package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"regexp"
	"strconv"
	"time"
)

type application struct {
	db *sql.DB
}

func (app *application) writeJSON(w http.ResponseWriter, status int, data interface{}, headers http.Header) error {
	js, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return err
	}

	js = append(js, '\n')

	if headers != nil {
		for key, value := range headers {
			w.Header()[key] = value
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(status)
	_, err = w.Write(js)
	return err
}

// Error response helper
func (app *application) errorResponse(w http.ResponseWriter, status int, message string, code string) {
	response := Envelope{
		"error":  message,
		"code":   code,
		"status": status,
	}
	app.writeJSON(w, status, response, nil)
}

func (app *application) serverError(w http.ResponseWriter, err error) {
	app.errorResponse(w, http.StatusInternalServerError, "Internal server error", "SERVER_ERROR")
}

func (app *application) notFound(w http.ResponseWriter) {
	app.errorResponse(w, http.StatusNotFound, "Resource not found", "NOT_FOUND")
}

func (app *application) badRequest(w http.ResponseWriter, message string) {
	app.errorResponse(w, http.StatusBadRequest, message, "BAD_REQUEST")
}

// Validation functions moved to handlers
func (app *application) validateYear(year int) bool {
	return year == 2026
}

func (app *application) validateMonth(month int) bool {
	return month >= 1 && month <= 12
}

func (app *application) validateDate(dateStr string) bool {
	_, err := time.Parse("2006-01-02", dateStr)
	return err == nil
}

func (app *application) validateYearParameter(yearStr string) (int, bool) {
	if yearStr == "" {
		return 0, false
	}

	yearRegex := regexp.MustCompile(`^\d{4}$`)
	if !yearRegex.MatchString(yearStr) {
		return 0, false
	}

	year, err := strconv.Atoi(yearStr)
	if err != nil {
		return 0, false
	}

	return year, true
}

// Health check endpoint
func (app *application) healthCheck(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		app.errorResponse(w, http.StatusMethodNotAllowed, "Method not allowed", "METHOD_NOT_ALLOWED")
		return
	}

	var testQuery int
	err := app.db.QueryRowContext(r.Context(), "SELECT 1").Scan(&testQuery)
	dbStatus := "connected"
	if err != nil {
		dbStatus = "disconnected"
	}

	app.writeJSON(w, http.StatusOK, Envelope{
		"status":   "available",
		"api":      "Belize Holidays API 2026",
		"database": dbStatus,
		"version":  "1.0.0",
	}, nil)
}

// 1. Get holidays in current month
func (app *application) getCurrentMonthHolidays(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		app.errorResponse(w, http.StatusMethodNotAllowed, "Method not allowed", "METHOD_NOT_ALLOWED")
		return
	}

	currentMonth := int(time.Now().Month())

	// Validate month
	if !app.validateMonth(currentMonth) {
		app.badRequest(w, "Invalid month")
		return
	}

	query := `SELECT day_of_week, TO_CHAR(date_value, 'DDth Month') as date, occasion 
	          FROM holidays WHERE month = $1 AND year = 2026 ORDER BY day_number`

	rows, err := app.db.QueryContext(r.Context(), query, currentMonth)
	if err != nil {
		app.serverError(w, err)
		return
	}
	defer rows.Close()

	var holidays []Holiday
	for rows.Next() {
		var h Holiday
		err := rows.Scan(&h.DayOfWeek, &h.Date, &h.Occasion)
		if err != nil {
			app.serverError(w, err)
			return
		}
		holidays = append(holidays, h)
	}

	app.writeJSON(w, http.StatusOK, holidays, nil)
}

// 2. Get all occasions for 2026
func (app *application) getAllOccasions(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		app.errorResponse(w, http.StatusMethodNotAllowed, "Method not allowed", "METHOD_NOT_ALLOWED")
		return
	}

	query := `SELECT occasion FROM holidays WHERE year = 2026 ORDER BY date_value`

	rows, err := app.db.QueryContext(r.Context(), query)
	if err != nil {
		app.serverError(w, err)
		return
	}
	defer rows.Close()

	var occasions []string
	for rows.Next() {
		var occasion string
		err := rows.Scan(&occasion)
		if err != nil {
			app.serverError(w, err)
			return
		}
		occasions = append(occasions, occasion)
	}

	response := Envelope{
		"year":      2026,
		"occasions": occasions,
		"count":     len(occasions),
	}
	app.writeJSON(w, http.StatusOK, response, nil)
}

