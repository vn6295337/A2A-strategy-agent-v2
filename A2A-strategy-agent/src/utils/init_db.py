import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "../../data/strategy.db")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS focus_areas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    strategy_name TEXT NOT NULL,
    description TEXT NOT NULL
)
""")

cursor.execute("""
INSERT INTO focus_areas (strategy_name, description)
VALUES (?, ?)
""", ("Cost Leadership", "Focus on pricing efficiency and supply chain optimization."))

conn.commit()
conn.close()

print("Database initialized successfully!")
print(f"Database created at: {db_path}")