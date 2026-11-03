package workspace

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
)

func TestProjectEndpointsRejectForeignAccountsBeforeAI(t *testing.T) {
	for _, tc := range []struct{ method, suffix string }{{"GET", ""}, {"PUT", ""}, {"GET", "/memories"}, {"POST", "/memories"}, {"POST", "/context"}, {"POST", "/tasks"}, {"POST", "/decisions"}, {"POST", "/import-twin-memories"}} {
		t.Run(tc.method+tc.suffix, func(t *testing.T) {
			r, mock, uid, token, ai := setup(t)
			id := uuid.New()
			expectUser(mock, uid)
			mock.ExpectQuery(`SELECT (.+) FROM "projects"`).WithArgs(id, uid, 1).WillReturnRows(sqlmock.NewRows([]string{"id"}))
			w := perform(r, tc.method, "/api/projects/"+id.String()+tc.suffix, token, `{}`)
			if w.Code != 404 {
				t.Fatalf("got %d: %s", w.Code, w.Body)
			}
			if ai.calls != 0 {
				t.Fatal("foreign context reached provider")
			}
			if err := mock.ExpectationsWereMet(); err != nil {
				t.Fatal(err)
			}
		})
	}
}
func TestTaskEndpointsRejectForeignAccounts(t *testing.T) {
	for _, tc := range []struct{ method, suffix string }{{"GET", ""}, {"PUT", "/review"}} {
		t.Run(tc.method, func(t *testing.T) {
			r, mock, uid, token, _ := setup(t)
			id := uuid.New()
			expectUser(mock, uid)
			mock.ExpectQuery(`SELECT (.+) FROM "task_runs"`).WithArgs(id, uid, 1).WillReturnRows(sqlmock.NewRows([]string{"id"}))
			w := perform(r, tc.method, "/api/tasks/"+id.String()+tc.suffix, token, `{}`)
			if w.Code != 404 {
				t.Fatalf("got %d", w.Code)
			}
			if err := mock.ExpectationsWereMet(); err != nil {
				t.Fatal(err)
			}
		})
	}
}
func TestTaskRetryReturnsSavedResultWithoutProviderCall(t *testing.T) {
	r, mock, uid, token, ai := setup(t)
	pid, requestID, taskID := uuid.New(), uuid.New(), uuid.New()
	preview := strings.Repeat("a", 64)
	expectUser(mock, uid)
	mock.ExpectQuery(`SELECT (.+) FROM "projects"`).WithArgs(pid, uid, 1).WillReturnRows(sqlmock.NewRows([]string{"id", "user_id", "archived"}).AddRow(pid.String(), uid.String(), true))
	mock.ExpectQuery(`SELECT (.+) FROM "task_runs"`).WithArgs(requestID, uid, 1).WillReturnRows(sqlmock.NewRows([]string{"id", "user_id", "project_id", "request_id", "objective", "kind", "context_token", "result", "status"}).AddRow(taskID.String(), uid.String(), pid.String(), requestID.String(), "Evaluate", "analyze", preview, "Saved result", "needs_review"))
	payload, _ := json.Marshal(TaskInput{Objective: "Evaluate", Kind: "analyze", PreviewToken: preview, RequestID: requestID})
	w := perform(r, "POST", "/api/projects/"+pid.String()+"/tasks", token, string(payload))
	if w.Code != 200 || !strings.Contains(w.Body.String(), "Saved result") {
		t.Fatalf("got %d: %s", w.Code, w.Body)
	}
	if ai.calls != 0 {
		t.Fatal("retry generated a duplicate result")
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}
func TestChangedTaskContextStopsBeforeProviderCall(t *testing.T) {
	r, mock, uid, token, ai := setup(t)
	pid, requestID := uuid.New(), uuid.New()
	expectUser(mock, uid)
	mock.ExpectQuery(`SELECT (.+) FROM "projects"`).WithArgs(pid, uid, 1).WillReturnRows(sqlmock.NewRows([]string{"id", "user_id", "name"}).AddRow(pid.String(), uid.String(), "Changed project"))
	mock.ExpectQuery(`SELECT (.+) FROM "task_runs"`).WithArgs(requestID, uid, 1).WillReturnRows(sqlmock.NewRows([]string{"id"}))
	mock.ExpectQuery(`SELECT (.+) FROM "project_memories"`).WithArgs(pid).WillReturnRows(sqlmock.NewRows([]string{"id"}))
	payload, _ := json.Marshal(TaskInput{Objective: "Evaluate", Kind: "analyze", PreviewToken: strings.Repeat("a", 64), RequestID: requestID})
	w := perform(r, "POST", "/api/projects/"+pid.String()+"/tasks", token, string(payload))
	if w.Code != 409 {
		t.Fatalf("got %d: %s", w.Code, w.Body)
	}
	if ai.calls != 0 {
		t.Fatal("unconfirmed context reached provider")
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}
