package service

import (
	"errors"
	"strings"

	"github.com/joenathan-15/kilas/dto"
	"github.com/joenathan-15/kilas/model"
	"github.com/joenathan-15/kilas/repository"
)

type DeckService struct {
	DeckRepo *repository.DeckRepository
}

func NewDeckService(deckRepo *repository.DeckRepository) *DeckService {
	return &DeckService{DeckRepo: deckRepo}
}

func tagsToString(tags []string) string {
	return strings.Join(tags, ",")
}

func stringToTags(s string) []string {
	if s == "" {
		return []string{}
	}
	parts := strings.Split(s, ",")
	result := make([]string, 0, len(parts))
	for _, p := range parts {
		trimmed := strings.TrimSpace(p)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

func (s *DeckService) List(userID uint) ([]model.Deck, error) {
	return s.DeckRepo.FindByUserID(userID)
}

func (s *DeckService) Create(userID uint, req dto.DeckRequest) (*model.Deck, error) {
	deck := &model.Deck{
		UserID:      userID,
		Title:       req.Title,
		Description: req.Description,
		IsPublic:    req.IsPublic,
		Tags:        tagsToString(req.Tags),
	}
	if err := s.DeckRepo.Create(deck); err != nil {
		return nil, err
	}
	return deck, nil
}

func (s *DeckService) GetByID(id uint) (*model.Deck, error) {
	return s.DeckRepo.FindByID(id)
}

func (s *DeckService) Update(id, userID uint, req dto.DeckRequest) (*model.Deck, error) {
	deck, err := s.DeckRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if deck.UserID != userID {
		return nil, errors.New("forbidden")
	}

	deck.Title = req.Title
	deck.Description = req.Description
	deck.IsPublic = req.IsPublic
	deck.Tags = tagsToString(req.Tags)

	if err := s.DeckRepo.Update(deck); err != nil {
		return nil, err
	}
	return deck, nil
}

func (s *DeckService) Delete(id, userID uint) error {
	deck, err := s.DeckRepo.FindByID(id)
	if err != nil {
		return err
	}
	if deck.UserID != userID {
		return errors.New("forbidden")
	}
	return s.DeckRepo.Delete(id, userID)
}

// StringToTags is exported for use by other packages (e.g., library)
func StringToTags(s string) []string {
	return stringToTags(s)
}
