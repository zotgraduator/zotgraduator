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

# Vercel will look for the 'app' object by default for Flask applications.
# The custom handler below is likely not needed and might be causing the issue.
# # Very basic handler that just returns a text response
# def handler(request, context):
#     """Super simple handler function for debugging."""
#     return {
#         'statusCode': 200,
#         'body': 'Hello from Zotgraduator API',
#         'headers': {
#             'Content-Type': 'text/plain'
#         }    
#     }