package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/joenathan-15/kilas/model"
	"github.com/joenathan-15/kilas/repository"
)

type ProductService struct {
	ProductRepo *repository.ProductRepository
	UserRepo    *repository.UserRepository
}

func NewProductService(productRepo *repository.ProductRepository, userRepo *repository.UserRepository) *ProductService {
	return &ProductService{ProductRepo: productRepo, UserRepo: userRepo}
}

// ListProducts returns all listed products.
func (s *ProductService) ListProducts() ([]model.Product, error) {
	return s.ProductRepo.FindAllListed()
}

// Purchase handles buying a product: validates the product, adds tokens, records the transaction.
func (s *ProductService) Purchase(userID, productID uint) (*model.Transaction, *model.User, error) {
	// Find the product
	product, err := s.ProductRepo.FindByID(productID)
	if err != nil {
		return nil, nil, errors.New("product not found")
	}

	if !product.IsListed {
		return nil, nil, errors.New("product is not available")
	}

	// Add tokens to user
	if err := s.UserRepo.AddTokens(userID, product.Quantity); err != nil {
		return nil, nil, fmt.Errorf("failed to add tokens: %w", err)
	}

	// Record the transaction
	transaction := &model.Transaction{
		UserID:    userID,
		ProductID: product.ID,
		Amount:    product.Price,
		Tokens:    product.Quantity,
		CreatedAt: time.Now(),
	}
	if err := s.ProductRepo.CreateTransaction(transaction); err != nil {
		return nil, nil, fmt.Errorf("failed to record transaction: %w", err)
	}

	// Fetch updated user
	user, err := s.UserRepo.FindByID(userID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to fetch user: %w", err)
	}

	return transaction, user, nil
}

// GetTransactions returns all transactions for a user.
func (s *ProductService) GetTransactions(userID uint) ([]model.Transaction, error) {
	return s.ProductRepo.FindTransactionsByUserID(userID)
}
