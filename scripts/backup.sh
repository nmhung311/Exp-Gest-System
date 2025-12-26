#!/bin/bash
# Database Backup Script
# Backup toàn bộ database từ event-backend container

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_BASE="$PROJECT_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_BASE/$TIMESTAMP"
DB_BACKUP_DIR="$BACKUP_DIR/database"

echo "📦 Starting database backup..."
echo "📁 Backup directory: $BACKUP_DIR"

# Create backup directories
mkdir -p "$DB_BACKUP_DIR"

# Copy database file from container
echo "📋 Copying database file..."
docker cp event-backend:/app/instance/exp_guest.db "$DB_BACKUP_DIR/exp_guest.db"

if [ -f "$DB_BACKUP_DIR/exp_guest.db" ]; then
    DB_SIZE=$(du -h "$DB_BACKUP_DIR/exp_guest.db" | cut -f1)
    echo "✅ Database file backed up: $DB_BACKUP_DIR/exp_guest.db ($DB_SIZE)"
else
    echo "❌ Failed to backup database file"
    exit 1
fi

# Export data to JSON using Python in container
echo "📊 Exporting data to JSON..."
docker exec event-backend python3 -c "
import json, sqlite3
from datetime import datetime

conn = sqlite3.connect('/app/instance/exp_guest.db')
cursor = conn.cursor()

# Get counts
cursor.execute('SELECT COUNT(*) FROM events')
events_count = cursor.fetchone()[0]

cursor.execute('SELECT COUNT(*) FROM guests')
guests_count = cursor.fetchone()[0]

cursor.execute('SELECT COUNT(*) FROM checkins')
checkins_count = cursor.fetchone()[0]

cursor.execute('SELECT COUNT(*) FROM tokens')
tokens_count = cursor.fetchone()[0]

# Export all guests
cursor.execute('SELECT id, name, title, role, organization, tag, email, phone, rsvp_status, checkin_status, event_id, event_content, created_at FROM guests')
guests = []
for row in cursor.fetchall():
    guests.append({
        'id': row[0],
        'name': row[1],
        'title': row[2],
        'role': row[3],
        'organization': row[4],
        'tag': row[5],
        'email': row[6],
        'phone': row[7],
        'rsvp_status': row[8],
        'checkin_status': row[9],
        'event_id': row[10],
        'event_content': row[11],
        'created_at': row[12]
    })

# Export all events
cursor.execute('SELECT id, name, description, date, time, location, venue_address, venue_map_url, program_outline, dress_code, max_guests, status, created_at FROM events')
events = []
for row in cursor.fetchall():
    events.append({
        'id': row[0],
        'name': row[1],
        'description': row[2],
        'date': row[3],
        'time': row[4],
        'location': row[5],
        'venue_address': row[6],
        'venue_map_url': row[7],
        'program_outline': row[8],
        'dress_code': row[9],
        'max_guests': row[10],
        'status': row[11],
        'created_at': row[12]
    })

# Export checkins
cursor.execute('SELECT id, guest_id, time, gate, staff FROM checkins')
checkins = []
for row in cursor.fetchall():
    checkins.append({
        'id': row[0],
        'guest_id': row[1],
        'time': row[2],
        'gate': row[3],
        'staff': row[4]
    })

# Export tokens
cursor.execute('SELECT id, guest_id, token, created_at FROM tokens')
tokens = []
for row in cursor.fetchall():
    tokens.append({
        'id': row[0],
        'guest_id': row[1],
        'token': row[2],
        'created_at': row[3]
    })

conn.close()

export_data = {
    'backup_timestamp': '$TIMESTAMP',
    'backup_date': datetime.now().isoformat(),
    'summary': {
        'events_count': events_count,
        'guests_count': guests_count,
        'checkins_count': checkins_count,
        'tokens_count': tokens_count
    },
    'events': events,
    'guests': guests,
    'checkins': checkins,
    'tokens': tokens
}

json_path = '/app/backups/$TIMESTAMP/data_export.json'
import os
os.makedirs(os.path.dirname(json_path), exist_ok=True)

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(export_data, f, indent=2, ensure_ascii=False)

print(f'✅ Data exported: {json_path}')
print(f'📊 Summary: {events_count} events, {guests_count} guests, {checkins_count} checkins, {tokens_count} tokens')
" 2>&1

# Copy JSON export from container
if docker exec event-backend test -f "/app/backups/$TIMESTAMP/data_export.json" 2>/dev/null; then
    docker cp event-backend:/app/backups/$TIMESTAMP/data_export.json "$BACKUP_DIR/data_export.json"
    echo "✅ Data export copied: $BACKUP_DIR/data_export.json"
fi

# Create backup info file
cat > "$BACKUP_DIR/backup_info.txt" << EOF
Backup Information
==================
Timestamp: $TIMESTAMP
Date: $(date)
Container: event-backend
Database: exp_guest.db
Location: $BACKUP_DIR
EOF

echo ""
echo "✅ Backup completed successfully!"
echo "📁 Backup location: $BACKUP_DIR"
echo "📊 Contents:"
ls -lh "$BACKUP_DIR" | tail -n +2
echo ""
echo "💾 Total backup size: $(du -sh "$BACKUP_DIR" | cut -f1)"

