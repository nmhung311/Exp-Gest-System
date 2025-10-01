#!/usr/bin/env python3
"""
Script để import khách từ Google Sheets vào database
"""

import csv
import requests
import sys
import os
from datetime import datetime

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app import create_app
from models import db, Guest, Event, Token
import secrets

# Google Sheets URL
CSV_URL = "https://docs.google.com/spreadsheets/d/1r489l9sbIdbuEeRw0FT-vknamclIkkDmc-h1QMEVvbA/export?format=csv&gid=0"

def fetch_guest_csv(url: str):
    """Lấy dữ liệu CSV từ Google Sheets"""
    resp = requests.get(url)
    resp.raise_for_status()
    resp.encoding = 'utf-8'
    return resp.text

def parse_csv_data(csv_text: str):
    """Parse dữ liệu CSV thành danh sách khách"""
    lines = csv_text.splitlines()
    if len(lines) < 1:
        return []
    
    # Tìm dòng header
    header_line = 0
    for i, line in enumerate(lines[:3]):
        if 'name' in line.lower() or 'title' in line.lower():
            header_line = i
            break
    
    reader = csv.DictReader(lines[header_line:])
    guests = []
    
    for row in reader:
        # Lọc dòng trống
        has_data = False
        for key, value in row.items():
            if value:
                if isinstance(value, list):
                    value = ' '.join(str(v) for v in value if v)
                if str(value).strip():
                    has_data = True
                    break
        
        if has_data:
            guests.append(row)
    
    return guests

def map_guest_data(row):
    """Map dữ liệu từ CSV sang format database"""
    # Xử lý encoding issues
    def clean_text(text):
        if not text:
            return None
        # Fix common encoding issues
        text = str(text)
        text = text.replace('Ã¡', 'á').replace('Ã ', 'à').replace('Ã¢', 'â')
        text = text.replace('Ã£', 'ã').replace('Ã¤', 'ä').replace('Ã¥', 'å')
        text = text.replace('Ã¦', 'æ').replace('Ã§', 'ç').replace('Ã¨', 'è')
        text = text.replace('Ã©', 'é').replace('Ãª', 'ê').replace('Ã«', 'ë')
        text = text.replace('Ã¬', 'ì').replace('Ã­', 'í').replace('Ã®', 'î')
        text = text.replace('Ã¯', 'ï').replace('Ã°', 'ð').replace('Ã±', 'ñ')
        text = text.replace('Ã²', 'ò').replace('Ã³', 'ó').replace('Ã´', 'ô')
        text = text.replace('Ãµ', 'õ').replace('Ã¶', 'ö').replace('Ã·', '÷')
        text = text.replace('Ã¸', 'ø').replace('Ã¹', 'ù').replace('Ãº', 'ú')
        text = text.replace('Ã»', 'û').replace('Ã¼', 'ü').replace('Ã½', 'ý')
        text = text.replace('Ã¾', 'þ').replace('Ã¿', 'ÿ')
        return text.strip() if text.strip() else None
    
    # Map các trường
    name = clean_text(row.get('Name'))
    title = clean_text(row.get('ttitle'))
    role = clean_text(row.get('Role'))
    organization = clean_text(row.get('Organization'))
    tag = clean_text(row.get('tags'))
    host = clean_text(row.get('host'))
    message = clean_text(row.get('message'))
    
    return {
        'name': name,
        'title': title,
        'role': role,
        'organization': organization,
        'tag': tag,
        'host': host,
        'message': message
    }

def import_guests_to_database(guests_data, event_id=1):
    """Import danh sách khách vào database"""
    app = create_app()
    
    with app.app_context():
        try:
            # Kiểm tra event có tồn tại không
            event = Event.query.get(event_id)
            if not event:
                print(f"❌ Event với ID {event_id} không tồn tại")
                return False
            
            print(f"📋 Importing guests to event: {event.name}")
            print(f"📅 Event date: {event.date}")
            print("-" * 50)
            
            imported_count = 0
            skipped_count = 0
            error_count = 0
            
            for i, guest_data in enumerate(guests_data, 1):
                try:
                    # Map dữ liệu
                    mapped_data = map_guest_data(guest_data)
                    
                    if not mapped_data['name']:
                        print(f"⏭️  Row {i}: Bỏ qua - không có tên")
                        skipped_count += 1
                        continue
                    
                    # Kiểm tra khách đã tồn tại chưa
                    existing_guest = Guest.query.filter_by(
                        name=mapped_data['name'],
                        event_id=event_id
                    ).first()
                    
                    if existing_guest:
                        print(f"⏭️  Row {i}: Bỏ qua - {mapped_data['name']} đã tồn tại")
                        skipped_count += 1
                        continue
                    
                    # Tạo khách mới
                    guest = Guest(
                        name=mapped_data['name'],
                        title=mapped_data['title'],
                        role=mapped_data['role'],
                        organization=mapped_data['organization'],
                        tag=mapped_data['tag'],
                        host=mapped_data['host'],
                        event_id=event_id,
                        rsvp_status='pending',
                        created_at=datetime.now()
                    )
                    
                    db.session.add(guest)
                    db.session.flush()  # Để lấy ID
                    
                    # Tạo token cho khách
                    token = Token(
                        guest_id=guest.id,
                        token=secrets.token_urlsafe(32),
                        status='active'
                    )
                    db.session.add(token)
                    
                    print(f"✅ Row {i}: Imported {mapped_data['name']} - {mapped_data['title']} {mapped_data['role']}")
                    imported_count += 1
                    
                except Exception as e:
                    print(f"❌ Row {i}: Lỗi - {str(e)}")
                    error_count += 1
                    continue
            
            # Commit tất cả thay đổi
            db.session.commit()
            
            print("-" * 50)
            print(f"🎉 Import completed!")
            print(f"✅ Imported: {imported_count} guests")
            print(f"⏭️  Skipped: {skipped_count} guests")
            print(f"❌ Errors: {error_count} guests")
            print(f"📊 Total processed: {len(guests_data)} rows")
            
            return True
            
        except Exception as e:
            print(f"❌ Database error: {str(e)}")
            db.session.rollback()
            return False

def main():
    """Main function"""
    print("🚀 Starting guest import from Google Sheets...")
    print("=" * 60)
    
    try:
        # Lấy dữ liệu từ Google Sheets
        print("📥 Fetching data from Google Sheets...")
        csv_text = fetch_guest_csv(CSV_URL)
        guests_data = parse_csv_data(csv_text)
        
        if not guests_data:
            print("❌ No guest data found")
            return False
        
        print(f"📋 Found {len(guests_data)} guests in Google Sheets")
        print("-" * 60)
        
        # Import vào database
        success = import_guests_to_database(guests_data, event_id=1)
        
        if success:
            print("=" * 60)
            print("🎉 Guest import completed successfully!")
            return True
        else:
            print("=" * 60)
            print("❌ Guest import failed!")
            return False
            
    except Exception as e:
        print(f"❌ Import error: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
