package model

import "time"

type AIGenerationHistory struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;index" json:"user_id"`
	Text      string    `gorm:"type:text;not null" json:"text"`
	CardCount int       `gorm:"not null" json:"card_count"`
	CreatedAt time.Time `json:"created_at"`
	User      User      `gorm:"foreignKey:UserID" json:"-"`
}
