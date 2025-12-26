#!/usr/bin/env python3
"""
Database Backup Script
Backup toàn bộ database và export data ra JSON
"""

import os
import sys
import shutil
import json
from datetime import datetime
from pathlib import Path

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app import create_app
from db import db
from models import Guest, Event, Checkin, Token, User, UserToken

def backup_database():
    """Backup database và export data"""
    app = create_app()
    
    # Tạo thư mục backup với timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = Path(__file__).parent.parent / "backups" / timestamp
    backup_dir.mkdir(parents=True, exist_ok=True)
    db_dir = backup_dir / "database"
    db_dir.mkdir(exist_ok=True)
    
    print(f"📦 Creating backup in: {backup_dir}")
    
    with app.app_context():
        # 1. Copy database file - try multiple locations
        possible_db_paths = [
            "/app/instance/exp_guest.db",  # Docker container path
            str(Path(__file__).parent.parent / "backend" / "instance" / "exp_guest.db"),  # Local backend path
            str(Path(__file__).parent.parent / "exp_guest.db"),  # Root path
        ]
        
        db_path = None
        for path in possible_db_paths:
            if os.path.exists(path):
                db_path = path
                break
        
        if db_path:
            backup_db_path = db_dir / "exp_guest.db"
            shutil.copy2(db_path, backup_db_path)
            print(f"✅ Database file backed up from {db_path} to {backup_db_path}")
        else:
            print(f"⚠️  Database file not found at any of these locations:")
            for path in possible_db_paths:
                print(f"   - {path}")
        
        # 2. Export data to JSON
        print("📊 Exporting data to JSON...")
        
        # Export Events
        events = Event.query.all()
        events_data = [{
            'id': e.id,
            'name': e.name,
            'date': e.date.isoformat() if e.date else None,
            'time': e.time.isoformat() if e.time else None,
            'location': e.location,
            'venue_address': e.venue_address,
            'venue_map_url': e.venue_map_url,
            'program_outline': e.program_outline,
            'dress_code': e.dress_code,
            'invitation_content': e.invitation_content,
            'max_guests': e.max_guests,
            'status': e.status,
            'created_at': e.created_at.isoformat() if e.created_at else None
        } for e in events]
        
        # Export Guests
        guests = Guest.query.all()
        guests_data = [{
            'id': g.id,
            'name': g.name,
            'title': g.title,
            'role': g.role,
            'organization': g.organization,
            'tag': g.tag,
            'email': g.email,
            'phone': g.phone,
            'rsvp_status': g.rsvp_status,
            'checkin_status': g.checkin_status,
            'event_id': g.event_id,
            'event_content': g.event_content,
            'created_at': g.created_at.isoformat() if g.created_at else None
        } for g in guests]
        
        # Export Checkins
        checkins = Checkin.query.all()
        checkins_data = [{
            'id': c.id,
            'guest_id': c.guest_id,
            'time': c.time.isoformat() if c.time else None,
            'gate': c.gate,
            'staff': c.staff
        } for c in checkins]
        
        # Export Tokens
        tokens = Token.query.all()
        tokens_data = [{
            'id': t.id,
            'guest_id': t.guest_id,
            'token': t.token,
            'status': t.status,
            'created_at': t.created_at.isoformat() if t.created_at else None,
            'expires_at': t.expires_at.isoformat() if t.expires_at else None
        } for t in tokens]
        
        # Export Users
        users = User.query.all()
        users_data = [{
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'created_at': u.created_at.isoformat() if u.created_at else None
        } for u in users]
        
        # Export UserTokens
        user_tokens = UserToken.query.all()
        user_tokens_data = [{
            'id': ut.id,
            'user_id': ut.user_id,
            'token': ut.token,
            'status': ut.status,
            'created_at': ut.created_at.isoformat() if ut.created_at else None,
            'expires_at': ut.expires_at.isoformat() if ut.expires_at else None
        } for ut in user_tokens]
        
        # Combine all data
        export_data = {
            'backup_timestamp': timestamp,
            'backup_date': datetime.now().isoformat(),
            'summary': {
                'events_count': len(events_data),
                'guests_count': len(guests_data),
                'checkins_count': len(checkins_data),
                'tokens_count': len(tokens_data),
                'users_count': len(users_data),
                'user_tokens_count': len(user_tokens_data)
            },
            'events': events_data,
            'guests': guests_data,
            'checkins': checkins_data,
            'tokens': tokens_data,
            'users': users_data,
            'user_tokens': user_tokens_data
        }
        
        # Save to JSON
        json_path = backup_dir / "data_export.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Data exported to: {json_path}")
        print(f"\n📊 Backup Summary:")
        print(f"   Events: {len(events_data)}")
        print(f"   Guests: {len(guests_data)}")
        print(f"   Checkins: {len(checkins_data)}")
        print(f"   Tokens: {len(tokens_data)}")
        print(f"   Users: {len(users_data)}")
        print(f"   User Tokens: {len(user_tokens_data)}")
        print(f"\n✅ Backup completed successfully!")
        print(f"📁 Backup location: {backup_dir}")
        
        return backup_dir

if __name__ == "__main__":
    try:
        backup_dir = backup_database()
        sys.exit(0)
    except Exception as e:
        print(f"❌ Backup failed: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

