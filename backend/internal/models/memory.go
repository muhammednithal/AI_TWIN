package models

import (
	"time"

	"github.com/google/uuid"
)

type Memory struct {
	ID            uuid.UUID   `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	PersonalityID uuid.UUID   `gorm:"type:uuid;not null"`
	Personality   Personality `gorm:"foreignKey:PersonalityID;constraint:OnDelete:CASCADE"`

	Content  string
	Tags     []string `gorm:"type:text[]"`
	VectorID string

	CreatedAt time.Time
}
