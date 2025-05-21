from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.schedule import Schedule
from extensions import db

schedule_bp = Blueprint('schedule', __name__)

@schedule_bp.route('/', methods=['POST'])
@jwt_required()
def create_schedule():
    """Create a new course schedule"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    # Create new schedule
    schedule = Schedule(
        name=data['name'],
        term=data['term'],
        year=data['year'],
        user_id=current_user_id,
        plan_id=data.get('planId'),
        courses=data.get('courses', [])
    )
    
    db.session.add(schedule)
    db.session.commit()
    
    return jsonify(schedule.to_dict()), 201

@schedule_bp.route('/', methods=['GET'])
@jwt_required()
def get_user_schedules():
    """Get all schedules for the current user"""
    current_user_id = get_jwt_identity()
    
    schedules = Schedule.query.filter_by(user_id=current_user_id).all()
    
    return jsonify({
        "schedules": [schedule.to_dict() for schedule in schedules]
    }), 200

@schedule_bp.route('/plan/<int:plan_id>', methods=['GET'])
@jwt_required()
def get_schedules_for_plan(plan_id):
    """Get all schedules for a specific plan"""
    current_user_id = get_jwt_identity()
    
    schedules = Schedule.query.filter_by(user_id=current_user_id, plan_id=plan_id).all()
    
    return jsonify({
        "schedules": [schedule.to_dict() for schedule in schedules]
    }), 200

@schedule_bp.route('/<int:schedule_id>', methods=['GET'])
@jwt_required()
def get_schedule(schedule_id):
    """Get a specific schedule"""
    current_user_id = get_jwt_identity()
    
    schedule = Schedule.query.filter_by(id=schedule_id, user_id=current_user_id).first()
    if not schedule:
        return jsonify({"error": "Schedule not found or unauthorized"}), 404
    
    return jsonify(schedule.to_dict()), 200

@schedule_bp.route('/<int:schedule_id>', methods=['PUT'])
@jwt_required()
def update_schedule(schedule_id):
    """Update a schedule"""
    current_user_id = get_jwt_identity()
    
    schedule = Schedule.query.filter_by(id=schedule_id, user_id=current_user_id).first()
    if not schedule:
        return jsonify({"error": "Schedule not found or unauthorized"}), 404
    
    data = request.get_json()
    
    # Update fields
    schedule.name = data.get('name', schedule.name)
    schedule.term = data.get('term', schedule.term)
    schedule.year = data.get('year', schedule.year)
    schedule.courses = data.get('courses', schedule.courses)
    
    db.session.commit()
    
    return jsonify(schedule.to_dict()), 200

@schedule_bp.route('/<int:schedule_id>', methods=['DELETE'])
@jwt_required()
def delete_schedule(schedule_id):
    """Delete a schedule"""
    current_user_id = get_jwt_identity()
    
    schedule = Schedule.query.filter_by(id=schedule_id, user_id=current_user_id).first()
    if not schedule:
        return jsonify({"error": "Schedule not found or unauthorized"}), 404
    
    db.session.delete(schedule)
    db.session.commit()
    
    return jsonify({"message": "Schedule deleted successfully"}), 200

@schedule_bp.route('/validate', methods=['POST'])
@jwt_required(optional=True)
def validate_schedule():
    """Validate a schedule for conflicts"""
    data = request.get_json()
    
    # This would check for time conflicts, prerequisite issues, etc.
    # For now, return a mock response
    
    mock_validation = {
        "valid": True,
        "conflicts": [],
        "warnings": [
            "COMPSCI 161 and COMPSCI 171 are both high workload courses"
        ]
    }
    
    return jsonify(mock_validation), 200

@schedule_bp.route('/optimize', methods=['POST'])
@jwt_required(optional=True)
def optimize_schedule():
    """Generate an optimized course schedule"""
    data = request.get_json()
    
    # This would generate an optimized schedule based on constraints
    # For now, return a mock response
    
    mock_optimized_schedule = {
        "courses": [
            {"id": "COMPSCI 161", "time": "MWF 10:00-10:50", "location": "DBH 1100", "instructor": "Prof. Smith"},
            {"id": "COMPSCI 171", "time": "TuTh 11:00-12:20", "location": "ICS 174", "instructor": "Prof. Jones"},
            {"id": "IN4MATX 115", "time": "MW 3:30-4:50", "location": "PSCB 140", "instructor": "Prof. Garcia"},
            {"id": "WRITING 39C", "time": "TuTh 8:00-9:20", "location": "HH 105", "instructor": "Prof. Wilson"}
        ]
    }
    
    return jsonify(mock_optimized_schedule), 200
