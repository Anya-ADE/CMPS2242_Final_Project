package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"

	_ "github.com/lib/pq"
)

// OpenDB opens a connection to the database
func OpenDB(dsn string) (*sql.DB, error) {
	if dsn == "" {
		return nil, fmt.Errorf("database connection string cannot be empty")
	}

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %v", err)
	}

	// Configure connection pool
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)

	// Test connection
	err = db.Ping()
	if err != nil {
		db.Close()
		return nil, fmt.Errorf(`
DATABASE CONNECTION FAILED!

Error: %v

Please ensure:
1. PostgreSQL is running
2. Database 'holidays' exists
3. User 'holidays' with password 'holidays' exists

To fix, run:
sudo -u postgres psql -c "CREATE DATABASE holidays;"
sudo -u postgres psql -c "CREATE USER holidays WITH PASSWORD 'holidays';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE holidays TO holidays;"
`, err)
	}

	log.Println("Database connection established")
	return db, nil
}

// RunMigrations executes the up migration
func RunMigrations(db *sql.DB) error {
	migrationPath := filepath.Join("migrations", "000001_create_holidays_table.up.sql")

	migrationSQL, err := os.ReadFile(migrationPath)
	if err != nil {
		return fmt.Errorf("failed to read migration file: %v", err)
	}

	_, err = db.Exec(string(migrationSQL))
	if err != nil {
		return fmt.Errorf("migration failed: %v", err)
	}

	return nil
}

// RollbackMigrations executes the down migration
func RollbackMigrations(db *sql.DB) error {
	migrationPath := filepath.Join("migrations", "000001_create_holidays_table.down.sql")

	migrationSQL, err := os.ReadFile(migrationPath)
	if err != nil {
		return fmt.Errorf("failed to read rollback file: %v", err)
	}

	_, err = db.Exec(string(migrationSQL))
	if err != nil {
		return fmt.Errorf("rollback failed: %v", err)
	}

	return nil
}
