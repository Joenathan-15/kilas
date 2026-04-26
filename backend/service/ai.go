package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"

	"github.com/joenathan-15/dto"
	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

type AIService struct{}

func NewAIService() *AIService {
	return &AIService{}
}

func (s *AIService) GenerateCards(text string, count int) ([]dto.GeneratedCard, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return nil, errors.New("AI not configured")
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		return nil, fmt.Errorf("failed to create Gemini client: %w", err)
	}
	defer client.Close()

	model := client.GenerativeModel("gemini-3.5-flash")

	systemPrompt := fmt.Sprintf(
		"You are an expert educator creating flashcards for Indonesian students. Generate exactly %d high-quality flashcard pairs from the study material. Return ONLY a valid JSON array, no other text: [{\"front\": \"question\", \"back\": \"answer\"}]. Keep answers concise. Use $LaTeX$ for math formulas.",
		count,
	)

	model.SystemInstruction = &genai.Content{
		Parts: []genai.Part{genai.Text(systemPrompt)},
	}
	model.SetTemperature(0.7)
	// model.ResponseMIMEType = "application/json" // optional, gemini is usually good enough with the prompt

	resp, err := model.GenerateContent(ctx, genai.Text(text))
	if err != nil {
		return nil, fmt.Errorf("Gemini API error: %w", err)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return nil, errors.New("AI returned no response")
	}

	part := resp.Candidates[0].Content.Parts[0]
	textResponse, ok := part.(genai.Text)
	if !ok {
		return nil, errors.New("AI returned non-text response")
	}

	content := string(textResponse)

	// Strip potential markdown code blocks (e.g. ```json ... ```)
	if len(content) > 7 && content[:7] == "```json" {
		content = content[7:]
		if len(content) > 3 && content[len(content)-3:] == "```" {
			content = content[:len(content)-3]
		}
	} else if len(content) > 3 && content[:3] == "```" {
		content = content[3:]
		if len(content) > 3 && content[len(content)-3:] == "```" {
			content = content[:len(content)-3]
		}
	}

	var cards []dto.GeneratedCard
	if err := json.Unmarshal([]byte(content), &cards); err != nil {
		return nil, fmt.Errorf("failed to parse AI response: %w\nResponse was: %s", err, content)
	}

	if len(cards) == 0 {
		return nil, errors.New("AI returned no cards, try again")
	}

	return cards, nil
}
