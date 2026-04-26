package handler

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/joenathan-15/model"
	"github.com/joenathan-15/repository"
	"github.com/joenathan-15/service"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

type OAuthHandler struct {
	UserRepo    *repository.UserRepository
	AuthService *service.AuthService
}

func NewOAuthHandler(userRepo *repository.UserRepository, authService *service.AuthService) *OAuthHandler {
	return &OAuthHandler{UserRepo: userRepo, AuthService: authService}
}

func (h *OAuthHandler) getOAuthConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		RedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		Endpoint: google.Endpoint,
	}
}

func (h *OAuthHandler) GoogleLogin(c *gin.Context) {
	config := h.getOAuthConfig()

	// Generate random state
	stateBytes := make([]byte, 16)
	if _, err := rand.Read(stateBytes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate state"})
		return
	}
	state := base64.URLEncoding.EncodeToString(stateBytes)

	// Set httpOnly cookie
	c.SetCookie("oauth_state", state, 300, "/", "", false, true)

	url := config.AuthCodeURL(state, oauth2.AccessTypeOnline)
	c.Redirect(http.StatusFound, url)
}

func (h *OAuthHandler) GoogleCallback(c *gin.Context) {
	config := h.getOAuthConfig()
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}

	// Validate state
	stateCookie, err := c.Cookie("oauth_state")
	if err != nil || stateCookie != c.Query("state") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid state"})
		return
	}

	// Exchange code for token
	token, err := config.Exchange(c.Request.Context(), c.Query("code"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to exchange code"})
		return
	}

	// Get user info from Google
	client := config.Client(c.Request.Context(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to get user info"})
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read response"})
		return
	}

	var googleUser struct {
		ID      string `json:"id"`
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}
	if err := json.Unmarshal(body, &googleUser); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse user info"})
		return
	}

	// Upsert user
	user, err := h.UserRepo.FindByEmail(googleUser.Email)
	if err != nil {
		// Not found — create new user
		username := sanitizeUsername(googleUser.Name)
		user = &model.User{
			Email:     googleUser.Email,
			Username:  username,
			Provider:  "google",
			AvatarURL: googleUser.Picture,
		}
		if err := h.UserRepo.Create(user); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
			return
		}
	} else {
		// Found — update avatar
		user.AvatarURL = googleUser.Picture
		h.UserRepo.DB.Save(user)
	}

	// Generate tokens
	accessToken, refreshToken, err := h.AuthService.GenerateTokens(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate tokens"})
		return
	}

	// Delete oauth_state cookie
	c.SetCookie("oauth_state", "", -1, "/", "", false, true)

	// Redirect to frontend
	redirectURL := fmt.Sprintf("%s/auth/callback?access_token=%s&refresh_token=%s", frontendURL, accessToken, refreshToken)
	c.Redirect(http.StatusFound, redirectURL)
}

func sanitizeUsername(name string) string {
	reg := regexp.MustCompile("[^a-zA-Z0-9]")
	sanitized := reg.ReplaceAllString(name, "")
	sanitized = strings.ToLower(sanitized)
	if len(sanitized) > 20 {
		sanitized = sanitized[:20]
	}
	if sanitized == "" {
		sanitized = "user"
	}
	return sanitized
}
