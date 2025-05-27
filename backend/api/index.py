import sys
import os
from pathlib import Path

# Add the parent directory to the path so we can import the app
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

# Set environment variable to indicate we're running on Vercel
os.environ['VERCEL'] = '1'

# Import Flask app - must be after setting path
from app import create_app

# Create Flask app instance
app = create_app()

