"""
MCP Cache - SQLite-based caching for MCP server results.

Caches aggregated MCP data with configurable TTL to reduce API calls.
"""

import sqlite3
import json
import os
from datetime import datetime, timedelta
from typing import Optional
from pathlib import Path

# Default TTL: 24 hours
DEFAULT_TTL_HOURS = 24

# Database path
DB_PATH = Path(__file__).parent.parent.parent / "data" / "strategy.db"


def get_connection():
    """Get SQLite connection."""
    return sqlite3.connect(str(DB_PATH))


def init_cache_table():
    """Initialize the MCP cache table if it doesn't exist."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS mcp_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticker TEXT NOT NULL,
        company_name TEXT NOT NULL,
        data JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        UNIQUE(ticker)
    )
    """)

    # Create index for faster lookups
    cursor.execute("""
    CREATE INDEX IF NOT EXISTS idx_mcp_cache_ticker ON mcp_cache(ticker)
    """)

    conn.commit()
    conn.close()


def get_cached_data(ticker: str) -> Optional[dict]:
    """
    Get cached MCP data for a ticker if it exists and hasn't expired.

    Args:
        ticker: Stock ticker symbol

    Returns:
        Cached data dict or None if not found/expired
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT data, expires_at FROM mcp_cache
    WHERE ticker = ? AND expires_at > datetime('now')
    """, (ticker.upper(),))

    row = cursor.fetchone()
    conn.close()

    if row:
        data_json, expires_at = row
        try:
            data = json.loads(data_json)
            data["_cache_info"] = {
                "cached": True,
                "expires_at": expires_at
            }
            return data
        except json.JSONDecodeError:
            return None

    return None


def set_cached_data(ticker: str, company_name: str, data: dict, ttl_hours: int = DEFAULT_TTL_HOURS):
    """
    Store MCP data in cache.

    Args:
        ticker: Stock ticker symbol
        company_name: Company name
        data: MCP aggregated data dict
        ttl_hours: Time-to-live in hours
    """
    conn = get_connection()
    cursor = conn.cursor()

    expires_at = datetime.now() + timedelta(hours=ttl_hours)

    # Remove cache info before storing
    data_to_store = {k: v for k, v in data.items() if k != "_cache_info"}

    cursor.execute("""
    INSERT OR REPLACE INTO mcp_cache (ticker, company_name, data, created_at, expires_at)
    VALUES (?, ?, ?, datetime('now'), ?)
    """, (ticker.upper(), company_name, json.dumps(data_to_store, default=str), expires_at.isoformat()))

    conn.commit()
    conn.close()


def clear_cache(ticker: Optional[str] = None):
    """
    Clear cache entries.

    Args:
        ticker: If provided, clear only this ticker. Otherwise clear all.
    """
    conn = get_connection()
    cursor = conn.cursor()

    if ticker:
        cursor.execute("DELETE FROM mcp_cache WHERE ticker = ?", (ticker.upper(),))
    else:
        cursor.execute("DELETE FROM mcp_cache")

    conn.commit()
    conn.close()


def clear_expired_cache():
    """Remove all expired cache entries."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM mcp_cache WHERE expires_at <= datetime('now')")

    deleted = cursor.rowcount
    conn.commit()
    conn.close()

    return deleted


def get_cache_stats() -> dict:
    """Get cache statistics."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM mcp_cache")
    total = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM mcp_cache WHERE expires_at > datetime('now')")
    valid = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM mcp_cache WHERE expires_at <= datetime('now')")
    expired = cursor.fetchone()[0]

    conn.close()

    return {
        "total_entries": total,
        "valid_entries": valid,
        "expired_entries": expired
    }


# Initialize table on module import
init_cache_table()
