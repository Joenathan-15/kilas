package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"

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
		"You are an expert educator creating flashcards for students. Generate the content in %s. Generate a title, a short description, 3-5 relevant tags, and exactly %d high-quality flashcard pairs from the study material. Return ONLY a valid JSON object matching this schema: {\"title\": \"string\", \"description\": \"string\", \"tags\": [\"string\"], \"cards\": [{\"front\": \"question\", \"back\": \"answer\"}]}. Keep answers concise. IMPORTANT: For math formulas, use $LaTeX$. Ensure all backslashes in LaTeX are double-escaped (e.g., use \\\\frac instead of \\frac) so the JSON is valid.",
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

	var data dto.GeneratedDeckData
	if err := json.Unmarshal([]byte(content), &data); err != nil {
		return nil, fmt.Errorf("failed to parse AI response: %w\nResponse was: %s", err, content)
	}

	if len(data.Cards) == 0 {
		return nil, errors.New("AI returned no cards, try again")
	}

	return &data, nil
}
