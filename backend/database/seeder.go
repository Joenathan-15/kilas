package database

import (
	"log"

	"github.com/joenathan-15/kilas/model"
)

func SeedProducts() {
	products := []model.Product{
		{
			Name:        "Starter Pack",
			Price:       15000,
			Quantity:    2100,
			Type:        "currency",
			IsListed:    true,
			Description: "A small pack of 2,100 tokens to get you started.",
		},
		{
			Name:        "Value Pack",
			Price:       29000,
			Quantity:    4300,
			Type:        "currency",
			IsListed:    true,
			Description: "A great value pack of 4,300 tokens.",
		},
		{
			Name:        "Super Pack",
			Price:       49000,
			Quantity:    7900,
			Type:        "currency",
			IsListed:    true,
			Description: "A super pack containing 7,900 tokens.",
		},
		{
			Name:        "Mega Pack",
			Price:       79000,
			Quantity:    13500,
			Type:        "currency",
			IsListed:    true,
			Description: "A mega-sized deal for 13,500 tokens.",
		},
		{
			Name:        "Giga Pack",
			Price:       149000,
			Quantity:    27500,
			Type:        "currency",
			IsListed:    true,
			Description: "A huge bundle of 27,500 tokens for dedicated users.",
		},
		{
			Name:        "Tera Pack",
			Price:       499000,
			Quantity:    100000,
			Type:        "currency",
			IsListed:    true,
			Description: "The ultimate value with a massive 100,000 tokens.",
		},
		{
			Name:        "Super Plan",
			Price:       250000,
			Quantity:    0,
			Type:        "subscription",
			IsListed:    true,
			Description: "Advanced features for power users. Unlimited daily generations and a 10% discount on token usage. (Monthly)",
		},
	}

	for _, p := range products {
		// FirstOrCreate: only insert if name doesn't exist
		result := DB.Where("name = ?", p.Name).FirstOrCreate(&model.Product{}, p)
		if result.Error != nil {
			log.Printf("Failed to seed product %s: %v", p.Name, result.Error)
		}
	}

	log.Println("Products seeded successfully")
}
