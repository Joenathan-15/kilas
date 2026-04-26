package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/joenathan-15/kilas/middleware"
	"github.com/joenathan-15/kilas/service"
)

type LibraryHandler struct {
	LibraryService *service.LibraryService
}

func NewLibraryHandler(libraryService *service.LibraryService) *LibraryHandler {
	return &LibraryHandler{LibraryService: libraryService}
}

func (h *LibraryHandler) Browse(c *gin.Context) {
	search := c.Query("search")
	tags := c.Query("tags")
	page := service.ParseInt(c.Query("page"), 1)
	limit := service.ParseInt(c.Query("limit"), 12)

	result, err := h.LibraryService.Browse(search, tags, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *LibraryHandler) Clone(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	deckID, err := strconv.ParseUint(c.Param("deck_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid deck id"})
		return
	}

	deck, err := h.LibraryService.Clone(uint(deckID), userID)
	if err != nil {
		if err.Error() == "not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "deck not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"deck": deck})
}
