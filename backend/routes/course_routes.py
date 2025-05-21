from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.course import Course
from extensions import db

course_bp = Blueprint('course', __name__)

@course_bp.route('/', methods=['GET'])
def get_all_courses():
    """Get all courses"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    courses = Course.query.paginate(page=page, per_page=per_page)
    
    return jsonify({
        "courses": [course.to_dict() for course in courses.items],
        "total": courses.total,
        "pages": courses.pages,
        "current_page": courses.page
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
    ).limit(50).all()
    
    return jsonify({
        "results": [course.to_dict() for course in courses]
    }), 200

@course_bp.route('/prerequisites/<class_name>', methods=['GET'])
def get_prerequisites(class_name):
    """Get prerequisites for a course"""
    course = Course.query.filter_by(class_name=class_name).first()
    if not course:
        return jsonify({"error": "Course not found"}), 404
        
    return jsonify({
        "course": course.class_name,
        "prerequisites": course.parsed_prerequisites
    }), 200

@course_bp.route('/department/<department>', methods=['GET'])
def get_courses_by_department(department):
    """Get all courses in a department (e.g., COMPSCI)"""
    department = department.upper()
    courses = Course.query.filter(Course.class_name.startswith(f"{department} ")).all()
    
    return jsonify({
        "department": department,
        "courses": [course.to_dict() for course in courses]
    }), 200

# Admin routes - may want to move these to admin_routes.py
@course_bp.route('/', methods=['POST'])
@jwt_required()
def create_course():
    """Create a new course (admin only)"""
    current_user_id = get_jwt_identity()
    # Simple admin check - typically you'd have a proper role-based system
    if current_user_id != 1:  # Assuming user ID 1 is admin
        return jsonify({"error": "Unauthorized. Admin access required"}), 403
        
    data = request.get_json()
    
    # Check if course already exists
    if Course.query.filter_by(class_name=data['class_name']).first():
        return jsonify({"error": "Course already exists"}), 400
        
    # Create new course
    course = Course(
        class_name=data['class_name'],
        title=data['title'],
        description=data.get('description', ''),
        units=data.get('units'),
        parsed_prerequisites=data.get('parsed_prerequisites'),
        overlaps_with=data.get('overlaps_with'),
        same_as=data.get('same_as'),
        restriction=data.get('restriction', ''),
        grading_option=data.get('grading_option')
    )
    
    db.session.add(course)
    db.session.commit()
    
    return jsonify(course.to_dict()), 201

@course_bp.route('/<int:course_id>', methods=['PUT'])
@jwt_required()
def update_course(course_id):
    """Update a course (admin only)"""
    current_user_id = get_jwt_identity()
    # Simple admin check
    if current_user_id != 1:
        return jsonify({"error": "Unauthorized. Admin access required"}), 403
        
    course = Course.query.get(course_id)
    if not course:
        return jsonify({"error": "Course not found"}), 404
    
    data = request.get_json()
    
    # Update fields
    course.title = data.get('title', course.title)
    course.description = data.get('description', course.description)
    course.units = data.get('units', course.units)
    course.parsed_prerequisites = data.get('parsed_prerequisites', course.parsed_prerequisites)
    course.overlaps_with = data.get('overlaps_with', course.overlaps_with)
    course.same_as = data.get('same_as', course.same_as)
    course.restriction = data.get('restriction', course.restriction)
    course.grading_option = data.get('grading_option', course.grading_option)
    
    db.session.commit()
    
    return jsonify(course.to_dict()), 200

@course_bp.route('/<int:course_id>', methods=['DELETE'])
@jwt_required()
def delete_course(course_id):
    """Delete a course (admin only)"""
    current_user_id = get_jwt_identity()
    # Simple admin check
    if current_user_id != 1:
        return jsonify({"error": "Unauthorized. Admin access required"}), 403
        
    course = Course.query.get(course_id)
    if not course:
        return jsonify({"error": "Course not found"}), 404
    
    db.session.delete(course)
    db.session.commit()
    
    return jsonify({"message": "Course deleted successfully"}), 200
