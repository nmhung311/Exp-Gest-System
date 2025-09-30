#!/usr/bin/env python3
"""
Database initialization script
Tạo database và seed data ban đầu
"""

import os
import sys
from datetime import datetime, date, time

# Add current directory to path
sys.path.append(os.path.dirname(__file__))

from app import create_app
from db import db
from models import Event, Guest, Token, Checkin, User, UserToken, get_hanoi_time
import secrets

def init_database():
    """Khởi tạo database và tạo dữ liệu mẫu"""
    print("🔄 Initializing database...")
    print("=" * 50)
    
    app = create_app()
    
    with app.app_context():
        try:
            # 1. Tạo tất cả bảng
            print("📦 Creating database tables...")
            db.create_all()
            
            # Kiểm tra tables đã tạo
            result = db.session.execute(db.text("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"))
            tables = [row[0] for row in result]
            print(f"✅ Tables created: {', '.join(tables)}")
            
            # 2. Tạo admin user
            print("\n👤 Creating admin user...")
            existing_admin = User.query.filter_by(username="admin").first()
            if not existing_admin:
                admin_user = User.create_user(
                    username="admin",
                    password="admin123",
                    email="admin@expsolution.io"
                )
                print(f"✅ Admin user created: {admin_user.username}")
            else:
                print("⏭️  Admin user already exists")
                admin_user = existing_admin
            
            # 3. Tạo event mẫu
            print("\n📅 Creating sample event...")
            existing_event = Event.query.filter_by(name="EXP Solution Annual Conference 2024").first()
            if not existing_event:
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
            else:
                print("⏭️  Sample event already exists")
                sample_event = existing_event
            
            # 4. Tạo guests mẫu
            print("\n👥 Creating sample guests...")
            sample_guests_data = [
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
            for guest_data in sample_guests_data:
                existing_guest = Guest.query.filter_by(email=guest_data["email"]).first()
                if not existing_guest:
                    guest = Guest(**guest_data)
                    db.session.add(guest)
                    created_guests.append(guest)
                else:
                    created_guests.append(existing_guest)
            
            if any(guest.id is None for guest in created_guests):
                db.session.commit()
                print(f"✅ {len([g for g in created_guests if g.id is None])} new sample guests created")
            else:
                print("⏭️  Sample guests already exist")
            
            # 5. Tạo tokens cho guests
            print("\n🔑 Creating tokens for guests...")
            token_count = 0
            for guest in created_guests:
                existing_token = Token.query.filter_by(guest_id=guest.id).first()
                if not existing_token:
                    token = Token(
                        guest_id=guest.id,
                        token=secrets.token_urlsafe(32),
                        status="active"
                    )
                    db.session.add(token)
                    token_count += 1
            
            if token_count > 0:
                db.session.commit()
                print(f"✅ {token_count} new tokens created")
            else:
                print("⏭️  Tokens already exist for all guests")
            
            # 6. Hiển thị thống kê
            print("\n" + "="*50)
            print("🎉 Database initialization completed successfully!")
            print("="*50)
            
            # Thống kê
            user_count = User.query.count()
            event_count = Event.query.count()
            guest_count = Guest.query.count()
            token_count = Token.query.count()
            
            print("📊 Database Statistics:")
            print(f"  - Users: {user_count}")
            print(f"  - Events: {event_count}")
            print(f"  - Guests: {guest_count}")
            print(f"  - Tokens: {token_count}")
            
            print("\n🔐 Login Credentials:")
            print("  - Username: admin")
            print("  - Password: admin123")
            
            print("="*50)
            
        except Exception as e:
            print(f"❌ Database initialization failed: {e}")
            db.session.rollback()
            raise

if __name__ == "__main__":
    init_database()
