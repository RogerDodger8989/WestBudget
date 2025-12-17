from flask import Blueprint, request, jsonify
from models import db, Transaction, Agreement, Category
from sqlalchemy.exc import IntegrityError
from sqlalchemy import desc

# Create blueprint for economy app routes
economy_api = Blueprint('economy_api', __name__, url_prefix='/api')

# ============================================================================
# TRANSACTION ROUTES
# ============================================================================

@economy_api.route('/transactions', methods=['GET'])
def get_transactions():
    """Get all transactions"""
    transactions = Transaction.query.order_by(desc(Transaction.created_at)).all()
    return jsonify([t.to_dict() for t in transactions]), 200


@economy_api.route('/transactions/<int:transaction_id>', methods=['GET'])
def get_transaction(transaction_id):
    """Get a specific transaction by ID"""
    transaction = Transaction.query.get_or_404(transaction_id)
    return jsonify(transaction.to_dict()), 200


@economy_api.route('/transactions', methods=['POST'])
def create_transaction():
    """Create a new transaction"""
    data = request.get_json()
    
    required_fields = ['title', 'date', 'amount', 'amount_display', 'type', 'category']
    if not data or not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    transaction = Transaction(
        title=data['title'],
        date=data['date'],
        amount=data['amount'],
        amount_display=data['amount_display'],
        type=data['type'],
        category=data['category'],
        status=data.get('status', 'Väntar'),
        receipt=data.get('receipt', False),
        note=data.get('note', '')
    )
    
    db.session.add(transaction)
    db.session.commit()
    return jsonify(transaction.to_dict()), 201


@economy_api.route('/transactions/bulk', methods=['POST'])
def create_transactions_bulk():
    """Create multiple transactions at once (for import)"""
    data = request.get_json()
    
    if not data or 'transactions' not in data:
        return jsonify({'error': 'Missing transactions array'}), 400
    
    transactions_data = data['transactions']
    created_transactions = []
    
    for t_data in transactions_data:
        transaction = Transaction(
            title=t_data['title'],
            date=t_data['date'],
            amount=t_data.get('amount', 0),
            amount_display=t_data['amount'],
            type=t_data['type'],
            category=t_data['category'],
            status=t_data.get('status', 'Bokförd'),
            receipt=t_data.get('receipt', False),
            note=t_data.get('note', '')
        )
        db.session.add(transaction)
        created_transactions.append(transaction)
    
    db.session.commit()
    return jsonify([t.to_dict() for t in created_transactions]), 201


@economy_api.route('/transactions/<int:transaction_id>', methods=['PUT'])
def update_transaction(transaction_id):
    """Update a transaction"""
    transaction = Transaction.query.get_or_404(transaction_id)
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Update allowed fields
    if 'title' in data:
        transaction.title = data['title']
    if 'date' in data:
        transaction.date = data['date']
    if 'amount' in data:
        transaction.amount = data['amount']
    if 'amount_display' in data:
        transaction.amount_display = data['amount_display']
    if 'category' in data:
        transaction.category = data['category']
    if 'status' in data:
        transaction.status = data['status']
    if 'receipt' in data:
        transaction.receipt = data['receipt']
    if 'note' in data:
        transaction.note = data['note']
    
    db.session.commit()
    return jsonify(transaction.to_dict()), 200


