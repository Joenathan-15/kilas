package model

import "time"

type Transaction struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;index" json:"user_id"`
	ProductID uint      `gorm:"not null;index" json:"product_id"`
	Amount    int       `gorm:"not null" json:"amount"`
	Tokens    int       `gorm:"not null" json:"tokens"`
	CreatedAt time.Time `json:"created_at"`
	User      User      `gorm:"foreignKey:UserID" json:"-"`
	Product   Product   `gorm:"foreignKey:ProductID" json:"product"`
}
