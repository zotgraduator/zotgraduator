from flask import Flask, jsonify
from flask_cors import CORS
import os

from config import Config
from extensions import db, jwt
from routes.auth_routes import auth_bp
# Import admin_bp but don't register it in production mode
from routes.admin_routes import admin_bp
from routes.course_routes import course_bp
from routes.plan_routes import plan_bp
from routes.schedule_routes import schedule_bp

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    
    # Configure CORS properly
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000", "supports_credentials": True}})
    # CORS(app, resources={r"/api/*": {"origins": "https://sorts-converted-driven-lobby.trycloudflare.com", "supports_credentials": True}})
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(course_bp, url_prefix='/api/courses')
    app.register_blueprint(plan_bp, url_prefix='/api/plans')
    app.register_blueprint(schedule_bp, url_prefix='/api/schedules')
    
    # Only register admin blueprint in development mode with a secret
    if app.config.get('DEBUG') and os.environ.get('ENABLE_ADMIN') == 'true':
        app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
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
    
    with app.app_context():
        db.create_all()  # Create database tables if they don't exist
        
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
