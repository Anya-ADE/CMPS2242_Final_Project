package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	_ "github.com/lib/pq"
)

// OpenDB opens a connection to the database
func OpenDB(dsn string) (*sql.DB, error) {
	if dsn == "postgres://holidays:holidays@localhost/holidays?sslmode=disable" {
		return nil, fmt.Errorf("database connection string cannot be empty")
	}

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %v", err)
	}

	// Configure connection pool
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxIdleTime(15 * time.Minute)
	db.SetConnMaxLifetime(30 * time.Minute)

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err = db.PingContext(ctx)
	if err != nil {
		db.Close()
		return nil, fmt.Errorf("database ping failed: %v\nPlease ensure database 'holidays' exists and user 'holidays' with password 'holidays' has access", err)
	}

	log.Println("Database connection established successfully to holidays database")
	return db, nil
}

// RunMigrations executes the up migration
func RunMigrations(db *sql.DB) error {
	if db == nil {
		return fmt.Errorf("database connection is nil")
	}

	log.Println("Running migrations...")

	migrationPath := filepath.Join("migrations", "000001_create_holidays_table.up.sql")
	if _, err := os.Stat(migrationPath); os.IsNotExist(err) {
		return fmt.Errorf("migration file not found: %s", migrationPath)
	}

	migrationSQL, err := os.ReadFile(migrationPath)
	if err != nil {
		return fmt.Errorf("failed to read migration file: %v", err)
	}

	if len(migrationSQL) == 0 {
		return fmt.Errorf("migration file is empty")
	}

	// Execute migration in a transaction
	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback()

	_, err = tx.Exec(string(migrationSQL))
	if err != nil {
		return fmt.Errorf("migration execution failed: %v", err)
	}

	err = tx.Commit()
	if err != nil {
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

	log.Println("Migrations completed successfully")
	return nil
}

// RollbackMigrations executes the down migration
func RollbackMigrations(db *sql.DB) error {
	if db == nil {
		return fmt.Errorf("database connection is nil")
	}

	log.Println("Rolling back migrations...")

	migrationPath := filepath.Join("migrations", "000001_create_holidays_table.down.sql")
	if _, err := os.Stat(migrationPath); os.IsNotExist(err) {
		return fmt.Errorf("rollback file not found: %s", migrationPath)
	}

	migrationSQL, err := os.ReadFile(migrationPath)
	if err != nil {
		return fmt.Errorf("failed to read rollback file: %v", err)
	}

	if len(migrationSQL) == 0 {
		return fmt.Errorf("rollback file is empty")
	}

	// Execute rollback in a transaction
	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback()

	_, err = tx.Exec(string(migrationSQL))
	if err != nil {
		return fmt.Errorf("rollback execution failed: %v", err)
	}

	err = tx.Commit()
	if err != nil {
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

	log.Println("Rollback completed successfully")
	return nil
}
