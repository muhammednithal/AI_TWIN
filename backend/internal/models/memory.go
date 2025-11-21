package models

import (
	"time"

	"github.com/google/uuid"
)

type Memory struct {
	ID            uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	PersonalityID uuid.UUID `gorm:"type:uuid"`
	Content       string    `gorm:"type:text"`
	Tags          string    `gorm:"type:text"` // comma separated tags
	Embedding     []byte    `gorm:"type:bytea"`
	CreatedAt     time.Time
}
