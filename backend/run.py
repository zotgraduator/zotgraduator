from app import create_app
from extensions import db

app = create_app()

# Ensure database tables exist
with app.app_context():
    db.create_all()
    print("Database tables created/verified")

if __name__ == '__main__':
    app.run(debug=True)
