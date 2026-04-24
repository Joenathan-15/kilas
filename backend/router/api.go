package router

import "github.com/gin-gonic/gin"

func ApiRoutes(route *gin.Engine) {
	api := route.Group("/api")
	api.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})
}
