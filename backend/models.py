from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional
import pytz

from .db import db

# Múi giờ +7 (Hanoi/Bangkok)
HANOI_TZ = pytz.timezone('Asia/Ho_Chi_Minh')

def get_hanoi_time():
    """Lấy thời gian hiện tại theo múi giờ +7 (Hanoi/Bangkok)"""
    return datetime.now(HANOI_TZ)


class Event(db.Model):
    __tablename__ = "events"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time, nullable=True)
    location = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(20), default="upcoming")  # upcoming/ongoing/completed/cancelled
    max_guests = db.Column(db.Integer, default=100)
    created_at = db.Column(db.DateTime, default=get_hanoi_time)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "date": self.date.isoformat() if self.date else None,
            "time": self.time.isoformat() if self.time else None,
            "location": self.location,
            "status": self.status,
            "max_guests": self.max_guests,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Guest(db.Model):
    __tablename__ = "guests"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    title = db.Column(db.String(20), nullable=True)  # Mr, Ms, Dr, etc.
    position = db.Column(db.String(255), nullable=True)  # CEO, Manager, etc.
    company = db.Column(db.String(255), nullable=True)
    tag = db.Column(db.String(50), nullable=True)  # VIP, Regular, etc.
    email = db.Column(db.String(255), nullable=True, unique=True)
    phone = db.Column(db.String(50), nullable=True, unique=True)
    rsvp_status = db.Column(db.String(20), default="pending")  # pending/accepted/declined
    checkin_status = db.Column(db.String(20), default="not_arrived")  # not_arrived/arrived
    event_id = db.Column(db.Integer, db.ForeignKey("events.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=get_hanoi_time)
    
    # Relationship
    event = db.relationship("Event", backref="guests")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "title": self.title,
            "position": self.position,
            "company": self.company,
            "tag": self.tag,
            "email": self.email,
            "phone": self.phone,
            "rsvp_status": self.rsvp_status,
            "checkin_status": self.checkin_status,
            "event_id": self.event_id,
            "event_name": self.event.name if self.event else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Token(db.Model):
    __tablename__ = "tokens"
    id = db.Column(db.Integer, primary_key=True)
    guest_id = db.Column(db.Integer, db.ForeignKey("guests.id"), nullable=False)
    token = db.Column(db.String(128), nullable=False, unique=True)
    status = db.Column(db.String(20), default="active")  # active/revoked
    created_at = db.Column(db.DateTime, default=get_hanoi_time)
    expires_at = db.Column(db.DateTime, nullable=True)  # Vĩnh viễn: không dùng hết hạn

    def is_expired(self):
        # Luôn hợp lệ: thiệp mời/QR không bao giờ hết hạn
        return False


class Checkin(db.Model):
    __tablename__ = "checkins"
    id = db.Column(db.Integer, primary_key=True)
    guest_id = db.Column(db.Integer, db.ForeignKey("guests.id"), nullable=False)
    time = db.Column(db.DateTime, default=get_hanoi_time)
    gate = db.Column(db.String(50), nullable=True)
    staff = db.Column(db.String(100), nullable=True)


