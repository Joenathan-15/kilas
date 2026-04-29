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

// FSRS parameters (defaults for v4.5)
var w = []float64{
	0.4, 0.6, 2.4, 5.8, // Initial stability for Again, Hard, Good, Easy
	4.93, 0.94, 0.86, 0.01, // Difficulty update
	1.49, 0.14, 0.94, // Stability update (success)
	2.18, 0.05, 0.34, 1.26, // Stability update (failure)
	0.29, 2.61, // Retrievability
}

// ApplyFSRS applies the FSRS algorithm to a card.
// quality: 0=Again, 1=Hard, 2=Good, 3=Easy
func ApplyFSRS(card *model.Card, quality int) {
	rating := quality + 1 // FSRS ratings: 1, 2, 3, 4

	if card.Stability == 0 {
		// First review
		card.Stability = w[rating-1]
		card.Difficulty = w[4] - w[5]*float64(rating-3)
	} else {
		// Reviewing existing card
		elapsedDays := time.Since(card.UpdatedAt).Hours() / 24
		if elapsedDays < 0 {
			elapsedDays = 0
		}

		// Calculate retrievability (R = (1 + elapsed / (9 * stability)) ^ -1)
		retrievability := math.Pow(1+elapsedDays/(9*card.Stability), -1)

		if rating == 1 {
			// Failure (Again)
			// S_new = w11 * D^-w12 * (S+1)^w13 * exp(w14 * (1-R))
			card.Stability = w[11] * math.Pow(card.Difficulty, -w[12]) * (math.Pow(card.Stability+1, w[13]) - 1) * math.Exp(w[14]*(1-retrievability))
			// D_new = min(max(D + w6, 1), 10)
			card.Difficulty = math.Min(10, math.Max(1, card.Difficulty+w[6]))
		} else {
			// Success
			// S_new = S * (1 + exp(w8) * (11-D) * S^-w9 * (exp(w10 * (1-R)) - 1))
			card.Stability = card.Stability * (1 + math.Exp(w[8])*(11-card.Difficulty)*math.Pow(card.Stability, -w[9])*(math.Exp(w[10]*(1-retrievability))-1))
			// D_new = min(max(D - w7 * (rating-3), 1), 10)
			card.Difficulty = math.Min(10, math.Max(1, card.Difficulty-w[7]*float64(rating-3)))
		}
	}

	card.Repetitions++
	card.Interval = int(math.Round(card.Stability))
	if card.Interval < 1 {
		card.Interval = 1
	}

	// User requested "Again" cards not appear again in same session.
	// Standard FSRS would set a small learning interval, but we'll set it to 1 day.
	if rating == 1 {
		card.DueDate = time.Now().Add(24 * time.Hour)
	} else {
		card.DueDate = time.Now().Add(time.Duration(card.Interval) * 24 * time.Hour)
	}
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

	// Apply FSRS
	ApplyFSRS(card, quality)

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
