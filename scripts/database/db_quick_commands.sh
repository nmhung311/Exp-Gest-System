#!/bin/bash
# Quick Database Commands - EXP Guest System
# Các lệnh nhanh để quản lý database

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database path
DB_PATH="/home/exp/Hung/Exp-Gest-System/exp_guest.db"
BACKEND_PATH="/home/exp/Hung/Exp-Gest-System/backend"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to check if database exists
check_db() {
    if [ ! -f "$DB_PATH" ]; then
        print_error "Database not found at $DB_PATH"
        return 1
    fi
    return 0
}

# Function to show database status
db_status() {
    print_info "Database Status"
    echo "=================="
    
    if check_db; then
        print_status "Database exists"
        echo "Size: $(du -h "$DB_PATH" | cut -f1)"
        echo "Last modified: $(stat -c %y "$DB_PATH")"
        
        # Show table counts
        echo ""
        print_info "Table Statistics:"
        sqlite3 "$DB_PATH" << EOF
SELECT 'users: ' || COUNT(*) FROM users;
SELECT 'events: ' || COUNT(*) FROM events;
SELECT 'guests: ' || COUNT(*) FROM guests;
SELECT 'tokens: ' || COUNT(*) FROM tokens;
SELECT 'checkins: ' || COUNT(*) FROM checkins;
EOF
    else
        print_error "Database not found"
    fi
}

# Function to initialize database
db_init() {
    print_info "Initializing database..."
    cd "$BACKEND_PATH" || exit 1
    
    if python init_db.py; then
        print_status "Database initialized successfully"
    else
        print_error "Database initialization failed"
        exit 1
    fi
}

# Function to run migrations
db_migrate() {
    print_info "Running migrations..."
    cd "$BACKEND_PATH" || exit 1
    
    if python migrations/migrate.py; then
        print_status "Migrations completed successfully"
    else
        print_error "Migration failed"
        exit 1
    fi
}

# Function to backup database
db_backup() {
    if ! check_db; then
        exit 1
    fi
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="exp_guest_backup_$TIMESTAMP.db"
    BACKUP_PATH="/home/exp/Hung/Exp-Gest-System/backups/$BACKUP_FILE"
    
    # Create backups directory if not exists
    mkdir -p "/home/exp/Hung/Exp-Gest-System/backups"
    
    print_info "Backing up database..."
    if cp "$DB_PATH" "$BACKUP_PATH"; then
        print_status "Database backed up to: $BACKUP_PATH"
    else
        print_error "Backup failed"
        exit 1
    fi
}

# Function to restore database
db_restore() {
    if [ -z "$1" ]; then
        print_error "Please specify backup file"
        echo "Usage: $0 restore <backup_file>"
        exit 1
    fi
    
    BACKUP_FILE="$1"
    if [ ! -f "$BACKUP_FILE" ]; then
        print_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    print_warning "This will replace the current database!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Backup current database first
        db_backup
        
        print_info "Restoring database from: $BACKUP_FILE"
        if cp "$BACKUP_FILE" "$DB_PATH"; then
            print_status "Database restored successfully"
        else
            print_error "Restore failed"
            exit 1
        fi
    else
        print_info "Restore cancelled"
    fi
}

# Function to show database schema
db_schema() {
    if ! check_db; then
        exit 1
    fi
    
    print_info "Database Schema"
    echo "================"
    sqlite3 "$DB_PATH" ".schema"
}

# Function to show tables
db_tables() {
    if ! check_db; then
        exit 1
    fi
    
    print_info "Database Tables"
    echo "================"
    sqlite3 "$DB_PATH" ".tables"
}

# Function to query database
db_query() {
    if ! check_db; then
        exit 1
    fi
    
    if [ -z "$1" ]; then
        print_error "Please specify SQL query"
        echo "Usage: $0 query \"SELECT * FROM users;\""
        exit 1
    fi
    
    print_info "Executing query: $1"
    echo "========================"
    sqlite3 "$DB_PATH" "$1"
}

# Function to open SQLite shell
db_shell() {
    if ! check_db; then
        exit 1
    fi
    
    print_info "Opening SQLite shell..."
    sqlite3 "$DB_PATH"
}

# Function to show help
show_help() {
    echo "EXP Guest System - Database Management"
    echo "======================================"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  status     - Show database status and statistics"
    echo "  init       - Initialize database with sample data"
    echo "  migrate    - Run database migrations"
    echo "  backup     - Create database backup"
    echo "  restore    - Restore database from backup"
    echo "  schema     - Show database schema"
    echo "  tables     - List all tables"
    echo "  query      - Execute SQL query"
    echo "  shell      - Open SQLite shell"
    echo "  help       - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 status"
    echo "  $0 init"
    echo "  $0 backup"
    echo "  $0 restore /path/to/backup.db"
    echo "  $0 query \"SELECT COUNT(*) FROM guests;\""
    echo "  $0 shell"
}

# Main script logic
case "$1" in
    "status")
        db_status
        ;;
    "init")
        db_init
        ;;
    "migrate")
        db_migrate
        ;;
    "backup")
        db_backup
        ;;
    "restore")
        db_restore "$2"
        ;;
    "schema")
        db_schema
        ;;
    "tables")
        db_tables
        ;;
    "query")
        db_query "$2"
        ;;
    "shell")
        db_shell
        ;;
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
