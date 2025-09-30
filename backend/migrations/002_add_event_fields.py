#!/usr/bin/env python3
"""
Migration 002: Thêm các trường mới cho bảng events
"""

import os
import sys
import sqlite3

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from db import db

def migrate():
    """Thêm các trường mới cho events table"""
    print("Adding new fields to events table...")
    
    try:
        # Kiểm tra các cột hiện có
        existing_cols = set()
        result = db.session.execute(db.text("PRAGMA table_info(events)"))
        for row in result:
            existing_cols.add(str(row[1]))

        alter_statements = []
        
        # Thêm các cột mới nếu chưa có
        new_fields = [
            ("venue_address", "TEXT"),
            ("venue_map_url", "TEXT"), 
            ("program_outline", "TEXT"),
            ("dress_code", "TEXT")
        ]
        
        for field_name, field_type in new_fields:
            if field_name not in existing_cols:
                alter_statements.append(f"ALTER TABLE events ADD COLUMN {field_name} {field_type}")
                print(f"  Adding column: {field_name}")

        # Thực thi các lệnh ALTER
        for stmt in alter_statements:
            try:
                db.session.execute(db.text(stmt))
                print(f"  ✅ {stmt}")
            except Exception as e:
                print(f"  ⚠️  {stmt} - {e}")
        
        if alter_statements:
            db.session.commit()
            print("✅ Event fields migration completed")
        else:
            print("⏭️  All event fields already exist")
            
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        db.session.rollback()
        raise
