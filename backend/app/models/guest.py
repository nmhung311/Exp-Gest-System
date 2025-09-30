from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.session import Base


class Guest(Base):
    __tablename__ = "guests"
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(200), nullable=False, index=True)
    title = Column(String(20), nullable=True)  # Mr, Ms, Dr, etc.
    role = Column(String(255), nullable=True)  # CEO, Manager, etc.
    organization = Column(String(255), nullable=True, index=True)
    phone = Column(String(50), nullable=True, unique=True, index=True)
    email = Column(String(255), nullable=True, unique=True, index=True)
    
    # QR and invitation fields
    qr_code = Column(String(128), nullable=True, unique=True, index=True)
    invitation_id = Column(String(128), nullable=True, index=True)
    qr_token = Column(String(128), nullable=True, unique=True, index=True)
    
    # Grouping and VIP status
    group_tag = Column(String(50), nullable=True, index=True)  # VIP, Regular, Partner, Media, etc.
    is_vip = Column(Boolean, default=False, index=True)
    
    # RSVP and check-in
    rsvp_status = Column(String(20), default="pending", index=True)  # pending/accepted/declined
    checkin_at = Column(DateTime, nullable=True, index=True)
    
    # Event relationship
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Additional fields for invitation system
    notes = Column(Text, nullable=True)
    email_subject_last = Column(String(255), nullable=True)
    attach_file_name = Column(String(255), nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    event = relationship("Event", back_populates="guests")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('invitation_id', 'event_id', name='uq_guests_invitation_event'),
    )
    
    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "title": self.title,
            "role": self.role,
            "organization": self.organization,
            "phone": self.phone,
            "email": self.email,
            "qr_code": self.qr_code,
            "invitation_id": self.invitation_id,
            "qr_token": self.qr_token,
            "group_tag": self.group_tag,
            "is_vip": self.is_vip,
            "rsvp_status": self.rsvp_status,
            "checkin_at": self.checkin_at.isoformat() if self.checkin_at else None,
            "event_id": self.event_id,
            "notes": self.notes,
            "email_subject_last": self.email_subject_last,
            "attach_file_name": self.attach_file_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
