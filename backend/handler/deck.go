package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/joenathan-15/dto"
	"github.com/joenathan-15/middleware"
	"github.com/joenathan-15/service"
)

type DeckHandler struct {
	DeckService *service.DeckService
}

func NewDeckHandler(deckService *service.DeckService) *DeckHandler {
	return &DeckHandler{DeckService: deckService}
}

func (h *DeckHandler) List(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	decks, err := h.DeckService.List(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Convert tags string to array for JSON response
	type deckResponse struct {
		ID          uint     `json:"id"`
		UserID      uint     `json:"user_id"`
		Title       string   `json:"title"`
		Description string   `json:"description"`
		IsPublic    bool     `json:"is_public"`
		Tags        []string `json:"tags"`
		CardCount   int64    `json:"card_count"`
		CreatedAt   string   `json:"created_at"`
		UpdatedAt   string   `json:"updated_at"`
	}

	result := make([]deckResponse, len(decks))
	for i, d := range decks {
		result[i] = deckResponse{
			ID:          d.ID,
			UserID:      d.UserID,
			Title:       d.Title,
			Description: d.Description,
			IsPublic:    d.IsPublic,
			Tags:        service.StringToTags(d.Tags),
			CardCount:   d.CardCount,
			CreatedAt:   d.CreatedAt.Format("2006-01-02T15:04:05Z"),
			UpdatedAt:   d.UpdatedAt.Format("2006-01-02T15:04:05Z"),
		}
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

func (h *DeckHandler) Create(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req dto.DeckRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	deck, err := h.DeckService.Create(userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":          deck.ID,
		"user_id":     deck.UserID,
		"title":       deck.Title,
		"description": deck.Description,
		"is_public":   deck.IsPublic,
		"tags":        service.StringToTags(deck.Tags),
		"card_count":  0,
		"created_at":  deck.CreatedAt.Format("2006-01-02T15:04:05Z"),
		"updated_at":  deck.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	})
}

func (h *DeckHandler) Get(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid deck id"})
		return
	}

	deck, err := h.DeckService.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "deck not found"})
		return
	}

	// Allow if owner or public
	if deck.UserID != userID && !deck.IsPublic {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":          deck.ID,
		"user_id":     deck.UserID,
		"title":       deck.Title,
		"description": deck.Description,
		"is_public":   deck.IsPublic,
		"tags":        service.StringToTags(deck.Tags),
		"card_count":  len(deck.Cards),
		"cards":       deck.Cards,
		"created_at":  deck.CreatedAt.Format("2006-01-02T15:04:05Z"),
		"updated_at":  deck.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	})
}

func (h *DeckHandler) Update(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid deck id"})
		return
	}

	var req dto.DeckRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	deck, err := h.DeckService.Update(uint(id), userID, req)
	if err != nil {
		if err.Error() == "forbidden" {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":          deck.ID,
		"user_id":     deck.UserID,
		"title":       deck.Title,
		"description": deck.Description,
		"is_public":   deck.IsPublic,
		"tags":        service.StringToTags(deck.Tags),
		"card_count":  len(deck.Cards),
		"created_at":  deck.CreatedAt.Format("2006-01-02T15:04:05Z"),
		"updated_at":  deck.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	})
}

func (h *DeckHandler) Delete(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid deck id"})
		return
	}

	if err := h.DeckService.Delete(uint(id), userID); err != nil {
		if err.Error() == "forbidden" {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}
