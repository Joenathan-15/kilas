package service

import (
	"time"

	"gorm.io/gorm"
)

type StatsService struct {
	DB *gorm.DB
}

func NewStatsService(db *gorm.DB) *StatsService {
	return &StatsService{DB: db}
}

type OverviewStats struct {
	TotalDecks     int64 `json:"total_decks"`
	TotalCards     int64 `json:"total_cards"`
	CardsDueToday  int64 `json:"cards_due_today"`
	CardsMastered  int64 `json:"cards_mastered"`
	TotalSessions  int64 `json:"total_sessions"`
	TotalStudyTime int64 `json:"total_study_time"`
}

func (s *StatsService) GetOverview(userID uint) (*OverviewStats, error) {
	stats := &OverviewStats{}

	// Total decks
	s.DB.Table("decks").Where("user_id = ?", userID).Count(&stats.TotalDecks)

	// Total cards
	s.DB.Table("cards").
		Joins("JOIN decks ON cards.deck_id = decks.id").
		Where("decks.user_id = ?", userID).
		Count(&stats.TotalCards)

	// Cards due today
	s.DB.Table("cards").
		Joins("JOIN decks ON cards.deck_id = decks.id").
		Where("decks.user_id = ? AND cards.due_date <= ?", userID, time.Now()).
		Count(&stats.CardsDueToday)

	// Cards mastered (repetitions >= 3)
	s.DB.Table("cards").
		Joins("JOIN decks ON cards.deck_id = decks.id").
		Where("decks.user_id = ? AND cards.repetitions >= 3", userID).
		Count(&stats.CardsMastered)

	// Total sessions
	s.DB.Table("study_sessions").Where("user_id = ?", userID).Count(&stats.TotalSessions)

	// Total study time
	var totalTime *int64
	s.DB.Table("study_sessions").
		Where("user_id = ? AND ended_at IS NOT NULL", userID).
		Select("COALESCE(SUM(duration), 0)").
		Scan(&totalTime)
	if totalTime != nil {
		stats.TotalStudyTime = *totalTime
	}

	return stats, nil
}

type ActivityEntry struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

func (s *StatsService) GetActivity(userID uint) ([]ActivityEntry, error) {
	// Query DB for last 30 days
	type dbResult struct {
		Date  string
		Count int
	}
	var results []dbResult

	s.DB.Table("card_reviews").
		Select("DATE(card_reviews.created_at) as date, COUNT(*) as count").
		Joins("JOIN study_sessions ON card_reviews.session_id = study_sessions.id").
		Where("study_sessions.user_id = ? AND card_reviews.created_at >= ?", userID, time.Now().AddDate(0, 0, -29)).
		Group("DATE(card_reviews.created_at)").
		Find(&results)

	// Build lookup map
	countMap := make(map[string]int)
	for _, r := range results {
		countMap[r.Date] = r.Count
	}

	// Zero-fill all 30 days
	activity := make([]ActivityEntry, 30)
	for i := 0; i < 30; i++ {
		date := time.Now().AddDate(0, 0, -(29 - i)).Format("2006-01-02")
		count := countMap[date]
		activity[i] = ActivityEntry{Date: date, Count: count}
	}

	return activity, nil
}

type DeckStatsResult struct {
	DeckID     uint  `json:"deck_id"`
	TotalCards int64 `json:"total_cards"`
	DueToday   int64 `json:"due_today"`
	Mastered   int64 `json:"mastered"`
	NewCards   int64 `json:"new_cards"`
	Learning   int64 `json:"learning"`
}

func (s *StatsService) GetDeckStats(deckID, userID uint) (*DeckStatsResult, error) {
	stats := &DeckStatsResult{DeckID: deckID}

	// Total cards
	s.DB.Table("cards").Where("deck_id = ?", deckID).Count(&stats.TotalCards)

	// Due today
	s.DB.Table("cards").Where("deck_id = ? AND due_date <= ?", deckID, time.Now()).Count(&stats.DueToday)

	// Mastered (repetitions >= 3)
	s.DB.Table("cards").Where("deck_id = ? AND repetitions >= 3", deckID).Count(&stats.Mastered)

	// New cards (repetitions == 0)
	s.DB.Table("cards").Where("deck_id = ? AND repetitions = 0", deckID).Count(&stats.NewCards)

	// Learning (repetitions > 0 AND repetitions < 3)
	s.DB.Table("cards").Where("deck_id = ? AND repetitions > 0 AND repetitions < 3", deckID).Count(&stats.Learning)

	return stats, nil
}
