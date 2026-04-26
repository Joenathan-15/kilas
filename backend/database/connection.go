package database

import (
	"log"
	"os"

	"github.com/joenathan-15/kilas/model"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func autoMigrate() {
	err := DB.AutoMigrate(
		&model.User{},
		&model.Deck{},
		&model.Card{},
		&model.StudySession{},
		&model.CardReview{},
	)
	if err != nil {
		log.Fatal("Error occurred while migrating tables: ", err)
	}
}

func InitDB() {
	dbName := os.Getenv("DATABASE_NAME")
	dbHost := os.Getenv("DATABASE_HOST")
	dbPort := os.Getenv("DATABASE_PORT")
	dbUsername := os.Getenv("DATABASE_USERNAME")
	dbPassword := os.Getenv("DATABASE_PASSWORD")
	dsn := dbUsername + ":" + dbPassword + "@(" + dbHost + ":" + dbPort + ")/" + dbName + "?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Error Connecting to database: ", err)
	}
	DB = db
	autoMigrate()
}
