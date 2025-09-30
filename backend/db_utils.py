#!/usr/bin/env python3
"""
Database utilities - Các tiện ích quản lý database
"""

import os
import sys
import sqlite3
from datetime import datetime
from pathlib import Path

# Add current directory to path
sys.path.append(os.path.dirname(__file__))

from app import create_app
from db import db
from models import Event, Guest, Token, Checkin, User, UserToken

class DatabaseManager:
    """Quản lý database operations"""
    
    def __init__(self):
        self.app = create_app()
        self.db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'exp_guest.db'))
    
    def get_stats(self):
        """Lấy thống kê database"""
        with self.app.app_context():
            stats = {
                'users': User.query.count(),
                'events': Event.query.count(),
                'guests': Guest.query.count(),
                'tokens': Token.query.count(),
                'checkins': Checkin.query.count(),
                'user_tokens': UserToken.query.count()
            }
            return stats
    
    def backup_database(self, backup_path=None):
        """Backup database"""
        if not backup_path:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = f"exp_guest_backup_{timestamp}.db"
        
        # Copy database file
        import shutil
        shutil.copy2(self.db_path, backup_path)
        print(f"✅ Database backed up to: {backup_path}")
        return backup_path
    
    def restore_database(self, backup_path):
        """Restore database từ backup"""
        if not os.path.exists(backup_path):
            print(f"❌ Backup file not found: {backup_path}")
            return False
        
        # Backup current database first
        current_backup = self.backup_database()
        print(f"📦 Current database backed up to: {current_backup}")
        
        # Restore from backup
        import shutil
        shutil.copy2(backup_path, self.db_path)
        print(f"✅ Database restored from: {backup_path}")
        return True
    
    def check_integrity(self):
        """Kiểm tra tính toàn vẹn database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Check integrity
        cursor.execute("PRAGMA integrity_check")
        result = cursor.fetchone()
        
        conn.close()
        
        if result[0] == "ok":
            print("✅ Database integrity check passed")
            return True
        else:
            print(f"❌ Database integrity check failed: {result[0]}")
            return False
    
    def vacuum_database(self):
        """Tối ưu database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get size before
        cursor.execute("PRAGMA page_count")
        pages_before = cursor.fetchone()[0]
        
        # Vacuum
        cursor.execute("VACUUM")
        
        # Get size after
        cursor.execute("PRAGMA page_count")
        pages_after = cursor.fetchone()[0]
        
        conn.close()
        
        print(f"✅ Database optimized: {pages_before} -> {pages_after} pages")
        return pages_before - pages_after
    
    def get_table_info(self, table_name):
        """Lấy thông tin cấu trúc table"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = cursor.fetchall()
        
        conn.close()
        
        return columns
    
    def list_tables(self):
        """Liệt kê tất cả tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        tables = [row[0] for row in cursor.fetchall()]
        
        conn.close()
        
        return tables
    
    def export_to_csv(self, table_name, output_file=None):
        """Export table ra CSV"""
        if not output_file:
            output_file = f"{table_name}_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get data
        cursor.execute(f"SELECT * FROM {table_name}")
        rows = cursor.fetchall()
        
        # Get column names
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = [row[1] for row in cursor.fetchall()]
        
        conn.close()
        
        # Write CSV
        import csv
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(columns)
            writer.writerows(rows)
        
        print(f"✅ Table {table_name} exported to: {output_file}")
        return output_file
    
    def import_from_csv(self, table_name, csv_file):
        """Import data từ CSV vào table"""
        if not os.path.exists(csv_file):
            print(f"❌ CSV file not found: {csv_file}")
            return False
        
        import csv
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
        
        with self.app.app_context():
            # Get model class
            model_map = {
                'users': User,
                'events': Event,
                'guests': Guest,
                'tokens': Token,
                'checkins': Checkin,
                'user_tokens': UserToken
            }
            
            if table_name not in model_map:
                print(f"❌ Unknown table: {table_name}")
                return False
            
            model_class = model_map[table_name]
            
            # Import data
            for row in rows:
                # Convert data types
                for key, value in row.items():
                    if value == '':
                        row[key] = None
                
                try:
                    record = model_class(**row)
                    db.session.add(record)
                except Exception as e:
                    print(f"⚠️  Error importing row: {e}")
                    continue
            
            db.session.commit()
            print(f"✅ Imported {len(rows)} records to {table_name}")
            return True

def main():
    """CLI interface cho database utilities"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Database Management Utilities')
    parser.add_argument('action', choices=[
        'stats', 'backup', 'restore', 'check', 'vacuum', 
        'tables', 'info', 'export', 'import'
    ], help='Action to perform')
    parser.add_argument('--table', help='Table name for info/export/import')
    parser.add_argument('--file', help='File path for backup/restore/export/import')
    
    args = parser.parse_args()
    
    db_manager = DatabaseManager()
    
    if args.action == 'stats':
        stats = db_manager.get_stats()
        print("📊 Database Statistics:")
        for table, count in stats.items():
            print(f"  - {table}: {count}")
    
    elif args.action == 'backup':
        backup_path = db_manager.backup_database(args.file)
        print(f"Backup created: {backup_path}")
    
    elif args.action == 'restore':
        if not args.file:
            print("❌ Please specify backup file with --file")
            return
        db_manager.restore_database(args.file)
    
    elif args.action == 'check':
        db_manager.check_integrity()
    
    elif args.action == 'vacuum':
        db_manager.vacuum_database()
    
    elif args.action == 'tables':
        tables = db_manager.list_tables()
        print("📋 Database Tables:")
        for table in tables:
            print(f"  - {table}")
    
    elif args.action == 'info':
        if not args.table:
            print("❌ Please specify table name with --table")
            return
        columns = db_manager.get_table_info(args.table)
        print(f"📋 Table {args.table} structure:")
        for col in columns:
            print(f"  - {col[1]} ({col[2]})")
    
    elif args.action == 'export':
        if not args.table:
            print("❌ Please specify table name with --table")
            return
        db_manager.export_to_csv(args.table, args.file)
    
    elif args.action == 'import':
        if not args.table or not args.file:
            print("❌ Please specify table name with --table and CSV file with --file")
            return
        db_manager.import_from_csv(args.table, args.file)

if __name__ == "__main__":
    main()
