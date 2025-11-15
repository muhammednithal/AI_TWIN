package models

import (
	"time"

	"github.com/google/uuid"
)

type Message struct {
	ID        uuid.UUID   `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	SessionID uuid.UUID   `gorm:"type:uuid;not null"`
	Session   ChatSession `gorm:"foreignKey:SessionID;constraint:OnDelete:CASCADE"`

	FromUser bool
	Content  string
	Meta     string `gorm:"type:jsonb"`

	CreatedAt time.Time
}