// 3. Get all dates
func (app *application) getAllDates(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		app.errorResponse(w, http.StatusMethodNotAllowed, "Method not allowed", "METHOD_NOT_ALLOWED")
		return
	}

	query := `SELECT TO_CHAR(date_value, 'DDth Month') as date, occasion 
	          FROM holidays WHERE year = 2026 ORDER BY date_value`

	rows, err := app.db.QueryContext(r.Context(), query)
	if err != nil {
		app.serverError(w, err)
		return
	}
	defer rows.Close()

	var dates []map[string]string
	for rows.Next() {
		var date, occasion string
		err := rows.Scan(&date, &occasion)
		if err != nil {
			app.serverError(w, err)
			return
		}
		dates = append(dates, map[string]string{
			"date":     date,
			"occasion": occasion,
		})
	}

	app.writeJSON(w, http.StatusOK, dates, nil)
}

// 4. Get all days
func (app *application) getAllDays(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		app.errorResponse(w, http.StatusMethodNotAllowed, "Method not allowed", "METHOD_NOT_ALLOWED")
		return
	}

	query := `SELECT day_of_week, TO_CHAR(date_value, 'DDth Month') as date, occasion 
	          FROM holidays WHERE year = 2026 ORDER BY date_value`

	rows, err := app.db.QueryContext(r.Context(), query)
	if err != nil {
		app.serverError(w, err)
		return
	}
	defer rows.Close()

	var days []map[string]string
	for rows.Next() {
		var day, date, occasion string
		err := rows.Scan(&day, &date, &occasion)
		if err != nil {
			app.serverError(w, err)
			return
		}
		days = append(days, map[string]string{
			"day":      day,
			"date":     date,
			"occasion": occasion,
		})
	}

	app.writeJSON(w, http.StatusOK, days, nil)
}

// 5. Check if today is a holiday
func (app *application) checkTodayHoliday(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		app.errorResponse(w, http.StatusMethodNotAllowed, "Method not allowed", "METHOD_NOT_ALLOWED")
		return
	}

	today := time.Now().Format("2006-01-02")

	// Validate date
	if !app.validateDate(today) {
		app.badRequest(w, "Invalid date format")
		return
	}

	query := `SELECT occasion FROM holidays WHERE date_value = $1`
	var occasion sql.NullString
	err := app.db.QueryRowContext(r.Context(), query, today).Scan(&occasion)

	var response Envelope
	if err == nil && occasion.Valid {
		response = Envelope{
			"isHoliday": "yes",
			"occasion":  occasion.String,
			"date":      today,
			"message":   "Congratulations. You deserve a break. 🎉",
		}
	} else {
		response = Envelope{
			"isHoliday": "no",
			"occasion":  nil,
			"date":      today,
			"message":   "I know you need a break, but hold on a bit longer. 💪",
		}
	}

	app.writeJSON(w, http.StatusOK, response, nil)
}

// 6. Get next holiday after today
func (app *application) getNextHoliday(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		app.errorResponse(w, http.StatusMethodNotAllowed, "Method not allowed", "METHOD_NOT_ALLOWED")
		return
	}

	today := time.Now().Format("2006-01-02")

	// Validate date
	if !app.validateDate(today) {
		app.badRequest(w, "Invalid date format")
		return
	}

	query := `SELECT day_of_week, TO_CHAR(date_value, 'DDth Month') as date, occasion 
	          FROM holidays WHERE date_value > $1 ORDER BY date_value LIMIT 1`

	var day, date, occasion string
	err := app.db.QueryRowContext(r.Context(), query, today).Scan(&day, &date, &occasion)

	var response Envelope
	if err == nil {
		response = Envelope{
			"day":      day,
			"date":     date,
			"occasion": occasion,
		}
	} else {
		// No more holidays in 2026, return first holiday of 2026
		query2 := `SELECT day_of_week, TO_CHAR(date_value, 'DDth Month') as date, occasion 
		           FROM holidays WHERE year = 2026 ORDER BY date_value LIMIT 1`
		err2 := app.db.QueryRowContext(r.Context(), query2).Scan(&day, &date, &occasion)
		if err2 != nil {
			app.serverError(w, err2)
			return
		}
		response = Envelope{
			"day":      day,
			"date":     date,
			"occasion": occasion,
			"message":  "No more holidays in 2026. Looking forward to 2027!",
		}
	}

	app.writeJSON(w, http.StatusOK, response, nil)
}

