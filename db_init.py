
import os
import psycopg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")

def init_db():
    print(f"Connecting to database...")
    try:
        conn = psycopg.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        print("Reading schema_pg.sql...")
        with open("schema_pg.sql", "r", encoding="utf-8") as f:
            schema_sql = f.read()
            
        print("Executing schema...")
        cursor.execute(schema_sql)
        conn.commit()
        conn.close()
        print("✅ Database initialized successfully!")
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")

if __name__ == "__main__":
    init_db()
