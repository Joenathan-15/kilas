package repository

import (
	"time"

	"github.com/joenathan-15/model"
	"gorm.io/gorm"
)

type CardRepository struct {
	DB *gorm.DB
}

func NewCardRepository(db *gorm.DB) *CardRepository {
	return &CardRepository{DB: db}
}

func (r *CardRepository) FindByDeckID(deckID uint) ([]model.Card, error) {
	var cards []model.Card
	err := r.DB.Where("deck_id = ?", deckID).Find(&cards).Error
	return cards, err
}

func (r *CardRepository) FindByID(id uint) (*model.Card, error) {
	var card model.Card
	err := r.DB.First(&card, id).Error
	return &card, err
}

func (r *CardRepository) Create(card *model.Card) error {
	return r.DB.Create(card).Error
}

func (r *CardRepository) Update(card *model.Card) error {
	return r.DB.Save(card).Error
}

func (r *CardRepository) Delete(id uint) error {
	return r.DB.Delete(&model.Card{}, id).Error
}

func (r *CardRepository) FindDueCards(deckID uint, limit int) ([]model.Card, error) {
	var cards []model.Card
	err := r.DB.Where("deck_id = ? AND due_date <= ?", deckID, time.Now()).
		Order("due_date ASC").
		Limit(limit).
		Find(&cards).Error
	return cards, err
}
