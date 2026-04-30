package handler

import (
	"bytes"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joenathan-15/kilas/dto"
	"github.com/joenathan-15/kilas/middleware"
	"github.com/joenathan-15/kilas/model"
	"github.com/joenathan-15/kilas/repository"
	"github.com/joenathan-15/kilas/service"
	"github.com/joenathan-15/kilas/utils"
	"github.com/ledongthuc/pdf"
)

type AIHandler struct {
	AIService     *service.AIService
	DeckService   *service.DeckService
	CardService   *service.CardService
	AuthService   *service.AuthService
	AIHistoryRepo *repository.AIHistoryRepository
}

func NewAIHandler(aiService *service.AIService, deckService *service.DeckService, cardService *service.CardService, authService *service.AuthService, aiHistoryRepo *repository.AIHistoryRepository) *AIHandler {
	return &AIHandler{AIService: aiService, DeckService: deckService, CardService: cardService, AuthService: authService, AIHistoryRepo: aiHistoryRepo}
}

func (h *AIHandler) GenerateCards(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req dto.GenerateCardsRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.FormatValidationError(err))
		return
	}

	text := req.Text

	count := req.Count
	if count <= 0 {
		count = 10
	}

	tokenCost := count * 10

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

		numPages := pdfReader.NumPage()
		tokenCost = numPages * 50

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

	// Fetch user details for power user status
	user, err := h.AuthService.GetByID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch user details"})
		return
	}

	isPowerUser := user.SubscriptionUntil != nil && user.SubscriptionUntil.After(time.Now())

	if isPowerUser {
		// Apply 10% discount
		tokenCost = int(float64(tokenCost) * 0.9)
	} else {
		// Check daily generation limit (3x per day)
		countToday, err := h.AIHistoryRepo.CountGenerationsToday(userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check generation limits"})
			return
		}
		if countToday >= 3 {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "daily limit of 3 AI generations reached. please try again tomorrow."})
			return
		}
	}

	// Deduct tokens before generating (fail fast if insufficient)
	if err := h.AuthService.DeductTokens(userID, tokenCost); err != nil {
		c.JSON(http.StatusPaymentRequired, gin.H{
			"error":           "insufficient tokens",
			"tokens_required": tokenCost,
		})
		return
	}

	generatedData, err := h.AIService.GenerateCards(text, count, req.Language)
	if err != nil {
		// Refund tokens on AI failure
		h.AuthService.TopUp(userID, tokenCost)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var finalDeck *model.Deck
	if req.DeckID != 0 {
		existingDeck, err := h.DeckService.GetByID(req.DeckID)
		if err != nil {
			h.AuthService.TopUp(userID, tokenCost)
			c.JSON(http.StatusNotFound, gin.H{"error": "deck not found"})
			return
		}
		if existingDeck.UserID != userID {
			h.AuthService.TopUp(userID, tokenCost)
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		finalDeck = existingDeck
	} else {
		title := req.Title
		if title == "" {
			title = generatedData.Title + " (AI Generated)"
		} else {
			title = title + " (AI Generated)"
		}

		// Create a new deck automatically
		newDeck, err := h.DeckService.Create(userID, dto.DeckRequest{
			Title:         title,
			Description:   generatedData.Description,
			IsPublic:      false,
			Tags:          generatedData.Tags,
			IsAIGenerated: true,
		})
		if err != nil {
			// Refund tokens on deck creation failure
			h.AuthService.TopUp(userID, tokenCost)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create deck"})
			return
		}
		finalDeck = newDeck
	}

	deckID := finalDeck.ID

	// Save generated cards to the new deck
	var savedCards []model.Card
	for _, gc := range generatedData.Cards {
		card := &model.Card{
			DeckID:      deckID,
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

	// Record AI generation history
	history := &model.AIGenerationHistory{
		UserID:    userID,
		Text:      text,
		DeckTitle: finalDeck.Title,
		DeckID:    finalDeck.ID,
		CardCount: len(savedCards),
		CreatedAt: time.Now(),
	}
	_ = h.AIHistoryRepo.Create(history)

	// Fetch updated user to get current token balance
	updatedUser, _ := h.AuthService.GetByID(userID)
	tokensRemaining := 0
	if updatedUser != nil {
		tokensRemaining = updatedUser.Tokens
	}

	c.JSON(http.StatusCreated, gin.H{
		"deck":             finalDeck,
		"cards":            savedCards,
		"tokens_used":      tokenCost,
		"tokens_remaining": tokensRemaining,
	})
}

func (h *AIHandler) GetHistory(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	history, err := h.AIHistoryRepo.FindByUserID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch AI generation history"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": history})
}
