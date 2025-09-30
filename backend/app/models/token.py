from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from app.db.session import Base


class Token(Base):
    __tablename__ = "tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    guest_id = Column(Integer, ForeignKey("guests.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(128), nullable=False, unique=True, index=True)
    status = Column(String(20), default="active", index=True)  # active/revoked
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    
    def is_expired(self):
        if self.expires_at is None:
            return False
        return datetime.utcnow() > self.expires_at
    
    def to_dict(self):
        return {
            "id": self.id,
            "guest_id": self.guest_id,
            "token": self.token,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None
        }


class UserToken(Base):
    __tablename__ = "user_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(128), nullable=False, unique=True, index=True)
    status = Column(String(20), default="active", index=True)  # active/revoked
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    
    def is_expired(self):
        if self.expires_at is None:
            return False
        return datetime.utcnow() > self.expires_at
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "token": self.token,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None
        }
