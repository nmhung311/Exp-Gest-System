#!/usr/bin/env python3
"""
Script để monitor và cảnh báo khi có vấn đề với event_content
"""

import sys
import os
import time
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db, Guest

def monitor_event_content():
    """Monitor event_content và cảnh báo khi có vấn đề"""
    app = create_app()
    
    with app.app_context():
        try:
            print("=== MONITOR EVENT_CONTENT ===")
            print("Đang theo dõi dữ liệu event_content...")
            print("Nhấn Ctrl+C để dừng")
            
            last_check = {}
            
            while True:
                guests = Guest.query.all()
                current_check = {}
                
                for guest in guests:
                    has_content = bool(guest.event_content and guest.event_content.strip())
                    current_check[guest.id] = has_content
                    
                    # Kiểm tra nếu guest đã mất event_content
                    if guest.id in last_check and last_check[guest.id] and not has_content:
                        print(f"⚠️  CẢNH BÁO: Guest {guest.id} ({guest.name}) đã mất event_content!")
                        print(f"   Thời gian: {time.strftime('%Y-%m-%d %H:%M:%S')}")
                        print(f"   Nội dung cũ: '{guest.event_content}'")
                
                last_check = current_check
                
                # Hiển thị thống kê mỗi 30 giây
                guests_with_content = sum(1 for has_content in current_check.values() if has_content)
                total_guests = len(guests)
                
                print(f"[{time.strftime('%H:%M:%S')}] Guests có event_content: {guests_with_content}/{total_guests}")
                
                time.sleep(30)  # Kiểm tra mỗi 30 giây
                
        except KeyboardInterrupt:
            print("\nĐã dừng monitor.")
        except Exception as e:
            print(f"Lỗi khi monitor: {e}")

if __name__ == "__main__":
    monitor_event_content()
