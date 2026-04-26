package dto

type StartSessionRequest struct {
	DeckID uint `json:"deck_id" binding:"required"`
}

type ReviewRequest struct {
	CardID  uint `json:"card_id" binding:"required"`
	Quality int  `json:"quality" binding:"min=0,max=3"`
}

type EndSessionRequest struct {
	Duration int `json:"duration"`
}
