import os
import sqlite3
import zipfile
import shutil
import tempfile
from datetime import datetime
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename

# Configuration
DATABASE = 'westbudget.db'
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif'}

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Enable CORS for Electron/React frontend
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5100", "http://192.168.1.232:5100", "http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        "supports_credentials": True,
        "expose_headers": ["Content-Type", "Content-Disposition"]
    }
}, supports_credentials=True)

# Add CORS headers manually for all routes as fallback (only if not already set by Flask-CORS)
@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    allowed_origins = ["http://localhost:5100", "http://192.168.1.232:5100", "http://localhost:3000"]
    
    # Only add headers if they don't already exist (to avoid duplicates)
    if 'Access-Control-Allow-Origin' not in response.headers:
        if origin in allowed_origins:
            response.headers['Access-Control-Allow-Origin'] = origin
    
    if 'Access-Control-Allow-Headers' not in response.headers:
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,X-Requested-With'
    
    if 'Access-Control-Allow-Methods' not in response.headers:
        response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS,PATCH'
    
    if 'Access-Control-Allow-Credentials' not in response.headers:
        response.headers['Access-Control-Allow-Credentials'] = 'true'
    
    # Expose headers for file downloads
    if 'Access-Control-Expose-Headers' not in response.headers:
        response.headers['Access-Control-Expose-Headers'] = 'Content-Type,Content-Disposition'
    
    return response

# Ensure upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ============================================================================
# DATABASE INITIALIZATION
# ============================================================================

