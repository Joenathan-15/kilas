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

	// Access token: 15 minutes
	accessClaims := jwt.MapClaims{
		"sub":  float64(userID),
		"type": "access",
		"exp":  time.Now().Add(15 * time.Minute).Unix(),
		"iat":  time.Now().Unix(),
	}
	accessToken, err = jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims).SignedString([]byte(accessSecret))
	if err != nil {
		return "", "", fmt.Errorf("failed to generate access token: %w", err)
	}

	// Refresh token: 7 days
	refreshClaims := jwt.MapClaims{
		"sub":  float64(userID),
		"type": "refresh",
		"exp":  time.Now().Add(7 * 24 * time.Hour).Unix(),
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
		"exp":  time.Now().Add(15 * time.Minute).Unix(),
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
