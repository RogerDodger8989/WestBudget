
import os
import psycopg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")

try:
    conn = psycopg.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    print("Creating category_rules table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS category_rules (
            id SERIAL PRIMARY KEY,
            category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
            keyword VARCHAR(255) NOT NULL,
            priority INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_category_rules_category_id ON category_rules(category_id);
    """)
    conn.commit()
    conn.close()
    print("✅ Successfully created category_rules table.")
except Exception as e:
    print(f"❌ Error: {e}")
