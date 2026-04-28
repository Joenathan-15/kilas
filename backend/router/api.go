package router

import (
	"github.com/gin-gonic/gin"
	"github.com/joenathan-15/kilas/handler"
	"github.com/joenathan-15/kilas/middleware"
)

func ApiRoutes(
	route *gin.Engine,
	authHandler *handler.AuthHandler,
	deckHandler *handler.DeckHandler,
	cardHandler *handler.CardHandler,
	studyHandler *handler.StudyHandler,
	statsHandler *handler.StatsHandler,
	libraryHandler *handler.LibraryHandler,
	aiHandler *handler.AIHandler,
	oauthHandler *handler.OAuthHandler,
	productHandler *handler.ProductHandler,
	uploadHandler *handler.UploadHandler,
) {
	api := route.Group("/api")

	// Health check
	api.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})

	// Auth routes
	auth := api.Group("/auth")
	auth.POST("/register", authHandler.Register)
	auth.POST("/login", authHandler.Login)
	auth.POST("/refresh", authHandler.Refresh)
	auth.POST("/logout", authHandler.Logout)
	auth.GET("/me", middleware.AuthMiddleware(), authHandler.Me)
	auth.GET("/tokens", middleware.AuthMiddleware(), authHandler.GetTokens)
	auth.POST("/daily-login", middleware.AuthMiddleware(), authHandler.ClaimDailyReward)

	// Product routes (public list, protected purchase)
	products := api.Group("/products")
	products.GET("", productHandler.List)
	products.POST("/purchase", middleware.AuthMiddleware(), productHandler.Purchase)
	products.GET("/transactions", middleware.AuthMiddleware(), productHandler.Transactions)
	products.POST("/midtrans/webhook", productHandler.MidtransWebhook)

	// Deck routes (protected)
	decks := api.Group("/decks", middleware.AuthMiddleware())
	decks.GET("", deckHandler.List)
	decks.POST("", deckHandler.Create)
	decks.GET("/:id", deckHandler.Get)
	decks.PUT("/:id", deckHandler.Update)
	decks.DELETE("/:id", deckHandler.Delete)

	// Card routes under decks (protected)
	decks.POST("/:id/cards", cardHandler.Create)
	decks.GET("/:id/cards", cardHandler.List)

	// Card routes (protected)
	cards := api.Group("/cards", middleware.AuthMiddleware())
	cards.PUT("/:id", cardHandler.Update)
	cards.DELETE("/:id", cardHandler.Delete)

	// Study routes
	decks.GET("/:id/study/due", studyHandler.GetDueCards)

	study := api.Group("/study", middleware.AuthMiddleware())
	study.POST("/sessions", studyHandler.StartSession)
	study.POST("/sessions/:id/review", studyHandler.SubmitReview)
	study.POST("/sessions/:id/end", studyHandler.EndSession)

	// Stats routes (protected)
	stats := api.Group("/stats", middleware.AuthMiddleware())
	stats.GET("/overview", statsHandler.Overview)
	stats.GET("/activity", statsHandler.Activity)
	stats.GET("/deck/:deck_id", statsHandler.DeckStats)

	// Library routes (public browse, protected clone)
	library := api.Group("/library")
	library.GET("", libraryHandler.Browse)
	library.POST("/:deck_id/clone", middleware.AuthMiddleware(), libraryHandler.Clone)

	// AI routes (protected)
	ai := api.Group("/ai", middleware.AuthMiddleware())
	ai.POST("/generate-cards", aiHandler.GenerateCards)

	// Upload routes (protected)
	uploads := api.Group("/upload", middleware.AuthMiddleware())
	uploads.POST("/image", uploadHandler.UploadImage)

	// Google OAuth routes
	api.GET("/auth/google", oauthHandler.GoogleLogin)
	api.GET("/auth/google/callback", oauthHandler.GoogleCallback)
}
