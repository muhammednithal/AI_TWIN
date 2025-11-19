package models

import (
	"time"

	"github.com/google/uuid"
)

type ChatSession struct {
	ID            uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	PersonalityID uuid.UUID `gorm:"type:uuid;not null" json:"personality_id"`
	UserID        uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`

	Messages []Message `gorm:"foreignKey:SessionID" json:"messages"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