// 7. Get holidays this month
func (app *application) getThisMonthHolidays(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		app.errorResponse(w, http.StatusMethodNotAllowed, "Method not allowed", "METHOD_NOT_ALLOWED")
		return
	}

	currentMonth := int(time.Now().Month())
	currentMonthName := time.Now().Month().String()

	// Validate month
	if !app.validateMonth(currentMonth) {
		app.badRequest(w, "Invalid month")
		return
	}

	query := `SELECT day_of_week, TO_CHAR(date_value, 'DDth Month') as date, occasion 
	          FROM holidays WHERE month = $1 AND year = 2026 ORDER BY day_number`

	rows, err := app.db.QueryContext(r.Context(), query, currentMonth)
	if err != nil {
		app.serverError(w, err)
		return
	}
	defer rows.Close()

	var holidays []Holiday
	for rows.Next() {
		var h Holiday
		err := rows.Scan(&h.DayOfWeek, &h.Date, &h.Occasion)
		if err != nil {
			app.serverError(w, err)
			return
		}
		holidays = append(holidays, h)
	}

	response := Envelope{
		"month":    currentMonthName,
		"year":     2026,
		"holidays": holidays,
		"count":    len(holidays),
	}
	app.writeJSON(w, http.StatusOK, response, nil)
}

// 8. Get holidays next month
func (app *application) getNextMonthHolidays(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		app.errorResponse(w, http.StatusMethodNotAllowed, "Method not allowed", "METHOD_NOT_ALLOWED")
		return
	}

	currentMonth := int(time.Now().Month())
	nextMonth := currentMonth + 1

	if nextMonth > 12 {
		response := Envelope{
			"month":    "January",
			"year":     2027,
			"holidays": []Holiday{},
			"message":  "Holidays for 2027 are not yet available in the database",
		}
		app.writeJSON(w, http.StatusOK, response, nil)
		return
	}

	// Validate month
	if !app.validateMonth(nextMonth) {
		app.badRequest(w, "Invalid month")
		return
	}

	query := `SELECT day_of_week, TO_CHAR(date_value, 'DDth Month') as date, occasion 
	          FROM holidays WHERE month = $1 AND year = 2026 ORDER BY day_number`

	rows, err := app.db.QueryContext(r.Context(), query, nextMonth)
	if err != nil {
		app.serverError(w, err)
		return
	}
	defer rows.Close()

	var holidays []Holiday
	for rows.Next() {
		var h Holiday
		err := rows.Scan(&h.DayOfWeek, &h.Date, &h.Occasion)
		if err != nil {
			app.serverError(w, err)
			return
		}
		holidays = append(holidays, h)
	}

	monthName := time.Month(nextMonth).String()
	response := Envelope{
		"month":    monthName,
		"year":     2026,
		"holidays": holidays,
		"count":    len(holidays),
	}
	app.writeJSON(w, http.StatusOK, response, nil)
}

// 9. Get holidays for a specific year (only 2026)
func (app *application) getHolidaysByYear(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		app.errorResponse(w, http.StatusMethodNotAllowed, "Method not allowed", "METHOD_NOT_ALLOWED")
		return
	}

	yearStr := r.PathValue("year")

	// Validate year parameter
	year, valid := app.validateYearParameter(yearStr)
	if !valid {
		app.badRequest(w, "Year must be a valid 4-digit number")
		return
	}

	// Validate year is 2026
	if !app.validateYear(year) {
		app.badRequest(w, "Data only available for 2026. Please use year=2026")
		return
	}

	query := `SELECT day_of_week, TO_CHAR(date_value, 'DDth Month') as date, occasion, year 
	          FROM holidays WHERE year = $1 ORDER BY date_value`

	rows, err := app.db.QueryContext(r.Context(), query, year)
	if err != nil {
		app.serverError(w, err)
		return
	}
	defer rows.Close()

	var holidays []Holiday
	for rows.Next() {
		var h Holiday
		err := rows.Scan(&h.DayOfWeek, &h.Date, &h.Occasion, &h.Year)
		if err != nil {
			app.serverError(w, err)
			return
		}
		holidays = append(holidays, h)
	}

	if len(holidays) == 0 {
		app.notFound(w)
		return
	}

	response := Envelope{
		"year":     2026,
		"holidays": holidays,
		"count":    len(holidays),
	}
	app.writeJSON(w, http.StatusOK, response, nil)
}

// UI Handlers
func (app *application) serveUI(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		app.notFound(w)
		return
	}
	http.ServeFile(w, r, "UI/index.html")
}

func (app *application) serveCSS(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/css")
	http.ServeFile(w, r, "UI/styles.css")
}

func (app *application) serveJS(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/javascript")
	http.ServeFile(w, r, "UI/scripts.js")
}
