package main

// Holiday represents a Belize public holiday
type Holiday struct {
	ID        int    `json:"id,omitempty"`
	DayOfWeek string `json:"day"`
	Date      string `json:"date"`
	Occasion  string `json:"occasion"`
	Year      int    `json:"year,omitempty"`
}

// Envelope wraps JSON responses
type Envelope map[string]interface{}

// ErrorResponse struct for error messages
type ErrorResponse struct {
	Error  string `json:"error"`
	Code   string `json:"code"`
	Status int    `json:"status"`
}
