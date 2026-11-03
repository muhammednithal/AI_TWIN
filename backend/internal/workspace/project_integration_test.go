package workspace

import (
	"encoding/json"
	"errors"
	"net/http/httptest"
	"net/url"
	"os"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// These tests only accept an explicitly configured local *_test database. Each
// run owns a random schema; no existing application schema or .env is touched.
func integrationDB(t *testing.T) *gorm.DB {
	t.Helper()
	raw := os.Getenv("TWIN_TEST_DATABASE_URL")
	if raw == "" {
		t.Skip("set TWIN_TEST_DATABASE_URL to a disposable local PostgreSQL *_test database")
	}
	parsed, err := url.Parse(raw)
	if err != nil || !(parsed.Hostname() == "localhost" || parsed.Hostname() == "127.0.0.1") || !strings.HasSuffix(parsed.Path, "_test") {
		t.Fatal("integration database must be explicitly local and end in _test")
	}
	q := parsed.Query()
	q.Set("connect_timeout", "5")
	parsed.RawQuery = q.Encode()
	admin, err := gorm.Open(postgres.Open(parsed.String()), &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil {
		t.Fatal(err)
	}
	schema := "twin_test_" + strings.ReplaceAll(uuid.NewString(), "-", "")
	if err := admin.Exec("CREATE SCHEMA " + schema).Error; err != nil {
		t.Fatal(err)
	}
	q.Set("search_path", schema)
	parsed.RawQuery = q.Encode()
	db, err := gorm.Open(postgres.Open(parsed.String()), &gorm.Config{TranslateError: true, Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil {
		admin.Exec("DROP SCHEMA " + schema + " CASCADE")
		t.Fatal(err)
	}
	t.Cleanup(func() {
		sql, _ := db.DB()
		if sql != nil {
			sql.Close()
		}
		if err := admin.Exec("DROP SCHEMA " + schema + " CASCADE").Error; err != nil {
			t.Error(err)
		}
		sql, _ = admin.DB()
		if sql != nil {
			sql.Close()
		}
	})
	if err := db.AutoMigrate(&User{}, &Twin{}, &Sample{}, &Memory{}, &Session{}, &Message{}, &Project{}, &ProjectMemory{}, &TaskRun{}, &Decision{}); err != nil {
		t.Fatal(err)
	}
	return db
}
func decodeResponse[T any](t *testing.T, w *httptest.ResponseRecorder) T {
	t.Helper()
	var value T
	if err := json.Unmarshal(w.Body.Bytes(), &value); err != nil {
		t.Fatalf("decode response: %v: %s", err, w.Body)
	}
	return value
}
func TestProjectTaskJournalPostgres(t *testing.T) {
	db := integrationDB(t)
	gin.SetMode(gin.TestMode)
	provider := &fakeAI{}
	secret := strings.Repeat("s", 32)
	router := New(db, provider, secret, []string{"http://localhost:5173"})
	user := User{Email: "one@example.test", DisplayName: "One", PasswordHash: "test-only"}
	other := User{Email: "two@example.test", DisplayName: "Two", PasswordHash: "test-only"}
	if err := db.Create(&[]User{user, other}).Error; err != nil {
		t.Fatal(err)
	}
	// Create assigns application-generated IDs through hooks.
	db.First(&user, "email = ?", "one@example.test")
	db.First(&other, "email = ?", "two@example.test")
	token, _ := (&API{Secret: secret}).token(user)
	otherToken, _ := (&API{Secret: secret}).token(other)
	call := func(method, path string, payload any, expected int) *httptest.ResponseRecorder {
		t.Helper()
		data, _ := json.Marshal(payload)
		w := perform(router, method, path, token, string(data))
		if w.Code != expected {
			t.Fatalf("%s %s: got %d want %d: %s", method, path, w.Code, expected, w.Body)
		}
		return w
	}
	project := decodeResponse[struct {
		Project Project `json:"project"`
	}](t, call("POST", "/api/projects", map[string]any{"name": "Research", "purpose": "Evaluate supplied evidence", "instructions": "Identify missing information"}, 200)).Project
	path := "/api/projects/" + project.ID.String()
	if w := perform(router, "GET", path, otherToken, ""); w.Code != 404 {
		t.Fatal("cross-account project access")
	}
	saveNote := func(title, content string, pinned bool) ProjectMemory {
		t.Helper()
		return decodeResponse[struct {
			Memory ProjectMemory `json:"memory"`
		}](t, call("POST", path+"/memories", map[string]any{"title": title, "kind": "research", "content": content, "pinned": pinned}, 200)).Memory
	}
	pinned := saveNote("Constraint", "Always distinguish evidence from assumptions", true)
	selected := saveNote("Research", "Original selected evidence", false)
	_ = saveNote("Unused", "DO_NOT_INCLUDE_UNSELECTED_NOTE", false)
	if provider.calls != 0 {
		t.Fatal("memory storage unexpectedly sent data to AI")
	}
	input := TaskInput{Objective: "Compare the supplied options", Kind: "compare", MemoryIDs: []uuid.UUID{selected.ID}}
	preview := decodeResponse[struct {
		Context TaskContext `json:"context"`
		Token   string      `json:"preview_token"`
	}](t, call("POST", path+"/context", input, 200))
	if len(preview.Context.Memories) != 2 || preview.Context.Memories[0].ID != pinned.ID {
		t.Fatal("pinned context was lost")
	}
	input.PreviewToken = preview.Token
	input.RequestID = uuid.New()
	task := decodeResponse[struct {
		Task TaskRun `json:"task"`
	}](t, call("POST", path+"/tasks", input, 201)).Task
	if provider.calls != 1 || strings.Contains(provider.lastContent, "DO_NOT_INCLUDE_UNSELECTED_NOTE") || !strings.Contains(provider.lastContent, "Original selected evidence") {
		t.Fatal("provider received wrong context")
	}
	if !strings.Contains(provider.lastSystem, "NO live web") {
		t.Fatal("missing provider capability boundary")
	}
	replay := decodeResponse[struct {
		Task TaskRun `json:"task"`
	}](t, call("POST", path+"/tasks", input, 200)).Task
	if replay.ID != task.ID || provider.calls != 1 {
		t.Fatal("task retry was not idempotent")
	}
	call("PUT", path+"/memories/"+selected.ID.String(), map[string]any{"title": "Updated research", "kind": "research", "content": "New evidence"}, 200)
	input.RequestID = uuid.New()
	call("POST", path+"/tasks", input, 409)
	if provider.calls != 1 {
		t.Fatal("changed context reached provider")
	}
	stored := decodeResponse[struct {
		Task TaskRun `json:"task"`
	}](t, call("GET", "/api/tasks/"+task.ID.String(), nil, 200)).Task
	if !strings.Contains(string(stored.ContextSnapshot), "Original selected evidence") || strings.Contains(string(stored.ContextSnapshot), "New evidence") {
		t.Fatal("historical snapshot was mutated")
	}
	call("PUT", "/api/tasks/"+task.ID.String()+"/review", map[string]any{"status": "accepted", "review_notes": "Checked assumptions"}, 200)
	decision := decodeResponse[struct {
		Decision Decision `json:"decision"`
	}](t, call("POST", path+"/decisions", map[string]any{"title": "Wait for more evidence", "task_id": task.ID, "choice": "Gather missing information first", "reasoning": "The supplied material is incomplete", "status": "considering"}, 200)).Decision
	call("PUT", path+"/decisions/"+decision.ID.String(), map[string]any{"title": "Wait for more evidence", "task_id": task.ID, "choice": "Gather missing information first", "reasoning": "The supplied material is incomplete", "outcome": "Recorded a follow-up", "status": "closed"}, 200)
	call("POST", path+"/memories", map[string]any{"title": "Reviewed lesson", "kind": "decision", "content": "A reviewed excerpt", "source_task_id": task.ID}, 200)
	exported := call("GET", "/api/export", nil, 200)
	if !strings.Contains(exported.Body.String(), "context_snapshot") || !strings.Contains(exported.Body.String(), "Recorded a follow-up") {
		t.Fatal("export omitted the decision workflow")
	}
	var count int64
	db.Model(&TaskRun{}).Where("project_id = ?", project.ID).Count(&count)
	if count != 1 {
		t.Fatal("duplicate task persistence")
	}

	t.Run("context changes during generation", func(t *testing.T) {
		input.PreviewToken = ""
		input.RequestID = uuid.Nil
		fresh := decodeResponse[struct {
			Token string `json:"preview_token"`
		}](t, call("POST", path+"/context", input, 200))
		input.PreviewToken = fresh.Token
		input.RequestID = uuid.New()
		provider.onGenerate = func() {
			if err := db.Model(&ProjectMemory{}).Where("id = ?", selected.ID).Updates(map[string]any{"content": "Changed during generation", "version": 3}).Error; err != nil {
				t.Error(err)
			}
		}
		call("POST", path+"/tasks", input, 409)
		provider.onGenerate = nil
		db.Model(&TaskRun{}).Where("project_id = ?", project.ID).Count(&count)
		if count != 1 {
			t.Fatal("saved a result with unconfirmed context")
		}
	})
	t.Run("provider failure does not persist", func(t *testing.T) {
		fresh := decodeResponse[struct {
			Token string `json:"preview_token"`
		}](t, call("POST", path+"/context", input, 200))
		input.PreviewToken = fresh.Token
		input.RequestID = uuid.New()
		provider.generateErr = errors.New("provider unavailable")
		call("POST", path+"/tasks", input, 502)
		provider.generateErr = nil
		db.Model(&TaskRun{}).Where("project_id = ?", project.ID).Count(&count)
		if count != 1 {
			t.Fatal("saved a failed result")
		}
	})
	call("PUT", path, map[string]any{"name": project.Name, "purpose": project.Purpose, "instructions": project.Instructions, "archived": true}, 200)
	call("POST", path+"/context", input, 409)
	call("GET", "/api/tasks/"+task.ID.String(), nil, 200)
}
