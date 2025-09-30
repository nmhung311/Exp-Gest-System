from app.seeds.base_seed import BaseSeed, register
from app.models.user import User
from app.models.role import Role
from app.models.user_role import UserRole


@register
class SeedUsers(BaseSeed):
    order = 20
    
    def run(self, db):
        """Seed system users with admin role"""
        # Get admin role
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if not admin_role:
            print("Admin role not found. Make sure roles are seeded first.")
            return
        
        # Create admin user
        admin_user_data = {
            "username": "admin",
            "email": "admin@exp.com",
            "password": "admin123"  # Will be hashed in create_user
        }
        
        # Check if admin user already exists
        existing_user = db.query(User).filter(User.username == admin_user_data["username"]).first()
        if not existing_user:
            admin_user = User.create_user(
                username=admin_user_data["username"],
                password=admin_user_data["password"],
                email=admin_user_data["email"]
            )
            db.add(admin_user)
            db.flush()  # Flush to get user ID
            
            # Assign admin role
            user_role = UserRole(
                user_id=admin_user.id,
                role_id=admin_role.id
            )
            db.add(user_role)
            print(f"Created admin user: {admin_user_data['username']}")
        else:
            print(f"Admin user already exists: {admin_user_data['username']}")
        
        # Create manager user
        manager_role = db.query(Role).filter(Role.name == "manager").first()
        if manager_role:
            manager_user_data = {
                "username": "manager",
                "email": "manager@exp.com",
                "password": "manager123"
            }
            
            existing_manager = db.query(User).filter(User.username == manager_user_data["username"]).first()
            if not existing_manager:
                manager_user = User.create_user(
                    username=manager_user_data["username"],
                    password=manager_user_data["password"],
                    email=manager_user_data["email"]
                )
                db.add(manager_user)
                db.flush()
                
                # Assign manager role
                user_role = UserRole(
                    user_id=manager_user.id,
                    role_id=manager_role.id
                )
                db.add(user_role)
                print(f"Created manager user: {manager_user_data['username']}")
            else:
                print(f"Manager user already exists: {manager_user_data['username']}")
        
        db.flush()
