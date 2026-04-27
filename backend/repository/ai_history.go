package repository

import (
	"time"

	"github.com/joenathan-15/kilas/model"
	"gorm.io/gorm"
)

type AIHistoryRepository struct {
	DB *gorm.DB
}

func NewAIHistoryRepository(db *gorm.DB) *AIHistoryRepository {
	return &AIHistoryRepository{DB: db}
}

// CountGenerationsToday returns the number of AI generations a user has made today.
func (r *AIHistoryRepository) CountGenerationsToday(userID uint) (int64, error) {
	var count int64
	today := time.Now().Truncate(24 * time.Hour)
	err := r.DB.Model(&model.AIGenerationHistory{}).
		Where("user_id = ? AND created_at >= ?", userID, today).
		Count(&count).Error
	return count, err
}

// Create inserts a new AI generation history record.
func (r *AIHistoryRepository) Create(history *model.AIGenerationHistory) error {
	return r.DB.Create(history).Error
}
