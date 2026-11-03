package workspace

import (
	"context"
	"errors"
	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

type fakeAI struct {
	embedErr, generateErr error
	calls                 int
}

func (f *fakeAI) Embed(context.Context, string) ([]float32, error) {
	f.calls++
	return []float32{1, 0}, f.embedErr
}
func (f *fakeAI) Generate(context.Context, string, string) (string, error) {
	f.calls++
	return "A helpful reply.", f.generateErr
}
func setup(t *testing.T) (*gin.Engine, sqlmock.Sqlmock, uuid.UUID, string, *fakeAI) {
	t.Helper()
	gin.SetMode(gin.TestMode)
	sql, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { sql.Close() })
	db, err := gorm.Open(postgres.New(postgres.Config{Conn: sql}), &gorm.Config{DisableAutomaticPing: true, Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil {
		t.Fatal(err)
	}
	uid := uuid.New()
	secret := strings.Repeat("s", 32)
	raw, err := (&API{Secret: secret}).token(User{ID: uid})
	if err != nil {
		t.Fatal(err)
	}
	ai := &fakeAI{}
	return New(db, ai, secret, []string{"http://localhost:5173"}), mock, uid, raw, ai
}
func expectUser(mock sqlmock.Sqlmock, uid uuid.UUID) {
	mock.ExpectQuery(`SELECT (.+) FROM "users"`).WithArgs(uid, 1).WillReturnRows(sqlmock.NewRows([]string{"id", "email", "display_name"}).AddRow(uid.String(), "person@example.com", "Person"))
}
func perform(r http.Handler, method, path, token, body string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}
func TestPrivateEndpointsRequireAuthentication(t *testing.T) {
	r, _, _, _, _ := setup(t)
	for _, path := range []string{"/api/twins", "/api/sessions", "/api/memories", "/api/export", "/api/me"} {
		if w := perform(r, "GET", path, "", ""); w.Code != 401 {
			t.Fatalf("%s: %d", path, w.Code)
		}
	}
}
func TestForeignResourcesAreNotAccessible(t *testing.T) {
	for _, tc := range []struct{ method, path, table string }{{"PUT", "/api/twins/", "personalities"}, {"DELETE", "/api/twins/", "personalities"}, {"GET", "/api/sessions/", "chat_sessions"}, {"PUT", "/api/sessions/", "chat_sessions"}, {"DELETE", "/api/sessions/", "chat_sessions"}, {"PUT", "/api/memories/", "memories"}, {"DELETE", "/api/memories/", "memories"}} {
		t.Run(tc.method+tc.path, func(t *testing.T) {
			r, mock, uid, token, ai := setup(t)
			id := uuid.New()
			expectUser(mock, uid)
			mock.ExpectQuery(`SELECT (.+) FROM "`+tc.table+`"`).WithArgs(id, uid, 1).WillReturnRows(sqlmock.NewRows([]string{"id"}))
			w := perform(r, tc.method, tc.path+id.String(), token, `{}`)
			if w.Code != 404 {
				t.Fatalf("got %d: %s", w.Code, w.Body)
			}
			if ai.calls != 0 {
				t.Fatal("foreign resource reached AI")
			}
			if err := mock.ExpectationsWereMet(); err != nil {
				t.Fatal(err)
			}
		})
	}
}
func TestChatFailureDoesNotPersistPartialMessages(t *testing.T) {
	for _, stage := range []string{"embedding", "generation"} {
		t.Run(stage, func(t *testing.T) {
			r, mock, uid, token, ai := setup(t)
			tid := uuid.New()
			expectUser(mock, uid)
			mock.ExpectQuery(`SELECT (.+) FROM "personalities"`).WithArgs(tid, uid, 1).WillReturnRows(sqlmock.NewRows([]string{"id", "user_id", "name", "language", "slider_json"}).AddRow(tid.String(), uid.String(), "Twin", "English", `{}`))
			mock.ExpectQuery(`SELECT (.+) FROM "samples"`).WithArgs(tid).WillReturnRows(sqlmock.NewRows([]string{"id"}))
			if stage == "embedding" {
				ai.embedErr = errors.New("provider down")
			} else {
				mock.ExpectQuery(`SELECT (.+) FROM "memories"`).WithArgs(tid).WillReturnRows(sqlmock.NewRows([]string{"id"}))
				ai.generateErr = errors.New("provider down")
			}
			w := perform(r, "POST", "/api/chat", token, `{"personality_id":"`+tid.String()+`","message":"Hello"}`)
			if w.Code != 502 {
				t.Fatalf("got %d: %s", w.Code, w.Body)
			}
			if err := mock.ExpectationsWereMet(); err != nil {
				t.Fatal(err)
			}
		})
	}
}
func TestMalformedResourceIDReturns400(t *testing.T) {
	r, mock, uid, token, _ := setup(t)
	expectUser(mock, uid)
	w := perform(r, "DELETE", "/api/twins/not-a-uuid", token, "")
	if w.Code != 400 {
		t.Fatalf("got %d", w.Code)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}
