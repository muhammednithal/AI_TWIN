package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

type Personality struct {
	ID           uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID       uuid.UUID      `gorm:"type:uuid;not null" json:"user_id"`
	Name         string         `json:"name"`
	Language     string         `gorm:"default:'en'" json:"language"`
	SliderJSON   datatypes.JSON `gorm:"type:jsonb" json:"sliders"`
	StyleSummary string         `gorm:"type:text" json:"style_summary"`

	Samples []Sample `gorm:"foreignKey:PersonalityID" json:"samples"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
