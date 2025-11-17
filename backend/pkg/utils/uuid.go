package utils

import "github.com/google/uuid"

// ParseUUID returns zero UUID if parsing fails.
func ParseUUID(s string) uuid.UUID {
	id, err := uuid.Parse(s)
	if err != nil {
		return uuid.UUID{}
	}
	return id
}
