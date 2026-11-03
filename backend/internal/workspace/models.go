// Package workspace owns persistence models and the account-scoped workspace API.
package workspace

import (
	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
	"time"
)

type User struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Email        string    `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash string    `json:"-"`
	DisplayName  string    `json:"display_name"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (u *User) BeforeCreate(*gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

// Existing table names are retained so the schema migration preserves legacy records.
type Twin struct {
	ID           uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	UserID       uuid.UUID      `gorm:"type:uuid;index;not null" json:"user_id"`
	Name         string         `json:"name"`
	Language     string         `json:"language"`
	SliderJSON   datatypes.JSON `gorm:"column:slider_json;type:jsonb" json:"sliders"`
	StyleSummary string         `json:"style_summary"`
	Samples      []Sample       `gorm:"foreignKey:PersonalityID" json:"samples"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
}

func (Twin) TableName() string { return "personalities" }
func (t *Twin) BeforeCreate(*gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}

type Sample struct {
	ID            uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	PersonalityID uuid.UUID      `gorm:"type:uuid;index" json:"personality_id"`
	Text          string         `gorm:"type:text" json:"text"`
	Source        string         `json:"source"`
	Embedding     datatypes.JSON `gorm:"type:jsonb" json:"-"`
	CreatedAt     time.Time      `json:"created_at"`
}
type Memory struct {
	ID            uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	PersonalityID uuid.UUID `gorm:"type:uuid;index" json:"personality_id"`
	Content       string    `gorm:"type:text" json:"content"`
	Tags          string    `json:"tags"`
	Embedding     []byte    `gorm:"type:bytea" json:"-"`
	CreatedAt     time.Time `json:"created_at"`
}
type Session struct {
	ID            uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID        uuid.UUID `gorm:"type:uuid;index" json:"user_id"`
	PersonalityID uuid.UUID `gorm:"type:uuid;index" json:"personality_id"`
	Title         string    `gorm:"default:'New conversation'" json:"title"`
	Messages      []Message `gorm:"foreignKey:SessionID" json:"messages,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

func (Session) TableName() string { return "chat_sessions" }

type Message struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	SessionID uuid.UUID      `gorm:"type:uuid;index" json:"session_id"`
	FromUser  bool           `json:"from_user"`
	Content   string         `gorm:"type:text" json:"content"`
	Metadata  datatypes.JSON `gorm:"type:jsonb" json:"metadata,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
}
