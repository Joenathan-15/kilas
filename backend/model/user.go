package model

import "time"

type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Email     string    `gorm:"size:255;uniqueIndex;not null" json:"email"`
	Username  string    `gorm:"size:255;not null" json:"username"`
	Password  string    `json:"-"`
	Provider  string    `gorm:"default:'local'" json:"provider"`
	AvatarURL string    `json:"avatar_url"`
	Tokens            int       `gorm:"default:500" json:"tokens"`
	SubscriptionUntil *time.Time `json:"subscription_until"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}
