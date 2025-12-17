import os
from pathlib import Path

# Get the base directory
BASE_DIR = Path(__file__).resolve().parent

class Config:
    """Base configuration class"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    # SQLite database configuration
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        f'sqlite:///{BASE_DIR / "instance" / "app.db"}'
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JSON configuration
    JSON_SORT_KEYS = False
    
    # Enable debug mode for development
    DEBUG = True

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    
class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    
class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

