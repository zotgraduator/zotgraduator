from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User
from extensions import db

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    """
    Get list of all users (for admin use only)
    Only accessible to the first registered user (admin)
    """
    current_user_id = get_jwt_identity()
    
    # Simple admin check - typically you'd have a proper role-based system
    # Here we're just assuming user ID 1 is admin
    if current_user_id != 1:
        return jsonify({"error": "Unauthorized. Admin access required"}), 403
        
    # Instead of returning all user details, just return count for security
    user_count = User.query.count()
    return jsonify({
        "message": "Access restricted in production mode",
        "user_count": user_count
    }), 200
