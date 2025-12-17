from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Transaction(db.Model):
    """Transaction model for economy app"""
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    date = db.Column(db.String(50), nullable=False)  # Stored as string for flexibility
    amount = db.Column(db.Float, nullable=False)  # Numeric amount (positive for income, negative for expense)
    amount_display = db.Column(db.String(50), nullable=False)  # Display string like "+12,500 kr"
    type = db.Column(db.String(20), nullable=False)  # 'income' or 'expense'
    category = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(50), nullable=False, default='Väntar')  # 'Bokförd', 'Väntar', 'Granskas'
    receipt = db.Column(db.Boolean, default=False)
    note = db.Column(db.Text, nullable=True, default='')
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'date': self.date,
            'amount': self.amount_display,
            'type': self.type,
            'category': self.category,
            'status': self.status,
            'receipt': self.receipt,
            'note': self.note,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Transaction {self.title} - {self.amount_display}>'


class Agreement(db.Model):
    """Agreement/Subscription model"""
    __tablename__ = 'agreements'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    provider = db.Column(db.String(200), nullable=False)
    cost = db.Column(db.Float, nullable=False)
    frequency = db.Column(db.String(50), nullable=False)  # 'Månadsvis', 'Kvartalsvis', 'Årligen'
    next_payment = db.Column(db.String(50), nullable=False)  # Date string
    status = db.Column(db.String(50), nullable=False, default='Aktiv')  # 'Aktiv', 'Uppsagd', 'Väntar på motpart'
    category = db.Column(db.String(100), nullable=False)
    icon = db.Column(db.String(10), nullable=True, default='📄')
    notice = db.Column(db.String(200), nullable=True, default='')
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'provider': self.provider,
            'cost': self.cost,
            'frequency': self.frequency,
            'nextPayment': self.next_payment,
            'status': self.status,
            'category': self.category,
            'icon': self.icon,
            'notice': self.notice,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Agreement {self.name} - {self.provider}>'


class Category(db.Model):
    """Category model for organizing transactions"""
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'name': self.name
        }
    
    def __repr__(self):
        return f'<Category {self.name}>'

