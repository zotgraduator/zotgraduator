from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.course import Course
from extensions import db

course_bp = Blueprint('course', __name__)

@course_bp.route('/', methods=['GET'])
def get_all_courses():
    """Get all courses"""
    courses = Course.query.all()
    return jsonify({
        "courses": [course.to_dict() for course in courses]
    }), 200

@course_bp.route('/<class_name>', methods=['GET'])
def get_course(class_name):
    """Get a single course by class name"""
    course = Course.query.filter_by(class_name=class_name).first()
    if not course:
        return jsonify({"error": "Course not found"}), 404
    
    return jsonify(course.to_dict()), 200

@course_bp.route('/search', methods=['GET'])
def search_courses():
    """Search for courses by query string"""
    query = request.args.get('q', '')
    if not query or len(query) < 2:
        return jsonify({"error": "Search query must be at least 2 characters"}), 400
    
    courses = Course.query.filter(
        (Course.class_name.ilike(f'%{query}%')) | 
        (Course.title.ilike(f'%{query}%'))
    ).all()
    
    return jsonify({
        "results": [course.to_dict() for course in courses]
    }), 200
