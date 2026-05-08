package model

import "time"

type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Email     string    `gorm:"size:255;uniqueIndex;not null" json:"email"`
	Username  string    `gorm:"size:255;not null" json:"username"`
	Password  string    `json:"-"`
	Provider  string    `gorm:"default:'local'" json:"provider"`
	AvatarURL string    `json:"avatar_url"`
	Tokens            int        `gorm:"default:500" json:"tokens"`
	LastLoginDate     *time.Time `json:"last_login_date"`
	LoginStreak       int        `gorm:"default:0" json:"login_streak"`
	SubscriptionUntil *time.Time `json:"subscription_until"`
	Language          string     `gorm:"size:10;default:'id'" json:"language"`
	OnboardingCompleted bool     `gorm:"default:false" json:"onboarding_completed"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}
