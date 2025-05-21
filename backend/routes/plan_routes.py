from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.plan import Plan
from extensions import db

plan_bp = Blueprint('plan', __name__)

@plan_bp.route('/', methods=['POST'])
@jwt_required()
def create_plan():
    """Create a new academic plan"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    # Create new plan
    plan = Plan(
        name=data['name'],
        description=data.get('description', ''),
        start_year=data['startYear'],
        planned_years=data['plannedYears'],
        user_id=current_user_id,
        plan_data=data.get('planData', {})
    )
    
    db.session.add(plan)
    db.session.commit()
    
    return jsonify(plan.to_dict()), 201

@plan_bp.route('/', methods=['GET'])
@jwt_required()
def get_user_plans():
    """Get all plans for the current user"""
    current_user_id = get_jwt_identity()
    
    plans = Plan.query.filter_by(user_id=current_user_id).all()
    
    return jsonify({
        "plans": [plan.to_dict() for plan in plans]
    }), 200

@plan_bp.route('/<int:plan_id>', methods=['GET'])
@jwt_required()
def get_plan(plan_id):
    """Get a specific plan"""
    current_user_id = get_jwt_identity()
    
    plan = Plan.query.filter_by(id=plan_id, user_id=current_user_id).first()
    if not plan:
        return jsonify({"error": "Plan not found or unauthorized"}), 404
    
    return jsonify(plan.to_dict()), 200

@plan_bp.route('/<int:plan_id>', methods=['PUT'])
@jwt_required()
def update_plan(plan_id):
    """Update a plan"""
    current_user_id = get_jwt_identity()
    
    plan = Plan.query.filter_by(id=plan_id, user_id=current_user_id).first()
    if not plan:
        return jsonify({"error": "Plan not found or unauthorized"}), 404
    
    data = request.get_json()
    
    # Update fields
    plan.name = data.get('name', plan.name)
    plan.description = data.get('description', plan.description)
    plan.start_year = data.get('startYear', plan.start_year)
    plan.planned_years = data.get('plannedYears', plan.planned_years)
    plan.plan_data = data.get('planData', plan.plan_data)
    
    db.session.commit()
    
    return jsonify(plan.to_dict()), 200

@plan_bp.route('/<int:plan_id>', methods=['DELETE'])
@jwt_required()
def delete_plan(plan_id):
    """Delete a plan"""
    current_user_id = get_jwt_identity()
    
    plan = Plan.query.filter_by(id=plan_id, user_id=current_user_id).first()
    if not plan:
        return jsonify({"error": "Plan not found or unauthorized"}), 404
    
    db.session.delete(plan)
    db.session.commit()
    
    return jsonify({"message": "Plan deleted successfully"}), 200

@plan_bp.route('/validate', methods=['POST'])
@jwt_required(optional=True)
def validate_plan():
    """Validate a plan against graduation requirements"""
    data = request.get_json()
    
    # This would be a complex function that checks if a plan meets
    # all degree requirements. For now, return a mock response
    # In a real implementation, this might call another service or
    # run a complex algorithm
    
    mock_validation = {
        "valid": True,
        "missingRequirements": [],
        "suggestions": [
            "Consider adding an upper-division writing course",
            "You may need additional units to meet the minimum required for graduation"
        ]
    }
    
    return jsonify(mock_validation), 200

@plan_bp.route('/optimize', methods=['POST'])
@jwt_required(optional=True)
def optimize_plan():
    """Generate an optimized academic plan"""
    data = request.get_json()
    
    # This would generate an optimized plan based on constraints
    # For now, return a mock response
    
    mock_optimized_plan = {
        "planData": {
            "terms": [
                {
                    "term": "Fall 2023",
                    "courses": ["COMPSCI 161", "COMPSCI 171", "IN4MATX 115", "GEN ED"]
                },
                {
                    "term": "Winter 2024",
                    "courses": ["COMPSCI 122A", "COMPSCI 143A", "STATS 67", "GEN ED"]
                },
                {
                    "term": "Spring 2024",
                    "courses": ["COMPSCI 142A", "COMPSCI 145", "COMPSCI 132", "GEN ED"]
                }
            ]
        }
    }
    
    return jsonify(mock_optimized_plan), 200
