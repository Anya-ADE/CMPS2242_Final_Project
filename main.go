package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
)

func main() {
	migrate := flag.Bool("migrate", false, "Run database migrations")
	rollback := flag.Bool("rollback", false, "Rollback database migrations")
	flag.Parse()

	dsn := "postgres://holidays:holidays@localhost/holidays?sslmode=disable"

	if envDsn := os.Getenv("DATABASE_URL"); envDsn != "" {
		dsn = envDsn
	}

	fmt.Println("=== BELIZE HOLIDAYS API ===")
	fmt.Println("Connecting to database...")

	db, err := OpenDB(dsn)
	if err != nil {
		log.Fatalf("❌ Cannot open database: %v\n\nPlease ensure:\n1. PostgreSQL is running\n2. Database 'holidays' exists\n3. User 'holidays' with password 'holidays' exists\n4. Or update the connection string in main.go", err)
	}
	defer db.Close()
	fmt.Println("✅ Database connected successfully")

	if *migrate {
		fmt.Println("\n📦 Running migrations...")
		if err := RunMigrations(db); err != nil {
			log.Fatalf("❌ Migration failed: %v", err)
		}
		fmt.Println("✅ Migrations completed. Exiting.")
		return
	}

	if *rollback {
		fmt.Println("\n📦 Rolling back migrations...")
		if err := RollbackMigrations(db); err != nil {
			log.Fatalf("❌ Rollback failed: %v", err)
		}
		fmt.Println("✅ Rollback completed. Exiting.")
		return
	}

	// Create application instance
	app := &application{db: db}

	// Setup routes
	mux := setupRoutes(app)

	// Print API information
	fmt.Println("\n=== BELIZE HOLIDAYS API 2026 ===")
	fmt.Println("✅ Server starting on http://localhost:4000")
	fmt.Println("✅ Database: postgres://holidays:holidays@localhost/holidays")
	fmt.Println()
	fmt.Println("=== API Endpoints (curl commands) ===")
	fmt.Println("  curl http://localhost:4000/health")
	fmt.Println("  curl http://localhost:4000/api/holidays/today")
	fmt.Println("  curl http://localhost:4000/api/holidays/occasions")
	fmt.Println("  curl http://localhost:4000/api/holidays/dates")
	fmt.Println("  curl http://localhost:4000/api/holidays/days")
	fmt.Println("  curl http://localhost:4000/api/holidays/current-month")
	fmt.Println("  curl http://localhost:4000/api/holidays/this-month")
	fmt.Println("  curl http://localhost:4000/api/holidays/next-month")
	fmt.Println("  curl http://localhost:4000/api/holidays/next")
	fmt.Println("  curl http://localhost:4000/api/holidays/year/2026")
	fmt.Println()
	fmt.Println("=== UI ===")
	fmt.Println("  Open http://localhost:4000 in your browser")
	fmt.Println()
	fmt.Println("=== Migration Commands ===")
	fmt.Println("  go run . -migrate    - Run database migrations")
	fmt.Println("  go run . -rollback   - Rollback database migrations")
	fmt.Println()
	fmt.Println("Press Ctrl+C to stop the server")
	fmt.Println()

	// Start server
	err = http.ListenAndServe(":4000", mux)
	log.Fatal(err)
}
