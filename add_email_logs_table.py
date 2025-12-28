import os
import psycopg
from dotenv import load_dotenv
from psycopg.rows import dict_row

# Load environment variables
load_dotenv()

DATABASE_URL = os.environ.get('DATABASE_URL')

def get_db_connection():
    try:
        conn = psycopg.connect(DATABASE_URL, row_factory=dict_row)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

def apply_migration():
    conn = get_db_connection()
    if not conn:
        return

    try:
        cursor = conn.cursor()
        
        # Create email_logs table
        print("Creating email_logs table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS email_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                recipient_email VARCHAR(255) NOT NULL,
                subject VARCHAR(255) NOT NULL,
                template_id VARCHAR(100),
                status VARCHAR(50) NOT NULL CHECK(status IN ('sent', 'failed')),
                error_message TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);")
        
        conn.commit()
        print("Migration applied successfully!")
        
    except Exception as e:
        print(f"Error applying migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    apply_migration()
