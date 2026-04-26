package repository

import (
	"github.com/joenathan-15/model"
	"gorm.io/gorm"
)

type StudyRepository struct {
	DB *gorm.DB
}

func NewStudyRepository(db *gorm.DB) *StudyRepository {
	return &StudyRepository{DB: db}
}

func (r *StudyRepository) CreateSession(s *model.StudySession) error {
	return r.DB.Create(s).Error
}

func (r *StudyRepository) FindSessionByID(id uint) (*model.StudySession, error) {
	var session model.StudySession
	err := r.DB.First(&session, id).Error
	return &session, err
}

func (r *StudyRepository) UpdateSession(s *model.StudySession) error {
	return r.DB.Save(s).Error
}

func (r *StudyRepository) CreateReview(review *model.CardReview) error {
	return r.DB.Create(review).Error
}
