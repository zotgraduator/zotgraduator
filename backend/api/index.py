import sys
import os
from pathlib import Path

# Add the parent directory to the path so we can import the app
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

from app import create_app

# Create Flask app
app = create_app()

# Vercel uses WSGI handler to serve the app
handler = app
