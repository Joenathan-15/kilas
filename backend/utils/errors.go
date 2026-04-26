package utils

import (
	"errors"
	"fmt"

	"github.com/go-playground/validator/v10"
)

// FormatValidationError converts raw Gin binding errors into a structured map
func FormatValidationError(err error) map[string]interface{} {
	var ve validator.ValidationErrors
	if errors.As(err, &ve) {
		out := make(map[string]string)
		for _, fe := range ve {
			out[fe.Field()] = getErrorMsg(fe)
		}
		return map[string]interface{}{
			"error":   "Validation failed",
			"details": out,
		}
	}
	return map[string]interface{}{"error": "Invalid request format or data type"}
}

func getErrorMsg(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return "This field is required"
	case "email":
		return "Invalid email format"
	case "min":
		return fmt.Sprintf("Should be at least %s characters long", fe.Param())
	case "max":
		return fmt.Sprintf("Should be at most %s characters long", fe.Param())
	}
	return "Invalid value"
}
