package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/joenathan-15/kilas/middleware"
	"github.com/joenathan-15/kilas/service"
)

type StatsHandler struct {
	StatsService *service.StatsService
}

func NewStatsHandler(statsService *service.StatsService) *StatsHandler {
	return &StatsHandler{StatsService: statsService}
}

func (h *StatsHandler) Overview(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	stats, err := h.StatsService.GetOverview(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

func (h *StatsHandler) Activity(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	activity, err := h.StatsService.GetActivity(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": activity})
}

func (h *StatsHandler) DeckStats(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	deckID, err := strconv.ParseUint(c.Param("deck_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid deck id"})
		return
	}

	stats, err := h.StatsService.GetDeckStats(uint(deckID), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}
