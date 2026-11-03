package workspace

import (
	"encoding/json"
	"errors"
	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
	"testing"
)

func TestChatPersistsWholeTurnTransactionally(t *testing.T) {
	for _, writeFails := range []bool{false, true} {
		name := "commit"
		if writeFails {
			name = "rollback"
		}
		t.Run(name, func(t *testing.T) {
			r, mock, uid, token, _ := setup(t)
			tid := uuid.New()
			expectUser(mock, uid)
			row := func() *sqlmock.Rows {
				return sqlmock.NewRows([]string{"id", "user_id", "name", "language", "slider_json"}).AddRow(tid.String(), uid.String(), "Twin", "English", `{}`)
			}
			mock.ExpectQuery(`SELECT (.+) FROM "personalities"`).WithArgs(tid, uid, 1).WillReturnRows(row())
			mock.ExpectQuery(`SELECT (.+) FROM "samples"`).WithArgs(tid).WillReturnRows(sqlmock.NewRows([]string{"id"}))
			mock.ExpectQuery(`SELECT (.+) FROM "memories"`).WithArgs(tid).WillReturnRows(sqlmock.NewRows([]string{"id"}))
			mock.ExpectBegin()
			mock.ExpectQuery(`SELECT (.+) FROM "personalities"(.+)FOR UPDATE`).WithArgs(tid, uid, 1).WillReturnRows(row())
			mock.ExpectExec(`INSERT INTO "chat_sessions"`).WillReturnResult(sqlmock.NewResult(0, 1))
			if writeFails {
				mock.ExpectExec(`INSERT INTO "messages"`).WillReturnError(errors.New("private database failure"))
				mock.ExpectRollback()
			} else {
				mock.ExpectExec(`INSERT INTO "messages"`).WillReturnResult(sqlmock.NewResult(0, 2))
				mock.ExpectExec(`UPDATE "chat_sessions"`).WillReturnResult(sqlmock.NewResult(0, 1))
				mock.ExpectCommit()
			}
			response := perform(r, "POST", "/api/chat", token, `{"personality_id":"`+tid.String()+`","message":"A thought"}`)
			if writeFails {
				if response.Code != 500 {
					t.Fatalf("expected 500, got %d: %s", response.Code, response.Body)
				}
			} else {
				if response.Code != 200 {
					t.Fatalf("expected 200, got %d: %s", response.Code, response.Body)
				}
				var body struct {
					Messages  []Message `json:"messages"`
					SessionID string    `json:"session_id"`
				}
				if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
					t.Fatal(err)
				}
				if len(body.Messages) != 2 || !body.Messages[0].FromUser || body.Messages[1].FromUser || body.SessionID == "" {
					t.Fatalf("incomplete turn: %s", response.Body)
				}
			}
			if err := mock.ExpectationsWereMet(); err != nil {
				t.Fatal(err)
			}
		})
	}
}
