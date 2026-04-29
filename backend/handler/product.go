package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/joenathan-15/kilas/dto"
	"github.com/joenathan-15/kilas/middleware"
	"github.com/joenathan-15/kilas/service"
	"github.com/joenathan-15/kilas/utils"
)

type ProductHandler struct {
	ProductService *service.ProductService
}

func NewProductHandler(productService *service.ProductService) *ProductHandler {
	return &ProductHandler{ProductService: productService}
}

// List returns all available products for purchase.
func (h *ProductHandler) List(c *gin.Context) {
	products, err := h.ProductService.ListProducts()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch products"})
		return
	}

	response := []dto.ProductResponse{}
	for _, p := range products {
		response = append(response, dto.ProductResponse{
			ID:          p.ID,
			Name:        p.Name,
			Price:       p.Price,
			Quantity:    p.Quantity,
			Type:        p.Type,
			IsListed:    p.IsListed,
			Description: p.Description,
			CreatedAt:   p.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": response})
}

// Purchase handles buying a product and adding tokens to the user.
func (h *ProductHandler) Purchase(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req dto.PurchaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.FormatValidationError(err))
		return
	}

	transaction, user, err := h.ProductService.Purchase(userID, req.ProductID)
	if err != nil {
		if err.Error() == "product not found" || err.Error() == "product is not available" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.PurchaseResponse{
		Message:         "purchase initiated",
		PaymentURL:      transaction.PaymentURL,
		TokensRemaining: user.Tokens,
		Transaction: dto.TransactionInfo{
			ID:          transaction.ID,
			ProductName: "",
			Amount:      transaction.Amount,
			Tokens:      transaction.Tokens,
			CreatedAt:   transaction.CreatedAt,
		},
	})
}

// Transactions returns the purchase history for the current user.
func (h *ProductHandler) Transactions(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	transactions, err := h.ProductService.GetTransactions(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch transactions"})
		return
	}

	response := []dto.TransactionInfo{}
	for _, t := range transactions {
		response = append(response, dto.TransactionInfo{
			ID:          t.ID,
			ProductName: t.Product.Name,
			Amount:      t.Amount,
			Tokens:      t.Tokens,
			CreatedAt:   t.CreatedAt,
			Status:      t.Status,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": response})
}

// MidtransWebhook processes notifications sent by Midtrans.
func (h *ProductHandler) MidtransWebhook(c *gin.Context) {
	var notificationPayload map[string]interface{}
	if err := c.ShouldBindJSON(&notificationPayload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	orderID, ok1 := notificationPayload["order_id"].(string)
	transactionStatus, ok2 := notificationPayload["transaction_status"].(string)

	if !ok1 || !ok2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing essential fields"})
		return
	}

	fraudStatus, _ := notificationPayload["fraud_status"].(string)

	err := h.ProductService.HandleNotification(orderID, transactionStatus, fraudStatus)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success"})
}
