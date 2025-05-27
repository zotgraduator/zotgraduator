import sys
import os

# Add the parent directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app

# Create the Flask app - simplified for serverless
app = create_app()

# This is for Vercel serverless deployment
handler = app
