package dto

type GenerateCardsRequest struct {
	Text  string `form:"text" binding:"omitempty,max=255"`
	Count int    `form:"count" binding:"omitempty,min=1,max=20"`
	Title  string `form:"title"`
	DeckID uint   `form:"deck_id"`
}

type GeneratedCard struct {
	Front string `json:"front"`
	Back  string `json:"back"`
}

type GeneratedDeckData struct {
	Title       string          `json:"title"`
	Description string          `json:"description"`
	Tags        []string        `json:"tags"`
	Cards       []GeneratedCard `json:"cards"`
}
