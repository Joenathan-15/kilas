package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strings"

	"github.com/google/generative-ai-go/genai"
	"github.com/joenathan-15/kilas/dto"
	"google.golang.org/api/option"
)

type AIService struct{}

func NewAIService() *AIService {
	return &AIService{}
}

func (s *AIService) GenerateCards(text string, count int, language string) (*dto.GeneratedDeckData, error) {
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

	model := client.GenerativeModel("gemini-flash-latest")

	targetLang := "Indonesian"
	if language == "en" {
		targetLang = "English"
	}

	systemPrompt := fmt.Sprintf(
		"You are an expert educator creating flashcards for students. Generate the content in %s. Generate a title, a short description, 3-5 relevant tags, and exactly %d high-quality flashcard pairs from the study material. Return ONLY a valid JSON object matching this schema: {\"title\": \"string\", \"description\": \"string\", \"tags\": [\"string\"], \"cards\": [{\"front\": \"question\", \"back\": \"answer\"}]}. Keep answers concise. Use $LaTeX$ for math formulas.",
		targetLang,
		count,
	)

	model.SystemInstruction = &genai.Content{
		Parts: []genai.Part{genai.Text(systemPrompt)},
	}
	model.SetTemperature(0.7)
	model.ResponseMIMEType = "application/json"

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

	content := strings.TrimSpace(string(textResponse))

	// Strip potential markdown code blocks (e.g. ```json ... ```)
	if strings.HasPrefix(content, "```") {
		content = strings.TrimPrefix(content, "```json")
		content = strings.TrimPrefix(content, "```")
		content = strings.TrimSuffix(content, "```")
		content = strings.TrimSpace(content)
	}

	var data dto.GeneratedDeckData
	if err := json.Unmarshal([]byte(content), &data); err != nil {
		return nil, fmt.Errorf("failed to parse AI response: %w\nResponse was: %s", err, content)
	}

	if len(data.Cards) == 0 {
		return nil, errors.New("AI returned no cards, try again")
	}

	return &data, nil
}
