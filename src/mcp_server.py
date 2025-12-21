try:
    from mcp.server import FastMCP as MCP
except ImportError:
    # Fall back to mock implementation if MCP package is not available
    from src.mcp_mock import FastMCP as MCP
import sqlite3
import os

# Tool function
def get_strategy_context(strategy_name: str) -> str:
    db_path = os.path.join(os.path.dirname(__file__), "../data/strategy.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT description FROM focus_areas WHERE strategy_name = ?",
        (strategy_name,)
    )
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else "No such strategy found."

# Expose tool via MCP
app = MCP(name="strategy_context")
app.tool(name="get_strategy_context")(get_strategy_context)

if __name__ == "__main__":
    app.run()