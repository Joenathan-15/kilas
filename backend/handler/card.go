package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/joenathan-15/dto"
	"github.com/joenathan-15/middleware"
	"github.com/joenathan-15/service"
)

type CardHandler struct {
	CardService *service.CardService
	DeckService *service.DeckService
}

func NewCardHandler(cardService *service.CardService, deckService *service.DeckService) *CardHandler {
	return &CardHandler{CardService: cardService, DeckService: deckService}
}

func (h *CardHandler) Create(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	deckID, err := strconv.ParseUint(c.Param("deck_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid deck id"})
		return
	}

	var req dto.CardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	card, err := h.CardService.Create(uint(deckID), userID, req)
	if err != nil {
		if err.Error() == "forbidden" {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, card)
}

func (h *CardHandler) List(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	deckID, err := strconv.ParseUint(c.Param("deck_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid deck id"})
		return
	}

	// Verify access — owner or public deck
	deck, err := h.DeckService.GetByID(uint(deckID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "deck not found"})
		return
	}
	if deck.UserID != userID && !deck.IsPublic {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	cards, err := h.CardService.ListByDeckID(uint(deckID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": cards})
}

func (h *CardHandler) Update(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	cardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid card id"})
		return
	}

	var req dto.CardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	card, err := h.CardService.Update(uint(cardID), userID, req)
	if err != nil {
		if err.Error() == "forbidden" {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, card)
}

func (h *CardHandler) Delete(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	cardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid card id"})
		return
	}

	if err := h.CardService.Delete(uint(cardID), userID); err != nil {
		if err.Error() == "forbidden" {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}
