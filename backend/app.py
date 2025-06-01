from flask import Flask, jsonify
from flask_cors import CORS
import os

from config import Config
from extensions import db, jwt
from routes.auth_routes import auth_bp
from routes.course_routes import course_bp
from routes.plan_routes import plan_bp
from routes.schedule_routes import schedule_bp

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    
    # Configure CORS for frontend
    CORS(app, resources={r"/api/*": {"origins": "*", "supports_credentials": True}})
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(course_bp, url_prefix='/api/courses')
    app.register_blueprint(plan_bp, url_prefix='/api/plans')
    app.register_blueprint(schedule_bp, url_prefix='/api/schedules')
    
    # Create a route to check if the API is running
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({"status": "API is running!"}), 200
        
    # Handle JWT errors
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({"message": "Token has expired", "error": "token_expired"}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({"message": "Signature verification failed", "error": "invalid_token"}), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({"message": "Request does not contain an access token", 
                      "error": "authorization_required"}), 401
    
    # Handle CORS preflight requests
    @app.route('/api/preflight', methods=['OPTIONS'])
    def preflight():
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', '*')
        response.headers.add('Access-Control-Allow-Methods', '*')
        return response, 200
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
