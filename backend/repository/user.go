package repository

import (
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
