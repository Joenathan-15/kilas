package model

import "time"

type Deck struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	UserID      uint      `gorm:"not null;index" json:"user_id"`
	Title       string    `gorm:"not null" json:"title"`
	Description string    `json:"description"`
	IsPublic    bool      `gorm:"default:false" json:"is_public"`
	Tags        string    `json:"tags"` // comma-separated e.g. "math,science"
	CloneCount  int       `gorm:"default:0" json:"clone_count"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	User        User      `gorm:"foreignKey:UserID" json:"-"`
	Cards       []Card    `gorm:"foreignKey:DeckID" json:"cards,omitempty"`
	CardCount   int64     `gorm:"->" json:"card_count"`
}
