#!/usr/bin/env python3
"""
Database migration script to add host column to guests table
Run this script to add the host field to existing guests table
"""

import sqlite3
import os
from datetime import datetime

def migrate_database():
    """Add host column to guests table"""
    
    # Database path
    db_path = os.path.join(os.path.dirname(__file__), '..', 'exp_guest.db')
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return False
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if host column already exists
        cursor.execute("PRAGMA table_info(guests)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'host' in columns:
            print("Host column already exists in guests table")
            return True
        
        # Add host column
        print("Adding host column to guests table...")
        cursor.execute("ALTER TABLE guests ADD COLUMN host VARCHAR(255)")
        
        # Commit changes
        conn.commit()
        print("Successfully added host column to guests table")
        
        # Verify the column was added
        cursor.execute("PRAGMA table_info(guests)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'host' in columns:
            print("✓ Host column verified in guests table")
            return True
        else:
            print("✗ Failed to add host column")
            return False
            
    except Exception as e:
        print(f"Error during migration: {e}")
        return False
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    print("Starting database migration...")
    print(f"Timestamp: {datetime.now()}")
    print("-" * 50)
    
    success = migrate_database()
    
    print("-" * 50)
    if success:
        print("✓ Migration completed successfully!")
    else:
        print("✗ Migration failed!")
    
    print(f"Completed at: {datetime.now()}")
