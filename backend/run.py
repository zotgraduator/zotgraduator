from app import create_app
from extensions import db
import os

app = create_app()

# Only create database tables when running locally, not on Vercel
if not os.environ.get('VERCEL'):
    with app.app_context():
        db.create_all()
        print("Database tables created/verified")

if __name__ == '__main__':
    app.run(debug=True)
