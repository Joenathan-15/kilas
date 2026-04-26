package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joenathan-15/database"
	"github.com/joenathan-15/handler"
	"github.com/joenathan-15/middleware"
	"github.com/joenathan-15/repository"
	"github.com/joenathan-15/router"
	"github.com/joenathan-15/service"
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

	// Initialize Services
	authService := service.NewAuthService(userRepo)
	deckService := service.NewDeckService(deckRepo)
	cardService := service.NewCardService(cardRepo, deckRepo)
	studyService := service.NewStudyService(studyRepo, cardRepo, deckRepo)
	statsService := service.NewStatsService(database.DB)
	libraryService := service.NewLibraryService(deckRepo, cardRepo, database.DB)
	aiService := service.NewAIService()

	// Initialize Handlers
	authHandler := handler.NewAuthHandler(authService)
	deckHandler := handler.NewDeckHandler(deckService)
	cardHandler := handler.NewCardHandler(cardService, deckService)
	studyHandler := handler.NewStudyHandler(studyService)
	statsHandler := handler.NewStatsHandler(statsService)
	libraryHandler := handler.NewLibraryHandler(libraryService)
	aiHandler := handler.NewAIHandler(aiService, deckService)
	oauthHandler := handler.NewOAuthHandler(userRepo, authService)

	// Initialize Router
	r := gin.Default()
	r.Use(middleware.CORSMiddleware())
	router.ApiRoutes(r, authHandler, deckHandler, cardHandler, studyHandler, statsHandler, libraryHandler, aiHandler, oauthHandler)

	// Run the server
	r.Run(appAddress + ":" + appPort)
}
