package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joenathan-15/database"
	"github.com/joenathan-15/router"
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

	// Initialize Router
	r := gin.Default()
	r.Routes()
	router.ApiRoutes(r)

	// Run the server
	r.Run(appAddress + ":" + appPort)
}
