package handler

import (
	"fmt"
	_ "image/gif"
	_ "image/png"
	_ "golang.org/x/image/webp"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/disintegration/imaging"
	"github.com/rwcarlsen/goexif/exif"
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

	// Try to get orientation from EXIF
	orientation := 1
	x, err := exif.Decode(srcFile)
	if err == nil {
		tag, err := x.Get(exif.Orientation)
		if err == nil {
			val, err := tag.Int(0)
			if err == nil {
				orientation = val
			}
		}
	}

	// Seek back to start of file for imaging.Decode
	srcFile.Seek(0, 0)

	// Decode the image
	img, err := imaging.Decode(srcFile)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid image file: unable to decode"})
		return
	}

	// Apply rotation based on EXIF orientation
	switch orientation {
	case 3:
		img = imaging.Rotate180(img)
	case 6:
		img = imaging.Rotate270(img)
	case 8:
		img = imaging.Rotate90(img)
	}

	// Generate unique filename
	newFilename := fmt.Sprintf("%d.jpg", time.Now().UnixNano())
	dst := filepath.Join("public", "uploads", "images", newFilename)

	// Save the processed image as JPEG with 75% quality
	err = imaging.Save(img, dst, imaging.JPEGQuality(75))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save processed image"})
		return
	}

	// Construct URL
	imageURL := fmt.Sprintf("/public/uploads/images/%s", newFilename)

	c.JSON(http.StatusCreated, gin.H{
		"url": imageURL,
	})
}
