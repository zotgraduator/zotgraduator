# Import Flask app
from app import create_app
import sys
import os
from pathlib import Path

# Add the parent directory to the path so we can import the app
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

# Set environment variable to indicate we're running on Vercel
os.environ['VERCEL'] = '1'

# Create Flask app instance once when the module loads
app = create_app()

# Define handler for Vercel - this is the standard WSGI handler
def handler(environ, start_response):
    return app.wsgi_app(environ, start_response)
