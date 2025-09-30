import uuid
from app.seeds.base_seed import BaseSeed, register
from app.models.guest import Guest
from app.models.event import Event


@register
class SeedGuests(BaseSeed):
    order = 40
    
    def run(self, db):
        """Seed sample guests"""
        # Get the first event
        event = db.query(Event).first()
        if not event:
            print("No event found. Make sure events are seeded first.")
            return
        
        # Sample guests data
        guests_data = [
            {
                "full_name": "Nguyễn Văn Cường",
                "title": "Mr",
                "role": "CEO",
                "organization": "ABC Technology",
                "phone": "+84901234567",
                "email": "cuong.nguyen@abc.com",
                "group_tag": "VIP",
                "is_vip": True,
                "rsvp_status": "pending"
            },
            {
                "full_name": "Trần Thị Lan",
                "title": "Ms",
                "role": "Director",
                "organization": "XYZ Corporation",
                "phone": "+84901234568",
                "email": "lan.tran@xyz.com",
                "group_tag": "VIP",
                "is_vip": True,
                "rsvp_status": "accepted"
            },
            {
                "full_name": "Lê Minh Tuấn",
                "title": "Dr",
                "role": "CTO",
                "organization": "DEF Solutions",
                "phone": "+84901234569",
                "email": "tuan.le@def.com",
                "group_tag": "Partner",
                "is_vip": False,
                "rsvp_status": "pending"
            },
            {
                "full_name": "Phạm Thị Hương",
                "title": "Ms",
                "role": "Marketing Manager",
                "organization": "GHI Media",
                "phone": "+84901234570",
                "email": "huong.pham@ghi.com",
                "group_tag": "Media",
                "is_vip": False,
                "rsvp_status": "declined"
            },
            {
                "full_name": "Hoàng Văn Nam",
                "title": "Mr",
                "role": "Founder",
                "organization": "JKL Startup",
                "phone": "+84901234571",
                "email": "nam.hoang@jkl.com",
                "group_tag": "Partner",
                "is_vip": True,
                "rsvp_status": "accepted"
            }
        ]
        
        for guest_data in guests_data:
            # Check if guest already exists
            existing_guest = db.query(Guest).filter(
                Guest.email == guest_data["email"]
            ).first()
            
            if not existing_guest:
                # Generate unique QR code and invitation ID
                guest_data["qr_code"] = str(uuid.uuid4())
                guest_data["invitation_id"] = str(uuid.uuid4())
                guest_data["qr_token"] = str(uuid.uuid4())
                guest_data["event_id"] = event.id
                
                guest = Guest(**guest_data)
                db.add(guest)
                print(f"Created guest: {guest_data['full_name']}")
            else:
                print(f"Guest already exists: {guest_data['full_name']}")
        
        db.flush()
