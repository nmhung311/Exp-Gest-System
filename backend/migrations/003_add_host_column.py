#!/usr/bin/env python3
"""
Migration 003: Thêm cột host vào bảng guests
"""

import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from db import db

def migrate():
    """Thêm cột host vào bảng guests"""
    print("Adding host column to guests table...")
    
    try:
        # Kiểm tra cột host đã tồn tại chưa
        existing_cols = set()
        result = db.session.execute(db.text("PRAGMA table_info(guests)"))
        for row in result:
            existing_cols.add(str(row[1]))
        
        if 'host' in existing_cols:
            print("⏭️  Host column already exists in guests table")
            return
        
        # Thêm cột host
        print("  Adding column: host")
        db.session.execute(db.text("ALTER TABLE guests ADD COLUMN host VARCHAR(255)"))
        db.session.commit()
        
        print("✅ Host column added successfully")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        db.session.rollback()
        raise
