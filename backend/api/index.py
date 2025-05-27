from http.server import BaseHTTPRequestHandler
import sys
import os
from pathlib import Path
from app import create_app

# Add the parent directory to the path so we can import the app
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

# Set environment variable to indicate we're running on Vercel
os.environ['VERCEL'] = '1'


# Create Flask app instance
app = create_app()

# Handler class for Vercel
class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write('Hello from Flask on Vercel!'.encode())
        return

# Function to handle requests via WSGI
def handler(event, context):
    return app

# For local testing
if __name__ == '__main__':
    app.run(debug=True)
