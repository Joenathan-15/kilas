package service

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/joenathan-15/model"
	"github.com/joenathan-15/repository"
	"gorm.io/gorm"
)

type LibraryService struct {
	DeckRepo *repository.DeckRepository
	CardRepo *repository.CardRepository
	DB       *gorm.DB
}

func NewLibraryService(deckRepo *repository.DeckRepository, cardRepo *repository.CardRepository, db *gorm.DB) *LibraryService {
	return &LibraryService{DeckRepo: deckRepo, CardRepo: cardRepo, DB: db}
}

type LibraryDeck struct {
	ID          uint     `json:"id"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Tags        []string `json:"tags"`
	CardCount   int64    `json:"card_count"`
	Author      struct {
		ID       uint   `json:"id"`
		Username string `json:"username"`
	} `json:"author"`
}

type BrowseResult struct {
	Data  []LibraryDeck `json:"data"`
	Total int64         `json:"total"`
	Page  int           `json:"page"`
	Limit int           `json:"limit"`
}

func (s *LibraryService) Browse(search, tags string, page, limit int) (*BrowseResult, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 12
	}

	type rawDeck struct {
		ID          uint
		Title       string
		Description string
		Tags        string
		UserID      uint
		Username    string
		CardCount   int64
	}

	query := s.DB.Table("decks").
		Select("decks.id, decks.title, decks.description, decks.tags, decks.user_id, users.username, COUNT(cards.id) as card_count").
		Joins("JOIN users ON decks.user_id = users.id").
		Joins("LEFT JOIN cards ON cards.deck_id = decks.id").
		Where("decks.is_public = ?", true).
		Group("decks.id").
		Order("decks.created_at DESC")

	countQuery := s.DB.Table("decks").Where("decks.is_public = ?", true)

	if search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("(decks.title LIKE ? OR decks.description LIKE ?)", searchPattern, searchPattern)
		countQuery = countQuery.Where("(decks.title LIKE ? OR decks.description LIKE ?)", searchPattern, searchPattern)
	}

	if tags != "" {
		tagList := strings.Split(tags, ",")
		for _, tag := range tagList {
			tag = strings.TrimSpace(tag)
			if tag != "" {
				tagPattern := "%" + tag + "%"
				query = query.Where("decks.tags LIKE ?", tagPattern)
				countQuery = countQuery.Where("decks.tags LIKE ?", tagPattern)
			}
		}
	}

	var total int64
	countQuery.Count(&total)

	var rawDecks []rawDeck
	offset := (page - 1) * limit
	query.Limit(limit).Offset(offset).Find(&rawDecks)

	data := make([]LibraryDeck, len(rawDecks))
	for i, rd := range rawDecks {
		data[i] = LibraryDeck{
			ID:          rd.ID,
			Title:       rd.Title,
			Description: rd.Description,
			Tags:        StringToTags(rd.Tags),
			CardCount:   rd.CardCount,
		}
		data[i].Author.ID = rd.UserID
		data[i].Author.Username = rd.Username
	}

	return &BrowseResult{
		Data:  data,
		Total: total,
		Page:  page,
		Limit: limit,
	}, nil
}

func (s *LibraryService) Clone(sourceDeckID, userID uint) (*model.Deck, error) {
	source, err := s.DeckRepo.FindByID(sourceDeckID)
	if err != nil {
		return nil, err
	}
	if !source.IsPublic {
		return nil, errors.New("not found")
	}

	// Create new deck
	newDeck := &model.Deck{
		UserID:      userID,
		Title:       fmt.Sprintf("Copy of %s", source.Title),
		Description: source.Description,
		IsPublic:    false,
		Tags:        source.Tags,
	}
	if err := s.DeckRepo.Create(newDeck); err != nil {
		return nil, err
	}

	// Bulk-copy cards with reset SM-2 fields
	for _, card := range source.Cards {
		newCard := &model.Card{
			DeckID:      newDeck.ID,
			Front:       card.Front,
			Back:        card.Back,
			FrontImageURL: card.FrontImageURL,
			BackImageURL:  card.BackImageURL,
			Interval:    0,
			Repetitions: 0,
			EaseFactor:  2.5,
			DueDate:     time.Now(),
		}
		s.CardRepo.Create(newCard)
	}

	// Set card count
	newDeck.CardCount = int64(len(source.Cards))

	return newDeck, nil
}

func ParseInt(s string, defaultVal int) int {
	if s == "" {
		return defaultVal
	}
	v, err := strconv.Atoi(s)
	if err != nil {
		return defaultVal
	}
	return v
}
