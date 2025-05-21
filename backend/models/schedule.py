from extensions import db
from datetime import datetime

class Schedule(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    term = db.Column(db.String(64), nullable=False)  # e.g., "Fall 2023"
    year = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    plan_id = db.Column(db.Integer, db.ForeignKey('plan.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    courses = db.Column(db.JSON)  # List of course IDs and additional information
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'term': self.term,
            'year': self.year,
            'userId': self.user_id,
            'planId': self.plan_id,
            'createdAt': self.created_at.isoformat() + 'Z' if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() + 'Z' if self.updated_at else None,
            'courses': self.courses
        }