package dto

type CardRequest struct {
	Front         string `json:"front" binding:"required"`
	Back          string `json:"back" binding:"required"`
	FrontImageURL string `json:"front_image_url"`
	BackImageURL  string `json:"back_image_url"`
}
