from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.session import Base


class UserRole(Base):
    __tablename__ = "user_roles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="roles")
    role = relationship("Role", back_populates="users")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('user_id', 'role_id', name='uq_user_roles_user_role'),
    )
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "role_id": self.role_id,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
