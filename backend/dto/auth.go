package dto

import "time"

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Username string `json:"username" binding:"required,min=3,max=20"`
	Password string `json:"password" binding:"required,min=8"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type UserResponse struct {
	ID                uint       `json:"id"`
	Email             string     `json:"email"`
	Username          string     `json:"username"`
	AvatarURL         string     `json:"avatar_url"`
	LoginStreak       int        `json:"login_streak"`
	Tokens            int        `json:"tokens"`
	LastLoginDate     *time.Time `json:"last_login_date"`
	Language          string     `json:"language"`
	SubscriptionUntil *time.Time `json:"subscription_until"`
}

type AuthResponse struct {
	User         UserResponse `json:"user"`
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
}

type DailyLoginResponse struct {
	Reward      int `json:"reward"`
	Streak      int `json:"streak"`
	TotalTokens int `json:"total_tokens"`
}

type UpdateProfileRequest struct {
	Username  string `json:"username" binding:"omitempty,min=3,max=20"`
	AvatarURL string `json:"avatar_url" binding:"omitempty"`
	Language  string `json:"language" binding:"omitempty"`
}
