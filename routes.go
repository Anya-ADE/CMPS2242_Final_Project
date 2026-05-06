package main

import (
	"net/http"
)

func setupRoutes(app *application) *http.ServeMux {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", app.healthCheck)

	mux.HandleFunc("GET /api/holidays/current-month", app.getCurrentMonthHolidays)
	mux.HandleFunc("GET /api/holidays/occasions", app.getAllOccasions)
	mux.HandleFunc("GET /api/holidays/dates", app.getAllDates)
	mux.HandleFunc("GET /api/holidays/days", app.getAllDays)
	mux.HandleFunc("GET /api/holidays/today", app.checkTodayHoliday)
	mux.HandleFunc("GET /api/holidays/next", app.getNextHoliday)
	mux.HandleFunc("GET /api/holidays/this-month", app.getThisMonthHolidays)
	mux.HandleFunc("GET /api/holidays/next-month", app.getNextMonthHolidays)
	mux.HandleFunc("GET /api/holidays/year/", app.getHolidaysByYear)
	mux.HandleFunc("GET /api/holidays/year/2026", app.getHolidaysByYear)

	mux.HandleFunc("GET /api/holidays/month/{year}/{month}", app.getHolidaysByMonthYear)

	mux.HandleFunc("GET /", app.serveUI)
	mux.HandleFunc("GET /UI/styles.css", app.serveCSS)
	mux.HandleFunc("GET /UI/script.js", app.serveJS)

	return mux
}
