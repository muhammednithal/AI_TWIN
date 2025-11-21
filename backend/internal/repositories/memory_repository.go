package repositories

import (
	"github.com/muhammednithal/AI_TWIN/backend/internal/config"
	"github.com/muhammednithal/AI_TWIN/backend/internal/models"
	"gorm.io/gorm"
)

type MemoryRepository struct {
	db *gorm.DB
}

func NewMemoryRepository() *MemoryRepository {
	return &MemoryRepository{db: config.DB}
}

func (r *MemoryRepository) Create(m *models.Memory) error {
	return r.db.Create(m).Error
}

func (r *MemoryRepository) ListByPersonality(pid string) ([]models.Memory, error) {
	var mem []models.Memory
	err := r.db.Where("personality_id = ?", pid).Order("created_at DESC").Find(&mem).Error
	return mem, err
}

func (r *MemoryRepository) Delete(id string) error {
	return r.db.Delete(&models.Memory{}, "id = ?", id).Error
}
