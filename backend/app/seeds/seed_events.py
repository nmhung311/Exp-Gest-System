from datetime import datetime, timedelta
from app.seeds.base_seed import BaseSeed, register
from app.models.event import Event


@register
class SeedEvents(BaseSeed):
    order = 30
    
    def run(self, db):
        """Seed sample events"""
        # Create a sample event
        event_data = {
            "name": "Lễ kỷ niệm 15 năm thành lập EXP Technology",
            "start_datetime": datetime.utcnow() + timedelta(days=30),
            "end_datetime": datetime.utcnow() + timedelta(days=30, hours=4),
            "location": "Trung tâm Hội nghị Quốc gia",
            "address": "Số 1 Thăng Long, Nam Từ Liêm, Hà Nội",
            "agenda": "18:00 - Đón khách\n18:30 - Khai mạc\n19:00 - Tiệc buffet\n20:00 - Chương trình văn nghệ\n21:30 - Bế mạc",
            "agenda_md": """## Chương trình sự kiện

- **18:00** - Đón khách
- **18:30** - Khai mạc
- **19:00** - Tiệc buffet
- **20:00** - Chương trình văn nghệ
- **21:30** - Bế mạc""",
            "timezone": "Asia/Ho_Chi_Minh",
            "brand_logo_url": "https://example.com/logo.png",
            "brand_primary_color": "#1e40af",
            "brand_accent_color": "#3b82f6",
            "status": "upcoming",
            "max_guests": 200
        }
        
        # Check if event already exists
        existing_event = db.query(Event).filter(Event.name == event_data["name"]).first()
        if not existing_event:
            event = Event(**event_data)
            db.add(event)
            print(f"Created event: {event_data['name']}")
        else:
            print(f"Event already exists: {event_data['name']}")
        
        db.flush()
