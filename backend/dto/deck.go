package dto

type DeckRequest struct {
	Title       string   `json:"title" binding:"required,min=1,max=255"`
	Description string   `json:"description"`
	IsPublic    bool     `json:"is_public"`
	Tags          []string `json:"tags"`
	IsAIGenerated bool     `json:"is_ai_generated"`
}
