package model

import "time"

type StudySession struct {
	ID           uint         `gorm:"primaryKey" json:"id"`
	UserID       uint         `gorm:"not null;index" json:"user_id"`
	DeckID       uint         `gorm:"not null;index" json:"deck_id"`
	CardsStudied int          `gorm:"default:0" json:"cards_studied"`
	Duration     int          `json:"duration"`
	StartedAt    time.Time    `json:"started_at"`
	EndedAt      *time.Time   `json:"ended_at"`
	Reviews      []CardReview `gorm:"foreignKey:SessionID" json:"reviews,omitempty"`
}

type CardReview struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	SessionID uint      `gorm:"not null;index" json:"session_id"`
	CardID    uint      `gorm:"not null;index" json:"card_id"`
	Quality   int       `json:"quality"`
	CreatedAt time.Time `json:"created_at"`
}
