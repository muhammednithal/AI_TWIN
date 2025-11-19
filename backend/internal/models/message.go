package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

type Message struct {
	ID        uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	SessionID uuid.UUID      `gorm:"type:uuid;not null" json:"session_id"`
	FromUser  bool           `json:"from_user"`
	Content   string         `gorm:"type:text" json:"content"`
	Metadata  datatypes.JSON `gorm:"type:jsonb" json:"metadata"`

	CreatedAt time.Time `json:"created_at"`
}
