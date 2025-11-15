package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

type Sample struct {
	ID            uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	PersonalityID uuid.UUID `gorm:"type:uuid;not null" json:"personality_id"`

	Text      string         `gorm:"type:text" json:"text"`
	Source    string         `json:"source"`
	VectorID  string         `json:"vector_id"`                   // used for vector DB later
	Embedding datatypes.JSON `gorm:"type:jsonb" json:"embedding"` // embedding vector

	CreatedAt time.Time `json:"created_at"`
}
