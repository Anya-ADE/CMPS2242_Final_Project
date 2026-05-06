package main

import (
	"flag"
	"log"
	"net/http"
)

func main() {
	// Command line flags for migrations
	migrate := flag.Bool("migrate", false, "Run database migrations")
	rollback := flag.Bool("rollback", false, "Rollback database migrations")
	flag.Parse()

	// Database connection string
	dsn := "postgres://holidays:holidays@localhost/holidays?sslmode=disable"

	log.Println("=== BELIZE HOLIDAYS API ===")
	log.Println("Connecting to database...")

	// Open database connection
	db, err := OpenDB(dsn)
	if err != nil {
		log.Fatalf("❌ Cannot open database: %v", err)
	}
	defer db.Close()
	log.Println("✅ Database connected successfully")

	// Handle migration commands
	if *migrate {
		log.Println("📦 Running migrations...")
		if err := RunMigrations(db); err != nil {
			log.Fatalf("❌ Migration failed: %v", err)
		}
		log.Println("✅ Migrations completed. Exiting.")
		return
	}

	if *rollback {
		log.Println("📦 Rolling back migrations...")
		if err := RollbackMigrations(db); err != nil {
			log.Fatalf("❌ Rollback failed: %v", err)
		}
		log.Println("✅ Rollback completed. Exiting.")
		return
	}

	// Create application instance
	app := &application{db: db}

	// Setup routes
	mux := setupRoutes(app)

	// Print API information
	log.Println("=== BELIZE HOLIDAYS API 2026 ===")
	log.Println("✅ Server starting on http://localhost:4000")
	log.Println("✅ Database: postgres://holidays:holidays@localhost/holidays")
	log.Println()
	log.Println("=== API Endpoints (curl commands) ===")
	log.Println("  curl http://localhost:4000/health")
	log.Println("  curl http://localhost:4000/api/holidays/today")
	log.Println("  curl http://localhost:4000/api/holidays/occasions")
	log.Println("  curl http://localhost:4000/api/holidays/dates")
	log.Println("  curl http://localhost:4000/api/holidays/days")
	log.Println("  curl http://localhost:4000/api/holidays/current-month")
	log.Println("  curl http://localhost:4000/api/holidays/this-month")
	log.Println("  curl http://localhost:4000/api/holidays/next-month")
	log.Println("  curl http://localhost:4000/api/holidays/next")
	log.Println("  curl http://localhost:4000/api/holidays/year/2026")
	log.Println()
	log.Println("=== UI ===")
	log.Println("  Open http://localhost:4000 in your browser")
	log.Println()
	log.Println("=== Migration Commands ===")
	log.Println("  go run . -migrate    - Run database migrations")
	log.Println("  go run . -rollback   - Rollback database migrations")
	log.Println()

	// Start server
	err = http.ListenAndServe(":4000", mux)
	log.Fatal(err)
}
