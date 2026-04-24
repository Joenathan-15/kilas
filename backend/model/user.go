package model

type User struct {
	Id       uint   `gorm:"primaryKey"`
	Email    string `gorm:"unique;not null"`
	Username string `gorm:"not null"`
	Password string `gorm:"not null"`
	Provider string `gorm:"not null"`
}
