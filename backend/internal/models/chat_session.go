package models

import (
	"time"

	"github.com/google/uuid"
)

type ChatSession struct {
	ID            uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	PersonalityID uuid.UUID
	Personality   Personality `gorm:"foreignKey:PersonalityID;constraint:OnDelete:CASCADE"`

	UserID uuid.UUID
	User   User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`

	Title     string
	CreatedAt time.Time
}
