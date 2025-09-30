from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from app.db.session import Base


class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    start_datetime = Column(DateTime, nullable=False, index=True)
    end_datetime = Column(DateTime, nullable=True)
    location = Column(String(255), nullable=True)
    address = Column(String(512), nullable=True)
    agenda = Column(Text, nullable=True)
    agenda_md = Column(Text, nullable=True)  # Markdown content
    timezone = Column(String(50), default="Asia/Ho_Chi_Minh")
    
    # Branding fields
    brand_logo_url = Column(String(1024), nullable=True)
    brand_primary_color = Column(String(7), nullable=True)  # #RRGGBB
    brand_accent_color = Column(String(7), nullable=True)   # #RRGGBB
    
    # Status and metadata
    status = Column(String(20), default="upcoming")  # upcoming/ongoing/completed/cancelled
    max_guests = Column(Integer, default=100)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    guests = relationship("Guest", back_populates="event", cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "start_datetime": self.start_datetime.isoformat() if self.start_datetime else None,
            "end_datetime": self.end_datetime.isoformat() if self.end_datetime else None,
            "location": self.location,
            "address": self.address,
            "agenda": self.agenda,
            "agenda_md": self.agenda_md,
            "timezone": self.timezone,
            "brand_logo_url": self.brand_logo_url,
            "brand_primary_color": self.brand_primary_color,
            "brand_accent_color": self.brand_accent_color,
            "status": self.status,
            "max_guests": self.max_guests,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
