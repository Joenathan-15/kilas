package service

import (
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/joenathan-15/kilas/model"
	"github.com/joenathan-15/kilas/repository"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthService struct {
	UserRepo *repository.UserRepository
}

func NewAuthService(userRepo *repository.UserRepository) *AuthService {
	return &AuthService{UserRepo: userRepo}
}

// generateTokens creates a pair of access and refresh JWT tokens for the given user ID.
func (s *AuthService) GenerateTokens(userID uint) (accessToken, refreshToken string, err error) {
	accessSecret := os.Getenv("ACCESS_TOKEN_SECRET")
	refreshSecret := os.Getenv("REFRESH_TOKEN_SECRET")

	// Access token: 24 hours
	accessClaims := jwt.MapClaims{
		"sub":  float64(userID),
		"type": "access",
		"exp":  time.Now().Add(24 * time.Hour).Unix(),
		"iat":  time.Now().Unix(),
	}
	accessToken, err = jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims).SignedString([]byte(accessSecret))
	if err != nil {
		return "", "", fmt.Errorf("failed to generate access token: %w", err)
	}

	// Refresh token: 30 days
	refreshClaims := jwt.MapClaims{
		"sub":  float64(userID),
		"type": "refresh",
		"exp":  time.Now().Add(30 * 24 * time.Hour).Unix(),
		"iat":  time.Now().Unix(),
	}
	refreshToken, err = jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims).SignedString([]byte(refreshSecret))
	if err != nil {
		return "", "", fmt.Errorf("failed to generate refresh token: %w", err)
	}

	return accessToken, refreshToken, nil
}

// Register creates a new user with hashed password and returns tokens.
func (s *AuthService) Register(email, username, password string) (*model.User, string, string, error) {
	// Check if email already taken
	existing, err := s.UserRepo.FindByEmail(email)
	if err == nil && existing.ID > 0 {
		return nil, "", "", errors.New("email already taken")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return nil, "", "", fmt.Errorf("failed to hash password: %w", err)
	}

	user := &model.User{
		Email:    email,
		Username: username,
		Password: string(hashedPassword),
		Provider: "local",
		Tokens:   500,
	}

	if err := s.UserRepo.Create(user); err != nil {
		return nil, "", "", fmt.Errorf("failed to create user: %w", err)
	}

	accessToken, refreshToken, err := s.GenerateTokens(user.ID)
	if err != nil {
		return nil, "", "", err
	}

	return user, accessToken, refreshToken, nil
}

// Login authenticates a user by email and password.
func (s *AuthService) Login(email, password string) (*model.User, string, string, error) {
	user, err := s.UserRepo.FindByEmail(email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", "", errors.New("invalid credentials")
		}
		return nil, "", "", fmt.Errorf("failed to find user: %w", err)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, "", "", errors.New("invalid credentials")
	}

	accessToken, refreshToken, err := s.GenerateTokens(user.ID)
	if err != nil {
		return nil, "", "", err
	}

	return user, accessToken, refreshToken, nil
}

// RefreshToken validates a refresh token and returns a new access token.
func (s *AuthService) RefreshToken(refreshTokenStr string) (string, error) {
	refreshSecret := os.Getenv("REFRESH_TOKEN_SECRET")

	token, err := jwt.Parse(refreshTokenStr, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(refreshSecret), nil
	})

	if err != nil || !token.Valid {
		return "", errors.New("invalid refresh token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", errors.New("invalid token claims")
	}

	tokenType, _ := claims["type"].(string)
	if tokenType != "refresh" {
		return "", errors.New("invalid token type")
	}

	sub, _ := claims["sub"].(float64)
	userID := uint(sub)

	// Generate new access token only
	accessSecret := os.Getenv("ACCESS_TOKEN_SECRET")
	accessClaims := jwt.MapClaims{
		"sub":  float64(userID),
		"type": "access",
		"exp":  time.Now().Add(24 * time.Hour).Unix(),
		"iat":  time.Now().Unix(),
	}
	accessToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims).SignedString([]byte(accessSecret))
	if err != nil {
		return "", fmt.Errorf("failed to generate access token: %w", err)
	}

	return accessToken, nil
}

// GetByID fetches a user by their ID.
func (s *AuthService) GetByID(id uint) (*model.User, error) {
	return s.UserRepo.FindByID(id)
}

// TopUp adds tokens to a user's balance.
func (s *AuthService) TopUp(userID uint, amount int) (*model.User, error) {
	if err := s.UserRepo.AddTokens(userID, amount); err != nil {
		return nil, fmt.Errorf("failed to top up tokens: %w", err)
	}
	return s.UserRepo.FindByID(userID)
}

// DeductTokens subtracts tokens from a user's balance. Returns error if insufficient.
func (s *AuthService) DeductTokens(userID uint, amount int) error {
	if err := s.UserRepo.DeductTokens(userID, amount); err != nil {
		return errors.New("insufficient tokens")
	}
	return nil
}

// ClaimDailyReward grants tokens based on a user's daily login streak.
func (s *AuthService) ClaimDailyReward(userID uint) (reward int, streak int, totalTokens int, err error) {
	user, err := s.UserRepo.FindByID(userID)
	if err != nil {
		return 0, 0, 0, fmt.Errorf("failed to find user: %w", err)
	}

	now := time.Now()
	var lastLogin time.Time
	if user.LastLoginDate != nil {
		lastLogin = *user.LastLoginDate
	}

	// Check if already claimed today
	if user.LastLoginDate != nil {
		y1, m1, d1 := lastLogin.Date()
		y2, m2, d2 := now.Date()
		if y1 == y2 && m1 == m2 && d1 == d2 {
			return 0, 0, 0, errors.New("daily reward already claimed today")
		}
	}

	streak = user.LoginStreak
	// Check if logged in yesterday
	yesterday := now.AddDate(0, 0, -1)
	y1, m1, d1 := lastLogin.Date()
	y2, m2, d2 := yesterday.Date()

	if user.LastLoginDate != nil && y1 == y2 && m1 == m2 && d1 == d2 {
		streak++
	} else {
		// Streak broken or first login
		streak = 1
	}

	// Loop back to day 1 after day 7
	if streak > 7 {
		streak = 1
	}

	// Calculate reward mapping
	rewards := []int{50, 100, 150, 200, 250, 350, 500}
	reward = rewards[streak-1] // streak is 1-indexed (1 to 7)

	// Save to DB
	if err := s.UserRepo.UpdateDailyLogin(userID, streak, now, reward); err != nil {
		return 0, 0, 0, fmt.Errorf("failed to update daily login: %w", err)
	}

	// Retrieve updated user to get accurate total tokens
	updatedUser, _ := s.UserRepo.FindByID(userID)

	return reward, streak, updatedUser.Tokens, nil
}

func (s *AuthService) UpdateProfile(userID uint, username, avatarURL, language string) (*model.User, error) {
	user, err := s.UserRepo.FindByID(userID)
	if err != nil {
		return nil, err
	}

	if username != "" {
		user.Username = username
	}
	if avatarURL != "" {
		user.AvatarURL = avatarURL
	}
	if language != "" {
		user.Language = language
	}

	if err := s.UserRepo.Update(user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *AuthService) CompleteOnboarding(userID uint) error {
	return s.UserRepo.SetOnboardingCompleted(userID, true)
}
