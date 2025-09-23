from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional
import pytz

from db import db
from werkzeug.security import generate_password_hash, check_password_hash

# Múi giờ +7 (Hanoi/Bangkok)
HANOI_TZ = pytz.timezone('Asia/Ho_Chi_Minh')

def get_hanoi_time():
    """Lấy thời gian hiện tại theo múi giờ +7 (Hanoi/Bangkok)"""
    return datetime.now(HANOI_TZ)


class Event(db.Model):
    __tablename__ = "events"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time, nullable=True)
    location = db.Column(db.String(255), nullable=True)
    venue_address = db.Column(db.String(512), nullable=True)
    venue_map_url = db.Column(db.String(1024), nullable=True)
    program_outline = db.Column(db.Text, nullable=True)  # JSON string [[time, item], ...]
    dress_code = db.Column(db.String(255), nullable=True)
    invitation_content = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default="upcoming")  # upcoming/ongoing/completed/cancelled
    max_guests = db.Column(db.Integer, default=100)
    created_at = db.Column(db.DateTime, default=get_hanoi_time)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "date": self.date.isoformat() if self.date else None,
            "time": self.time.isoformat() if self.time else None,
            "location": self.location,
            "venue_address": self.venue_address,
            "venue_map_url": self.venue_map_url,
            "program_outline": self.program_outline,
            "dress_code": self.dress_code,
            "invitation_content": self.invitation_content,
            "status": self.status,
            "max_guests": self.max_guests,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Guest(db.Model):
    __tablename__ = "guests"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    title = db.Column(db.String(20), nullable=True)  # Mr, Ms, Dr, etc.
    role = db.Column(db.String(255), nullable=True)  # CEO, Manager, etc.
    organization = db.Column(db.String(255), nullable=True)
    tag = db.Column(db.String(50), nullable=True)  # VIP, Regular, etc.
    email = db.Column(db.String(255), nullable=True, unique=True)
    phone = db.Column(db.String(50), nullable=True, unique=True)
    rsvp_status = db.Column(db.String(20), default="pending")  # pending/accepted/declined
    checkin_status = db.Column(db.String(20), default="not_arrived")  # not_arrived/arrived
    event_content = db.Column(db.Text, nullable=True)  # Nội dung sự kiện cho khách mời
    event_id = db.Column(db.Integer, db.ForeignKey("events.id", ondelete="CASCADE"), nullable=True)
    created_at = db.Column(db.DateTime, default=get_hanoi_time)
    
    # Relationship
    event = db.relationship("Event", backref=db.backref("guests", cascade="all, delete-orphan"))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "title": self.title,
            "role": self.role,
            "organization": self.organization,
            "tag": self.tag,
            "email": self.email,
            "phone": self.phone,
            "rsvp_status": self.rsvp_status,
            "checkin_status": self.checkin_status,
            "event_content": self.event_content,
            "event_id": self.event_id,
            "event_name": self.event.name if self.event else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Token(db.Model):
    __tablename__ = "tokens"
    id = db.Column(db.Integer, primary_key=True)
    guest_id = db.Column(db.Integer, db.ForeignKey("guests.id", ondelete="CASCADE"), nullable=False)
    token = db.Column(db.String(128), nullable=False, unique=True)
    status = db.Column(db.String(20), default="active")  # active/revoked
    created_at = db.Column(db.DateTime, default=get_hanoi_time)
    expires_at = db.Column(db.DateTime, nullable=True)  # Vĩnh viễn: không dùng hết hạn

    def is_expired(self):
        # Luôn hợp lệ: thiệp mời/QR không bao giờ hết hạn
        return False


class UserToken(db.Model):
    __tablename__ = "user_tokens"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    token = db.Column(db.String(128), nullable=False, unique=True)
    status = db.Column(db.String(20), default="active")  # active/revoked
    created_at = db.Column(db.DateTime, default=get_hanoi_time)
    expires_at = db.Column(db.DateTime, nullable=True)

    def is_expired(self):
        if self.expires_at is None:
            return False
        return datetime.now() > self.expires_at


class Checkin(db.Model):
    __tablename__ = "checkins"
    id = db.Column(db.Integer, primary_key=True)
    guest_id = db.Column(db.Integer, db.ForeignKey("guests.id", ondelete="CASCADE"), nullable=False)
    time = db.Column(db.DateTime, default=get_hanoi_time)
    gate = db.Column(db.String(50), nullable=True)
    staff = db.Column(db.String(100), nullable=True)


# --- Auth ---
class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=get_hanoi_time)

    @staticmethod
    def create_user(username: str, password: str, email: str | None = None) -> "User":
        user = User(
            username=username.strip(),
            email=(email.strip() if email else None),
            password_hash=generate_password_hash(password),
        )
        db.session.add(user)
        db.session.commit()
        return user

    def verify_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_public_dict(self) -> dict:
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

