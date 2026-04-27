package repository

import (
	"github.com/joenathan-15/kilas/model"
	"gorm.io/gorm"
)

type ProductRepository struct {
	DB *gorm.DB
}

func NewProductRepository(db *gorm.DB) *ProductRepository {
	return &ProductRepository{DB: db}
}

// FindAllListed returns all products that are currently listed for sale.
func (r *ProductRepository) FindAllListed() ([]model.Product, error) {
	var products []model.Product
	err := r.DB.Where("is_listed = ?", true).Order("price ASC").Find(&products).Error
	return products, err
}

// FindByID returns a product by its ID.
func (r *ProductRepository) FindByID(id uint) (*model.Product, error) {
	var product model.Product
	err := r.DB.First(&product, id).Error
	return &product, err
}

// CreateTransaction records a purchase transaction.
func (r *ProductRepository) CreateTransaction(tx *model.Transaction) error {
	return r.DB.Create(tx).Error
}

// FindTransactionsByUserID returns all transactions for a given user.
func (r *ProductRepository) FindTransactionsByUserID(userID uint) ([]model.Transaction, error) {
	var transactions []model.Transaction
	err := r.DB.Where("user_id = ?", userID).
		Preload("Product").
		Order("created_at DESC").
		Find(&transactions).Error
	return transactions, err
}

// FindTransactionByID returns a transaction by its ID.
func (r *ProductRepository) FindTransactionByID(id uint) (*model.Transaction, error) {
	var transaction model.Transaction
	err := r.DB.First(&transaction, id).Error
	return &transaction, err
}
