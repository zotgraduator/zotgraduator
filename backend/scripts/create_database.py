import sys
import os

# Add parent directory to path to be able to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from extensions import db
from models.user import User

def init_database():
    """Initialize the database and create tables"""
    print("Initializing database...")
    
    try:
        app = create_app()
        
        with app.app_context():
            # Create all tables
            db.create_all()
            print("Created tables")
            
            # Create a test admin user
            admin = User(
                username="admin",
                email="admin@example.com", 
                first_name="Admin",
                last_name="User",
                major="Computer Science",
                year="Senior"
            )
            admin.set_password("adminpass")
            db.session.add(admin)
            
            # Create a regular test user
            test_user = User(
                username="testuser",
                email="test@example.com",
                first_name="Test",
                last_name="User",
                major="Informatics",
                year="Junior"
            )
            test_user.set_password("testpass")
            db.session.add(test_user)
            
            # Commit changes
            db.session.commit()
            print("Added test users to database")
            
            print("Database initialization complete!")
            print("\nTest Users:")
            print("-----------")
            print("Admin User:")
            print("  Username: admin")
            print("  Email: admin@example.com")
            print("  Password: adminpass")
            print("\nRegular User:")
            print("  Username: testuser")
            print("  Email: test@example.com")
            print("  Password: testpass")
            
    except Exception as e:
        print(f"Error initializing database: {str(e)}")

if __name__ == "__main__":
    init_database()
