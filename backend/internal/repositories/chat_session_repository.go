package repositories

import (
	"github.com/muhammednithal/AI_TWIN/backend/internal/config"
	"github.com/muhammednithal/AI_TWIN/backend/internal/models"
	"gorm.io/gorm"
)

type ChatSessionRepository struct {
	db *gorm.DB
}

func NewChatSessionRepository() *ChatSessionRepository {
	return &ChatSessionRepository{db: config.DB}
}

func (r *ChatSessionRepository) Create(session *models.ChatSession) error {
	return r.db.Create(session).Error
}

func (r *ChatSessionRepository) GetByID(id string) (*models.ChatSession, error) {
	var s models.ChatSession
	if err := r.db.Where("id = ?", id).First(&s).Error; err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *ChatSessionRepository) GetFullSession(id string) (*models.ChatSession, error) {
	var s models.ChatSession
	if err := r.db.Preload("Messages").
		Where("id = ?", id).
		First(&s).Error; err != nil {
		return nil, err
	}
	return &s, nil
}
