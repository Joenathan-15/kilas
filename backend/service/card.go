package service

import (
	"errors"
	"time"

	"github.com/joenathan-15/kilas/dto"
	"github.com/joenathan-15/kilas/model"
	"github.com/joenathan-15/kilas/repository"
)

type CardService struct {
	CardRepo *repository.CardRepository
	DeckRepo *repository.DeckRepository
}

func NewCardService(cardRepo *repository.CardRepository, deckRepo *repository.DeckRepository) *CardService {
	return &CardService{CardRepo: cardRepo, DeckRepo: deckRepo}
}

func (s *CardService) verifyOwnership(deckID, userID uint) error {
	deck, err := s.DeckRepo.FindByID(deckID)
	if err != nil {
		return err
	}
	if deck.UserID != userID {
		return errors.New("forbidden")
	}
	return nil
}

func (s *CardService) Create(deckID, userID uint, req dto.CardRequest) (*model.Card, error) {
	if err := s.verifyOwnership(deckID, userID); err != nil {
		return nil, err
	}

	card := &model.Card{
		DeckID:        deckID,
		Front:         req.Front,
		Back:          req.Back,
		FrontImageURL: req.FrontImageURL,
		BackImageURL:  req.BackImageURL,
		Interval:      0,
		Repetitions:   0,
		EaseFactor:    2.5,
		DueDate:       time.Now(),
	}

	if err := s.CardRepo.Create(card); err != nil {
		return nil, err
	}
	return card, nil
}

func (s *CardService) ListByDeckID(deckID uint) ([]model.Card, error) {
	return s.CardRepo.FindByDeckID(deckID)
}

func (s *CardService) Update(cardID, userID uint, req dto.CardRequest) (*model.Card, error) {
	card, err := s.CardRepo.FindByID(cardID)
	if err != nil {
		return nil, err
	}

	if err := s.verifyOwnership(card.DeckID, userID); err != nil {
		return nil, err
	}

	// Only update content fields, never SM-2 fields
	card.Front = req.Front
	card.Back = req.Back
	card.FrontImageURL = req.FrontImageURL
	card.BackImageURL = req.BackImageURL

	if err := s.CardRepo.Update(card); err != nil {
		return nil, err
	}
	return card, nil
}

func (s *CardService) Delete(cardID, userID uint) error {
	card, err := s.CardRepo.FindByID(cardID)
	if err != nil {
		return err
	}

	if err := s.verifyOwnership(card.DeckID, userID); err != nil {
		return err
	}

	return s.CardRepo.Delete(cardID)
}
