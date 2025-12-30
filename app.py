import os
import json
import zipfile
import shutil
import tempfile
import bcrypt
import jwt
import secrets
import stripe
import sys
import io
import psycopg
from psycopg.rows import dict_row
from supabase import create_client, Client
from datetime import datetime, timedelta
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS, cross_origin
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.utils import secure_filename
from functools import wraps
from dotenv import load_dotenv
import threading
import time
from datetime import datetime, timedelta
from email_service import send_email, send_welcome_email, send_credentials_email, send_trial_expiring_email

# Load environment variables
# Load environment variables
if getattr(sys, 'frozen', False):
    # If we are running as a bundle (frozen)
    base_dir = os.path.dirname(sys.executable)
    env_path = os.path.join(base_dir, '.env')
    print(f"DEBUG: Frozen execution. Base dir: {base_dir}")
    print(f"DEBUG: Looking for .env at: {env_path}")
    if os.path.exists(env_path):
        print("DEBUG: .env file FOUND.")
    else:
        print("DEBUG: .env file NOT FOUND!")
        # Try one level up just in case (e.g. if we are in resources and .env is in app root, unlikely but possible)
        parent_env = os.path.join(os.path.dirname(base_dir), '.env')
        if os.path.exists(parent_env):
             print(f"DEBUG: Found .env in parent: {parent_env}")
             env_path = parent_env
        
    load_dotenv(env_path)
else:
    # If we are running in a normal Python environment
    print(f"DEBUG: Normal execution. CWD: {os.getcwd()}")
    try: 
        load_dotenv() 
    except: pass

print(f"DEBUG: JWT_SECRET_KEY loaded: {'Yes' if os.environ.get('JWT_SECRET_KEY') else 'No'}")
print(f"DEBUG: DATABASE_URL is: {os.environ.get('DATABASE_URL')}")
print(f"DEBUG: STRIPE_SECRET_KEY present: {'Yes' if os.environ.get('STRIPE_SECRET_KEY') else 'No'}")
print(f"DEBUG: SENDGRID_API_KEY present: {'Yes' if os.environ.get('SENDGRID_API_KEY') else 'No'}")

app = Flask(__name__)
# Enable CORS for frontend with credentials support
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5100", "http://localhost:3000", "https://westbudget.netlify.app", "http://192.168.1.240:5000", "http://192.168.1.240"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        "supports_credentials": True,
        "expose_headers": ["Content-Type", "Content-Disposition"]
    }
}, supports_credentials=True)

# Force UTF-8 encoding for stdout/stderr to avoid cp1252 errors in Windows console
if sys.stdout:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
if sys.stderr:
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Configuration
if getattr(sys, 'frozen', False):
    app_path = os.path.dirname(sys.executable)
    bundle_dir = sys._MEIPASS
else:
    bundle_dir = os.path.dirname(os.path.abspath(__file__))

# Supabase Configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
DATABASE_URL = os.environ.get("DATABASE_URL")

# Initialize Supabase Client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif'}
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', secrets.token_urlsafe(32))
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24 * 7

# Upload Directory Configuration
UPLOAD_FOLDER = os.path.join(os.environ.get('APPDATA', os.getcwd()), 'WestBudget', 'uploads')

# Ensure upload directory exists (kept for temp processing or fallback)
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size
app.config['JWT_SECRET_KEY'] = JWT_SECRET_KEY

# Setup Rate Limiting
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=[],
    storage_uri="memory://"
)
limiter.enabled = False

import bcrypt
import jwt
import stripe
import sendgrid

# Configure Stripe
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY = os.environ.get("STRIPE_PUBLISHABLE_KEY")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET")
STRIPE_PRICE_ID = os.environ.get("STRIPE_PRICE_ID")

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

# Configure SendGrid
SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY")
SENDGRID_FROM_EMAIL = os.environ.get("SENDGRID_FROM_EMAIL")
SENDGRID_FROM_NAME = os.environ.get("SENDGRID_FROM_NAME", "WestBudget")

sendgrid_client = sendgrid.SendGridAPIClient(SENDGRID_API_KEY) if SENDGRID_API_KEY else None

# --- Helper Classes for Postgres Compatibility ---

class PostgresCursorWrapper:
    """Wrapper to make psycopg cursor behave like sqlite3 cursor for easier migration"""
    def __init__(self, cursor):
        self.cursor = cursor
        self.lastrowid = None
        self.rowcount = 0

    def execute(self, query, params=None):
        # Translate SQLite ? placeholders to Postgres %s
        pg_query = query.replace('?', '%s')
        
            # Determine if it's an INSERT/UPDATE that needs RETURNING id for lastrowid
        is_insert = pg_query.strip().upper().startswith("INSERT")
        
        try:
            if is_insert and "RETURNING" not in pg_query.upper():
                 pg_query += " RETURNING id"
                 if params:
                     self.cursor.execute(pg_query, params)
                 else:
                     self.cursor.execute(pg_query)
                 
                 # Fetch the new ID
                 result = self.cursor.fetchone()
                 if result:
                     self.lastrowid = result['id'] # Uses dict access because of dict_row factory
                 self.rowcount = self.cursor.rowcount
            else:
                 if params:
                     self.cursor.execute(pg_query, params)
                 else:
                     self.cursor.execute(pg_query)
                 self.lastrowid = None # Reset if not insert
                 self.rowcount = self.cursor.rowcount
                 
        except Exception as e:
            # Re-raise or handle
            raise e
            
    def fetchone(self):
        return self.cursor.fetchone()
        
    def fetchall(self):
        return self.cursor.fetchall()
        
    def close(self):
        self.cursor.close()

