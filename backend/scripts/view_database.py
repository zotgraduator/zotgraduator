import sys
import os
import sqlite3
from tabulate import tabulate

# Add parent directory to path to be able to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import Config

def check_db_exists():
    """Check if the database file exists"""
    # Extract the database path from Config
    db_path = Config.SQLALCHEMY_DATABASE_URI.replace('sqlite:///', '')
    
    if not os.path.exists(db_path):
        print(f"Database file not found at: {db_path}")
        print("Please run 'python scripts/create_database.py' to create the database")
        return False
    return True

def view_users():
    """Display users in the database in a safe way"""
    # First check if database exists
    if not check_db_exists():
        return
    
    # Only allow this in development mode with correct environment variable
    if os.environ.get('FLASK_ENV') != 'development' or os.environ.get('ENABLE_DB_VIEW') != 'true':
        print("Database viewing is disabled in production mode.")
        print("Set FLASK_ENV=development and ENABLE_DB_VIEW=true to enable this feature.")
        return
    
    # Extract the database path from Config
    db_path = Config.SQLALCHEMY_DATABASE_URI.replace('sqlite:///', '')
    
    try:
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check user count rather than displaying details
        cursor.execute("SELECT COUNT(*) FROM user")
        count = cursor.fetchone()[0]
        
        print(f"\nDatabase contains {count} users.")
        print("For security reasons, individual user details are not displayed.")
        print("Use the application login functionality to test user accounts.")
        
        conn.close()
        
    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    view_users()
