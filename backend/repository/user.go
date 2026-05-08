package repository

import (
	"time"

	"github.com/joenathan-15/kilas/model"
	"gorm.io/gorm"
)

type UserRepository struct {
	DB *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{DB: db}
}

func (r *UserRepository) FindByEmail(email string) (*model.User, error) {
	var user model.User
	err := r.DB.Where("email = ?", email).First(&user).Error
	return &user, err
}

func (r *UserRepository) FindByID(id uint) (*model.User, error) {
	var user model.User
	err := r.DB.First(&user, id).Error
	return &user, err
}

func (r *UserRepository) Create(user *model.User) error {
	return r.DB.Create(user).Error
}

// UpdateTokens sets the user's token balance to the given value.
func (r *UserRepository) UpdateTokens(userID uint, tokens int) error {
	return r.DB.Model(&model.User{}).Where("id = ?", userID).Update("tokens", tokens).Error
}

// AddTokens atomically increments the user's token balance by the given amount.
func (r *UserRepository) AddTokens(userID uint, amount int) error {
	return r.DB.Model(&model.User{}).Where("id = ?", userID).
		Update("tokens", gorm.Expr("tokens + ?", amount)).Error
}

// DeductTokens atomically decrements the user's token balance. Returns error if insufficient.
func (r *UserRepository) DeductTokens(userID uint, amount int) error {
	result := r.DB.Model(&model.User{}).
		Where("id = ? AND tokens >= ?", userID, amount).
		Update("tokens", gorm.Expr("tokens - ?", amount))
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound // insufficient tokens
	}
	return nil
}

// ExtendSubscription adds days to the user's subscription. If they don't have an active one, it starts from today.
func (r *UserRepository) ExtendSubscription(userID uint, days int) error {
	user, err := r.FindByID(userID)
	if err != nil {
		return err
	}

	var newExpiration time.Time
	if user.SubscriptionUntil != nil && user.SubscriptionUntil.After(time.Now()) {
		newExpiration = user.SubscriptionUntil.AddDate(0, 0, days)
	} else {
		newExpiration = time.Now().AddDate(0, 0, days)
	}

	return r.DB.Model(&model.User{}).Where("id = ?", userID).Update("subscription_until", newExpiration).Error
}

// UpdateDailyLogin updates the user's login streak, last login date, and adds tokens.
func (r *UserRepository) UpdateDailyLogin(userID uint, newStreak int, newDate time.Time, addedTokens int) error {
	return r.DB.Model(&model.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"login_streak":    newStreak,
		"last_login_date": newDate,
		"tokens":          gorm.Expr("tokens + ?", addedTokens),
	}).Error
}

func (r *UserRepository) Update(user *model.User) error {
	return r.DB.Save(user).Error
}

func (r *UserRepository) SetOnboardingCompleted(userID uint, completed bool) error {
	return r.DB.Model(&model.User{}).Where("id = ?", userID).Update("onboarding_completed", completed).Error
}
