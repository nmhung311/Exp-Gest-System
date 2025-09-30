#!/bin/bash

# Pre-commit hook to check if documentation is up to date with model changes
# This script ensures that ERD.md and BA.md are updated when models change

set -e

echo "🔍 Checking documentation consistency..."

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository"
    exit 1
fi

# Get list of modified files in staging area
MODIFIED_FILES=$(git diff --cached --name-only)

# Check if any model files were modified
MODEL_FILES=$(echo "$MODIFIED_FILES" | grep -E "backend/app/models/.*\.py$" || true)
DOC_FILES=$(echo "$MODIFIED_FILES" | grep -E "docs/v1.0/(ERD\.md|BA\.md)$" || true)

# If no model files were modified, skip check
if [ -z "$MODEL_FILES" ]; then
    echo "✅ No model files modified, skipping documentation check"
    exit 0
fi

echo "📝 Model files modified:"
echo "$MODEL_FILES"

# Check if documentation files were also modified
if [ -z "$DOC_FILES" ]; then
    echo ""
    echo "❌ ERROR: Model files were modified but documentation was not updated!"
    echo ""
    echo "Please update the following documentation files:"
    echo "  - docs/v1.0/ERD.md"
    echo "  - docs/v1.0/BA.md"
    echo "  - docs/v1.0/CHANGELOG_DB.md"
    echo ""
    echo "Modified model files:"
    echo "$MODEL_FILES"
    echo ""
    echo "After updating documentation, add them to the commit:"
    echo "  git add docs/v1.0/ERD.md docs/v1.0/BA.md docs/v1.0/CHANGELOG_DB.md"
    echo ""
    exit 1
fi

echo "✅ Documentation files were also modified:"
echo "$DOC_FILES"

# Check if migration files exist for model changes
MIGRATION_FILES=$(echo "$MODIFIED_FILES" | grep -E "alembic/versions/.*\.py$" || true)

if [ -z "$MIGRATION_FILES" ]; then
    echo ""
    echo "⚠️  WARNING: Model files were modified but no migration files found!"
    echo "Please create a migration for your model changes:"
    echo "  PYTHONPATH=backend alembic revision --autogenerate -m 'describe changes'"
    echo ""
fi

# Check if CHANGELOG_DB.md was updated
CHANGELOG_UPDATED=$(echo "$MODIFIED_FILES" | grep -E "docs/v1.0/CHANGELOG_DB\.md$" || true)

if [ -z "$CHANGELOG_UPDATED" ]; then
    echo ""
    echo "⚠️  WARNING: CHANGELOG_DB.md was not updated!"
    echo "Please update CHANGELOG_DB.md with your changes"
    echo ""
fi

echo "✅ Documentation check passed!"
exit 0
