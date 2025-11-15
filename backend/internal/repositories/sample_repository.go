package repositories

import (
	"github.com/muhammednithal/AI_TWIN/backend/internal/config"
	"github.com/muhammednithal/AI_TWIN/backend/internal/models"
	"gorm.io/gorm"
)

type SampleRepository struct {
	db *gorm.DB
}

func NewSampleRepository() *SampleRepository {
	return &SampleRepository{db: config.DB}
}

func (r *SampleRepository) Create(s *models.Sample) error {
	return r.db.Create(s).Error
}

func (r *SampleRepository) Update(s *models.Sample) error {
	return r.db.Save(s).Error
}
