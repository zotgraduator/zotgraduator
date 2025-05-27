import sys
import os
from pathlib import Path

# Add the parent directory to the path so we can import the app
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

# Set environment variable to indicate we're running on Vercel
os.environ['VERCEL'] = '1'

# Create a standard WSGI application that Vercel can use
def application(environ, start_response):
    # Import within the function to ensure path is set up first
    from app import create_app
    
    # Create Flask app
    app = create_app()
    
    # Let Flask handle the WSGI request
    return app.wsgi_app(environ, start_response)

# Vercel serverless function handler
def handler(environ, start_response):
    return application(environ, start_response)
