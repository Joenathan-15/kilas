package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joenathan-15/kilas/database"
	"github.com/joenathan-15/kilas/handler"
	"github.com/joenathan-15/kilas/middleware"
	"github.com/joenathan-15/kilas/repository"
	"github.com/joenathan-15/kilas/router"
	"github.com/joenathan-15/kilas/service"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error Loading .env file")
	}
	appAddress := os.Getenv("APP_ADDRESS")
	appPort := os.Getenv("APP_PORT")

	// Initialize Database
	database.InitDB()

	// Initialize Repositories
	userRepo := repository.NewUserRepository(database.DB)
	deckRepo := repository.NewDeckRepository(database.DB)
	cardRepo := repository.NewCardRepository(database.DB)
	studyRepo := repository.NewStudyRepository(database.DB)
	productRepo := repository.NewProductRepository(database.DB)
	aiHistoryRepo := repository.NewAIHistoryRepository(database.DB)

	// Initialize Services
	authService := service.NewAuthService(userRepo)
	deckService := service.NewDeckService(deckRepo)
	cardService := service.NewCardService(cardRepo, deckRepo)
	studyService := service.NewStudyService(studyRepo, cardRepo, deckRepo)
	statsService := service.NewStatsService(database.DB)
	libraryService := service.NewLibraryService(deckRepo, cardRepo, database.DB)
	aiService := service.NewAIService()
	productService := service.NewProductService(productRepo, userRepo)

	// Initialize Handlers
	authHandler := handler.NewAuthHandler(authService)
	deckHandler := handler.NewDeckHandler(deckService)
	cardHandler := handler.NewCardHandler(cardService, deckService)
	studyHandler := handler.NewStudyHandler(studyService)
	statsHandler := handler.NewStatsHandler(statsService)
	libraryHandler := handler.NewLibraryHandler(libraryService)
	aiHandler := handler.NewAIHandler(aiService, deckService, cardService, authService, aiHistoryRepo)
	oauthHandler := handler.NewOAuthHandler(userRepo, authService)
	productHandler := handler.NewProductHandler(productService)
	uploadHandler := handler.NewUploadHandler()

	// Initialize Router
	r := gin.Default()
	r.Static("/public", "./public")
	
	// Apply global middlewares
	r.Use(middleware.RateLimitMiddleware(20, 40)) // 20 requests per second, burst of 40
	r.Use(middleware.CORSMiddleware())
	
	router.ApiRoutes(r, authHandler, deckHandler, cardHandler, studyHandler, statsHandler, libraryHandler, aiHandler, oauthHandler, productHandler, uploadHandler)

	// Run the server
	r.Run(appAddress + ":" + appPort)
}