@economy_api.route('/transactions/<int:transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    """Delete a transaction"""
    transaction = Transaction.query.get_or_404(transaction_id)
    db.session.delete(transaction)
    db.session.commit()
    return jsonify({'message': 'Transaction deleted successfully'}), 200


@economy_api.route('/transactions/category/<string:category>', methods=['GET'])
def get_transactions_by_category(category):
    """Get all transactions by category"""
    transactions = Transaction.query.filter_by(category=category).order_by(desc(Transaction.created_at)).all()
    return jsonify([t.to_dict() for t in transactions]), 200


# ============================================================================
# AGREEMENT ROUTES
# ============================================================================

@economy_api.route('/agreements', methods=['GET'])
def get_agreements():
    """Get all agreements"""
    agreements = Agreement.query.order_by(Agreement.name).all()
    return jsonify([a.to_dict() for a in agreements]), 200


@economy_api.route('/agreements/<int:agreement_id>', methods=['GET'])
def get_agreement(agreement_id):
    """Get a specific agreement by ID"""
    agreement = Agreement.query.get_or_404(agreement_id)
    return jsonify(agreement.to_dict()), 200


@economy_api.route('/agreements', methods=['POST'])
def create_agreement():
    """Create a new agreement"""
    data = request.get_json()
    
    required_fields = ['name', 'provider', 'cost', 'frequency', 'next_payment', 'category']
    if not data or not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    agreement = Agreement(
        name=data['name'],
        provider=data['provider'],
        cost=data['cost'],
        frequency=data['frequency'],
        next_payment=data['next_payment'],
        status=data.get('status', 'Aktiv'),
        category=data['category'],
        icon=data.get('icon', '📄'),
        notice=data.get('notice', '')
    )
    
    db.session.add(agreement)
    db.session.commit()
    return jsonify(agreement.to_dict()), 201


@economy_api.route('/agreements/<int:agreement_id>', methods=['PUT'])
def update_agreement(agreement_id):
    """Update an agreement"""
    agreement = Agreement.query.get_or_404(agreement_id)
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Update allowed fields
    if 'name' in data:
        agreement.name = data['name']
    if 'provider' in data:
        agreement.provider = data['provider']
    if 'cost' in data:
        agreement.cost = data['cost']
    if 'frequency' in data:
        agreement.frequency = data['frequency']
    if 'next_payment' in data:
        agreement.next_payment = data['next_payment']
    if 'status' in data:
        agreement.status = data['status']
    if 'category' in data:
        agreement.category = data['category']
    if 'icon' in data:
        agreement.icon = data['icon']
    if 'notice' in data:
        agreement.notice = data['notice']
    
    db.session.commit()
    return jsonify(agreement.to_dict()), 200


@economy_api.route('/agreements/<int:agreement_id>', methods=['DELETE'])
def delete_agreement(agreement_id):
    """Delete an agreement"""
    agreement = Agreement.query.get_or_404(agreement_id)
    db.session.delete(agreement)
    db.session.commit()
    return jsonify({'message': 'Agreement deleted successfully'}), 200


# ============================================================================
# CATEGORY ROUTES
# ============================================================================

@economy_api.route('/categories', methods=['GET'])
def get_categories():
    """Get all categories"""
    categories = Category.query.order_by(Category.name).all()
    return jsonify([c.to_dict() for c in categories]), 200


@economy_api.route('/categories', methods=['POST'])
def create_category():
    """Create a new category"""
    data = request.get_json()
    
    if not data or 'name' not in data:
        return jsonify({'error': 'Category name is required'}), 400
    
    try:
        category = Category(name=data['name'])
        db.session.add(category)
        db.session.commit()
        return jsonify(category.to_dict()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Category already exists'}), 409


@economy_api.route('/categories/<int:category_id>', methods=['DELETE'])
def delete_category(category_id):
    """Delete a category"""
    category = Category.query.get_or_404(category_id)
    db.session.delete(category)
    db.session.commit()
    return jsonify({'message': 'Category deleted successfully'}), 200


# ============================================================================
# STATISTICS & REPORTS ROUTES
# ============================================================================

@economy_api.route('/stats/overview', methods=['GET'])
def get_stats_overview():
    """Get overview statistics"""
    transactions = Transaction.query.all()
    
    total_income = sum(t.amount for t in transactions if t.type == 'income')
    total_expenses = sum(abs(t.amount) for t in transactions if t.type == 'expense')
    net_amount = total_income - total_expenses
    
    # Agreements stats
    agreements = Agreement.query.filter_by(status='Aktiv').all()
    monthly_cost = sum(a.cost for a in agreements if a.frequency == 'Månadsvis')
    
    return jsonify({
        'total_income': total_income,
        'total_expenses': total_expenses,
        'net_amount': net_amount,
        'monthly_agreements_cost': monthly_cost,
        'active_agreements': len(agreements),
        'transaction_count': len(transactions)
    }), 200


@economy_api.route('/stats/categories', methods=['GET'])
def get_category_stats():
    """Get expense breakdown by category"""
    transactions = Transaction.query.filter_by(type='expense').all()
    
    category_totals = {}
    for t in transactions:
        if t.category in category_totals:
            category_totals[t.category] += abs(t.amount)
        else:
            category_totals[t.category] = abs(t.amount)
    
    return jsonify(category_totals), 200

