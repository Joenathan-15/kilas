package handler

import (
	"bytes"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joenathan-15/kilas/dto"
	"github.com/joenathan-15/kilas/middleware"
	"github.com/joenathan-15/kilas/model"
	"github.com/joenathan-15/kilas/service"
	"github.com/joenathan-15/kilas/utils"
	"github.com/ledongthuc/pdf"
)

type AIHandler struct {
	AIService   *service.AIService
	DeckService *service.DeckService
	CardService *service.CardService
	AuthService *service.AuthService
}

func NewAIHandler(aiService *service.AIService, deckService *service.DeckService, cardService *service.CardService, authService *service.AuthService) *AIHandler {
	return &AIHandler{AIService: aiService, DeckService: deckService, CardService: cardService, AuthService: authService}
}

func (h *AIHandler) GenerateCards(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req dto.GenerateCardsRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.FormatValidationError(err))
		return
	}

	text := req.Text

	// Check if a file was uploaded
	fileHeader, err := c.FormFile("file")
	if err == nil {
		file, err := fileHeader.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to open uploaded file"})
			return
		}
		defer file.Close()

		buf := new(bytes.Buffer)
		size, err := buf.ReadFrom(file)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read file content"})
			return
		}

		pdfReader, err := pdf.NewReader(bytes.NewReader(buf.Bytes()), size)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "failed to parse PDF file"})
			return
		}

		b, err := pdfReader.GetPlainText()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to extract text from PDF"})
			return
		}

		var textBuf bytes.Buffer
		textBuf.ReadFrom(b)
		text = textBuf.String()
	} else if text == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "either text or file must be provided"})
		return
	}

	count := req.Count
	if count <= 0 {
		count = 10
	}

	// Calculate token cost: 10 tokens per card requested
	tokenCost := count * 10

	// Deduct tokens before generating (fail fast if insufficient)
	if err := h.AuthService.DeductTokens(userID, tokenCost); err != nil {
		c.JSON(http.StatusPaymentRequired, gin.H{
			"error":          "insufficient tokens",
			"tokens_required": tokenCost,
		})
		return
	}

	generatedData, err := h.AIService.GenerateCards(text, count)
	if err != nil {
		// Refund tokens on AI failure
		h.AuthService.TopUp(userID, tokenCost)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	title := req.Title
	if title == "" {
		title = generatedData.Title + " (AI Generated)"
	} else {
		title = title + " (AI Generated)"
	}

	// Create a new deck automatically
	newDeck, err := h.DeckService.Create(userID, dto.DeckRequest{
		Title:       title,
		Description: generatedData.Description,
		IsPublic:    false,
		Tags:        generatedData.Tags,
	})
	if err != nil {
		// Refund tokens on deck creation failure
		h.AuthService.TopUp(userID, tokenCost)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create deck"})
		return
	}

	// Save generated cards to the new deck
	var savedCards []model.Card
	for _, gc := range generatedData.Cards {
		card := &model.Card{
			DeckID:      newDeck.ID,
			Front:       gc.Front,
			Back:        gc.Back,
			IsAICreated: true,
			Interval:    0,
			Repetitions: 0,
			EaseFactor:  2.5,
			DueDate:     time.Now(),
		}
		if err := h.CardService.CardRepo.Create(card); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save cards"})
			return
		}
		savedCards = append(savedCards, *card)
	}

	// Fetch updated user to get current token balance
	user, _ := h.AuthService.GetByID(userID)
	tokensRemaining := 0
	if user != nil {
		tokensRemaining = user.Tokens
	}

	c.JSON(http.StatusCreated, gin.H{
		"deck":             newDeck,
		"cards":            savedCards,
		"tokens_used":      tokenCost,
		"tokens_remaining": tokensRemaining,
	})
}
