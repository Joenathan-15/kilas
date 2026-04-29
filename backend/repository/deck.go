package repository

import (
	"github.com/joenathan-15/kilas/model"
	"gorm.io/gorm"
)

type DeckRepository struct {
	DB *gorm.DB
}

func NewDeckRepository(db *gorm.DB) *DeckRepository {
	return &DeckRepository{DB: db}
}

func (r *DeckRepository) FindByUserID(userID uint) ([]model.Deck, error) {
	var decks []model.Deck
	err := r.DB.Select("decks.*, " +
		"(SELECT COUNT(*) FROM cards WHERE cards.deck_id = decks.id) as card_count, " +
		"(SELECT COUNT(*) FROM cards WHERE cards.deck_id = decks.id AND cards.due_date <= NOW()) as due_count").
		Where("decks.user_id = ?", userID).
		Order("decks.created_at DESC").
		Find(&decks).Error
	return decks, err
}

func (r *DeckRepository) FindByID(id uint) (*model.Deck, error) {
	var deck model.Deck
	err := r.DB.Select("decks.*, " +
		"(SELECT COUNT(*) FROM cards WHERE cards.deck_id = decks.id) as card_count, " +
		"(SELECT COUNT(*) FROM cards WHERE cards.deck_id = decks.id AND cards.due_date <= NOW()) as due_count").
		Preload("Cards").Preload("User").First(&deck, id).Error
	return &deck, err
}

func (r *DeckRepository) Create(deck *model.Deck) error {
	return r.DB.Create(deck).Error
}

func (r *DeckRepository) Update(deck *model.Deck) error {
	return r.DB.Save(deck).Error
}

func (r *DeckRepository) Delete(id, userID uint) error {
	return r.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("deck_id = ?", id).Delete(&model.Card{}).Error; err != nil {
			return err
		}
		return tx.Where("id = ? AND user_id = ?", id, userID).Delete(&model.Deck{}).Error
	})
}
