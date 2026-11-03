package workspace

import (
	"encoding/json"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
)

func TestTaskPersistenceUsesConfirmedContextAndAtomicWrites(t *testing.T) {
	for _, mode := range []string{"commit", "database failure", "context changed", "provider failure"} {
		t.Run(mode, func(t *testing.T) {
			r, mock, uid, token, provider := setup(t)
			p := Project{ID: uuid.New(), UserID: uid, Name: "Project"}
			input := TaskInput{Objective: "Make a plan", Kind: "plan", RequestID: uuid.New()}
			context, err := buildContext(p, nil, input, time.Now())
			if err != nil {
				t.Fatal(err)
			}
			input.PreviewToken = (&API{Secret: strings.Repeat("s", 32)}).contextToken(context)
			projectRows := func(name string) *sqlmock.Rows {
				return sqlmock.NewRows([]string{"id", "user_id", "name"}).AddRow(p.ID.String(), uid.String(), name)
			}
			expectUser(mock, uid)
			mock.ExpectQuery(`SELECT (.+) FROM "projects"`).WithArgs(p.ID, uid, 1).WillReturnRows(projectRows(p.Name))
			mock.ExpectQuery(`SELECT (.+) FROM "task_runs"`).WithArgs(input.RequestID, uid, 1).WillReturnRows(sqlmock.NewRows([]string{"id"}))
			mock.ExpectQuery(`SELECT (.+) FROM "project_memories"`).WithArgs(p.ID).WillReturnRows(sqlmock.NewRows([]string{"id"}))
			expected := 201
			if mode == "provider failure" {
				provider.generateErr = errors.New("provider offline")
				expected = 502
			} else {
				mock.ExpectBegin()
				name := p.Name
				if mode == "context changed" {
					name = "Updated project"
				}
				mock.ExpectQuery(`SELECT (.+) FROM "projects"(.+)FOR UPDATE`).WithArgs(p.ID, uid, 1).WillReturnRows(projectRows(name))
				mock.ExpectQuery(`SELECT (.+) FROM "project_memories"`).WithArgs(p.ID).WillReturnRows(sqlmock.NewRows([]string{"id"}))
				if mode == "context changed" {
					mock.ExpectRollback()
					expected = 409
				} else if mode == "database failure" {
					mock.ExpectExec(`INSERT INTO "task_runs"`).WillReturnError(errors.New("database unavailable"))
					mock.ExpectRollback()
					expected = 500
				} else {
					mock.ExpectExec(`INSERT INTO "task_runs"`).WillReturnResult(sqlmock.NewResult(0, 1))
					mock.ExpectCommit()
				}
			}
			data, _ := json.Marshal(input)
			response := perform(r, "POST", "/api/projects/"+p.ID.String()+"/tasks", token, string(data))
			if response.Code != expected {
				t.Fatalf("got %d want %d: %s", response.Code, expected, response.Body)
			}
			if provider.calls != 1 {
				t.Fatalf("provider called %d times", provider.calls)
			}
			if mode == "commit" {
				saved := decodeResponse[struct {
					Task TaskRun `json:"task"`
				}](t, response)
				if saved.Task.Status != "needs_review" || saved.Task.Result != "A helpful reply." || !strings.Contains(string(saved.Task.ContextSnapshot), "Make a plan") {
					t.Fatal("result lost its input snapshot")
				}
			}
			if err := mock.ExpectationsWereMet(); err != nil {
				t.Fatal(err)
			}
		})
	}
}
