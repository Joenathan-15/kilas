package dto

import "time"

type ProductResponse struct {
	ID          uint      `json:"id"`
	Name          string    `json:"name"`
	NameID        string    `json:"name_id"`
	NameEN        string    `json:"name_en"`
	Price         int       `json:"price"`
	Quantity      int       `json:"quantity"`
	Type          string    `json:"type"`
	IsListed      bool      `json:"is_listed"`
	Description   string    `json:"description"`
	DescriptionID string    `json:"description_id"`
	DescriptionEN string    `json:"description_en"`
	CreatedAt     time.Time `json:"created_at"`
}

type PurchaseRequest struct {
	ProductID uint `json:"product_id" binding:"required"`
}

type PurchaseResponse struct {
	Message         string          `json:"message"`
	PaymentURL      string          `json:"payment_url"`
	TokensRemaining int             `json:"tokens_remaining"`
	Transaction     TransactionInfo `json:"transaction"`
}

type TransactionInfo struct {
	ID          uint      `json:"id"`
	ProductName string    `json:"product_name"`
	Amount      int       `json:"amount"`
	Tokens      int       `json:"tokens"`
	CreatedAt   time.Time `json:"created_at"`
	Status      string    `json:"status"`
}
