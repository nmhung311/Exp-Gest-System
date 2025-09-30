from app.seeds.base_seed import BaseSeed, register
from app.models.role import Role


@register
class SeedRoles(BaseSeed):
    order = 10
    
    def run(self, db):
        """Seed roles: admin, manager, host"""
        roles_data = [
            {"name": "admin", "description": "System administrator with full access"},
            {"name": "manager", "description": "Event manager with event management permissions"},
            {"name": "host", "description": "Event host with guest management permissions"}
        ]
        
        for role_data in roles_data:
            # Check if role already exists
            existing_role = db.query(Role).filter(Role.name == role_data["name"]).first()
            if not existing_role:
                role = Role(**role_data)
                db.add(role)
                print(f"Created role: {role_data['name']}")
            else:
                print(f"Role already exists: {role_data['name']}")
        
        db.flush()  # Flush to get IDs
