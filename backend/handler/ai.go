package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/joenathan-15/dto"
	"github.com/joenathan-15/middleware"
	"github.com/joenathan-15/service"
)

type AIHandler struct {
	AIService   *service.AIService
	DeckService *service.DeckService
}

func NewAIHandler(aiService *service.AIService, deckService *service.DeckService) *AIHandler {
	return &AIHandler{AIService: aiService, DeckService: deckService}
}

func (h *AIHandler) GenerateCards(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req dto.GenerateCardsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify deck ownership
	deck, err := h.DeckService.GetByID(req.DeckID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "deck not found"})
		return
	}
	if deck.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	cards, err := h.AIService.GenerateCards(req.Text, req.Count)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Returns cards for user to review, does NOT save to DB
	c.JSON(http.StatusOK, gin.H{"cards": cards})
}
