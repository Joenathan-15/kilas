package dto

type GenerateCardsRequest struct {
	Text   string `json:"text" binding:"required,min=10,max=3000"`
	Count  int    `json:"count" binding:"required,min=1,max=20"`
	DeckID uint   `json:"deck_id" binding:"required"`
}

type GeneratedCard struct {
	Front string `json:"front"`
	Back  string `json:"back"`
}