def init_db():
    """Initialize database from schema.sql if it doesn't exist"""
    db_exists = os.path.exists(DATABASE)
    
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    if not db_exists:
        print("🗄️  Initializing database...")
        with open('schema.sql', 'r', encoding='utf-8') as f:
            conn.executescript(f.read())
        conn.commit()
        print("✅ Database initialized successfully!")
    else:
        # Check and add missing columns to existing database
        cursor.execute("PRAGMA table_info(agreements)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'start_date' not in columns:
            print("⚠️  Adding start_date column to agreements table...")
            cursor.execute('ALTER TABLE agreements ADD COLUMN start_date TEXT')
            conn.commit()
        
        if 'end_date' not in columns:
            print("⚠️  Adding end_date column to agreements table...")
            cursor.execute('ALTER TABLE agreements ADD COLUMN end_date TEXT')
            conn.commit()
        
        # Check if saved_searches table exists, if not create it
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='saved_searches'")
        if not cursor.fetchone():
            print("⚠️  Creating saved_searches table...")
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS saved_searches (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    query TEXT DEFAULT '',
                    filters TEXT DEFAULT '{}',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            conn.commit()
        
        # Check if vehicles table exists, if not create it
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='vehicles'")
        if not cursor.fetchone():
            print("⚠️  Creating vehicles table...")
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS vehicles (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    registration_number TEXT UNIQUE NOT NULL,
                    make_model TEXT NOT NULL,
                    odometer INTEGER DEFAULT 0,
                    next_inspection TEXT,
                    insurance_company TEXT,
                    insurance_type TEXT,
                    status TEXT NOT NULL DEFAULT 'Aktiv' CHECK(status IN ('Aktiv', 'Inaktiv', 'Såld')),
                    category TEXT DEFAULT 'Personbil',
                    note TEXT DEFAULT '',
                    images TEXT DEFAULT '[]',
                    agreement_id INTEGER,
                    next_service_odometer INTEGER,
                    next_service_date TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (agreement_id) REFERENCES agreements(id)
                )
            ''')
            conn.commit()
        
        # Check if vehicle_expenses table exists, if not create it
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='vehicle_expenses'")
        if not cursor.fetchone():
            print("⚠️  Creating vehicle_expenses table...")
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS vehicle_expenses (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    vehicle_id INTEGER NOT NULL,
                    category TEXT NOT NULL,
                    amount REAL NOT NULL,
                    date TEXT NOT NULL,
                    description TEXT DEFAULT '',
                    receipt_path TEXT,
                    note TEXT DEFAULT '',
                    odometer_at_purchase INTEGER,
                    transaction_id INTEGER, -- Link to transactions table
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
                    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
                )
            ''')
            conn.commit()
        else:
            # Check if transaction_id column exists, if not add it
            cursor.execute("PRAGMA table_info(vehicle_expenses)")
            columns = [col[1] for col in cursor.fetchall()]
            if 'transaction_id' not in columns:
                print("⚠️  Adding transaction_id column to vehicle_expenses table...")
                cursor.execute('ALTER TABLE vehicle_expenses ADD COLUMN transaction_id INTEGER')
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_transaction_id ON vehicle_expenses(transaction_id)')
                conn.commit()
        
        # Check if loans tables exist, if not create them
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='loans'")
        if not cursor.fetchone():
            print("⚠️  Creating loans table...")
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS loans (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    lender TEXT NOT NULL,
                    principal_amount REAL NOT NULL,
                    current_balance REAL NOT NULL,
                    interest_rate REAL NOT NULL,
                    monthly_payment REAL NOT NULL,
                    amortization_amount REAL NOT NULL,
                    interest_amount REAL NOT NULL,
                    start_date TEXT NOT NULL,
                    end_date TEXT,
                    status TEXT NOT NULL DEFAULT 'Aktiv' CHECK(status IN ('Aktiv', 'Avslutat', 'Pausad')),
                    category TEXT DEFAULT 'Bolån',
                    note TEXT DEFAULT '',
                    agreement_id INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (agreement_id) REFERENCES agreements(id) ON DELETE SET NULL
                )
            ''')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_loans_agreement_id ON loans(agreement_id)')
            conn.commit()
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='loan_payments'")
        if not cursor.fetchone():
            print("⚠️  Creating loan_payments table...")
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS loan_payments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    loan_id INTEGER NOT NULL,
                    transaction_id INTEGER,
                    payment_date TEXT NOT NULL,
                    amount REAL NOT NULL,
                    principal_paid REAL NOT NULL,
                    interest_paid REAL NOT NULL,
                    extra_payment REAL DEFAULT 0,
                    note TEXT DEFAULT '',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
                    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
                )
            ''')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_loan_payments_loan_id ON loan_payments(loan_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_loan_payments_transaction_id ON loan_payments(transaction_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_loan_payments_date ON loan_payments(payment_date)')
            conn.commit()
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='loan_interest_periods'")
        if not cursor.fetchone():
            print("⚠️  Creating loan_interest_periods table...")
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS loan_interest_periods (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    loan_id INTEGER NOT NULL,
                    start_date TEXT NOT NULL,
                    end_date TEXT,
                    interest_rate REAL NOT NULL,
                    note TEXT DEFAULT '',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
                )
            ''')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_loan_interest_periods_loan_id ON loan_interest_periods(loan_id)')
            conn.commit()
        
        # Check if savings tables exist, if not create them
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='savings_goals'")
        if not cursor.fetchone():
            print("[INFO] Creating savings_goals table...")
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS savings_goals (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    target_amount REAL NOT NULL,
                    current_amount REAL DEFAULT 0,
                    deadline TEXT,
                    category TEXT,
                    status TEXT DEFAULT 'Aktiv' CHECK(status IN ('Aktiv', 'Pausad', 'Uppnådd', 'Avbruten')),
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_savings_goals_status ON savings_goals(status)')
            conn.commit()
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='savings_accounts'")
        if not cursor.fetchone():
            print("[INFO] Creating savings_accounts table...")
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS savings_accounts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    balance REAL DEFAULT 0,
                    description TEXT,
                    category TEXT,
                    status TEXT DEFAULT 'Aktiv' CHECK(status IN ('Aktiv', 'Pausad', 'Stängd')),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_savings_accounts_status ON savings_accounts(status)')
            conn.commit()
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='savings_transactions'")
        if not cursor.fetchone():
            print("[INFO] Creating savings_transactions table...")
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS savings_transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    transaction_id INTEGER,
                    goal_id INTEGER,
                    account_id INTEGER,
                    amount REAL NOT NULL,
                    type TEXT NOT NULL CHECK(type IN ('deposit', 'withdrawal', 'transfer')),
                    date TEXT NOT NULL,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
                    FOREIGN KEY (goal_id) REFERENCES savings_goals(id) ON DELETE CASCADE,
                    FOREIGN KEY (account_id) REFERENCES savings_accounts(id) ON DELETE CASCADE
                )
            ''')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_savings_transactions_goal_id ON savings_transactions(goal_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_savings_transactions_account_id ON savings_transactions(account_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_savings_transactions_transaction_id ON savings_transactions(transaction_id)')
            conn.commit()
    
    conn.close()


def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    return conn


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ============================================================================
# TRANSACTION ENDPOINTS
# ============================================================================

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    """Get all transactions"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM transactions ORDER BY id DESC')
    transactions = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return jsonify(transactions), 200


@app.route('/api/transactions/<int:transaction_id>', methods=['GET'])
def get_transaction(transaction_id):
    """Get a specific transaction"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM transactions WHERE id = ?', (transaction_id,))
    transaction = cursor.fetchone()
    
    conn.close()
    
    if transaction:
        return jsonify(dict(transaction)), 200
    return jsonify({'error': 'Transaction not found'}), 404


@app.route('/api/transactions', methods=['POST'])
def create_transaction():
    """Create a new transaction"""
    data = request.get_json()
    
    required_fields = ['title', 'date', 'amount', 'type', 'category']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if receipt_path points to deleted folder and restore it
    receipt_path = data.get('receipt_path', None)
    if receipt_path and 'deleted' in receipt_path.replace('\\', '/') and os.path.exists(receipt_path):
        try:
            # Get receipt storage path
            cursor.execute('SELECT value FROM settings WHERE key = ?', ('receipt_storage_path',))
            result = cursor.fetchone()
            storage_path = result['value'] if result else app.config['UPLOAD_FOLDER']
            
            # Extract filename from deleted path
            filename = os.path.basename(receipt_path)
            # Remove old transaction ID prefix if present (format: {old_id}_{original_filename})
            if '_' in filename:
                parts = filename.split('_', 1)
                if parts[0].isdigit():
                    filename = parts[1]  # Keep only original filename
            
            # Move file back from deleted folder to main receipt folder
            restored_path = os.path.join(storage_path, filename)
            if os.path.exists(receipt_path) and not os.path.exists(restored_path):
                shutil.move(receipt_path, restored_path)
                receipt_path = restored_path
                print(f"♻️ [Backend] Återställde kvittofil: {restored_path}")
        except Exception as e:
            print(f"⚠️ [Backend] Kunde inte återställa kvittofil: {e}")
            # Continue with original path
    
    cursor.execute('''
        INSERT INTO transactions (title, date, amount, type, category, status, receipt, receipt_path, note)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data['title'],
        data['date'],
        data['amount'],
        data['type'],
        data['category'],
        data.get('status', 'Väntar'),
        data.get('receipt', False),
        receipt_path,  # Use potentially restored path
        data.get('note', '')
    ))
    
    transaction_id = cursor.lastrowid
    conn.commit()
    
    # If receipt_path was restored, update filename with new transaction ID
    if receipt_path and os.path.exists(receipt_path):
        try:
            filename = os.path.basename(receipt_path)
            # Check if filename doesn't start with transaction_id
            if not filename.startswith(f"{transaction_id}_"):
                # Update filename to include transaction ID
                new_filename = f"{transaction_id}_{filename}"
                new_path = os.path.join(os.path.dirname(receipt_path), new_filename)
                
                if os.path.exists(receipt_path) and receipt_path != new_path:
                    shutil.move(receipt_path, new_path)
                    # Update database with new path
                    cursor.execute('UPDATE transactions SET receipt_path = ? WHERE id = ?', 
                                 (new_path, transaction_id))
                    conn.commit()
                    receipt_path = new_path
                    print(f"📝 [Backend] Uppdaterade kvittofilnamn med transaction ID: {new_path}")
        except Exception as e:
            print(f"⚠️ [Backend] Kunde inte uppdatera kvittofilnamn: {e}")
    
    cursor.execute('SELECT * FROM transactions WHERE id = ?', (transaction_id,))
    new_transaction = dict(cursor.fetchone())
    
    conn.close()
    
    return jsonify(new_transaction), 201


@app.route('/api/transactions/<int:transaction_id>', methods=['PUT'])
def update_transaction(transaction_id):
    """Update a transaction - CRUCIAL for notes, category, and receipt_path"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Build dynamic UPDATE query
    update_fields = []
    values = []
    
    allowed_fields = ['title', 'date', 'amount', 'type', 'category', 'status', 'receipt', 'receipt_path', 'note']
    
    for field in allowed_fields:
        if field in data:
            update_fields.append(f'{field} = ?')
            values.append(data[field])
    
    if not update_fields:
        return jsonify({'error': 'No valid fields to update'}), 400
    
    # Add updated_at timestamp
    update_fields.append('updated_at = ?')
    values.append(datetime.now().isoformat())
    
    # Add transaction_id for WHERE clause
    values.append(transaction_id)
    
    query = f"UPDATE transactions SET {', '.join(update_fields)} WHERE id = ?"
    
    cursor.execute(query, values)
    conn.commit()
    
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({'error': 'Transaction not found'}), 404
    
    cursor.execute('SELECT * FROM transactions WHERE id = ?', (transaction_id,))
    updated_transaction = dict(cursor.fetchone())
    
    conn.close()
    
    return jsonify(updated_transaction), 200


@app.route('/api/transactions/<int:transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    """Delete a transaction and move its receipt file to deleted folder (for undo support)"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Get transaction data before deleting (for undo)
    cursor.execute('SELECT * FROM transactions WHERE id = ?', (transaction_id,))
    transaction = cursor.fetchone()
    
    if not transaction:
        conn.close()
        return jsonify({'error': 'Transaction not found'}), 404
    
    receipt_path = transaction['receipt_path'] if transaction else None
    transaction_data = dict(transaction)  # Save for undo
    
    # Delete transaction from database
    cursor.execute('DELETE FROM transactions WHERE id = ?', (transaction_id,))
    conn.commit()
    
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({'error': 'Transaction not found'}), 404
    
    # Move receipt file to deleted folder if it exists (instead of deleting for undo support)
    moved_path = None
    if receipt_path and os.path.exists(receipt_path):
        try:
            # Get receipt storage path
            cursor.execute('SELECT value FROM settings WHERE key = ?', ('receipt_storage_path',))
            result = cursor.fetchone()
            storage_path = result['value'] if result else app.config['UPLOAD_FOLDER']
            
            # Create deleted subfolder
            deleted_folder = os.path.join(storage_path, 'deleted')
            os.makedirs(deleted_folder, exist_ok=True)
            
            # Move file to deleted folder with transaction ID prefix for easy identification
            filename = os.path.basename(receipt_path)
            deleted_filename = f"{transaction_id}_{filename}"
            deleted_path = os.path.join(deleted_folder, deleted_filename)
            
            shutil.move(receipt_path, deleted_path)
            moved_path = deleted_path
            print(f"🗑️ [Backend] Flyttade kvittofil till deleted-mapp: {deleted_path}")
        except Exception as e:
            print(f"⚠️ [Backend] Kunde inte flytta kvittofil {receipt_path}: {e}")
            # Don't fail the deletion if file move fails
    
    conn.close()
    return jsonify({
        'message': 'Transaction deleted successfully',
        'receipt_path': receipt_path,  # Original path for undo
        'moved_receipt_path': moved_path,  # New path in deleted folder
        'transaction_data': transaction_data  # Full transaction data for undo
    }), 200


# ============================================================================
# AGREEMENT ENDPOINTS
# ============================================================================

@app.route('/api/agreements', methods=['GET'])
def get_agreements():
    """Get all agreements"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM agreements ORDER BY name')
    agreements = []
    
    for row in cursor.fetchall():
        agreement = dict(row)
        # Parse images if it exists
        if 'images' in agreement and agreement['images']:
            try:
                import json
                agreement['images'] = json.loads(agreement['images'])
            except:
                agreement['images'] = []
        else:
            agreement['images'] = []
        agreements.append(agreement)
    
    conn.close()
    return jsonify(agreements), 200


@app.route('/api/agreements/<int:agreement_id>', methods=['GET'])
def get_agreement(agreement_id):
    """Get a specific agreement"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM agreements WHERE id = ?', (agreement_id,))
    agreement = cursor.fetchone()
    
    conn.close()
    
    if agreement:
        return jsonify(dict(agreement)), 200
    return jsonify({'error': 'Agreement not found'}), 404


@app.route('/api/agreements', methods=['POST'])
def create_agreement():
    """Create a new agreement"""
    data = request.get_json()
    
    required_fields = ['name', 'provider', 'cost', 'frequency', 'next_payment', 'category']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO agreements (name, provider, cost, frequency, next_payment, status, category, icon, notice, start_date, end_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data['name'],
        data['provider'],
        data['cost'],
        data['frequency'],
        data['next_payment'],
        data.get('status', 'Aktiv'),
        data['category'],
        data.get('icon', '📄'),
        data.get('notice', ''),
        data.get('start_date', ''),
        data.get('end_date', '')
    ))
    
    agreement_id = cursor.lastrowid
    conn.commit()
    
    cursor.execute('SELECT * FROM agreements WHERE id = ?', (agreement_id,))
    new_agreement = dict(cursor.fetchone())
    
    conn.close()
    
    return jsonify(new_agreement), 201


@app.route('/api/agreements/<int:agreement_id>', methods=['PUT'])
def update_agreement(agreement_id):
    """Update an agreement"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Ensure start_date and end_date columns exist
    cursor.execute("PRAGMA table_info(agreements)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'start_date' not in columns:
        cursor.execute('ALTER TABLE agreements ADD COLUMN start_date TEXT')
        conn.commit()
    
    if 'end_date' not in columns:
        cursor.execute('ALTER TABLE agreements ADD COLUMN end_date TEXT')
        conn.commit()
    
    # Build dynamic UPDATE query
    update_fields = []
    values = []
    
    allowed_fields = ['name', 'provider', 'cost', 'frequency', 'next_payment', 'status', 'category', 'icon', 'notice', 'images', 'start_date', 'end_date']
    
    for field in allowed_fields:
        if field in data:
            update_fields.append(f'{field} = ?')
            # Convert images array to JSON string if it's a list
            if field == 'images' and isinstance(data[field], list):
                import json
                values.append(json.dumps(data[field]))
            else:
                values.append(data[field])
    
    if not update_fields:
        conn.close()
        return jsonify({'error': 'No valid fields to update'}), 400
    
    update_fields.append('updated_at = ?')
    values.append(datetime.now().isoformat())
    values.append(agreement_id)
    
    query = f"UPDATE agreements SET {', '.join(update_fields)} WHERE id = ?"
    
    try:
        cursor.execute(query, values)
        conn.commit()
    except sqlite3.OperationalError as e:
        conn.close()
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({'error': 'Agreement not found'}), 404
    
    cursor.execute('SELECT * FROM agreements WHERE id = ?', (agreement_id,))
    updated_agreement = dict(cursor.fetchone())
    
    conn.close()
    
    return jsonify(updated_agreement), 200


@app.route('/api/agreements/<int:agreement_id>', methods=['DELETE'])
def delete_agreement(agreement_id):
    """Delete an agreement"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM agreements WHERE id = ?', (agreement_id,))
    conn.commit()
    
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({'error': 'Agreement not found'}), 404
    
    conn.close()
    return jsonify({'message': 'Agreement deleted successfully'}), 200


# ============================================================================
# SETTINGS ENDPOINTS
# ============================================================================

@app.route('/api/settings', methods=['GET'])
def get_settings():
    """Get all settings"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT key, value FROM settings')
    settings = {row['key']: row['value'] for row in cursor.fetchall()}
    
    conn.close()
    return jsonify(settings), 200


@app.route('/api/settings', methods=['POST'])
def update_settings():
    """Update settings"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    for key, value in data.items():
        cursor.execute('''
            INSERT OR REPLACE INTO settings (key, value, updated_at)
            VALUES (?, ?, ?)
        ''', (key, value, datetime.now().isoformat()))
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Settings updated successfully'}), 200


# ============================================================================
# SAVED SEARCHES ENDPOINTS
# ============================================================================

@app.route('/api/saved-searches', methods=['GET'])
def get_saved_searches():
    """Get all saved searches"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT id, name, query, filters, created_at FROM saved_searches ORDER BY created_at DESC')
    searches = []
    for row in cursor.fetchall():
        searches.append({
            'id': row[0],
            'name': row[1],
            'query': row[2],
            'filters': json.loads(row[3]) if row[3] else {},
            'created_at': row[4]
        })
    
    conn.close()
    return jsonify(searches), 200


@app.route('/api/saved-searches', methods=['POST'])
def create_saved_search():
    """Create a new saved search"""
    data = request.get_json()
    
    if not data or not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO saved_searches (name, query, filters, created_at)
        VALUES (?, ?, ?, ?)
    ''', (
        data['name'],
        data.get('query', ''),
        json.dumps(data.get('filters', {})),
        datetime.now().isoformat()
    ))
    
    conn.commit()
    search_id = cursor.lastrowid
    conn.close()
    
    return jsonify({
        'id': search_id,
        'name': data['name'],
        'query': data.get('query', ''),
        'filters': data.get('filters', {}),
        'message': 'Search saved successfully'
    }), 201


@app.route('/api/saved-searches/<int:search_id>', methods=['DELETE'])
def delete_saved_search(search_id):
    """Delete a saved search"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM saved_searches WHERE id = ?', (search_id,))
    
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({'error': 'Search not found'}), 404
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Search deleted successfully'}), 200


# ============================================================================
# FILE UPLOAD ENDPOINT
# ============================================================================

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Upload a receipt file (legacy endpoint - kept for backward compatibility)"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400
    
    # Get receipt storage path from settings or use default
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT value FROM settings WHERE key = ?', ('receipt_storage_path',))
    result = cursor.fetchone()
    conn.close()
    
    if result:
        storage_path = result['value']
    else:
        storage_path = app.config['UPLOAD_FOLDER']
    
    # Create directory if it doesn't exist
    os.makedirs(storage_path, exist_ok=True)
    
    # Secure filename and save (legacy format: timestamp_filename)
    filename = secure_filename(file.filename)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"{timestamp}_{filename}"
    
    file_path = os.path.join(storage_path, filename)
    file.save(file_path)
    
    return jsonify({
        'message': 'File uploaded successfully',
        'file_path': file_path,
        'filename': filename
    }), 200


@app.route('/api/transactions/<int:transaction_id>/upload-receipt', methods=['POST'])
def upload_transaction_receipt(transaction_id):
    """Upload a receipt file for a specific transaction - filename includes transaction ID"""
    try:
        # Verify transaction exists
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT id, receipt_path FROM transactions WHERE id = ?', (transaction_id,))
        transaction = cursor.fetchone()
        
        if not transaction:
            conn.close()
            return jsonify({'error': 'Transaction not found'}), 404
        
        # Get old receipt path for cleanup
        old_receipt_path = transaction['receipt_path'] if transaction else None
        
        if 'file' not in request.files:
            conn.close()
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            conn.close()
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            conn.close()
            return jsonify({'error': 'File type not allowed'}), 400
        
        # Get receipt storage path from settings or use default
        cursor.execute('SELECT value FROM settings WHERE key = ?', ('receipt_storage_path',))
        result = cursor.fetchone()
        
        if result:
            storage_path = result['value']
        else:
            storage_path = app.config['UPLOAD_FOLDER']
        
        # Create directory if it doesn't exist
        os.makedirs(storage_path, exist_ok=True)
        
        # Secure filename and save with transaction ID prefix
        original_filename = secure_filename(file.filename)
        filename = f"{transaction_id}_{original_filename}"
        
        file_path = os.path.join(storage_path, filename)
        file.save(file_path)
        
        # Delete old receipt file if it exists and is different
        if old_receipt_path and old_receipt_path != file_path and os.path.exists(old_receipt_path):
            try:
                os.remove(old_receipt_path)
                print(f"🗑️ [Backend] Raderade gammalt kvitto: {old_receipt_path}")
            except Exception as e:
                print(f"⚠️ [Backend] Kunde inte radera gammalt kvitto: {e}")
        
        # Update transaction with new receipt path
        cursor.execute('UPDATE transactions SET receipt = ?, receipt_path = ?, updated_at = ? WHERE id = ?',
                      (True, file_path, datetime.now().isoformat(), transaction_id))
        conn.commit()
        conn.close()
        
        return jsonify({
            'message': 'Receipt uploaded successfully',
            'file_path': file_path,
            'filename': filename
        }), 200
        
    except Exception as e:
        print(f"❌ [Backend] Error uploading receipt: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500


@app.route('/api/agreements/<int:agreement_id>/upload-image', methods=['POST'])
def upload_agreement_image(agreement_id):
    """Upload an image for an agreement - saves to uploads/avtal/"""
    try:
        print(f"📤 [Backend] Upload request för avtal {agreement_id}")
        
        if 'file' not in request.files:
            print("❌ [Backend] Ingen fil i request")
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            print("❌ [Backend] Tomt filnamn")
            return jsonify({'error': 'No file selected'}), 400
        
        print(f"📁 [Backend] Fil: {file.filename}, Storlek: {file.content_length}")
        
        # Only allow images
        if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
            print(f"❌ [Backend] Fel filtyp: {file.filename}")
            return jsonify({'error': 'Only image files are allowed'}), 400
        
        # Get agreement images storage path from settings or use default
        conn_settings = get_db()
        cursor_settings = conn_settings.cursor()
        cursor_settings.execute('SELECT value FROM settings WHERE key = ?', ('agreement_images_path',))
        result_settings = cursor_settings.fetchone()
        conn_settings.close()
        
        if result_settings:
            avtal_folder = result_settings['value']
        else:
            # Default: uploads/avtal
            avtal_folder = os.path.join(app.config['UPLOAD_FOLDER'], 'avtal')
        
        # Create directory if it doesn't exist
        os.makedirs(avtal_folder, exist_ok=True)
        print(f"📂 [Backend] Avtal-mapp: {avtal_folder}")
        
        # Secure filename and save
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{agreement_id}_{timestamp}_{filename}"
        
        file_path = os.path.join(avtal_folder, filename)
        print(f"💾 [Backend] Sparar fil till: {file_path}")
        
        file.save(file_path)
        
        # Kontrollera att filen faktiskt sparades
        if not os.path.exists(file_path):
            print(f"❌ [Backend] Filen sparades inte: {file_path}")
            return jsonify({'error': 'File save failed'}), 500
        
        print(f"✅ [Backend] Fil sparad: {file_path}")
        
        # Update agreement with new image path
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if images column exists, if not add it
        cursor.execute("PRAGMA table_info(agreements)")
        columns = [col[1] for col in cursor.fetchall()]
        if 'images' not in columns:
            print("⚠️ [Backend] Lägger till images-kolumn...")
            cursor.execute('ALTER TABLE agreements ADD COLUMN images TEXT DEFAULT "[]"')
            conn.commit()
        
        # Check if start_date and end_date columns exist, if not add them
        if 'start_date' not in columns:
            print("⚠️ [Backend] Lägger till start_date-kolumn...")
            cursor.execute('ALTER TABLE agreements ADD COLUMN start_date TEXT')
            conn.commit()
        if 'end_date' not in columns:
            print("⚠️ [Backend] Lägger till end_date-kolumn...")
            cursor.execute('ALTER TABLE agreements ADD COLUMN end_date TEXT')
            conn.commit()
        
        # Get current images
        cursor.execute('SELECT images FROM agreements WHERE id = ?', (agreement_id,))
        result = cursor.fetchone()
        
        if not result:
            conn.close()
            print(f"❌ [Backend] Avtal {agreement_id} hittades inte")
            return jsonify({'error': 'Agreement not found'}), 404
        
        # Parse existing images (stored as JSON string)
        try:
            import json
            current_images = json.loads(result['images']) if result['images'] else []
            print(f"📸 [Backend] Nuvarande bilder: {current_images}")
        except Exception as e:
            print(f"⚠️ [Backend] Kunde inte parsa images: {e}")
            current_images = []
        
        # Store full path in database (or relative path if using default)
        # If using custom path, store the full path
        if result_settings and result_settings['value'] != os.path.join(app.config['UPLOAD_FOLDER'], 'avtal'):
            # Custom path - store full path
            image_path = file_path
        else:
            # Default path - store relative path
            image_path = os.path.join('avtal', filename).replace('\\', '/')
        
        current_images.append(image_path)
        print(f"📸 [Backend] Ny bildlista: {current_images}")
        
        # Update agreement
        cursor.execute('UPDATE agreements SET images = ?, updated_at = ? WHERE id = ?', 
                       (json.dumps(current_images), datetime.now().isoformat(), agreement_id))
        conn.commit()
        conn.close()
        
        print(f"✅ [Backend] Avtal uppdaterat med ny bild: {image_path}")
        
        return jsonify({
            'message': 'Image uploaded successfully',
            'image_path': image_path,
            'filename': filename
        }), 200
        
    except Exception as e:
        print(f"❌ [Backend] Fel vid bilduppladdning: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500


@app.route('/uploads/<path:filename>')
def serve_uploaded_file(filename):
    """Serve uploaded files (images, receipts, etc.)"""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


@app.route('/api/files/<path:filepath>')
def serve_custom_file(filepath):
    """Serve files from custom paths (with security checks)"""
    # Säkerhetskontroll - bara tillåt sökvägar som börjar med tillåtna mappar
    # Normalisera sökväg
    normalized_path = filepath.replace('\\', '/')
    
    # Kontrollera om det är en absolut sökväg som börjar med en tillåten mapp
    # Hämta inställningar för att kontrollera tillåtna mappar
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT value FROM settings WHERE key = ?', ('agreement_images_path',))
    result = cursor.fetchone()
    conn.close()
    
    if result and result['value']:
        allowed_path = result['value']
        # Kontrollera om filen finns i den tillåtna mappen
        if normalized_path.startswith(allowed_path.replace('\\', '/')):
            if os.path.exists(normalized_path) and os.path.isfile(normalized_path):
                return send_file(normalized_path)
    
    return jsonify({'error': 'File not found or access denied'}), 404


# ============================================================================
# CATEGORIES ENDPOINTS
# ============================================================================

@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Get all categories"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM categories ORDER BY name')
    categories = [row['name'] for row in cursor.fetchall()]
    
    conn.close()
    return jsonify(categories), 200


@app.route('/api/categories', methods=['POST'])
def create_category():
    """Create a new category"""
    data = request.get_json()
    
    if not data or 'name' not in data:
        return jsonify({'error': 'Category name is required'}), 400
    
    name = data['name'].strip()
    
    if not name:
        return jsonify({'error': 'Category name cannot be empty'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('INSERT INTO categories (name) VALUES (?)', (name,))
        conn.commit()
        category_id = cursor.lastrowid
        
        cursor.execute('SELECT * FROM categories WHERE id = ?', (category_id,))
        new_category = dict(cursor.fetchone())
        
        conn.close()
        return jsonify(new_category), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Category already exists'}), 400
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500


@app.route('/api/categories/<int:category_id>', methods=['PUT'])
def update_category(category_id):
    """Update a category"""
    data = request.get_json()
    
    if not data or 'name' not in data:
        return jsonify({'error': 'Category name is required'}), 400
    
    name = data['name'].strip()
    
    if not name:
        return jsonify({'error': 'Category name cannot be empty'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Check if category exists
        cursor.execute('SELECT * FROM categories WHERE id = ?', (category_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Category not found'}), 404
        
        # Update category
        cursor.execute('UPDATE categories SET name = ? WHERE id = ?', (name, category_id))
        conn.commit()
        
        cursor.execute('SELECT * FROM categories WHERE id = ?', (category_id,))
        updated_category = dict(cursor.fetchone())
        
        conn.close()
        return jsonify(updated_category), 200
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Category name already exists'}), 400
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500


@app.route('/api/categories/<int:category_id>', methods=['DELETE'])
def delete_category(category_id):
    """Delete a category"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if category exists
    cursor.execute('SELECT * FROM categories WHERE id = ?', (category_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({'error': 'Category not found'}), 404
    
    # Check if category is used in transactions or agreements
    cursor.execute('SELECT COUNT(*) FROM transactions WHERE category = (SELECT name FROM categories WHERE id = ?)', (category_id,))
    tx_count = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM agreements WHERE category = (SELECT name FROM categories WHERE id = ?)', (category_id,))
    ag_count = cursor.fetchone()[0]
    
    if tx_count > 0 or ag_count > 0:
        conn.close()
        return jsonify({
            'error': 'Cannot delete category that is in use',
            'transactions': tx_count,
            'agreements': ag_count
        }), 400
    
    # Delete category
    cursor.execute('DELETE FROM categories WHERE id = ?', (category_id,))
    conn.commit()
    
    conn.close()
    return jsonify({'message': 'Category deleted successfully'}), 200


@app.route('/api/categories/with-ids', methods=['GET'])
def get_categories_with_ids():
    """Get all categories with their IDs and usage statistics"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM categories ORDER BY name')
    categories = []
    
    for row in cursor.fetchall():
        category = dict(row)
        category_id = category['id']
        category_name = category['name']
        
        # Count transactions using this category
        cursor.execute('SELECT COUNT(*) FROM transactions WHERE category = ?', (category_name,))
        tx_count = cursor.fetchone()[0]
        
        # Count agreements using this category
        cursor.execute('SELECT COUNT(*) FROM agreements WHERE category = ?', (category_name,))
        ag_count = cursor.fetchone()[0]
        
        category['transaction_count'] = tx_count
        category['agreement_count'] = ag_count
        category['total_usage'] = tx_count + ag_count
        
        categories.append(category)
    
    conn.close()
    return jsonify(categories), 200


@app.route('/api/categories/merge', methods=['POST'])
def merge_categories():
    """Merge two categories into one"""
    data = request.get_json()
    
    if not data or 'source_id' not in data or 'target_id' not in data or 'new_name' not in data:
        return jsonify({'error': 'source_id, target_id, and new_name are required'}), 400
    
    source_id = data['source_id']
    target_id = data['target_id']
    new_name = data['new_name'].strip()
    
    if not new_name:
        return jsonify({'error': 'Category name cannot be empty'}), 400
    
    if source_id == target_id:
        return jsonify({'error': 'Cannot merge category with itself'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Get category names
        cursor.execute('SELECT name FROM categories WHERE id = ?', (source_id,))
        source_result = cursor.fetchone()
        if not source_result:
            conn.close()
            return jsonify({'error': 'Source category not found'}), 404
        
        source_name = source_result['name']
        
        cursor.execute('SELECT name FROM categories WHERE id = ?', (target_id,))
        target_result = cursor.fetchone()
        if not target_result:
            conn.close()
            return jsonify({'error': 'Target category not found'}), 404
        
        target_name = target_result['name']
        
        # Update all transactions using source category to use new name
        cursor.execute('UPDATE transactions SET category = ? WHERE category = ?', (new_name, source_name))
        tx_updated = cursor.rowcount
        
        # Update all agreements using source category to use new name
        cursor.execute('UPDATE agreements SET category = ? WHERE category = ?', (new_name, source_name))
        ag_updated = cursor.rowcount
        
        # Update target category name if different
        if target_name != new_name:
            cursor.execute('UPDATE categories SET name = ? WHERE id = ?', (new_name, target_id))
        
        # Delete source category
        cursor.execute('DELETE FROM categories WHERE id = ?', (source_id,))
        
        conn.commit()
        
        # Get updated category
        cursor.execute('SELECT * FROM categories WHERE id = ?', (target_id,))
        merged_category = dict(cursor.fetchone())
        
        # Get usage counts
        cursor.execute('SELECT COUNT(*) FROM transactions WHERE category = ?', (new_name,))
        tx_count = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM agreements WHERE category = ?', (new_name,))
        ag_count = cursor.fetchone()[0]
        
        merged_category['transaction_count'] = tx_count
        merged_category['agreement_count'] = ag_count
        merged_category['total_usage'] = tx_count + ag_count
        
        conn.close()
        
        return jsonify({
            'message': 'Categories merged successfully',
            'category': merged_category,
            'transactions_updated': tx_updated,
            'agreements_updated': ag_updated
        }), 200
        
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Category name already exists'}), 400
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500


# ============================================================================
# CATEGORY RULES ENDPOINTS
# ============================================================================

@app.route('/api/category-rules', methods=['GET'])
def get_category_rules():
    """Get all category rules"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if table exists, create if not
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='category_rules'")
    if not cursor.fetchone():
        cursor.execute('''
            CREATE TABLE category_rules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                description_pattern TEXT NOT NULL,
                category TEXT NOT NULL,
                is_active BOOLEAN NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
    
    # Return all rules (not just active) so UI can show all
    cursor.execute('SELECT * FROM category_rules ORDER BY description_pattern')
    rows = cursor.fetchall()
    
    # Parse description_pattern as JSON if it's an array, otherwise keep as string
    import json
    rules = []
    for row in rows:
        rule = dict(row)
        try:
            # Try to parse as JSON array
            patterns = json.loads(rule['description_pattern'])
            if isinstance(patterns, list):
                rule['description_patterns'] = patterns
                rule['description_pattern'] = patterns[0] if patterns else ''  # Keep first for backward compatibility
            else:
                rule['description_patterns'] = [patterns] if patterns else []
        except (json.JSONDecodeError, TypeError):
            # Not JSON, treat as single pattern string
            rule['description_patterns'] = [rule['description_pattern']] if rule['description_pattern'] else []
        rules.append(rule)
    
    conn.close()
    return jsonify(rules), 200


@app.route('/api/category-rules', methods=['POST'])
def create_category_rule():
    """Create a new category rule"""
    data = request.get_json()
    
    # Support both single pattern (string) and multiple patterns (array)
    patterns = data.get('description_patterns') or data.get('description_pattern')
    if not patterns or not data.get('category'):
        return jsonify({'error': 'Missing description_pattern(s) or category'}), 400
    
    # Convert to list if single pattern
    if isinstance(patterns, str):
        patterns = [patterns]
    
    # Store as JSON array
    import json
    patterns_json = json.dumps(patterns)
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='category_rules'")
    if not cursor.fetchone():
        cursor.execute('''
            CREATE TABLE category_rules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                description_pattern TEXT NOT NULL,
                category TEXT NOT NULL,
                is_active BOOLEAN NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
    
    cursor.execute('''
        INSERT INTO category_rules (description_pattern, category, is_active)
        VALUES (?, ?, ?)
    ''', (
        patterns_json,
        data['category'],
        data.get('is_active', True)
    ))
    
    rule_id = cursor.lastrowid
    conn.commit()
    
    cursor.execute('SELECT * FROM category_rules WHERE id = ?', (rule_id,))
    row = cursor.fetchone()
    new_rule = dict(row)
    
    # Parse description_pattern as JSON
    import json
    try:
        patterns = json.loads(new_rule['description_pattern'])
        if isinstance(patterns, list):
            new_rule['description_patterns'] = patterns
            new_rule['description_pattern'] = patterns[0] if patterns else ''
        else:
            new_rule['description_patterns'] = [patterns] if patterns else []
    except (json.JSONDecodeError, TypeError):
        new_rule['description_patterns'] = [new_rule['description_pattern']] if new_rule['description_pattern'] else []
    
    conn.close()
    return jsonify(new_rule), 201


@app.route('/api/category-rules/<int:rule_id>', methods=['PUT'])
def update_category_rule(rule_id):
    """Update a category rule"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    update_fields = []
    values = []
    
    if 'description_patterns' in data or 'description_pattern' in data:
        # Support both description_patterns (array) and description_pattern (string)
        patterns = data.get('description_patterns') or data.get('description_pattern')
        if isinstance(patterns, str):
            patterns = [patterns]
        
        import json
        patterns_json = json.dumps(patterns)
        update_fields.append('description_pattern = ?')
        values.append(patterns_json)
    
    if 'category' in data:
        update_fields.append('category = ?')
        values.append(data['category'])
    
    if 'is_active' in data:
        update_fields.append('is_active = ?')
        values.append(data['is_active'])
    
    if not update_fields:
        conn.close()
        return jsonify({'error': 'No valid fields to update'}), 400
    
    update_fields.append('updated_at = ?')
    values.append(datetime.now().isoformat())
    values.append(rule_id)
    
    query = f"UPDATE category_rules SET {', '.join(update_fields)} WHERE id = ?"
    
    cursor.execute(query, values)
    conn.commit()
    
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({'error': 'Rule not found'}), 404
    
    cursor.execute('SELECT * FROM category_rules WHERE id = ?', (rule_id,))
    row = cursor.fetchone()
    updated_rule = dict(row)
    
    # Parse description_pattern as JSON
    import json
    try:
        patterns = json.loads(updated_rule['description_pattern'])
        if isinstance(patterns, list):
            updated_rule['description_patterns'] = patterns
            updated_rule['description_pattern'] = patterns[0] if patterns else ''
        else:
            updated_rule['description_patterns'] = [patterns] if patterns else []
    except (json.JSONDecodeError, TypeError):
        updated_rule['description_patterns'] = [updated_rule['description_pattern']] if updated_rule['description_pattern'] else []
    
    conn.close()
    return jsonify(updated_rule), 200


@app.route('/api/category-rules/<int:rule_id>', methods=['DELETE'])
def delete_category_rule(rule_id):
    """Delete a category rule"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM category_rules WHERE id = ?', (rule_id,))
    conn.commit()
    
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({'error': 'Rule not found'}), 404
    
    conn.close()
    return jsonify({'message': 'Rule deleted successfully'}), 200


# ============================================================================
# VEHICLE ENDPOINTS
# ============================================================================

@app.route('/api/vehicles', methods=['GET'])
def get_vehicles():
    """Get all vehicles"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM vehicles ORDER BY registration_number')
    vehicles = []
    
    for row in cursor.fetchall():
        vehicle = dict(row)
        # Parse images if it exists
        if 'images' in vehicle and vehicle['images']:
            try:
                import json
                vehicle['images'] = json.loads(vehicle['images'])
            except:
                vehicle['images'] = []
        else:
            vehicle['images'] = []
        vehicles.append(vehicle)
    
    conn.close()
    return jsonify(vehicles), 200


@app.route('/api/vehicles/<int:vehicle_id>', methods=['GET'])
def get_vehicle(vehicle_id):
    """Get a specific vehicle"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM vehicles WHERE id = ?', (vehicle_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        vehicle = dict(row)
        # Parse images
        if 'images' in vehicle and vehicle['images']:
            try:
                import json
                vehicle['images'] = json.loads(vehicle['images'])
            except:
                vehicle['images'] = []
        else:
            vehicle['images'] = []
        return jsonify(vehicle), 200
    
    return jsonify({'error': 'Vehicle not found'}), 404


@app.route('/api/vehicles', methods=['POST'])
def create_vehicle():
    """Create a new vehicle"""
    data = request.get_json()
    
    required_fields = ['registration_number', 'make_model']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if registration number already exists
    cursor.execute('SELECT id FROM vehicles WHERE registration_number = ?', (data['registration_number'],))
    if cursor.fetchone():
        conn.close()
        return jsonify({'error': 'Registration number already exists'}), 400
    
    cursor.execute('''
        INSERT INTO vehicles (
            registration_number, make_model, odometer, next_inspection,
            insurance_company, insurance_type, status, category, note,
            agreement_id, next_service_odometer, next_service_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data['registration_number'],
        data['make_model'],
        data.get('odometer', 0),
        data.get('next_inspection', ''),
        data.get('insurance_company', ''),
        data.get('insurance_type', ''),
        data.get('status', 'Aktiv'),
        data.get('category', 'Personbil'),
        data.get('note', ''),
        data.get('agreement_id'),
        data.get('next_service_odometer'),
        data.get('next_service_date', '')
    ))
    
    vehicle_id = cursor.lastrowid
    conn.commit()
    
    cursor.execute('SELECT * FROM vehicles WHERE id = ?', (vehicle_id,))
    new_vehicle = dict(cursor.fetchone())
    
    conn.close()
    
    return jsonify(new_vehicle), 201


@app.route('/api/vehicles/<int:vehicle_id>', methods=['PUT'])
def update_vehicle(vehicle_id):
    """Update a vehicle"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if vehicle exists
    cursor.execute('SELECT id FROM vehicles WHERE id = ?', (vehicle_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({'error': 'Vehicle not found'}), 404
    
    # Check if registration number is being changed and if it already exists
    if 'registration_number' in data:
        cursor.execute('SELECT id FROM vehicles WHERE registration_number = ? AND id != ?', 
                      (data['registration_number'], vehicle_id))
        if cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Registration number already exists'}), 400
    
    # Build update query dynamically
    update_fields = []
    values = []
    
    allowed_fields = [
        'registration_number', 'make_model', 'odometer', 'next_inspection',
        'insurance_company', 'insurance_type', 'status', 'category', 'note',
        'agreement_id', 'next_service_odometer', 'next_service_date'
    ]
    
    for field in allowed_fields:
        if field in data:
            update_fields.append(f"{field} = ?")
            values.append(data[field])
    
    if 'images' in data:
        import json
        images_json = json.dumps(data['images']) if isinstance(data['images'], list) else data['images']
        update_fields.append("images = ?")
        values.append(images_json)
    
    if not update_fields:
        conn.close()
        return jsonify({'error': 'No valid fields to update'}), 400
    
    update_fields.append("updated_at = ?")
    values.append(datetime.now().isoformat())
    values.append(vehicle_id)
    
    cursor.execute(f'''
        UPDATE vehicles 
        SET {', '.join(update_fields)}
        WHERE id = ?
    ''', values)
    
    conn.commit()
    
    cursor.execute('SELECT * FROM vehicles WHERE id = ?', (vehicle_id,))
    updated_vehicle = dict(cursor.fetchone())
    
    # Parse images
    if 'images' in updated_vehicle and updated_vehicle['images']:
        try:
            updated_vehicle['images'] = json.loads(updated_vehicle['images'])
        except:
            updated_vehicle['images'] = []
    else:
        updated_vehicle['images'] = []
    
    conn.close()
    
    return jsonify(updated_vehicle), 200


@app.route('/api/vehicles/<int:vehicle_id>', methods=['DELETE'])
def delete_vehicle(vehicle_id):
    """Delete a vehicle"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM vehicles WHERE id = ?', (vehicle_id,))
    
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({'error': 'Vehicle not found'}), 404
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Vehicle deleted successfully'}), 200


@app.route('/api/vehicles/<int:vehicle_id>/upload-image', methods=['POST'])
def upload_vehicle_image(vehicle_id):
    """Upload an image for a vehicle"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400
        
        # Get vehicle images storage path from settings or use default
        conn_settings = get_db()
        cursor_settings = conn_settings.cursor()
        cursor_settings.execute('SELECT value FROM settings WHERE key = ?', ('vehicle_images_path',))
        result_settings = cursor_settings.fetchone()
        conn_settings.close()
        
        if result_settings:
            vehicle_folder = result_settings['value']
        else:
            # Default: uploads/vehicles
            vehicle_folder = os.path.join(app.config['UPLOAD_FOLDER'], 'vehicles')
        
        # Create directory if it doesn't exist
        os.makedirs(vehicle_folder, exist_ok=True)
        
        # Secure filename and save
        filename = secure_filename(file.filename)
        file_path = os.path.join(vehicle_folder, filename)
        file.save(file_path)
        
        # Get current images
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT images FROM vehicles WHERE id = ?', (vehicle_id,))
        row = cursor.fetchone()
        
        if not row:
            conn.close()
            return jsonify({'error': 'Vehicle not found'}), 404
        
        import json
        current_images = []
        if row['images']:
            try:
                current_images = json.loads(row['images'])
            except:
                current_images = []
        
        # Store full path in database (or relative path if using default)
        if result_settings and result_settings['value'] != os.path.join(app.config['UPLOAD_FOLDER'], 'vehicles'):
            # Custom path - store full path
            image_path = file_path
        else:
            # Default path - store relative path
            image_path = os.path.join('vehicles', filename).replace('\\', '/')
        
        current_images.append(image_path)
        
        # Update vehicle
        cursor.execute('UPDATE vehicles SET images = ?, updated_at = ? WHERE id = ?',
                      (json.dumps(current_images), datetime.now().isoformat(), vehicle_id))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Image uploaded successfully', 'image_path': image_path}), 200
        
    except Exception as e:
        print(f"❌ [Backend] Error uploading vehicle image: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================================
# VEHICLE EXPENSES ENDPOINTS
# ============================================================================

@app.route('/api/vehicle-expenses', methods=['GET'])
def get_vehicle_expenses():
    """Get all vehicle expenses, optionally filtered by vehicle_id"""
    vehicle_id = request.args.get('vehicle_id', type=int)
    
    conn = get_db()
    cursor = conn.cursor()
    
    if vehicle_id:
        cursor.execute('SELECT * FROM vehicle_expenses WHERE vehicle_id = ? ORDER BY date DESC', (vehicle_id,))
    else:
        cursor.execute('SELECT * FROM vehicle_expenses ORDER BY date DESC')
    
    expenses = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(expenses), 200


@app.route('/api/vehicle-expenses/<int:expense_id>', methods=['GET'])
def get_vehicle_expense(expense_id):
    """Get a specific vehicle expense"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM vehicle_expenses WHERE id = ?', (expense_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return jsonify(dict(row)), 200
    
    return jsonify({'error': 'Vehicle expense not found'}), 404


@app.route('/api/vehicle-expenses', methods=['POST'])
def create_vehicle_expense():
    """Create a new vehicle expense"""
    data = request.get_json()
    
    required_fields = ['vehicle_id', 'category', 'amount', 'date']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Verify vehicle exists
    cursor.execute('SELECT id FROM vehicles WHERE id = ?', (data['vehicle_id'],))
    if not cursor.fetchone():
        conn.close()
        return jsonify({'error': 'Vehicle not found'}), 404
    
    cursor.execute('''
        INSERT INTO vehicle_expenses (
            vehicle_id, category, amount, date, description,
            receipt_path, note, odometer_at_purchase, transaction_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data['vehicle_id'],
        data['category'],
        data['amount'],
        data['date'],
        data.get('description', ''),
        data.get('receipt_path', ''),
        data.get('note', ''),
        data.get('odometer_at_purchase'),
        data.get('transaction_id')
    ))
    
    expense_id = cursor.lastrowid
    conn.commit()
    
    cursor.execute('SELECT * FROM vehicle_expenses WHERE id = ?', (expense_id,))
    new_expense = dict(cursor.fetchone())
    
    conn.close()
    
    return jsonify(new_expense), 201


@app.route('/api/vehicle-expenses/<int:expense_id>', methods=['PUT'])
def update_vehicle_expense(expense_id):
    """Update a vehicle expense"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if expense exists
    cursor.execute('SELECT id FROM vehicle_expenses WHERE id = ?', (expense_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({'error': 'Vehicle expense not found'}), 404
    
    # Build update query dynamically
    update_fields = []
    values = []
    
    allowed_fields = [
        'vehicle_id', 'category', 'amount', 'date', 'description',
        'receipt_path', 'note', 'odometer_at_purchase'
    ]
    
    for field in allowed_fields:
        if field in data:
            update_fields.append(f"{field} = ?")
            values.append(data[field])
    
    if not update_fields:
        conn.close()
        return jsonify({'error': 'No valid fields to update'}), 400
    
    update_fields.append("updated_at = ?")
    values.append(datetime.now().isoformat())
    values.append(expense_id)
    
    cursor.execute(f'''
        UPDATE vehicle_expenses 
        SET {', '.join(update_fields)}
        WHERE id = ?
    ''', values)
    
    conn.commit()
    
    cursor.execute('SELECT * FROM vehicle_expenses WHERE id = ?', (expense_id,))
    updated_expense = dict(cursor.fetchone())
    
    conn.close()
    
    return jsonify(updated_expense), 200


@app.route('/api/vehicle-expenses/<int:expense_id>', methods=['DELETE'])
def delete_vehicle_expense(expense_id):
    """Delete a vehicle expense"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM vehicle_expenses WHERE id = ?', (expense_id,))
    
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({'error': 'Vehicle expense not found'}), 404
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Vehicle expense deleted successfully'}), 200


# ============================================================================
# ROOT & HEALTH CHECK
# ============================================================================

@app.route('/')
def index():
    return jsonify({
        'message': 'Welcome to WestBudget API',
        'version': '1.0.0',
        'endpoints': {
            'transactions': '/api/transactions',
            'agreements': '/api/agreements',
            'settings': '/api/settings',
            'upload': '/api/upload',
            'categories': '/api/categories',
            'vehicles': '/api/vehicles',
            'vehicle-expenses': '/api/vehicle-expenses'
        }
    }), 200


@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'database': os.path.exists(DATABASE)}), 200


# ============================================================================
# SAVINGS ENDPOINTS
# ============================================================================

@app.route('/api/savings/goals', methods=['GET'])
def get_savings_goals():
    """Get all savings goals"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM savings_goals ORDER BY created_at DESC')
    goals = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return jsonify(goals), 200


@app.route('/api/savings/goals', methods=['POST'])
def create_savings_goal():
    """Create a new savings goal"""
    data = request.get_json()
    
    required_fields = ['name', 'target_amount']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields: name, target_amount'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO savings_goals (name, target_amount, current_amount, deadline, category, status, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        data['name'],
        data['target_amount'],
        data.get('current_amount', 0),
        data.get('deadline'),
        data.get('category'),
        data.get('status', 'Aktiv'),
        data.get('description')
    ))
    
    goal_id = cursor.lastrowid
    conn.commit()
    
    cursor.execute('SELECT * FROM savings_goals WHERE id = ?', (goal_id,))
    new_goal = dict(cursor.fetchone())
    
    conn.close()
    return jsonify(new_goal), 201


@app.route('/api/savings/goals/<int:goal_id>', methods=['PUT'])
def update_savings_goal(goal_id):
    """Update a savings goal"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    update_fields = []
    values = []
    allowed_fields = ['name', 'target_amount', 'current_amount', 'deadline', 'category', 'status', 'description']
    
    for field in allowed_fields:
        if field in data:
            update_fields.append(f'{field} = ?')
            values.append(data[field])
    
    if not update_fields:
        conn.close()
        return jsonify({'error': 'No valid fields to update'}), 400
    
    update_fields.append('updated_at = ?')
    values.append(datetime.now().isoformat())
    values.append(goal_id)
    
    cursor.execute(f'''
        UPDATE savings_goals 
        SET {', '.join(update_fields)}
        WHERE id = ?
    ''', values)
    
    conn.commit()
    
    cursor.execute('SELECT * FROM savings_goals WHERE id = ?', (goal_id,))
    updated_goal = cursor.fetchone()
    
    conn.close()
    
    if updated_goal:
        return jsonify(dict(updated_goal)), 200
    return jsonify({'error': 'Goal not found'}), 404


@app.route('/api/savings/goals/<int:goal_id>', methods=['DELETE'])
def delete_savings_goal(goal_id):
    """Delete a savings goal"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM savings_goals WHERE id = ?', (goal_id,))
    conn.commit()
    
    deleted = cursor.rowcount > 0
    conn.close()
    
    if deleted:
        return jsonify({'message': 'Goal deleted successfully'}), 200
    return jsonify({'error': 'Goal not found'}), 404


@app.route('/api/savings/accounts', methods=['GET'])
def get_savings_accounts():
    """Get all savings accounts"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM savings_accounts ORDER BY created_at DESC')
    accounts = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return jsonify(accounts), 200


@app.route('/api/savings/accounts', methods=['POST'])
def create_savings_account():
    """Create a new savings account"""
    data = request.get_json()
    
    required_fields = ['name']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required field: name'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO savings_accounts (name, balance, description, category, status)
        VALUES (?, ?, ?, ?, ?)
    ''', (
        data['name'],
        data.get('balance', 0),
        data.get('description'),
        data.get('category'),
        data.get('status', 'Aktiv')
    ))
    
    account_id = cursor.lastrowid
    conn.commit()
    
    cursor.execute('SELECT * FROM savings_accounts WHERE id = ?', (account_id,))
    new_account = dict(cursor.fetchone())
    
    conn.close()
    return jsonify(new_account), 201


@app.route('/api/savings/accounts/<int:account_id>', methods=['PUT'])
def update_savings_account(account_id):
    """Update a savings account"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    update_fields = []
    values = []
    allowed_fields = ['name', 'balance', 'description', 'category', 'status']
    
    for field in allowed_fields:
        if field in data:
            update_fields.append(f'{field} = ?')
            values.append(data[field])
    
    if not update_fields:
        conn.close()
        return jsonify({'error': 'No valid fields to update'}), 400
    
    update_fields.append('updated_at = ?')
    values.append(datetime.now().isoformat())
    values.append(account_id)
    
    cursor.execute(f'''
        UPDATE savings_accounts 
        SET {', '.join(update_fields)}
        WHERE id = ?
    ''', values)
    
    conn.commit()
    
    cursor.execute('SELECT * FROM savings_accounts WHERE id = ?', (account_id,))
    updated_account = cursor.fetchone()
    
    conn.close()
    
    if updated_account:
        return jsonify(dict(updated_account)), 200
    return jsonify({'error': 'Account not found'}), 404


@app.route('/api/savings/accounts/<int:account_id>', methods=['DELETE'])
def delete_savings_account(account_id):
    """Delete a savings account"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM savings_accounts WHERE id = ?', (account_id,))
    conn.commit()
    
    deleted = cursor.rowcount > 0
    conn.close()
    
    if deleted:
        return jsonify({'message': 'Account deleted successfully'}), 200
    return jsonify({'error': 'Account not found'}), 404


@app.route('/api/savings/transfer', methods=['POST'])
def transfer_savings():
    """Transfer money to/from savings account or goal"""
    data = request.get_json()
    
    required_fields = ['account_id', 'amount', 'type', 'date']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields: account_id, amount, type, date'}), 400
    
    account_id = data.get('account_id')
    goal_id = data.get('goal_id')
    amount = float(data['amount'])
    transfer_type = data['type']  # 'deposit' or 'withdrawal'
    date = data['date']
    notes = data.get('notes', '')
    
    if not account_id and not goal_id:
        return jsonify({'error': 'Either account_id or goal_id must be provided'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Create savings transaction record
        cursor.execute('''
            INSERT INTO savings_transactions (account_id, goal_id, amount, type, date, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (account_id, goal_id, amount, transfer_type, date, notes))
        
        transaction_id = cursor.lastrowid
        
        # Update account balance or goal current_amount
        if account_id:
            if transfer_type == 'deposit':
                cursor.execute('UPDATE savings_accounts SET balance = balance + ?, updated_at = ? WHERE id = ?',
                             (amount, datetime.now().isoformat(), account_id))
            elif transfer_type == 'withdrawal':
                # Check if sufficient balance
                cursor.execute('SELECT balance, name FROM savings_accounts WHERE id = ?', (account_id,))
                result = cursor.fetchone()
                if result and result['balance'] < amount:
                    conn.rollback()
                    conn.close()
                    return jsonify({
                        'error': 'Insufficient balance',
                        'message': f'Kontot "{result["name"]}" har bara {result["balance"]:.2f} kr men du försöker ta ut {amount:.2f} kr.'
                    }), 400
                cursor.execute('UPDATE savings_accounts SET balance = balance - ?, updated_at = ? WHERE id = ?',
                             (amount, datetime.now().isoformat(), account_id))
        
        if goal_id:
            if transfer_type == 'deposit':
                cursor.execute('UPDATE savings_goals SET current_amount = current_amount + ?, updated_at = ? WHERE id = ?',
                             (amount, datetime.now().isoformat(), goal_id))
            elif transfer_type == 'withdrawal':
                # Check if sufficient amount
                cursor.execute('SELECT current_amount, name FROM savings_goals WHERE id = ?', (goal_id,))
                result = cursor.fetchone()
                if result and result['current_amount'] < amount:
                    conn.rollback()
                    conn.close()
                    return jsonify({
                        'error': 'Insufficient amount in goal',
                        'message': f'Målet "{result["name"]}" har bara {result["current_amount"]:.2f} kr men du försöker ta ut {amount:.2f} kr.'
                    }), 400
                cursor.execute('UPDATE savings_goals SET current_amount = current_amount - ?, updated_at = ? WHERE id = ?',
                             (amount, datetime.now().isoformat(), goal_id))
        
        conn.commit()
        
        cursor.execute('SELECT * FROM savings_transactions WHERE id = ?', (transaction_id,))
        new_transaction = dict(cursor.fetchone())
        
        conn.close()
        return jsonify(new_transaction), 201
        
    except Exception as e:
        conn.rollback()
        conn.close()
        print(f"[ERROR] Transfer failed: {str(e)}")
        return jsonify({'error': f'Transfer failed: {str(e)}'}), 500


@app.route('/api/savings/transactions', methods=['GET'])
def get_savings_transactions():
    """Get all savings transactions"""
    conn = get_db()
    cursor = conn.cursor()
    
    account_id = request.args.get('account_id', type=int)
    goal_id = request.args.get('goal_id', type=int)
    
    query = 'SELECT * FROM savings_transactions WHERE 1=1'
    params = []
    
    if account_id:
        query += ' AND account_id = ?'
        params.append(account_id)
    
    if goal_id:
        query += ' AND goal_id = ?'
        params.append(goal_id)
    
    query += ' ORDER BY date DESC, created_at DESC'
    
    cursor.execute(query, params)
    transactions = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return jsonify(transactions), 200


@app.route('/api/savings/link-transaction', methods=['POST'])
def link_transaction_to_savings():
    """Link a regular transaction to a savings goal or account"""
    data = request.get_json()
    
    required_fields = ['transaction_id', 'amount', 'date']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields: transaction_id, amount, date'}), 400
    
    transaction_id = data['transaction_id']
    account_id = data.get('account_id')
    goal_id = data.get('goal_id')
    amount = float(data['amount'])
    date = data['date']
    notes = data.get('notes', '')
    
    if not account_id and not goal_id:
        return jsonify({'error': 'Either account_id or goal_id must be provided'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Check if transaction exists
        cursor.execute('SELECT * FROM transactions WHERE id = ?', (transaction_id,))
        transaction = cursor.fetchone()
        if not transaction:
            conn.close()
            return jsonify({'error': 'Transaction not found'}), 404
        
        # Determine type based on is_withdrawal flag
        # If is_withdrawal is True, it's a withdrawal, otherwise it's always a deposit
        is_withdrawal = data.get('is_withdrawal', False)
        transfer_type = 'withdrawal' if is_withdrawal else 'deposit'
        
        # Create savings transaction record
        cursor.execute('''
            INSERT INTO savings_transactions (transaction_id, account_id, goal_id, amount, type, date, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (transaction_id, account_id, goal_id, amount, transfer_type, date, notes))
        
        savings_transaction_id = cursor.lastrowid
        
        # Update account balance or goal current_amount
        if account_id:
            if transfer_type == 'deposit':
                cursor.execute('UPDATE savings_accounts SET balance = balance + ?, updated_at = ? WHERE id = ?',
                             (amount, datetime.now().isoformat(), account_id))
            elif transfer_type == 'withdrawal':
                # Check if sufficient balance
                cursor.execute('SELECT balance, name FROM savings_accounts WHERE id = ?', (account_id,))
                result = cursor.fetchone()
                if result and result['balance'] < amount:
                    conn.rollback()
                    conn.close()
                    return jsonify({
                        'error': 'Insufficient balance',
                        'message': f'Kontot "{result["name"]}" har bara {result["balance"]:.2f} kr men du försöker ta ut {amount:.2f} kr.'
                    }), 400
                cursor.execute('UPDATE savings_accounts SET balance = balance - ?, updated_at = ? WHERE id = ?',
                             (amount, datetime.now().isoformat(), account_id))
        
        if goal_id:
            if transfer_type == 'deposit':
                cursor.execute('UPDATE savings_goals SET current_amount = current_amount + ?, updated_at = ? WHERE id = ?',
                             (amount, datetime.now().isoformat(), goal_id))
            elif transfer_type == 'withdrawal':
                # Check if sufficient amount
                cursor.execute('SELECT current_amount, name FROM savings_goals WHERE id = ?', (goal_id,))
                result = cursor.fetchone()
                if result and result['current_amount'] < amount:
                    conn.rollback()
                    conn.close()
                    return jsonify({
                        'error': 'Insufficient amount in goal',
                        'message': f'Målet "{result["name"]}" har bara {result["current_amount"]:.2f} kr men du försöker ta ut {amount:.2f} kr.'
                    }), 400
                cursor.execute('UPDATE savings_goals SET current_amount = current_amount - ?, updated_at = ? WHERE id = ?',
                             (amount, datetime.now().isoformat(), goal_id))
        
        conn.commit()
        
        cursor.execute('SELECT * FROM savings_transactions WHERE id = ?', (savings_transaction_id,))
        new_savings_transaction = dict(cursor.fetchone())
        
        conn.close()
        return jsonify(new_savings_transaction), 201
        
    except Exception as e:
        conn.rollback()
        conn.close()
        print(f"[ERROR] Link transaction failed: {str(e)}")
        return jsonify({'error': f'Link transaction failed: {str(e)}'}), 500


# ============================================================================
# LOANS ENDPOINTS
# ============================================================================

@app.route('/api/loans', methods=['GET'])
def get_loans():
    """Get all loans"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM loans ORDER BY created_at DESC')
    loans = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return jsonify(loans), 200


@app.route('/api/loans', methods=['POST', 'OPTIONS'])
def create_loan():
    """Create a new loan"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        required_fields = ['name', 'lender', 'principal_amount', 'current_balance', 'interest_rate', 'monthly_payment', 'amortization_amount', 'interest_amount', 'start_date']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Convert string numbers to float if needed
        principal_amount = float(data['principal_amount']) if isinstance(data['principal_amount'], str) else data['principal_amount']
        current_balance = float(data['current_balance']) if isinstance(data['current_balance'], str) else data['current_balance']
        interest_rate = float(data['interest_rate']) if isinstance(data['interest_rate'], str) else data['interest_rate']
        monthly_payment = float(data['monthly_payment']) if isinstance(data['monthly_payment'], str) else data['monthly_payment']
        amortization_amount = float(data['amortization_amount']) if isinstance(data['amortization_amount'], str) else data['amortization_amount']
        interest_amount = float(data['interest_amount']) if isinstance(data['interest_amount'], str) else data['interest_amount']
        
        cursor.execute('''
            INSERT INTO loans (
                name, lender, principal_amount, current_balance, interest_rate,
                monthly_payment, amortization_amount, interest_amount, start_date,
                end_date, status, category, note, agreement_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['name'],
            data['lender'],
            principal_amount,
            current_balance,
            interest_rate,
            monthly_payment,
            amortization_amount,
            interest_amount,
            data['start_date'],
            data.get('end_date') or None,
            data.get('status', 'Aktiv'),
            data.get('category', 'Bolån'),
            data.get('note', ''),
            data.get('agreement_id') or None
        ))
        
        loan_id = cursor.lastrowid
        conn.commit()
        
        # Create initial interest period
        cursor.execute('''
            INSERT INTO loan_interest_periods (loan_id, start_date, interest_rate, note)
            VALUES (?, ?, ?, ?)
        ''', (loan_id, data['start_date'], interest_rate, 'Initial räntesats'))
        conn.commit()
        
        cursor.execute('SELECT * FROM loans WHERE id = ?', (loan_id,))
        new_loan = dict(cursor.fetchone())
        
        conn.close()
        return jsonify(new_loan), 201
    except Exception as e:
        import traceback
        error_msg = str(e)
        traceback.print_exc()
        return jsonify({'error': f'Error creating loan: {error_msg}'}), 500


@app.route('/api/loans/<int:loan_id>', methods=['PUT'])
def update_loan(loan_id):
    """Update a loan"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    update_fields = []
    values = []
    allowed_fields = ['name', 'lender', 'principal_amount', 'current_balance', 'interest_rate', 
                     'monthly_payment', 'amortization_amount', 'interest_amount', 'start_date',
                     'end_date', 'status', 'category', 'note', 'agreement_id']
    
    for field in allowed_fields:
        if field in data:
            update_fields.append(f'{field} = ?')
            values.append(data[field])
    
    if not update_fields:
        conn.close()
        return jsonify({'error': 'No valid fields to update'}), 400
    
    update_fields.append('updated_at = ?')
    values.append(datetime.now().isoformat())
    values.append(loan_id)
    
    cursor.execute(f'''
        UPDATE loans 
        SET {', '.join(update_fields)}
        WHERE id = ?
    ''', values)
    
    conn.commit()
    
    cursor.execute('SELECT * FROM loans WHERE id = ?', (loan_id,))
    updated_loan = cursor.fetchone()
    
    conn.close()
    
    if updated_loan:
        return jsonify(dict(updated_loan)), 200
    return jsonify({'error': 'Loan not found'}), 404


@app.route('/api/loans/<int:loan_id>', methods=['DELETE'])
def delete_loan(loan_id):
    """Delete a loan"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM loans WHERE id = ?', (loan_id,))
    conn.commit()
    
    deleted = cursor.rowcount > 0
    conn.close()
    
    if deleted:
        return jsonify({'message': 'Loan deleted successfully'}), 200
    return jsonify({'error': 'Loan not found'}), 404


@app.route('/api/loans/<int:loan_id>/payments', methods=['GET'])
def get_loan_payments(loan_id):
    """Get all payments for a loan"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM loan_payments WHERE loan_id = ? ORDER BY payment_date DESC', (loan_id,))
    payments = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return jsonify(payments), 200


@app.route('/api/loans/<int:loan_id>/payments', methods=['POST'])
def create_loan_payment(loan_id):
    """Create a loan payment"""
    data = request.get_json()
    
    required_fields = ['payment_date', 'amount', 'principal_paid', 'interest_paid']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Verify loan exists
    cursor.execute('SELECT * FROM loans WHERE id = ?', (loan_id,))
    loan = cursor.fetchone()
    if not loan:
        conn.close()
        return jsonify({'error': 'Loan not found'}), 404
    
    loan_dict = dict(loan)
    
    cursor.execute('''
        INSERT INTO loan_payments (
            loan_id, transaction_id, payment_date, amount,
            principal_paid, interest_paid, extra_payment, note
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        loan_id,
        data.get('transaction_id'),
        data['payment_date'],
        data['amount'],
        data['principal_paid'],
        data['interest_paid'],
        data.get('extra_payment', 0),
        data.get('note', '')
    ))
    
    payment_id = cursor.lastrowid
    
    # Update loan balance
    new_balance = loan_dict['current_balance'] - data['principal_paid'] - data.get('extra_payment', 0)
    cursor.execute('UPDATE loans SET current_balance = ?, updated_at = ? WHERE id = ?',
                 (max(0, new_balance), datetime.now().isoformat(), loan_id))
    
    conn.commit()
    
    cursor.execute('SELECT * FROM loan_payments WHERE id = ?', (payment_id,))
    new_payment = dict(cursor.fetchone())
    
    conn.close()
    return jsonify(new_payment), 201


@app.route('/api/loans/<int:loan_id>/interest-periods', methods=['GET'])
def get_loan_interest_periods(loan_id):
    """Get all interest periods for a loan"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM loan_interest_periods WHERE loan_id = ? ORDER BY start_date DESC', (loan_id,))
    periods = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return jsonify(periods), 200


@app.route('/api/loans/<int:loan_id>/interest-periods', methods=['POST'])
def create_loan_interest_period(loan_id):
    """Create a new interest period (for variable interest rates)"""
    data = request.get_json()
    
    required_fields = ['start_date', 'interest_rate']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields: start_date, interest_rate'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Verify loan exists
    cursor.execute('SELECT id FROM loans WHERE id = ?', (loan_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({'error': 'Loan not found'}), 404
    
    # End previous period if it exists
    cursor.execute('''
        UPDATE loan_interest_periods 
        SET end_date = ?
        WHERE loan_id = ? AND end_date IS NULL
    ''', (data['start_date'], loan_id))
    
    # Create new period
    cursor.execute('''
        INSERT INTO loan_interest_periods (loan_id, start_date, end_date, interest_rate, note)
        VALUES (?, ?, ?, ?, ?)
    ''', (
        loan_id,
        data['start_date'],
        data.get('end_date'),
        data['interest_rate'],
        data.get('note', '')
    ))
    
    period_id = cursor.lastrowid
    conn.commit()
    
    cursor.execute('SELECT * FROM loan_interest_periods WHERE id = ?', (period_id,))
    new_period = dict(cursor.fetchone())
    
    conn.close()
    return jsonify(new_period), 201


@app.route('/api/loans/<int:loan_id>/amortization-plan', methods=['GET'])
def get_amortization_plan(loan_id):
    """Calculate and return amortization plan for a loan"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM loans WHERE id = ?', (loan_id,))
    loan = cursor.fetchone()
    if not loan:
        conn.close()
        return jsonify({'error': 'Loan not found'}), 404
    
    loan_dict = dict(loan)
    
    # Get all interest periods
    cursor.execute('SELECT * FROM loan_interest_periods WHERE loan_id = ? ORDER BY start_date', (loan_id,))
    periods = [dict(row) for row in cursor.fetchall()]
    
    # Get all payments
    cursor.execute('SELECT * FROM loan_payments WHERE loan_id = ? ORDER BY payment_date', (loan_id,))
    payments = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    # Calculate amortization plan
    def add_months(date, months):
        """Add months to a date"""
        month = date.month - 1 + months
        year = date.year + month // 12
        month = month % 12 + 1
        day = min(date.day, [31, 29 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month-1])
        return datetime(year, month, day)
    
    plan = []
    current_balance = loan_dict['current_balance']
    current_date = datetime.strptime(loan_dict['start_date'], '%Y-%m-%d')
    end_date = datetime.strptime(loan_dict['end_date'], '%Y-%m-%d') if loan_dict.get('end_date') else None
    
    # If no end date, calculate for 30 years or until balance is 0
    if not end_date:
        end_date = add_months(current_date, 30 * 12)
    
    month = 0
    while current_balance > 0.01 and current_date <= end_date:
        # Get current interest rate for this period
        current_rate = loan_dict['interest_rate']
        for period in periods:
            period_start = datetime.strptime(period['start_date'], '%Y-%m-%d')
            period_end = datetime.strptime(period['end_date'], '%Y-%m-%d') if period.get('end_date') else datetime.now()
            if period_start <= current_date <= period_end:
                current_rate = period['interest_rate']
                break
        
        # Calculate monthly interest
        monthly_interest_rate = current_rate / 100 / 12
        interest_payment = current_balance * monthly_interest_rate
        
        # Get payment for this month if exists
        payment_for_month = next((p for p in payments if p['payment_date'].startswith(current_date.strftime('%Y-%m'))), None)
        
        if payment_for_month:
            principal_paid = payment_for_month['principal_paid']
            extra_payment = payment_for_month.get('extra_payment', 0)
        else:
            principal_paid = loan_dict['amortization_amount']
            extra_payment = 0
        
        total_payment = interest_payment + principal_paid + extra_payment
        current_balance = max(0, current_balance - principal_paid - extra_payment)
        
        plan.append({
            'month': month + 1,
            'date': current_date.strftime('%Y-%m-%d'),
            'balance': round(current_balance, 2),
            'principal_paid': round(principal_paid, 2),
            'interest_paid': round(interest_payment, 2),
            'extra_payment': round(extra_payment, 2),
            'total_payment': round(total_payment, 2),
            'interest_rate': current_rate
        })
        
        current_date = add_months(current_date, 1)
        month += 1
        
        if month > 600:  # Safety limit
            break
    
    return jsonify(plan), 200


@app.route('/api/loans/link-transaction', methods=['POST'])
def link_transaction_to_loan():
    """Link a transaction to a loan payment"""
    data = request.get_json()
    
    required_fields = ['transaction_id', 'loan_id', 'payment_date', 'amount', 'principal_paid', 'interest_paid']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    transaction_id = data['transaction_id']
    loan_id = data['loan_id']
    payment_date = data['payment_date']
    amount = float(data['amount'])
    principal_paid = float(data['principal_paid'])
    interest_paid = float(data['interest_paid'])
    extra_payment = float(data.get('extra_payment', 0))
    note = data.get('note', '')
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Check if transaction exists
        cursor.execute('SELECT * FROM transactions WHERE id = ?', (transaction_id,))
        transaction = cursor.fetchone()
        if not transaction:
            conn.close()
            return jsonify({'error': 'Transaction not found'}), 404
        
        # Check if loan exists
        cursor.execute('SELECT * FROM loans WHERE id = ?', (loan_id,))
        loan = cursor.fetchone()
        if not loan:
            conn.close()
            return jsonify({'error': 'Loan not found'}), 404
        
        loan_dict = dict(loan)
        
        # Check if payment already exists for this transaction
        cursor.execute('SELECT * FROM loan_payments WHERE transaction_id = ?', (transaction_id,))
        existing = cursor.fetchone()
        if existing:
            conn.close()
            return jsonify({'error': 'Transaction already linked to a loan payment'}), 400
        
        # Create loan payment linked to transaction
        cursor.execute('''
            INSERT INTO loan_payments (
                loan_id, transaction_id, payment_date, amount,
                principal_paid, interest_paid, extra_payment, note
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            loan_id,
            transaction_id,
            payment_date,
            amount,
            principal_paid,
            interest_paid,
            extra_payment,
            note or f'Kopplad från transaktion: {dict(transaction)["title"]}'
        ))
        
        payment_id = cursor.lastrowid
        
        # Update loan balance
        new_balance = loan_dict['current_balance'] - principal_paid - extra_payment
        cursor.execute('UPDATE loans SET current_balance = ?, updated_at = ? WHERE id = ?',
                     (max(0, new_balance), datetime.now().isoformat(), loan_id))
        
        conn.commit()
        
        cursor.execute('SELECT * FROM loan_payments WHERE id = ?', (payment_id,))
        new_payment = dict(cursor.fetchone())
        
        conn.close()
        return jsonify(new_payment), 201
        
    except Exception as e:
        conn.rollback()
        conn.close()
        print(f"[ERROR] Link transaction to loan failed: {str(e)}")
        return jsonify({'error': f'Link transaction to loan failed: {str(e)}'}), 500


# ============================================================================
# LINK TRANSACTION TO VEHICLE ENDPOINT
# ============================================================================

@app.route('/api/vehicles/link-transaction', methods=['POST'])
def link_transaction_to_vehicle():
    """Link a transaction to a vehicle, creating a vehicle expense"""
    data = request.get_json()
    
    required_fields = ['transaction_id', 'vehicle_id', 'amount', 'date']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields: transaction_id, vehicle_id, amount, date'}), 400
    
    transaction_id = data['transaction_id']
    vehicle_id = data['vehicle_id']
    amount = float(data['amount'])
    date = data['date']
    category = data.get('category', 'Övrigt')
    description = data.get('description', '')
    note = data.get('note', '')
    odometer_at_purchase = data.get('odometer_at_purchase')
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Check if transaction exists
        cursor.execute('SELECT * FROM transactions WHERE id = ?', (transaction_id,))
        transaction = cursor.fetchone()
        if not transaction:
            conn.close()
            return jsonify({'error': 'Transaction not found'}), 404
        
        # Check if vehicle exists
        cursor.execute('SELECT * FROM vehicles WHERE id = ?', (vehicle_id,))
        vehicle_row = cursor.fetchone()
        if not vehicle_row:
            conn.close()
            return jsonify({'error': 'Vehicle not found'}), 404
        vehicle = dict(vehicle_row)
        
        # Check if expense already exists for this transaction
        cursor.execute('SELECT * FROM vehicle_expenses WHERE transaction_id = ?', (transaction_id,))
        existing = cursor.fetchone()
        if existing:
            conn.close()
            return jsonify({'error': 'Transaction already linked to a vehicle expense'}), 400
        
        # Create vehicle expense linked to transaction
        cursor.execute('''
            INSERT INTO vehicle_expenses (
                vehicle_id, category, amount, date, description,
                note, odometer_at_purchase, transaction_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            vehicle_id,
            category,
            amount,
            date,
            description or transaction['title'],
            note or f'Kopplad från transaktion: {transaction["title"]}',
            odometer_at_purchase,
            transaction_id
        ))
        
        expense_id = cursor.lastrowid
        conn.commit()
        
        cursor.execute('SELECT * FROM vehicle_expenses WHERE id = ?', (expense_id,))
        new_expense = dict(cursor.fetchone())
        
        conn.close()
        return jsonify(new_expense), 201
        
    except Exception as e:
        conn.rollback()
        conn.close()
        print(f"[ERROR] Link transaction to vehicle failed: {str(e)}")
        return jsonify({'error': f'Link transaction to vehicle failed: {str(e)}'}), 500


# ============================================================================
# MEDIA FILES ENDPOINT
# ============================================================================

@app.route('/api/media-files', methods=['GET'])
def get_media_files():
    """Get all media files (receipts and agreement images) with metadata"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Get storage paths from settings
        cursor.execute('SELECT value FROM settings WHERE key = ?', ('receipt_storage_path',))
        receipt_path_result = cursor.fetchone()
        receipt_storage_path = receipt_path_result['value'] if receipt_path_result else app.config['UPLOAD_FOLDER']
        
        cursor.execute('SELECT value FROM settings WHERE key = ?', ('agreement_images_path',))
        agreement_path_result = cursor.fetchone()
        agreement_images_path = agreement_path_result['value'] if agreement_path_result else os.path.join(app.config['UPLOAD_FOLDER'], 'avtal')
        
        media_files = []
        
        # Get all transactions with receipts
        cursor.execute('SELECT id, title, date, receipt_path FROM transactions WHERE receipt = 1 AND receipt_path IS NOT NULL')
        transactions = cursor.fetchall()
        
        for trans in transactions:
            receipt_path = trans['receipt_path']
            if receipt_path and os.path.exists(receipt_path):
                file_size = os.path.getsize(receipt_path)
                media_files.append({
                    'type': 'receipt',
                    'filename': os.path.basename(receipt_path),
                    'path': receipt_path,
                    'size': file_size,
                    'date': trans['date'],
                    'transaction_id': trans['id'],
                    'transaction_title': trans['title']
                })
        
        # Get all agreement images
        cursor.execute('SELECT id, name, images FROM agreements WHERE images IS NOT NULL AND images != ""')
        agreements = cursor.fetchall()
        
        for agr in agreements:
            images_str = agr['images']
            if images_str:
                try:
                    import json
                    images = json.loads(images_str) if isinstance(images_str, str) else images_str
                    if isinstance(images, list):
                        for img_path in images:
                            if img_path and os.path.exists(img_path):
                                file_size = os.path.getsize(img_path)
                                media_files.append({
                                    'type': 'agreement',
                                    'filename': os.path.basename(img_path),
                                    'path': img_path,
                                    'size': file_size,
                                    'date': None,  # Agreements don't have a specific date
                                    'agreement_id': agr['id'],
                                    'agreement_name': agr['name']
                                })
                except (json.JSONDecodeError, TypeError):
                    # If images is a single string path
                    if isinstance(images_str, str) and os.path.exists(images_str):
                        file_size = os.path.getsize(images_str)
                        media_files.append({
                            'type': 'agreement',
                            'filename': os.path.basename(images_str),
                            'path': images_str,
                            'size': file_size,
                            'date': None,
                            'agreement_id': agr['id'],
                            'agreement_name': agr['name']
                        })
        
        conn.close()
        
        return jsonify(media_files), 200
        
    except Exception as e:
        print(f"❌ [Backend] Error getting media files: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to get media files: {str(e)}'}), 500


# ============================================================================
# BACKUP & RESTORE ENDPOINTS
# ============================================================================

@app.route('/api/backup/create', methods=['POST', 'OPTIONS'])
def create_backup():
    """Create a backup ZIP file containing database and all images"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Create temporary directory for backup
        temp_dir = tempfile.mkdtemp()
        backup_dir = os.path.join(temp_dir, 'westbudget_backup')
        os.makedirs(backup_dir, exist_ok=True)
        
        # 1. Copy database
        if os.path.exists(DATABASE):
            shutil.copy2(DATABASE, os.path.join(backup_dir, DATABASE))
            print(f"[Backup] Database copied: {DATABASE}")
        else:
            return jsonify({'error': 'Database file not found'}), 404
        
        # 2. Copy all images from uploads folder
        uploads_backup_dir = os.path.join(backup_dir, 'uploads')
        if os.path.exists(UPLOAD_FOLDER):
            shutil.copytree(UPLOAD_FOLDER, uploads_backup_dir, dirs_exist_ok=True)
            print(f"[Backup] Uploads folder copied: {UPLOAD_FOLDER}")
        
        # 3. Get custom image paths from settings and copy them too
        conn = get_db()
        cursor = conn.cursor()
        
        # Get receipt storage path
        cursor.execute('SELECT value FROM settings WHERE key = ?', ('receipt_storage_path',))
        receipt_path_result = cursor.fetchone()
        if receipt_path_result and receipt_path_result['value']:
            receipt_path = receipt_path_result['value']
            if os.path.exists(receipt_path) and receipt_path != UPLOAD_FOLDER:
                # Copy to backup/uploads/receipts
                receipts_backup = os.path.join(uploads_backup_dir, 'receipts')
                os.makedirs(receipts_backup, exist_ok=True)
                for item in os.listdir(receipt_path):
                    src = os.path.join(receipt_path, item)
                    dst = os.path.join(receipts_backup, item)
                    if os.path.isfile(src):
                        shutil.copy2(src, dst)
                    elif os.path.isdir(src):
                        shutil.copytree(src, dst, dirs_exist_ok=True)
                print(f"[Backup] Custom receipts folder copied: {receipt_path}")
        
        # Get agreement images path
        cursor.execute('SELECT value FROM settings WHERE key = ?', ('agreement_images_path',))
        agreement_path_result = cursor.fetchone()
        if agreement_path_result and agreement_path_result['value']:
            agreement_path = agreement_path_result['value']
            default_agreement_path = os.path.join(UPLOAD_FOLDER, 'avtal')
            if os.path.exists(agreement_path) and agreement_path != default_agreement_path:
                # Copy to backup/uploads/avtal
                avtal_backup = os.path.join(uploads_backup_dir, 'avtal')
                os.makedirs(avtal_backup, exist_ok=True)
                for item in os.listdir(agreement_path):
                    src = os.path.join(agreement_path, item)
                    dst = os.path.join(avtal_backup, item)
                    if os.path.isfile(src):
                        shutil.copy2(src, dst)
                    elif os.path.isdir(src):
                        shutil.copytree(src, dst, dirs_exist_ok=True)
                print(f"[Backup] Custom agreement images folder copied: {agreement_path}")
        
        # Get vehicle images path
        cursor.execute('SELECT value FROM settings WHERE key = ?', ('vehicle_images_path',))
        vehicle_path_result = cursor.fetchone()
        if vehicle_path_result and vehicle_path_result['value']:
            vehicle_path = vehicle_path_result['value']
            default_vehicle_path = os.path.join(UPLOAD_FOLDER, 'vehicles')
            if os.path.exists(vehicle_path) and vehicle_path != default_vehicle_path:
                # Copy to backup/uploads/vehicles
                vehicles_backup = os.path.join(uploads_backup_dir, 'vehicles')
                os.makedirs(vehicles_backup, exist_ok=True)
                for item in os.listdir(vehicle_path):
                    src = os.path.join(vehicle_path, item)
                    dst = os.path.join(vehicles_backup, item)
                    if os.path.isfile(src):
                        shutil.copy2(src, dst)
                    elif os.path.isdir(src):
                        shutil.copytree(src, dst, dirs_exist_ok=True)
                print(f"[Backup] Custom vehicle images folder copied: {vehicle_path}")
        
        conn.close()
        
        # 4. Create ZIP file
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        zip_filename = f'westbudget_backup_{timestamp}.zip'
        zip_path = os.path.join(temp_dir, zip_filename)
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(backup_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, backup_dir)
                    zipf.write(file_path, arcname)
        
        print(f"[Backup] ZIP file created: {zip_path}")
        
        # 5. Return ZIP file
        return send_file(
            zip_path,
            mimetype='application/zip',
            as_attachment=True,
            download_name=zip_filename
        )
        
    except Exception as e:
        print(f"[Backup] Error creating backup: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Backup failed: {str(e)}'}), 500
    finally:
        # Cleanup temporary directory after a delay (to allow file download)
        # Note: In production, you might want to use a background task for cleanup
        pass


@app.route('/api/backup/restore', methods=['POST', 'OPTIONS'])
def restore_backup():
    """Restore from a backup ZIP file"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No backup file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.endswith('.zip'):
            return jsonify({'error': 'Invalid backup file. Must be a ZIP file.'}), 400
        
        # Save uploaded ZIP to temporary location
        temp_dir = tempfile.mkdtemp()
        zip_path = os.path.join(temp_dir, file.filename)
        file.save(zip_path)
        
        # Extract ZIP
        extract_dir = os.path.join(temp_dir, 'extracted')
        os.makedirs(extract_dir, exist_ok=True)
        
        with zipfile.ZipFile(zip_path, 'r') as zipf:
            zipf.extractall(extract_dir)
        
        # Find database file
        db_path = None
        for root, dirs, files in os.walk(extract_dir):
            if DATABASE in files:
                db_path = os.path.join(root, DATABASE)
                break
        
        if not db_path:
            return jsonify({'error': 'Database file not found in backup'}), 400
        
        # Backup current database before restore
        current_db_backup = f'{DATABASE}.backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
        if os.path.exists(DATABASE):
            shutil.copy2(DATABASE, current_db_backup)
            print(f"[Restore] Current database backed up to: {current_db_backup}")
        
        # Replace database
        shutil.copy2(db_path, DATABASE)
        print(f"[Restore] Database restored from backup")
        
        # Restore images
        uploads_backup = os.path.join(extract_dir, 'uploads')
        if os.path.exists(uploads_backup):
            # Remove existing uploads folder
            if os.path.exists(UPLOAD_FOLDER):
                shutil.rmtree(UPLOAD_FOLDER)
            # Copy backup uploads
            shutil.copytree(uploads_backup, UPLOAD_FOLDER, dirs_exist_ok=True)
            print(f"[Restore] Uploads folder restored")
        
        # Restore custom image paths if they exist in backup
        conn = get_db()
        cursor = conn.cursor()
        
        # Check for custom receipt path
        receipts_backup = os.path.join(uploads_backup, 'receipts')
        if os.path.exists(receipts_backup):
            cursor.execute('SELECT value FROM settings WHERE key = ?', ('receipt_storage_path',))
            result = cursor.fetchone()
            if result and result['value']:
                receipt_path = result['value']
                if os.path.exists(receipt_path):
                    shutil.rmtree(receipt_path)
                shutil.copytree(receipts_backup, receipt_path, dirs_exist_ok=True)
                print(f"[Restore] Custom receipts folder restored: {receipt_path}")
        
        # Check for custom agreement images path
        avtal_backup = os.path.join(uploads_backup, 'avtal')
        if os.path.exists(avtal_backup):
            cursor.execute('SELECT value FROM settings WHERE key = ?', ('agreement_images_path',))
            result = cursor.fetchone()
            if result and result['value']:
                agreement_path = result['value']
                default_agreement_path = os.path.join(UPLOAD_FOLDER, 'avtal')
                if agreement_path != default_agreement_path and os.path.exists(agreement_path):
                    shutil.rmtree(agreement_path)
                    shutil.copytree(avtal_backup, agreement_path, dirs_exist_ok=True)
                    print(f"[Restore] Custom agreement images folder restored: {agreement_path}")
        
        # Check for custom vehicle images path
        vehicles_backup = os.path.join(uploads_backup, 'vehicles')
        if os.path.exists(vehicles_backup):
            cursor.execute('SELECT value FROM settings WHERE key = ?', ('vehicle_images_path',))
            result = cursor.fetchone()
            if result and result['value']:
                vehicle_path = result['value']
                default_vehicle_path = os.path.join(UPLOAD_FOLDER, 'vehicles')
                if vehicle_path != default_vehicle_path and os.path.exists(vehicle_path):
                    shutil.rmtree(vehicle_path)
                    shutil.copytree(vehicles_backup, vehicle_path, dirs_exist_ok=True)
                    print(f"[Restore] Custom vehicle images folder restored: {vehicle_path}")
        
        conn.close()
        
        # Cleanup
        shutil.rmtree(temp_dir)
        
        return jsonify({
            'message': 'Backup restored successfully',
            'warning': 'Please restart the application to see the restored data'
        }), 200
        
    except Exception as e:
        print(f"[Restore] Error restoring backup: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Restore failed: {str(e)}'}), 500


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    # Initialize database on startup
    init_db()
    
    print("=" * 50)
    print("🚀 WestBudget Backend Server")
    print("=" * 50)
    print(f"📊 Database: {DATABASE}")
    print(f"📁 Upload folder: {UPLOAD_FOLDER}")
    print(f"🌐 Server: http://0.0.0.0:5000")
    print(f"🌐 Network: http://192.168.1.232:5000")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=5000, debug=True)
