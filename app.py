import os
from flask import Flask, jsonify
from flask_cors import CORS
from models import db, Category
from backend_routes import economy_api
from config import config

def create_app(config_name=None):
    """Application factory pattern"""
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    app.config.from_object(config.get(config_name, config['default']))
    
    # Enable CORS with specific configuration for development
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "http://localhost:5173"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Initialize extensions
    db.init_app(app)
    
    # Register blueprints
    app.register_blueprint(economy_api)
    
    # Create database tables and seed default categories
    with app.app_context():
        # Create instance folder if it doesn't exist
        os.makedirs(os.path.join(app.instance_path), exist_ok=True)
        db.create_all()
        
        # Seed default categories if they don't exist
        default_categories = [
            "Nöje & Kultur",
            "IT & Programvara",
            "Inventarier",
            "Resor",
            "Kontorsmaterial",
            "Försäljning Tjänst",
            "Drivmedel",
            "Underhåll",
            "Försäkring",
            "Övrigt",
            "Representation"
        ]
        
        for cat_name in default_categories:
            if not Category.query.filter_by(name=cat_name).first():
                category = Category(name=cat_name)
                db.session.add(category)
        
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"Error seeding categories: {e}")
    
    # Root route
    @app.route('/')
    def index():
        return jsonify({
            'message': 'Welcome to WestBudget API',
            'version': '1.0',
            'endpoints': {
                'transactions': '/api/transactions',
                'agreements': '/api/agreements',
                'categories': '/api/categories',
                'stats': '/api/stats/overview'
            }
        }), 200
    
    # Health check endpoint
    @app.route('/health')
    def health():
        return jsonify({'status': 'healthy'}), 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)

