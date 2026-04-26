package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/joenathan-15/kilas/dto"
	"github.com/joenathan-15/kilas/middleware"
	"github.com/joenathan-15/kilas/service"
	"github.com/joenathan-15/kilas/utils"
)

type StudyHandler struct {
	StudyService *service.StudyService
}

func NewStudyHandler(studyService *service.StudyService) *StudyHandler {
	return &StudyHandler{StudyService: studyService}
}

func (h *StudyHandler) GetDueCards(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	deckID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid deck id"})
		return
	}

	cards, err := h.StudyService.GetDueCards(uint(deckID), userID)
	if err != nil {
		if err.Error() == "forbidden" {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":      cards,
		"total_due": len(cards),
	})
}

func (h *StudyHandler) StartSession(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req dto.StartSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.FormatValidationError(err))
		return
	}

	session, err := h.StudyService.StartSession(userID, req.DeckID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"session_id": session.ID})
}

func (h *StudyHandler) SubmitReview(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	sessionID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}

	var req dto.ReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.FormatValidationError(err))
		return
	}

	card, err := h.StudyService.SubmitReview(uint(sessionID), req.CardID, userID, req.Quality)
	if err != nil {
		if err.Error() == "forbidden" {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"card":     card,
		"next_due": card.DueDate.Format("2006-01-02T15:04:05Z"),
	})
}

func (h *StudyHandler) EndSession(c *gin.Context) {
	sessionID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}

	var req dto.EndSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.FormatValidationError(err))
		return
	}

	if err := h.StudyService.EndSession(uint(sessionID), req.Duration); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ok"})
}
