import os
import psycopg
from dotenv import load_dotenv

# Load environment variables
if getattr(os, 'frozen', False):
    base_dir = os.path.dirname(os.sys.executable)
    load_dotenv(os.path.join(base_dir, '.env'))
else:
    load_dotenv()

def add_column():
    print("Connecting to database...")
    try:
        conn = psycopg.connect(os.environ.get('DATABASE_URL'), autocommit=True)
        cursor = conn.cursor()
        
        print("Checking if column exists...")
        cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name='licenses' AND column_name='warning_sent'")
        if cursor.fetchone():
            print("Column 'warning_sent' already exists.")
        else:
            print("Adding 'warning_sent' column to licenses table...")
            cursor.execute("ALTER TABLE licenses ADD COLUMN warning_sent BOOLEAN DEFAULT FALSE")
            print("Column added successfully.")
            
        cursor.close()
        conn.close()
        print("Done.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    add_column()
