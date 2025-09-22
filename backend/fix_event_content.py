#!/usr/bin/env python3
"""
Script để kiểm tra và khôi phục dữ liệu event_content bị mất
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db, Guest

def check_and_fix_event_content():
    """Kiểm tra và khôi phục dữ liệu event_content"""
    app = create_app()
    
    with app.app_context():
        try:
            # Lấy tất cả guests
            guests = Guest.query.all()
            print(f"=== KIỂM TRA DỮ LIỆU EVENT_CONTENT ===")
            print(f"Tổng số guests: {len(guests)}")
            
            # Đếm guests có event_content
            guests_with_content = [g for g in guests if g.event_content and g.event_content.strip()]
            guests_without_content = [g for g in guests if not g.event_content or not g.event_content.strip()]
            
            print(f"Guests có event_content: {len(guests_with_content)}")
            print(f"Guests không có event_content: {len(guests_without_content)}")
            
            if guests_without_content:
                print(f"\n=== DANH SÁCH GUESTS KHÔNG CÓ EVENT_CONTENT ===")
                for guest in guests_without_content[:10]:  # Hiển thị 10 guests đầu tiên
                    print(f"  Guest {guest.id}: {guest.name} ({guest.organization or 'N/A'})")
                
                if len(guests_without_content) > 10:
                    print(f"  ... và {len(guests_without_content) - 10} guests khác")
            
            # Đề xuất nội dung mặc định cho guests không có event_content
            default_content = """Kính mời quý khách đến tham dự sự kiện đặc biệt của chúng tôi.

Thời gian: [Thời gian sự kiện]
Địa điểm: [Địa điểm sự kiện]

Chúng tôi rất mong được đón tiếp quý khách tại sự kiện này.

Trân trọng,
Ban tổ chức"""
            
            print(f"\n=== ĐỀ XUẤT KHÔI PHỤC ===")
            print(f"Nội dung mặc định:")
            print(f'"{default_content}"')
            
            # Hỏi người dùng có muốn khôi phục không
            response = input(f"\nBạn có muốn khôi phục event_content cho {len(guests_without_content)} guests không? (y/n): ")
            
            if response.lower() in ['y', 'yes', 'có']:
                updated_count = 0
                for guest in guests_without_content:
                    guest.event_content = default_content
                    updated_count += 1
                    print(f"Đã khôi phục event_content cho guest {guest.id} ({guest.name})")
                
                db.session.commit()
                print(f"\n✅ Đã khôi phục event_content cho {updated_count} guests thành công!")
                
                # Kiểm tra lại
                guests_after = Guest.query.all()
                guests_with_content_after = [g for g in guests_after if g.event_content and g.event_content.strip()]
                print(f"Sau khi khôi phục: {len(guests_with_content_after)}/{len(guests_after)} guests có event_content")
            else:
                print("Không thực hiện khôi phục.")
            
        except Exception as e:
            print(f"Lỗi khi kiểm tra/khôi phục dữ liệu: {e}")
            db.session.rollback()

if __name__ == "__main__":
    print("=== KIỂM TRA VÀ KHÔI PHỤC EVENT_CONTENT ===")
    check_and_fix_event_content()
