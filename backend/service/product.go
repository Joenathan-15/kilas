package service

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joenathan-15/kilas/model"
	"github.com/joenathan-15/kilas/repository"
	"github.com/midtrans/midtrans-go"
	"github.com/midtrans/midtrans-go/snap"
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

// Purchase handles buying a product: validates the product, records pending transaction, generates Midtrans payment URL.
func (s *ProductService) Purchase(userID, productID uint) (*model.Transaction, *model.User, error) {
	// Find the product
	product, err := s.ProductRepo.FindByID(productID)
	if err != nil {
		return nil, nil, errors.New("product not found")
	}

	if !product.IsListed {
		return nil, nil, errors.New("product is not available")
	}

	// Fetch user for details
	user, err := s.UserRepo.FindByID(userID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to fetch user: %w", err)
	}

	// Record the transaction as pending first
	transaction := &model.Transaction{
		UserID:    userID,
		ProductID: product.ID,
		Amount:    product.Price,
		Tokens:    product.Quantity,
		Status:    "pending",
		CreatedAt: time.Now(),
	}
	if err := s.ProductRepo.CreateTransaction(transaction); err != nil {
		return nil, nil, fmt.Errorf("failed to record transaction: %w", err)
	}

	// Setup Midtrans Snap client
	var snapClient snap.Client
	envType := midtrans.Sandbox
	if os.Getenv("MIDTRANS_ENV") == "production" {
		envType = midtrans.Production
	} else {
		envType = midtrans.Sandbox
	}
	snapClient.New(os.Getenv("MIDTRANS_SERVER_KEY"), envType)

	// Generate a unique OrderID
	orderID := fmt.Sprintf("KILAS-TRX-%d-%d", transaction.ID, time.Now().Unix())

	// Create Midtrans Snap transaction
	req := &snap.Request{
		TransactionDetails: midtrans.TransactionDetails{
			OrderID:  orderID,
			GrossAmt: int64(product.Price),
		},
		CustomerDetail: &midtrans.CustomerDetails{
			FName: user.Username,
			Email: user.Email,
		},
		Items: &[]midtrans.ItemDetails{
			{
				ID:    fmt.Sprintf("PROD-%d", product.ID),
				Price: int64(product.Price),
				Qty:   1,
				Name:  product.Name,
			},
		},
	}

	snapResp, midtransErr := snapClient.CreateTransaction(req)
	if midtransErr != nil {
		return nil, nil, fmt.Errorf("failed to create midtrans transaction: %w", midtransErr)
	}

	if snapResp.Token == "" {
		return nil, nil, fmt.Errorf("failed to create midtrans transaction: %s", snapResp.StatusCode)
	}

	// Update the transaction with the payment URL
	transaction.PaymentURL = snapResp.RedirectURL
	s.ProductRepo.DB.Save(transaction)

	return transaction, user, nil
}

// GetTransactions returns all transactions for a user.
func (s *ProductService) GetTransactions(userID uint) ([]model.Transaction, error) {
	return s.ProductRepo.FindTransactionsByUserID(userID)
}

// HandleNotification processes the webhook payload from Midtrans.
func (s *ProductService) HandleNotification(orderID, transactionStatus, fraudStatus string) error {
	// OrderID format: KILAS-TRX-{transactionID}-{timestamp}
	// Extract transaction ID
	parts := strings.Split(orderID, "-")
	if len(parts) < 3 {
		return errors.New("invalid order id format")
	}

	importStrconvID := parts[2]
	importStrconvIDUint, err := strconv.ParseUint(importStrconvID, 10, 32)
	if err != nil {
		return fmt.Errorf("invalid transaction id in order: %w", err)
	}

	transactionID := uint(importStrconvIDUint)

	// Fetch transaction
	transaction, err := s.ProductRepo.FindTransactionByID(transactionID)
	if err != nil {
		return fmt.Errorf("transaction not found: %w", err)
	}

	// Skip if already processed
	if transaction.Status == "success" {
		return nil
	}

	// Determine new status
	newStatus := transaction.Status
	switch transactionStatus {
	case "capture":
		if fraudStatus == "accept" {
			newStatus = "success"
		}
	case "settlement":
		newStatus = "success"
	case "cancel", "deny", "expire":
		newStatus = "failed"
	}

	// If status changed to success, grant tokens or extend subscription
	if newStatus == "success" && transaction.Status != "success" {
		if transaction.Product.Type == "subscription" {
			if err := s.UserRepo.ExtendSubscription(transaction.UserID, 30); err != nil {
				return fmt.Errorf("failed to extend subscription: %w", err)
			}
		} else {
			if err := s.UserRepo.AddTokens(transaction.UserID, transaction.Tokens); err != nil {
				return fmt.Errorf("failed to grant tokens: %w", err)
			}
		}
	}

	transaction.Status = newStatus
	return s.ProductRepo.DB.Save(transaction).Error
}
