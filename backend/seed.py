#!/usr/bin/env python3
"""
Database seeding script for EXP Guest Management System
Run this script to populate the database with initial data
"""

if __name__ == "__main__":
    # Import all seed modules to register them
    from app.seeds import seed_roles, seed_users, seed_events, seed_guests
    from app.seeds.base_seed import run_all
    
    print("Starting database seeding...")
    print("=" * 50)
    
    try:
        run_all()
        print("=" * 50)
        print("Database seeding completed successfully!")
    except Exception as e:
        print("=" * 50)
        print(f"Database seeding failed: {e}")
        exit(1)
