package model

import "time"

type Product struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"size:255;uniqueIndex;not null" json:"name"`
	Price       int       `gorm:"not null" json:"price"`
	Quantity    int       `gorm:"not null" json:"quantity"`
	Type        string    `gorm:"size:50;not null;default:'currency'" json:"type"`
	IsListed    bool      `gorm:"default:true" json:"is_listed"`
	Description string    `gorm:"type:text" json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
