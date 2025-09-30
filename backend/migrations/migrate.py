#!/usr/bin/env python3
"""
Database migration runner
Chạy tất cả migration files theo thứ tự
"""

import os
import sys
import sqlite3
from datetime import datetime
from pathlib import Path

# Add parent directory to path để import models
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from db import db
from models import Event, Guest, Token, Checkin, User, UserToken

def get_db_path():
    """Lấy đường dẫn database"""
    return os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'exp_guest.db'))

def init_migration_table():
    """Tạo bảng theo dõi migration"""
    db_path = get_db_path()
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT UNIQUE NOT NULL,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.commit()
    conn.close()

def get_executed_migrations():
    """Lấy danh sách migration đã chạy"""
    db_path = get_db_path()
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT filename FROM migrations ORDER BY id")
    executed = [row[0] for row in cursor.fetchall()]
    
    conn.close()
    return executed

def mark_migration_executed(filename):
    """Đánh dấu migration đã chạy"""
    db_path = get_db_path()
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("INSERT INTO migrations (filename) VALUES (?)", (filename,))
    conn.commit()
    conn.close()

def run_migrations():
    """Chạy tất cả migration chưa được thực thi"""
    print("🔄 Starting database migrations...")
    print(f"Database: {get_db_path()}")
    print("-" * 50)
    
    # Tạo Flask app context
    from app import create_app
    app = create_app()
    
    with app.app_context():
        # Tạo bảng migration tracking
        init_migration_table()
        
        # Lấy danh sách migration đã chạy
        executed = get_executed_migrations()
        
        # Tìm tất cả file migration
        migrations_dir = Path(__file__).parent
        migration_files = []
        
        for file in migrations_dir.glob("*.py"):
            if file.name not in ["__init__.py", "migrate.py", "seed.py"]:
                migration_files.append(file.name)
        
        # Sắp xếp theo tên file
        migration_files.sort()
        
        print(f"Found {len(migration_files)} migration files")
        print(f"Already executed: {len(executed)}")
        
        # Chạy migration chưa được thực thi
        for filename in migration_files:
            if filename not in executed:
                print(f"\n📦 Running migration: {filename}")
                try:
                    # Import và chạy migration
                    module_name = filename[:-3]  # Bỏ .py
                    module = __import__(module_name)
                    
                    if hasattr(module, 'migrate'):
                        module.migrate()
                        mark_migration_executed(filename)
                        print(f"✅ {filename} completed")
                    else:
                        print(f"⚠️  {filename} has no migrate() function")
                        
                except Exception as e:
                    print(f"❌ {filename} failed: {e}")
                    return False
            else:
                print(f"⏭️  {filename} already executed")
        
        print("\n" + "-" * 50)
        print("✅ All migrations completed!")
        return True

if __name__ == "__main__":
    success = run_migrations()
    if not success:
        sys.exit(1)
