#!/usr/bin/env python3
"""
Script để sửa dữ liệu guests bị import với position và company = "None"
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db, Guest

def fix_imported_guest_data():
    """Sửa dữ liệu guests bị import với position và company = "None" """
    app = create_app()
    
    with app.app_context():
        try:
            # Lấy guests có position hoặc company = "None" hoặc None
            guests_with_none_position = Guest.query.filter(
                (Guest.position == "None") | (Guest.position.is_(None)) | (Guest.position == "")
            ).all()
            
            guests_with_none_company = Guest.query.filter(
                (Guest.company == "None") | (Guest.company.is_(None)) | (Guest.company == "")
            ).all()
            
            print(f"Guests có position rỗng: {len(guests_with_none_position)}")
            print(f"Guests có company rỗng: {len(guests_with_none_company)}")
            
            # Dữ liệu mapping dựa trên tag
            position_mapping = {
                'Hachitech': 'CEO',
                'EcomElite': 'CTO', 
                'ICTU': 'Giáo sư',
                'Gstar': 'Manager',
                'GTE': 'Director',
                'Dino': 'Developer',
                'SSE': 'Senior Developer',
                'ST': 'Tester',
                'Biva': 'Designer',
                'EXP': 'Founder',
                'hoangdung': 'VP',
                '': 'Employee'  # Default for empty tag
            }
            
            company_mapping = {
                'Hachitech': 'Công ty TNHH Hachitech Solution',
                'EcomElite': 'Công ty TNHH EcomElite',
                'ICTU': 'Trường Đại học Công nghệ Thông tin và Truyền thông Thái Nguyên',
                'Gstar': 'Công ty TNHH Gstar',
                'GTE': 'Công ty TNHH GTE',
                'Dino': 'Công ty TNHH Dino',
                'SSE': 'Công ty TNHH SSE',
                'ST': 'Công ty TNHH ST',
                'Biva': 'Công ty TNHH Biva',
                'EXP': 'Công ty TNHH EXP Technology',
                'hoangdung': 'Công ty TNHH Hoang Dung',
                '': 'Công ty TNHH Mặc định'  # Default for empty tag
            }
            
            updated_count = 0
            
            # Cập nhật position
            for guest in guests_with_none_position:
                if guest.tag in position_mapping:
                    guest.position = position_mapping[guest.tag]
                    updated_count += 1
                    print(f"Cập nhật {guest.name} (ID: {guest.id}): position = {guest.position}")
                else:
                    # Set to null if no mapping found
                    guest.position = None
                    updated_count += 1
                    print(f"Cập nhật {guest.name} (ID: {guest.id}): position = null")
            
            # Cập nhật company
            for guest in guests_with_none_company:
                if guest.tag in company_mapping:
                    guest.company = company_mapping[guest.tag]
                    updated_count += 1
                    print(f"Cập nhật {guest.name} (ID: {guest.id}): company = {guest.company}")
                else:
                    # Set to null if no mapping found
                    guest.company = None
                    updated_count += 1
                    print(f"Cập nhật {guest.name} (ID: {guest.id}): company = null")
            
            db.session.commit()
            print(f"\nĐã cập nhật {updated_count} guests thành công!")
            
            # Kiểm tra lại
            guests_with_position = Guest.query.filter(
                Guest.position.isnot(None), 
                Guest.position != '',
                Guest.position != "None"
            ).count()
            guests_with_company = Guest.query.filter(
                Guest.company.isnot(None), 
                Guest.company != '',
                Guest.company != "None"
            ).count()
            
            print(f"Sau khi cập nhật:")
            print(f"- Guests có position: {guests_with_position}")
            print(f"- Guests có company: {guests_with_company}")
            
        except Exception as e:
            print(f"Lỗi khi cập nhật dữ liệu: {e}")
            db.session.rollback()

if __name__ == "__main__":
    print("=== SỬA DỮ LIỆU GUEST BỊ IMPORT SAI ===")
    fix_imported_guest_data()
