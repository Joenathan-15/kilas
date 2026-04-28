package handler

import (
	"fmt"
	"image"
	"image/jpeg"
	_ "image/gif"
	_ "image/png"
	_ "golang.org/x/image/webp"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type UploadHandler struct{}

func NewUploadHandler() *UploadHandler {
	// Ensure uploads directory exists
	os.MkdirAll("./public/uploads/images", os.ModePerm)
	return &UploadHandler{}
}

func (h *UploadHandler) UploadImage(c *gin.Context) {
	// Enforce a maximum file size (e.g., 5MB)
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 5<<20) // 5 MB

	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "image file is required or file is too large (max 5MB)"})
		return
	}

	// Validate extension
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".gif" && ext != ".webp" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid file type, only images are allowed"})
		return
	}

	// Open the uploaded file
	srcFile, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to open uploaded file"})
		return
	}
	defer srcFile.Close()

	// Decode the image
	img, _, err := image.Decode(srcFile)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid image file: unable to decode"})
		return
	}

	// Generate unique filename (always save as .jpg for compression)
	newFilename := fmt.Sprintf("%d.jpg", time.Now().UnixNano())
	dst := filepath.Join("public", "uploads", "images", newFilename)

	// Create destination file
	out, err := os.Create(dst)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create destination file"})
		return
	}
	defer out.Close()

	// Encode to JPEG with 75% quality
	err = jpeg.Encode(out, img, &jpeg.Options{Quality: 75})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to compress image"})
		return
	}

	// Construct URL
	imageURL := fmt.Sprintf("/public/uploads/images/%s", newFilename)

	c.JSON(http.StatusCreated, gin.H{
		"url": imageURL,
	})
}