from psycopg_pool import ConnectionPool

# Global Connection Pool
pool = None

class PostgresConnectionWrapper:
    """Wrapper for psycopg connection that returns it to the pool on close"""
    def __init__(self, conn, pool=None):
        self.conn = conn
        self.pool = pool

    def cursor(self):
        return PostgresCursorWrapper(self.conn.cursor())

    def commit(self):
        self.conn.commit()

    def close(self):
        if self.pool:
            self.pool.putconn(self.conn)
        else:
            self.conn.close()

def init_db_pool():
    global pool
    if pool is None:
        try:
            print("DATA BASE URL: ", os.environ.get("DATABASE_URL"))
            pool = ConnectionPool(
                os.environ.get("DATABASE_URL"),
                min_size=0, # Don't hold connections (Supabase Transaction Pooler best practice)
                max_size=20,
                max_lifetime=300, # Recycle connections every 5 minutes
                kwargs={
                    "row_factory": dict_row,
                    "connect_timeout": 10
                }
            )
            print("✅ Database Connection Pool Initialized")
        except Exception as e:
            print(f"❌ Failed to initialize DB pool: {e}")
            # Do not raise here, allow app to start, but get_db will fail if pool is None

def get_db():
    """Get database connection from pool"""
    global pool
    if pool is None:
        init_db_pool()
    
    try:
        conn = pool.getconn()
        return PostgresConnectionWrapper(conn, pool)
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        raise e

# Initialize pool on startup (best effort)
if os.environ.get("DATABASE_URL"):
    init_db_pool()






# ============================================================================
# DATABASE HELPERS
# ============================================================================

# The PostgresCursorWrapper and PostgresConnectionWrapper are now defined above.

# The get_db function is now defined above.



# ============================================================================
# AUTH DECORATORS
# ============================================================================

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == 'OPTIONS':
            return jsonify({'status': 'ok'}), 200

        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'message': 'Token is missing'}), 401
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
            
        try:
            data = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=["HS256"])
            request.current_user = data
        except Exception as e:
            return jsonify({'message': 'Token is invalid', 'error': str(e)}), 401
            
        return f(*args, **kwargs)
    return decorated

