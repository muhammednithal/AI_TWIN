package repositories

import (
	"github.com/muhammednithal/AI_TWIN/backend/internal/config"
	"github.com/muhammednithal/AI_TWIN/backend/internal/models"
	"gorm.io/gorm"
)

type MessageRepository struct {
	db *gorm.DB
}

func NewMessageRepository() *MessageRepository {
	return &MessageRepository{db: config.DB}
}

func (r *MessageRepository) Create(msg *models.Message) error {
	return r.db.Create(msg).Error
}

func (r *MessageRepository) ListBySession(sessionID string) ([]models.Message, error) {
	var msgs []models.Message
	if err := r.db.
		Where("session_id = ?", sessionID).
		Order("created_at ASC").
		Find(&msgs).Error; err != nil {
		return nil, err
	}
	return msgs, nil
}
