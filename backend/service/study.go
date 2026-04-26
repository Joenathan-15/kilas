package service

import (
	"errors"
	"math"
	"time"

	"github.com/joenathan-15/kilas/model"
	"github.com/joenathan-15/kilas/repository"
)

type StudyService struct {
	StudyRepo *repository.StudyRepository
	CardRepo  *repository.CardRepository
	DeckRepo  *repository.DeckRepository
}

func NewStudyService(studyRepo *repository.StudyRepository, cardRepo *repository.CardRepository, deckRepo *repository.DeckRepository) *StudyService {
	return &StudyService{StudyRepo: studyRepo, CardRepo: cardRepo, DeckRepo: deckRepo}
}

// ApplySM2 applies the SM-2 spaced repetition algorithm to a card.
// quality: 0=Again, 1=Hard, 2=Good, 3=Easy
func ApplySM2(card *model.Card, quality int) {
	// Map to SM-2 q: 0->1, 1->2, 2->4, 3->5
	qMap := map[int]float64{0: 1, 1: 2, 2: 4, 3: 5}
	q := qMap[quality]

	if q >= 3 {
		if card.Repetitions == 0 {
			card.Interval = 1
		} else if card.Repetitions == 1 {
			card.Interval = 6
		} else {
			card.Interval = int(math.Round(float64(card.Interval) * card.EaseFactor))
		}
		card.Repetitions++
		card.EaseFactor += 0.1 - (5-q)*(0.08+(5-q)*0.02)
		if card.EaseFactor < 1.3 {
			card.EaseFactor = 1.3
		}
	} else {
		card.Repetitions = 0
		card.Interval = 1
	}
	card.DueDate = time.Now().Add(time.Duration(card.Interval) * 24 * time.Hour)
}

func (s *StudyService) GetDueCards(deckID, userID uint) ([]model.Card, error) {
	deck, err := s.DeckRepo.FindByID(deckID)
	if err != nil {
		return nil, err
	}
	if deck.UserID != userID && !deck.IsPublic {
		return nil, errors.New("forbidden")
	}

	cards, err := s.CardRepo.FindDueCards(deckID, 100)
	if err != nil {
		return nil, err
	}
	return cards, nil
}

func (s *StudyService) StartSession(userID, deckID uint) (*model.StudySession, error) {
	session := &model.StudySession{
		UserID:    userID,
		DeckID:    deckID,
		StartedAt: time.Now(),
	}
	if err := s.StudyRepo.CreateSession(session); err != nil {
		return nil, err
	}
	return session, nil
}

func (s *StudyService) SubmitReview(sessionID, cardID, userID uint, quality int) (*model.Card, error) {
	// Load card
	card, err := s.CardRepo.FindByID(cardID)
	if err != nil {
		return nil, err
	}

	// Verify card's deck belongs to user
	deck, err := s.DeckRepo.FindByID(card.DeckID)
	if err != nil {
		return nil, err
	}
	if deck.UserID != userID {
		return nil, errors.New("forbidden")
	}

	// Apply SM-2
	ApplySM2(card, quality)

	// Save card
	if err := s.CardRepo.Update(card); err != nil {
		return nil, err
	}

	// Create review record
	review := &model.CardReview{
		SessionID: sessionID,
		CardID:    cardID,
		Quality:   quality,
		CreatedAt: time.Now(),
	}
	if err := s.StudyRepo.CreateReview(review); err != nil {
		return nil, err
	}

	// Increment session cards studied
	session, err := s.StudyRepo.FindSessionByID(sessionID)
	if err != nil {
		return nil, err
	}
	session.CardsStudied++
	if err := s.StudyRepo.UpdateSession(session); err != nil {
		return nil, err
	}

	return card, nil
}

func (s *StudyService) EndSession(sessionID uint, duration int) error {
	session, err := s.StudyRepo.FindSessionByID(sessionID)
	if err != nil {
		return err
	}
	now := time.Now()
	session.EndedAt = &now
	session.Duration = duration
	return s.StudyRepo.UpdateSession(session)
}
