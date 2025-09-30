#!/usr/bin/env python3
"""
Migration 001: Tạo schema cơ bản cho database
"""

import os
import sys
import sqlite3

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from db import db
from models import Event, Guest, Token, Checkin, User, UserToken

def migrate():
    """Tạo tất cả bảng cơ bản"""
    print("Creating initial database schema...")
    
    # Tạo tất cả bảng từ models
    db.create_all()
    
    print("✅ Initial schema created successfully")
    print("Tables created:")
    print("  - events")
    print("  - guests") 
    print("  - tokens")
    print("  - checkins")
    print("  - users")
    print("  - user_tokens")
