package database

import (
	"log"

	"github.com/joenathan-15/kilas/model"
)

func SeedProducts() {
	products := []model.Product{
		{
			Name:          "Lite Pack",
			NameID:        "Paket Lite",
			NameEN:        "Lite Pack",
			Price:         15000,
			Quantity:      2100,
			Type:          "currency",
			IsListed:      true,
			Description:   "Small pack of 2,100 tokens to get you started, can generate cards up to 42 pages.",
			DescriptionID: "Paket kecil berisi 2.100 token untuk memulai, bisa untuk membuat kartu hingga 42 halaman.",
			DescriptionEN: "Small pack of 2,100 tokens to get you started, can generate cards up to 42 pages.",
		},
		{
			Name:          "Basic Pack",
			NameID:        "Paket Basic",
			NameEN:        "Basic Pack",
			Price:         29000,
			Quantity:      4300,
			Type:          "currency",
			IsListed:      true,
			Description:   "Basic pack of 4,300 tokens, can generate cards up to 86 pages",
			DescriptionID: "Paket dasar berisi 4.300 token untuk memulai, bisa untuk membuat kartu hingga 86 halaman.",
			DescriptionEN: "Basic pack of 4,300 tokens, can generate cards up to 86 pages",
		},
		{
			Name:          "Plus Pack",
			NameID:        "Paket Plus",
			NameEN:        "Plus Pack",
			Price:         49000,
			Quantity:      7900,
			Type:          "currency",
			IsListed:      true,
			Description:   "Plus pack of 7,900 tokens, can generate cards up to 158 pages.",
			DescriptionID: "Paket plus berisi 7.900 token, bisa untuk membuat kartu hingga 158 halaman.",
			DescriptionEN: "Plus pack of 7,900 tokens, can generate cards up to 158 pages.",
		},
		{
			Name:          "Super Pack",
			NameID:        "Paket Super",
			NameEN:        "Super Pack",
			Price:         79000,
			Quantity:      13500,
			Type:          "currency",
			IsListed:      true,
			Description:   "Super pack of 13,500 tokens, can generate cards up to 270 pages.",
			DescriptionID: "Paket super berisi 13.500 token, bisa untuk membuat kartu hingga 270 halaman.",
			DescriptionEN: "Super pack of 13,500 tokens, can generate cards up to 270 pages.",
		},
		{
			Name:          "Ultra Pack",
			NameID:        "Paket Ultra",
			NameEN:        "Ultra Pack",
			Price:         149000,
			Quantity:      27500,
			Type:          "currency",
			IsListed:      true,
			Description:   "Ultra pack of 27,500 tokens, can generate cards up to 550 pages.",
			DescriptionID: "Paket ultra berisi 27.500 token, bisa untuk membuat kartu hingga 550 halaman.",
			DescriptionEN: "Ultra pack of 27,500 tokens, can generate cards up to 550 pages.",
		},
		{
			Name:          "Max Pack",
			NameID:        "Paket Max",
			NameEN:        "Max Pack",
			Price:         499000,
			Quantity:      100000,
			Type:          "currency",
			IsListed:      true,
			Description:   "Max pack of 100,000 tokens, can generate cards up to 2000 pages.",
			DescriptionID: "Paket max berisi 100.000 token, bisa untuk membuat kartu hingga 2000 halaman.",
			DescriptionEN: "Max pack of 100,000 tokens, can generate cards up to 2000 pages.",
		},
		{
			Name:          "Super Plan",
			NameID:        "Paket Super",
			NameEN:        "Super Plan",
			Price:         79000,
			Quantity:      0,
			Type:          "subscription",
			IsListed:      true,
			Description:   "Advanced features for power users. Unlimited daily generations and a 30% discount on token usage. (Monthly)",
			DescriptionID: "Fitur lanjutan untuk pengguna aktif. Pembuatan harian tanpa batas dan diskon 30% untuk penggunaan token. (Bulanan)",
			DescriptionEN: "Advanced features for power users. Unlimited daily generations and a 30% discount on token usage. (Monthly)",
		},
	}

	for _, p := range products {
		// Update existing product or create new one to ensure new fields are populated
		var existing model.Product
		err := DB.Where("name = ?", p.Name).First(&existing).Error
		if err == nil {
			// Update existing
			DB.Model(&existing).Updates(map[string]interface{}{
				"name_id":        p.NameID,
				"name_en":        p.NameEN,
				"description_id": p.DescriptionID,
				"description_en": p.DescriptionEN,
			})
		} else {
			// Create new
			DB.Create(&p)
		}
	}

	log.Println("Products seeded successfully")
}
