#!/usr/bin/env bash
set -euo pipefail

# CSV Seeding Script for EXP Guest Management System
# Usage: ./run_seed_csv.sh [options]

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Set Python path
export PYTHONPATH="$PROJECT_ROOT/backend"

# Change to project root
cd "$PROJECT_ROOT"

# Default values
DRY_RUN=false
CSV_FILE=""
STOP_ON_ERROR=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --file=*)
            CSV_FILE="${1#*=}"
            shift
            ;;
        --stop-on-error)
            STOP_ON_ERROR=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --dry-run              Parse and validate only, do not write to database"
            echo "  --file=<path>          Use local CSV file instead of URL"
            echo "  --stop-on-error        Stop on first error"
            echo "  -h, --help             Show this help message"
            echo ""
            echo "Environment variables:"
            echo "  SEED_CSV_URL           URL to fetch CSV from (Google Sheets)"
            echo "  SEED_TIMEOUT           Request timeout in seconds (default: 30)"
            echo "  DATABASE_URL           Database connection URL"
            echo ""
            echo "Examples:"
            echo "  $0                     # Seed from SEED_CSV_URL"
            echo "  $0 --dry-run           # Validate only"
            echo "  $0 --file=./data.csv   # Use local file"
            echo "  $0 --stop-on-error     # Stop on first error"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed"
    exit 1
fi

# Check if required packages are installed
echo "🔍 Checking dependencies..."
python3 -c "
import sys
try:
    import requests
    import csv
    from app.db.session import SessionLocal
    from app.models import Event, Guest
    print('✅ All dependencies available')
except ImportError as e:
    print(f'❌ Missing dependency: {e}')
    print('Please install: pip install requests python-dotenv')
    sys.exit(1)
"

# Check environment variables
echo "🔍 Checking environment..."
if [ -z "${SEED_CSV_URL:-}" ] && [ -z "$CSV_FILE" ]; then
    echo "⚠️  Warning: SEED_CSV_URL not set and no file specified"
    echo "   Will try to use snapshot file if available"
fi

if [ -z "${DATABASE_URL:-}" ]; then
    echo "❌ Error: DATABASE_URL not set"
    echo "   Please set DATABASE_URL in your environment or .env file"
    exit 1
fi

# Build command
CMD="python3 -m app.seeds.seed_csv"

if [ "$DRY_RUN" = true ]; then
    CMD="$CMD --dry-run"
fi

if [ -n "$CSV_FILE" ]; then
    CMD="$CMD --file=$CSV_FILE"
fi

if [ "$STOP_ON_ERROR" = true ]; then
    CMD="$CMD --stop-on-error"
fi

# Run the command
echo "🚀 Starting CSV seeding..."
echo "Command: $CMD"
echo ""

# Execute the command
if eval "$CMD"; then
    echo ""
    echo "✅ CSV seeding completed successfully!"
    exit 0
else
    echo ""
    echo "❌ CSV seeding failed!"
    exit 1
fi
