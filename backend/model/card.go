package model

import "time"

type Card struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	DeckID        uint      `gorm:"not null;index" json:"deck_id"`
	Front         string    `gorm:"type:text;not null" json:"front"`
	Back          string    `gorm:"type:text;not null" json:"back"`
	FrontImageURL string    `json:"front_image_url"`
	BackImageURL  string    `json:"back_image_url"`
	Interval      int       `gorm:"default:0" json:"interval"`
	Repetitions   int       `gorm:"default:0" json:"repetitions"`
	EaseFactor    float64   `gorm:"default:2.5" json:"ease_factor"`
	Stability     float64   `gorm:"default:0" json:"stability"`
	Difficulty    float64   `gorm:"default:0" json:"difficulty"`
	DueDate       time.Time `json:"due_date"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
	IsAICreated   bool      `gorm:"default:false" json:"is_ai_created"`
	Deck          Deck      `gorm:"foreignKey:DeckID" json:"-"`
}