def require_role(role):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if request.method == 'OPTIONS':
                return jsonify({'status': 'ok'}), 200
                
            if not hasattr(request, 'current_user') or not request.current_user:
                return jsonify({'message': 'Authentication required'}), 401
            
            # Check if role matches
            # We assume request.current_user has 'role' from the token
            # If not in token, you might need to query DB here, but for now we try token
            user_role = request.current_user.get('role')
            if user_role != role:
                 return jsonify({'error': 'Forbidden: Insufficient permissions'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# ============================================================================
# AUTH ROUTES
# ============================================================================

@app.route('/auth/me', methods=['GET', 'OPTIONS'])
@require_auth
def get_current_user():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
        
    try:
        user_id = request.current_user['user_id']
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, role, created_at, last_login FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        conn.close()
        
        if user:
            return jsonify(dict(user)), 200
        return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/auth/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
        
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
            
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify({'error': 'User already exists'}), 400
            
        # Hash password
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Insert user
        cursor.execute(
            "INSERT INTO users (email, password_hash, role, created_at) VALUES (%s, %s, 'user', NOW()) RETURNING id",
            (email, password_hash)
        )
        user_id = cursor.fetchone()['id']
        conn.commit()
        conn.commit()
        conn.close()
        
        # Send welcome email using our new service (which also logs it)
        try:
            send_welcome_email(email, user_id)
        except Exception as e:
            print(f"Failed to send welcome email: {e}") 

        return jsonify({'message': 'User created', 'user_id': user_id}), 201
        
    except Exception as e:
        print(f"Error registering user: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/auth/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
        
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        if user and bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            # Update last login
            cursor.execute("UPDATE users SET last_login = NOW() WHERE id = %s", (user['id'],))
            conn.commit()
            conn.close()
            
            # Generate JWT
            token = jwt.encode({
                'user_id': user['id'],
                'role': user['role'],
                'exp': datetime.utcnow() + timedelta(hours=24)
            }, app.config['JWT_SECRET_KEY'], algorithm='HS256')
            
            return jsonify({
                'token': token,
                'user': {
                    'id': user['id'],
                    'email': user['email'],
                    'role': user['role']
                }
            }), 200
            
        return jsonify({'error': 'Invalid credentials'}), 401
        
    except Exception as e:
        print(f"Error logging in: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/settings', methods=['GET', 'POST'])
def handle_settings():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    try:
        conn = get_db()
        cursor = conn.cursor()
        
        if request.method == 'GET':
            cursor.execute("SELECT key, value FROM settings")
            rows = cursor.fetchall()
            settings = {row['key']: row['value'] for row in rows}
            conn.close()
            return jsonify(settings), 200
            
        # Handle POST
        data = request.json
        for key, value in data.items():
            cursor.execute(
                "INSERT INTO settings (key, value) VALUES (%s, %s) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
                (key, str(value))
            )
        conn.commit()
        conn.close()
        return jsonify({'message': 'Settings saved'}), 200
        
    except Exception as e:
        print(f"Error handling settings: {e}")
        return jsonify({'error': str(e)}), 500



# ============================================================================
# INITIALIZATION
# ============================================================================

def init_db():
    """Verify database connection"""
    try:
        conn = get_db()
        print("✅ Connected to PostgreSQL database successfully!")
        
        # Ensure 'receipts' bucket exists in Supabase Storage
        if supabase:
            try:
                buckets = supabase.storage.list_buckets()
                bucket_names = [b.name for b in buckets]
                if 'receipts' not in bucket_names:
                    print("📦 Creating 'receipts' storage bucket...")
                    supabase.storage.create_bucket('receipts', {'public': False})
            except Exception as e:
                print(f"⚠️  Could not verify/create storage bucket: {e}")
                
        conn.close()
    except Exception as e:
        print(f"❌ Database connection failed: {e}")




# ============================================================================
# ENDPOINTS
# ============================================================================

# --- Dashboard & Settings ---

@app.route('/dashboard-layout', methods=['GET', 'POST'])
@require_auth
def handle_dashboard_layout():
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        if request.method == 'GET':
            cursor.execute("SELECT value FROM settings WHERE key = 'dashboard_layout'")
            row = cursor.fetchone()
            conn.close()
            return jsonify(json.loads(row['value']) if row else {'widgets': []})
        
        data = request.json
        widgets = data.get('widgets', [])
        cursor.execute("INSERT INTO settings (key, value) VALUES ('dashboard_layout', %s) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", (json.dumps(widgets),))
        conn.commit()
        conn.close()
        return jsonify({'status': 'success'})
    except Exception as e:
        print(f"Error in dashboard-layout: {e}")
        return jsonify({'error': str(e)}), 500

# --- Transactions ---

@app.route('/transactions', methods=['GET'])
@require_auth
def get_transactions():
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM transactions ORDER BY date DESC")
        rows = cursor.fetchall()
        conn.close()
        # Convert date/timestamp objects to string
        transactions = []
        for row in rows:
            t = dict(row)
            if t.get('date'): t['date'] = str(t['date'])
            if t.get('created_at'): t['created_at'] = str(t['created_at'])
            if t.get('updated_at'): t['updated_at'] = str(t['updated_at'])
            transactions.append(t)
        return jsonify(transactions)
    except Exception as e:
        print(f"Error getting transactions: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/transactions', methods=['POST'])
@require_auth
def create_transaction():
    try:
        data = request.json
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO transactions (title, date, amount, type, category, status, note, receipt, receipt_path)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (
            data.get('title'),
            data.get('date'),
            data.get('amount'),
            data.get('type'),
            data.get('category'),
            data.get('status', 'Väntar'),
            data.get('note', ''),
            data.get('receipt', False),
            data.get('receipt_path')
        ))
        new_transaction = cursor.fetchone()
        conn.commit()
        conn.close()
        
        # Serialize
        new_transaction = dict(new_transaction)
        new_transaction['date'] = str(new_transaction['date'])
        new_transaction['created_at'] = str(new_transaction['created_at'])
        
        return jsonify(new_transaction), 201
    except Exception as e:
        print(f"Error creating transaction: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/transactions/<int:id>', methods=['PUT'])
@require_auth
def update_transaction(id):
    try:
        data = request.json
        conn = get_db()
        cursor = conn.cursor()
        
        fields = ['title', 'date', 'amount', 'type', 'category', 'status', 'note', 'receipt', 'receipt_path']
        updates = []
        values = []
        for f in fields:
            if f in data:
                updates.append(f"{f} = %s")
                values.append(data[f])
        
        if not updates:
            return jsonify({'message': 'No fields to update'})

        values.append(id)
        query = f"UPDATE transactions SET {', '.join(updates)}, updated_at = NOW() WHERE id = %s RETURNING *"
        cursor.execute(query, values)
        updated = cursor.fetchone()
        conn.commit()
        conn.close()
        
        if not updated:
            return jsonify({'error': 'Transaction not found'}), 404
            
        res = dict(updated)
        res['date'] = str(res['date'])
        res['created_at'] = str(res['created_at'])
        res['updated_at'] = str(res['updated_at'])
        return jsonify(res)
    except Exception as e:
        print(f"Error updating transaction: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/transactions/<int:id>', methods=['DELETE'])
@require_auth
def delete_transaction(id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM transactions WHERE id = %s RETURNING id", (id,))
        deleted = cursor.fetchone()
        conn.commit()
        conn.close()
        if not deleted:
            return jsonify({'error': 'Transaction not found'}), 404
        return jsonify({'message': 'Transaction deleted'})
    except Exception as e:
        print(f"Error deleting transaction: {e}")
        return jsonify({'error': str(e)}), 500

# --- Categories ---

@app.route('/categories', methods=['GET'])
@require_auth
def get_categories():
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM categories ORDER BY name")
        rows = cursor.fetchall()
        conn.close()
        return jsonify([dict(row) for row in rows])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/categories', methods=['POST'])
@require_auth
def create_category():
    try:
        data = request.json
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO categories (name) VALUES (%s) RETURNING *", (data.get('name'),))
        new_cat = cursor.fetchone()
        conn.commit()
        conn.close()
        return jsonify(dict(new_cat)), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/categories/<int:id>', methods=['DELETE'])
@require_auth
def delete_category(id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM categories WHERE id = %s RETURNING id", (id,))
        deleted = cursor.fetchone()
        conn.commit()
        conn.close()
        if not deleted: 
            return jsonify({'error': 'Category not found'}), 404
        return jsonify({'message': 'Category deleted'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- Agreements ---

@app.route('/agreements', methods=['GET'])
@require_auth
def get_agreements():
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM agreements ORDER BY name")
        rows = cursor.fetchall()
        conn.close()
        
        agreements = []
        for row in rows:
            a = dict(row)
            # Handle JSON fields
            if a.get('images'): 
                try: a['images'] = json.loads(a['images'])
                except: a['images'] = []
            else: a['images'] = []
            
            # Dates to string
            for date_field in ['next_payment', 'start_date', 'end_date', 'created_at', 'updated_at']:
                if a.get(date_field): a[date_field] = str(a[date_field])
            agreements.append(a)
            
        return jsonify(agreements)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/agreements', methods=['POST'])
@require_auth
def create_agreement():
    try:
        data = request.json
        conn = get_db()
        cursor = conn.cursor()
        
        # Handle images list -> JSON
        images = json.dumps(data.get('images', []))
        
        cursor.execute("""
            INSERT INTO agreements (name, provider, cost, frequency, next_payment, status, category, icon, notice, images, start_date, end_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (
            data.get('name'), data.get('provider'), data.get('cost'), data.get('frequency'),
            data.get('next_payment'), data.get('status', 'Aktiv'), data.get('category'),
            data.get('icon', '📄'), data.get('notice', ''), images,
            data.get('start_date'), data.get('end_date')
        ))
        new_agreement = cursor.fetchone()
        conn.commit()
        conn.close()
        
        res = dict(new_agreement)
        if res.get('created_at'): res['created_at'] = str(res['created_at'])
        if res.get('next_payment'): res['next_payment'] = str(res['next_payment'])
        if res.get('images'): res['images'] = json.loads(res['images'])
        
        return jsonify(res), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/agreements/<int:id>', methods=['PUT'])
@require_auth
def update_agreement(id):
    try:
        data = request.json
        conn = get_db()
        cursor = conn.cursor()
        
        fields = ['name', 'provider', 'cost', 'frequency', 'next_payment', 'status', 'category', 'icon', 'notice', 'images', 'start_date', 'end_date']
        updates = []
        values = []
        for f in fields:
            if f in data:
                updates.append(f"{f} = %s")
                val = data[f]
                if f == 'images' and isinstance(val, list):
                    val = json.dumps(val)
                values.append(val)
        
        if not updates: return jsonify({'message': 'No updates'})
        
        values.append(id)
        cursor.execute(f"UPDATE agreements SET {', '.join(updates)}, updated_at = NOW() WHERE id = %s RETURNING *", values)
        updated = cursor.fetchone()
        conn.commit()
        conn.close()
        
        if not updated: return jsonify({'error': 'Agreement not found'}), 404
        
        res = dict(updated)
        if res.get('images'): res['images'] = json.loads(res['images'])
        dates = ['next_payment', 'start_date', 'end_date', 'created_at', 'updated_at']
        for d in dates:
             if res.get(d): res[d] = str(res[d])
             
        return jsonify(res)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/agreements/<int:id>', methods=['DELETE'])
@require_auth
def delete_agreement(id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM agreements WHERE id = %s RETURNING id", (id,))
        deleted = cursor.fetchone()
        conn.commit()
        conn.close()
        if not deleted: return jsonify({'error': 'Agreement not found'}), 404
        return jsonify({'message': 'Agreement deleted'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500




# --- Vehicles ---

@app.route('/vehicles', methods=['GET'])
@require_auth
def get_vehicles():
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM vehicles ORDER BY make_model")
        rows = cursor.fetchall()
        conn.close()
        vehicles = []
        for row in rows:
            v = dict(row)
            if v.get('images'): 
                try: v['images'] = json.loads(v['images'])
                except: v['images'] = []
            else: v['images'] = []
            vehicles.append(v)
        return jsonify(vehicles)
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/vehicles', methods=['POST'])
@require_auth
def create_vehicle():
    try:
        data = request.json
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO vehicles (registration_number, make_model, odometer, next_inspection, insurance_company, insurance_type, status, category, note, images) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING *
        """, (
            data.get('registration_number'), data.get('make_model'), data.get('odometer', 0),
            data.get('next_inspection'), data.get('insurance_company'), data.get('insurance_type'),
            data.get('status', 'Aktiv'), data.get('category', 'Personbil'), data.get('note', ''),
            json.dumps(data.get('images', []))
        ))
        row = cursor.fetchone()
        conn.commit()
        conn.close()
        res = dict(row)
        if res.get('images'): res['images'] = json.loads(res['images'])
        return jsonify(res), 201
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/vehicles/<int:id>', methods=['PUT', 'DELETE'])
@require_auth
def manage_vehicle(id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        if request.method == 'DELETE':
            cursor.execute("DELETE FROM vehicles WHERE id = %s RETURNING id", (id,))
            if not cursor.fetchone(): return jsonify({'error': 'Not found'}), 404
            conn.commit()
            conn.close()
            return jsonify({'message': 'Deleted'})
        
        # PUT
        data = request.json
        fields = ['registration_number', 'make_model', 'odometer', 'next_inspection', 'insurance_company', 'insurance_type', 'status', 'category', 'note', 'images', 'next_service_odometer', 'next_service_date']
        updates, values = [], []
        for f in fields:
            if f in data:
                updates.append(f"{f}=%s")
                val = data[f]
                if f == 'images' and isinstance(val, list): val = json.dumps(val)
                values.append(val)
        
        if not updates: return jsonify({'message': 'No updates'})
        values.append(id)
        cursor.execute(f"UPDATE vehicles SET {','.join(updates)}, updated_at=NOW() WHERE id=%s RETURNING *", values)
        row = cursor.fetchone()
        conn.commit()
        conn.close()
        if not row: return jsonify({'error': 'Not found'}), 404
        res = dict(row)
        if res.get('images'): res['images'] = json.loads(res['images'])
        return jsonify(res)
    except Exception as e: return jsonify({'error': str(e)}), 500

# --- Vehicle Expenses ---

@app.route('/vehicle-expenses', methods=['GET'])
@require_auth
def get_vehicle_expenses():
    try:
        conn = get_db()
        cursor = conn.cursor()
        vehicle_id = request.args.get('vehicle_id')
        if vehicle_id:
            cursor.execute("SELECT * FROM vehicle_expenses WHERE vehicle_id = %s ORDER BY date DESC", (vehicle_id,))
        else:
            cursor.execute("SELECT * FROM vehicle_expenses ORDER BY date DESC")
        rows = cursor.fetchall()
        conn.close()
        return jsonify([dict(row) for row in rows])
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/vehicle-expenses', methods=['POST'])
@require_auth
def create_vehicle_expense():
    try:
        data = request.json
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO vehicle_expenses (vehicle_id, category, amount, date, description, receipt_path, note, odometer_at_purchase)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING *
        """, (
            data.get('vehicle_id'), data.get('category'), data.get('amount'), data.get('date'),
            data.get('description', ''), data.get('receipt_path'), data.get('note', ''), data.get('odometer_at_purchase')
        ))
        row = cursor.fetchone()
        conn.commit()
        conn.close()
        return jsonify(dict(row)), 201
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/vehicle-expenses/<int:id>', methods=['DELETE'])
@require_auth
def delete_vehicle_expense(id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM vehicle_expenses WHERE id = %s RETURNING id", (id,))
        if not cursor.fetchone(): return jsonify({'error': 'Not found'}), 404
        conn.commit()
        conn.close()
        return jsonify({'message': 'Deleted'})
    except Exception as e: return jsonify({'error': str(e)}), 500

# --- Loans ---

@app.route('/loans', methods=['GET'])
@require_auth
def get_loans():
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM loans ORDER BY name")
        rows = cursor.fetchall()
        conn.close()
        return jsonify([dict(row) for row in rows])
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/loans', methods=['POST'])
@require_auth
def create_loan():
    try:
        data = request.json
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO loans (name, lender, principal_amount, current_balance, interest_rate, monthly_payment, amortization_amount, interest_amount, start_date, end_date, status, category, note)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING *
        """, (
            data.get('name'), data.get('lender'), data.get('principal_amount'), data.get('current_balance'),
            data.get('interest_rate'), data.get('monthly_payment'), data.get('amortization_amount'),
            data.get('interest_amount'), data.get('start_date'), data.get('end_date'),
            data.get('status', 'Aktiv'), data.get('category', 'Bolån'), data.get('note', '')
        ))
        row = cursor.fetchone()
        conn.commit()
        conn.close()
        return jsonify(dict(row)), 201
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/loans/<int:id>', methods=['PUT', 'DELETE'])
@require_auth
def manage_loan(id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        if request.method == 'DELETE':
            cursor.execute("DELETE FROM loans WHERE id = %s RETURNING id", (id,))
            if not cursor.fetchone(): return jsonify({'error': 'Not found'}), 404
            conn.commit()
            conn.close()
            return jsonify({'message': 'Deleted'})
        
        # PUT
        data = request.json
        fields = ['name', 'lender', 'principal_amount', 'current_balance', 'interest_rate', 'monthly_payment', 'amortization_amount', 'interest_amount', 'start_date', 'end_date', 'status', 'category', 'note']
        updates, values = [], []
        for f in fields:
            if f in data:
                updates.append(f"{f}=%s")
                values.append(data[f])
        values.append(id)
        cursor.execute(f"UPDATE loans SET {','.join(updates)}, updated_at=NOW() WHERE id=%s RETURNING *", values)
        row = cursor.fetchone()
        conn.commit()
        conn.close()
        if not row: return jsonify({'error': 'Not found'}), 404
        return jsonify(dict(row))
    except Exception as e: return jsonify({'error': str(e)}), 500

# --- Savings ---

@app.route('/savings/goals', methods=['GET'])
@require_auth
def get_savings_goals():
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM savings_goals ORDER BY created_at DESC")
        rows = cursor.fetchall()
        conn.close()
        return jsonify([dict(row) for row in rows])
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/savings/goals', methods=['POST'])
@require_auth
def create_savings_goal():
    try:
        data = request.json
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO savings_goals (name, target_amount, current_amount, deadline, category, status, description)
            VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING *
        """, (
            data.get('name'), data.get('target_amount'), data.get('current_amount', 0),
            data.get('deadline'), data.get('category'), data.get('status', 'Aktiv'), data.get('description', '')
        ))
        row = cursor.fetchone()
        conn.commit()
        conn.close()
        return jsonify(dict(row)), 201
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/savings/accounts', methods=['GET'])
@require_auth
def get_savings_accounts():
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM savings_accounts ORDER BY name")
        rows = cursor.fetchall()
        conn.close()
        return jsonify([dict(row) for row in rows])
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/savings/accounts', methods=['POST'])
@require_auth
def create_savings_account():
    try:
        data = request.json
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO savings_accounts (name, balance, description, category, status)
            VALUES (%s, %s, %s, %s, %s) RETURNING *
        """, (
            data.get('name'), data.get('balance', 0), data.get('description', ''),
            data.get('category'), data.get('status', 'Aktiv')
        ))
        row = cursor.fetchone()
        conn.commit()
        conn.close()
        return jsonify(dict(row)), 201
    except Exception as e: return jsonify({'error': str(e)}), 500

# --- Licenses ---

@app.route('/licenses/current', methods=['GET'])
@require_auth
def get_current_license():
    try:
        user_id = request.current_user['user_id']
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM licenses WHERE user_id = %s AND status = 'active' ORDER BY created_at DESC LIMIT 1", (user_id,))
        row = cursor.fetchone()
        conn.close()
        if row: return jsonify(dict(row))
        return jsonify({'error': 'No active license'}), 404
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/licenses/status', methods=['GET'])
@require_auth
def get_license_status():
    try:
        user_id = request.current_user['user_id']
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM licenses WHERE user_id = %s ORDER BY created_at DESC LIMIT 1", (user_id,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
             return jsonify({'has_license': False, 'status': 'no_license', 'message': 'No license found'})
             
        lic = dict(row)
        # Simplified expiration check
        is_expired = False
        if lic.get('expires_at'):
             if datetime.now() > lic['expires_at']: is_expired = True # Assuming datetime object from psycopg
        
        return jsonify({
            'has_license': True,
            'license': lic,
            'status': 'expired' if is_expired else lic['status'],
            'is_expired': is_expired,
            'can_use': not is_expired and lic['status'] == 'active'
        })
    except Exception as e: return jsonify({'error': str(e)}), 500




# Missing Category Rules Endpoints
@app.route('/category-rules', methods=['GET'])
@require_auth
def get_category_rules():
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM category_rules ORDER BY priority ASC")
        rows = cursor.fetchall()
        conn.close()
        return jsonify([dict(row) for row in rows])
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/category-rules', methods=['POST'])
@require_auth
def create_category_rule():
    try:
        data = request.json
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO category_rules (keyword, category_id, priority)
            VALUES (%s, %s, %s) RETURNING *
        """, (data.get('keyword'), data.get('category_id'), data.get('priority', 0)))
        row = cursor.fetchone()
        conn.commit()
        conn.close()
        return jsonify(dict(row)), 201
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/category-rules/<int:id>', methods=['PUT', 'DELETE'])
@require_auth
def manage_category_rule(id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        if request.method == 'DELETE':
            cursor.execute("DELETE FROM category_rules WHERE id = %s RETURNING id", (id,))
            if not cursor.fetchone(): return jsonify({'error': 'Not found'}), 404
            conn.commit()
            conn.close()
            return jsonify({'message': 'Deleted'})
            
        data = request.json
        cursor.execute("""
            UPDATE category_rules SET keyword=%s, category_id=%s, priority=%s WHERE id=%s RETURNING *
        """, (data.get('keyword'), data.get('category_id'), data.get('priority'), id))
        row = cursor.fetchone()
        conn.commit()
        conn.close()
        if not row: return jsonify({'error': 'Not found'}), 404
        return jsonify(dict(row))
    except Exception as e: return jsonify({'error': str(e)}), 500

# Missing Categories with IDs Endpoint
@app.route('/categories/with-ids', methods=['GET'])
@require_auth
def get_categories_with_ids():
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT id, name FROM categories ORDER BY name")
        rows = cursor.fetchall()
        conn.close()
        return jsonify([dict(row) for row in rows])
    except Exception as e: return jsonify({'error': str(e)}), 500

# Missing Payments History Endpoint (Placeholder logic based on existing schema or lack thereof)
@app.route('/payments/history', methods=['GET'])
@require_auth
def get_payment_history():
    try:
        # Assuming there is a payments table or requesting similar data
        conn = get_db()
        cursor = conn.cursor()
        # Fallback if no table exists yet: return empty list to stop frontend error
        # Check if table exists
        cursor.execute("SELECT to_regclass('public.payments')")
        if cursor.fetchone()['to_regclass']:
             cursor.execute("SELECT * FROM payments ORDER BY created_at DESC")
             rows = cursor.fetchall()
             conn.close()
             return jsonify([dict(row) for row in rows])
        else:
             conn.close()
             return jsonify([]) # Return empty list if no payments table
    except Exception as e: return jsonify({'error': str(e)}), 500

# --- Missing Endpoints V2 ---

@app.route('/payments/subscription', methods=['GET'])
@require_auth
def get_current_subscription():
    try:
        user_id = request.current_user['user_id']
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.*, p.amount as last_payment_amount 
            FROM subscriptions s
            LEFT JOIN payments p ON s.id = p.subscription_id
            WHERE s.user_id = %s 
            ORDER BY s.created_at DESC LIMIT 1
        """, (user_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row: return jsonify(dict(row))
        return jsonify({'status': 'none', 'message': 'No active subscription'}), 200 # Return 200 even if no sub, handled by frontend
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/media-files', methods=['GET'])
@require_auth
def get_media_files():
    try:
        # List files in the upload directory
        files = []
        if os.path.exists(UPLOAD_FOLDER):
            for f in os.listdir(UPLOAD_FOLDER):
                if os.path.isfile(os.path.join(UPLOAD_FOLDER, f)):
                    files.append({
                        'name': f,
                        'url': f'/uploads/{f}',
                        'size': os.path.getsize(os.path.join(UPLOAD_FOLDER, f)),
                        'created_at': os.path.getctime(os.path.join(UPLOAD_FOLDER, f))
                    })
        return jsonify(files)
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/select-folder', methods=['POST'])
@require_auth
def select_folder():
    # In a web context, we can't really open a system dialog on the server side 
    # and expect it to work for the client unless it's Electron.
    # If this is electron, we might need a specific bridge. 
    # For now, we'll return a stub or use a default if it's just for settings.
    try:
        return jsonify({'path': UPLOAD_FOLDER, 'message': 'Folder selection not supported in web mode'}), 200
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/admin/users', methods=['GET'])
@require_auth
def get_admin_users():
    try:
        if request.current_user['role'] != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
            
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, role, created_at, last_login FROM users ORDER BY created_at DESC")
        rows = cursor.fetchall()
        conn.close()
        
        # Convert dates
        users = []
        for row in rows:
            u = dict(row)
            if u.get('created_at'): u['created_at'] = str(u['created_at'])
            if u.get('last_login'): u['last_login'] = str(u['last_login'])
            users.append(u)
            
        return jsonify(users)
    except Exception as e: return jsonify({'error': str(e)}), 500

# --- History Endpoint ---

@app.route('/history', methods=['GET'])
@require_auth
def get_history():
    try:
        user_id = request.current_user['user_id']
        limit = request.args.get('limit', 100, type=int)
        entity_type = request.args.get('entity_type')
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if 'history' table exists (it likely doesn't based on previous schema checks)
        # If it doesn't, we return an empty list to prevent 404/500 errors.
        # If you later decide to implement a real history table, you'd CREATE it in schema_pg.sql first.
        cursor.execute("SELECT to_regclass('public.history')")
        if cursor.fetchone()['to_regclass']:
             query = "SELECT * FROM history WHERE user_id = %s"
             params = [user_id]
             
             if entity_type:
                 query += " AND entity_type = %s"
                 params.append(entity_type)
                 
             query += " ORDER BY created_at DESC LIMIT %s"
             params.append(limit)
             
             cursor.execute(query, params)
             rows = cursor.fetchall()
             conn.close()
             
             history_items = []
             for row in rows:
                 item = dict(row)
                 if item.get('created_at'): item['created_at'] = str(item['created_at'])
                 history_items.append(item)
                 
             return jsonify(history_items)
        else:
            conn.close()
            return jsonify([]) # Return empty list so frontend doesn't crash

    except Exception as e: return jsonify({'error': str(e)}), 500

# --- Missing Admin Endpoints ---

@app.route('/admin/licenses', methods=['GET'])
@require_auth
def get_admin_licenses():
    try:
        if request.current_user['role'] != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
            
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM licenses ORDER BY created_at DESC")
        rows = cursor.fetchall()
        conn.close()
        
        licenses = []
        for row in rows:
            l = dict(row)
            if l.get('starts_at'): l['starts_at'] = str(l['starts_at'])
            if l.get('expires_at'): l['expires_at'] = str(l['expires_at'])
            if l.get('created_at'): l['created_at'] = str(l['created_at'])
            licenses.append(l)
            
        return jsonify(licenses)
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/admin/statistics', methods=['GET'])
@require_auth
def get_admin_statistics():
    try:
        if request.current_user['role'] != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
            
        conn = get_db()
        cursor = conn.cursor()
        
        stats = {}
        
        # Total users
        cursor.execute("SELECT COUNT(*) as count FROM users")
        stats['total_users'] = cursor.fetchone()['count']
        
        # New users last 30 days
        cursor.execute("SELECT COUNT(*) as count FROM users WHERE created_at > NOW() - INTERVAL '30 days'")
        stats['new_users_30d'] = cursor.fetchone()['count']
        
        # Active licenses
        cursor.execute("SELECT COUNT(*) as count FROM licenses WHERE status = 'active'")
        stats['active_licenses'] = cursor.fetchone()['count']
        
        # Total revenue (from payments)
        cursor.execute("SELECT SUM(amount) as total FROM payments WHERE status = 'succeeded'")
        res = cursor.fetchone()
        stats['total_revenue'] = float(res['total']) if res and res['total'] else 0.0
        
        conn.close()
        return jsonify(stats)
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/admin/payments', methods=['GET'])
@require_auth
def get_admin_payments():
    try:
        if request.current_user['role'] != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
            
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM payments ORDER BY created_at DESC LIMIT 100")
        rows = cursor.fetchall()
        conn.close()
        
        payments = []
        for row in rows:
            p = dict(row)
            if p.get('created_at'): p['created_at'] = str(p['created_at'])
            payments.append(p)
            
        return jsonify(payments)
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/admin/system-settings', methods=['GET'])
@require_auth
def get_admin_system_settings():
    try:
        if request.current_user['role'] != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get settings from DB
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT key, value FROM settings")
        rows = cursor.fetchall()
        conn.close()
        
        db_settings = {row['key']: row['value'] for row in rows}

        # Construct nested response as expected by frontend
        response = {
            "database": {
                "type": "PostgreSQL",
                "upload_folder": app.config.get('UPLOAD_FOLDER', 'uploads')
            },
            "stripe": {
                "secret_key_configured": bool(os.environ.get('STRIPE_SECRET_KEY')),
                "publishable_key_configured": bool(os.environ.get('STRIPE_PUBLISHABLE_KEY')),
                "webhook_secret_configured": bool(os.environ.get('STRIPE_WEBHOOK_SECRET')),
                "price_id": os.environ.get('STRIPE_PRICE_ID'),
                "price_id_configured": bool(os.environ.get('STRIPE_PRICE_ID'))
            },
            "sendgrid": {
                "api_key_configured": bool(os.environ.get('SENDGRID_API_KEY')),
                "from_email": os.environ.get('SENDGRID_FROM_EMAIL')
            },
            # Include raw DB settings if needed, or map them
            "general": db_settings
        }
        
        return jsonify(response)
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/settings', methods=['GET', 'POST', 'OPTIONS'])
@cross_origin(supports_credentials=True)
@require_auth
def manage_app_settings():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'GET':
        try:
            cursor.execute("SELECT key, value FROM settings")
            rows = cursor.fetchall()
            settings = {row['key']: row['value'] for row in rows}
            conn.close()
            return jsonify(settings), 200
        except Exception as e:
            conn.close()
            return jsonify({'error': str(e)}), 500

    if request.method == 'POST':
        try:
            data = request.json
            if not data:
                conn.close()
                return jsonify({'error': 'No data provided'}), 400
            
            for key, value in data.items():
                cursor.execute("""
                    INSERT INTO settings (key, value, updated_at) 
                    VALUES (%s, %s, NOW()) 
                    ON CONFLICT (key) 
                    DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
                """, (str(key), str(value)))
            
            conn.commit()
            conn.close()
            return jsonify({'message': 'Settings saved'}), 200
        except Exception as e:
            conn.close()
            return jsonify({'error': str(e)}), 500

@app.route('/admin/email-logs', methods=['GET', 'OPTIONS'])
@cross_origin(supports_credentials=True)
@require_auth
@require_role('admin')
def get_email_logs():
        
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT el.*, u.email as user_email 
            FROM email_logs el
            LEFT JOIN users u ON el.user_id = u.id
            ORDER BY el.created_at DESC 
            LIMIT 100
        """)
        
        logs = cursor.fetchall()
        conn.close()
        
        return jsonify(logs), 200
    except Exception as e:
        print(f"Error fetching email logs: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/admin/users/<int:user_id>/send-credentials', methods=['POST', 'OPTIONS'])
@cross_origin(supports_credentials=True)
@require_auth
@require_role('admin')
def send_user_credentials(user_id):
        
    try:
        data = request.get_json()
        password = data.get('password')
        
        if not password:
            return jsonify({'error': 'Password is required'}), 400
            
        conn = get_db()
        cursor = conn.cursor()
        
        # Get user email
        cursor.execute("SELECT email FROM users WHERE id = %s", (user_id,))
        user_row = cursor.fetchone()
        conn.close()
        
        if not user_row:
            return jsonify({'error': 'User not found'}), 404
            
        user_email = user_row['email']
        
        # Send credentials email
        success, message = send_credentials_email(user_email, password, user_id)
        
        if success:
            return jsonify({'message': 'Credentials sent successfully'}), 200
        else:
            return jsonify({'error': f'Failed to send email: {message}'}), 500
            
    except Exception as e:
        print(f"Error sending credentials: {e}")
        return jsonify({'error': str(e)}), 500

# ============================================================================
# BACKGROUND TASKS
# ============================================================================
import threading
import time
from datetime import datetime

def check_expiring_trials():
    """Check for trials expiring in <= 3 days and send warning emails."""
    with app.app_context():
        print("Checking for expiring trials...")
        try:
            conn = get_db()
            cursor = conn.cursor()
            
            # Find trials expiring in 3 days (or less) that haven't been warned
            # We look for expiry within the next 3 days + 1 hour buffer (to catch "almost 3 days")
            cursor.execute("""
                SELECT l.id, l.user_id, l.expires_at, u.email 
                FROM licenses l 
                JOIN users u ON l.user_id = u.id 
                WHERE l.status = 'active' 
                AND l.license_type = 'trial' 
                AND l.warning_sent IS FALSE 
                AND l.expires_at <= NOW() + INTERVAL '3 days' 
                AND l.expires_at > NOW()
            """)
            
            expiring_licenses = cursor.fetchall()
            
            for license in expiring_licenses:
                days_left = (license['expires_at'].replace(tzinfo=None) - datetime.now()).days
                if days_left < 0: days_left = 0
                
                print(f"Sending warning to {license['email']} (expiring in {days_left} days)")
                print(f"Sending warning to {license['email']} (expiring in {days_left} days)")
                success, _ = send_trial_expiring_email(license['email'], days_left, license['user_id'])
                
                if success:
                    # Mark as warned
                    cursor.execute("UPDATE licenses SET warning_sent = TRUE WHERE id = %s", (license['id'],))
                    conn.commit()
            
            conn.close()
        except Exception as e:
            print(f"Error in check_expiring_trials: {e}")

def run_scheduler():
    """Run background checks periodically"""
    while True:
        try:
            check_expiring_trials()
        except Exception as e:
            print(f"Scheduler error: {e}")
        
        # Check every hour (desktop app might be closed/opened frequently)
        time.sleep(3600)  

# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    # Initialize database on startup
    init_db()
    
    # Start scheduler in background thread
    scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
    scheduler_thread.start()
    
    port = 5000
    print('=' * 50)
    print(f" Starting WestBudget Backend Server on port {port}...")
    print('=' * 50)

    print(f' Upload folder: {UPLOAD_FOLDER}')
    app.run(host='0.0.0.0', port=5000, debug=True)

