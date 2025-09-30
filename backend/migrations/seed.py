#!/usr/bin/env python3
"""
Seed data cho database
Tạo dữ liệu mẫu ban đầu
"""

import os
import sys
from datetime import datetime, date, time

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from db import db
from models import Event, Guest, Token, Checkin, User, UserToken, get_hanoi_time

def seed_data():
    """Tạo dữ liệu mẫu"""
    print("🌱 Seeding database with initial data...")
    
    # Tạo Flask app context
    from app import create_app
    app = create_app()
    
    with app.app_context():
        try:
            # 1. Tạo admin user
            print("Creating admin user...")
            admin_user = User.create_user(
                username="admin",
                password="admin123",
                email="admin@expsolution.io"
            )
            print(f"✅ Admin user created: {admin_user.username}")
            
            # 2. Tạo event mẫu
            print("Creating sample event...")
            sample_event = Event(
                name="EXP Solution Annual Conference 2024",
                date=date(2024, 12, 15),
                time=time(9, 0),
                location="Grand Ballroom, InterContinental Hotel",
                venue_address="123 Nguyen Hue, District 1, Ho Chi Minh City",
                venue_map_url="https://maps.google.com/...",
                program_outline='[["09:00", "Registration & Welcome Coffee"], ["09:30", "Opening Keynote"], ["10:30", "Coffee Break"], ["11:00", "Panel Discussion"], ["12:00", "Lunch Break"], ["13:30", "Workshop Sessions"], ["15:00", "Networking Break"], ["15:30", "Closing Remarks"]]',
                dress_code="Business Casual",
                invitation_content="We are delighted to invite you to our annual conference...",
                status="upcoming",
                max_guests=200
            )
            db.session.add(sample_event)
            db.session.commit()
            print(f"✅ Sample event created: {sample_event.name}")
            
            # 3. Tạo guests mẫu
            print("Creating sample guests...")
            sample_guests = [
                {
                    "name": "Nguyen Van A",
                    "title": "Mr",
                    "role": "CEO",
                    "organization": "ABC Company",
                    "tag": "VIP",
                    "email": "nguyenvana@abc.com",
                    "phone": "0901234567",
                    "host": "John Smith",
                    "rsvp_status": "accepted",
                    "event_id": sample_event.id
                },
                {
                    "name": "Tran Thi B",
                    "title": "Ms",
                    "role": "Marketing Director",
                    "organization": "XYZ Corporation",
                    "tag": "Regular",
                    "email": "tranthib@xyz.com",
                    "phone": "0907654321",
                    "host": "Jane Doe",
                    "rsvp_status": "pending",
                    "event_id": sample_event.id
                },
                {
                    "name": "Le Van C",
                    "title": "Dr",
                    "role": "CTO",
                    "organization": "Tech Solutions Ltd",
                    "tag": "VIP",
                    "email": "levanc@tech.com",
                    "phone": "0909876543",
                    "host": "Mike Johnson",
                    "rsvp_status": "accepted",
                    "event_id": sample_event.id
                }
            ]
            
            created_guests = []
            for guest_data in sample_guests:
                guest = Guest(**guest_data)
                db.session.add(guest)
                created_guests.append(guest)
            
            db.session.commit()
            print(f"✅ {len(created_guests)} sample guests created")
            
            # 4. Tạo tokens cho guests
            print("Creating tokens for guests...")
            import secrets
            
            for guest in created_guests:
                token = Token(
                    guest_id=guest.id,
                    token=secrets.token_urlsafe(32),
                    status="active"
                )
                db.session.add(token)
            
            db.session.commit()
            print(f"✅ Tokens created for {len(created_guests)} guests")
            
            print("\n" + "="*50)
            print("🎉 Database seeding completed successfully!")
            print("="*50)
            print("Sample data created:")
            print(f"  - 1 admin user (admin/admin123)")
            print(f"  - 1 sample event")
            print(f"  - {len(created_guests)} sample guests")
            print(f"  - {len(created_guests)} tokens")
            print("="*50)
            
        except Exception as e:
            print(f"❌ Seeding failed: {e}")
            db.session.rollback()
            raise

if __name__ == "__main__":
    seed_data()
