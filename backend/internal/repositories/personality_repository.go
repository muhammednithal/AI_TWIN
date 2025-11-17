package repositories

import (
	"github.com/muhammednithal/AI_TWIN/backend/internal/config"
	"github.com/muhammednithal/AI_TWIN/backend/internal/models"
	"gorm.io/gorm"
)

type PersonalityRepository struct {
	db *gorm.DB
}

func NewPersonalityRepository() *PersonalityRepository {
	return &PersonalityRepository{db: config.DB}
}

func (r *PersonalityRepository) Create(p *models.Personality) error {
	return r.db.Create(p).Error
}

func (r *PersonalityRepository) GetByID(id string) (*models.Personality, error) {
	var out models.Personality
	if err := r.db.Preload("Samples").Where("id = ?", id).First(&out).Error; err != nil {
		return nil, err
	}
	return &out, nil
}

func (r *PersonalityRepository) ListByUser(userID string) ([]models.Personality, error) {
	var out []models.Personality
	if err := r.db.Preload("Samples").Where("user_id = ?", userID).Order("created_at DESC").Find(&out).Error; err != nil {
		return nil, err
	}
	return out, nil
}
