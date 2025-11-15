package utils

import "github.com/google/uuid"

func ParseUUID(s string) uuid.UUID {
	id, err := uuid.Parse(s)
	if err != nil {
		// return zero UUID on error, or you can panic/log
		return uuid.UUID{}
	}
	return id
}
