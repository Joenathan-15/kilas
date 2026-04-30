package model

import "time"

type Product struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name          string    `gorm:"size:255;uniqueIndex;not null" json:"name"`
	NameID        string    `gorm:"size:255" json:"name_id"`
	NameEN        string    `gorm:"size:255" json:"name_en"`
	Price         int       `gorm:"not null" json:"price"`
	Quantity    int       `gorm:"not null" json:"quantity"`
	Type        string    `gorm:"size:50;not null;default:'currency'" json:"type"`
	IsListed    bool      `gorm:"default:true" json:"is_listed"`
	Description   string    `gorm:"type:text" json:"description"`
	DescriptionID string    `gorm:"type:text" json:"description_id"`
	DescriptionEN string    `gorm:"type:text" json:"description_en"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
