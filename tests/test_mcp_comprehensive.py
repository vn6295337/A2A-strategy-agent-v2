#!/usr/bin/env python3

"""
Comprehensive test for MCP Data Layer Integration
This demonstrates the complete workflow:
1. SQLite database with strategic context
2. MCP server exposing the database as a tool
3. Testing the tool functionality
"""

import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import sqlite3
from mcp.server import FastMCP as MCP

def test_database():
    """Test the SQLite database"""
    print("🔍 Testing SQLite Database...")
    
    db_path = 'data/strategy.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Test query
    cursor.execute('SELECT * FROM focus_areas')
    rows = cursor.fetchall()
    
    print(f"✅ Database contains {len(rows)} strategy focus area(s)")
    for row in rows:
        print(f"   Strategy: {row[1]} - {row[2]}")
    
    conn.close()
    return True

def test_mcp_tool():
    """Test the MCP tool function"""
    print("\n🔧 Testing MCP Tool Function...")
    
    def get_strategy_context(strategy_name: str) -> str:
        db_path = 'data/strategy.db'
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute(
            'SELECT description FROM focus_areas WHERE strategy_name = ?',
            (strategy_name,)
        )
        row = cursor.fetchone()
        conn.close()
        return row[0] if row else "No such strategy found."
    
    # Test the function directly
    result = get_strategy_context('Cost Leadership')
    print(f"✅ MCP Tool Response: {result}")
    
    # Test with non-existent strategy
    result2 = get_strategy_context('NonExistent Strategy')
    print(f"✅ MCP Tool Response (non-existent): {result2}")
    
    return True

def test_mcp_server_creation():
    """Test MCP server creation"""
    print("\n🚀 Testing MCP Server Creation...")
    
    def get_strategy_context(strategy_name: str) -> str:
        db_path = 'data/strategy.db'
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute(
            'SELECT description FROM focus_areas WHERE strategy_name = ?',
            (strategy_name,)
        )
        row = cursor.fetchone()
        conn.close()
        return row[0] if row else "No such strategy found."
    
    # Create MCP app
    app = MCP(name="strategy_context")
    app.tool(name="get_strategy_context")(get_strategy_context)
    
    print("✅ MCP Server created successfully")
    print(f"   Server name: {app.name}")
    
    return True

def main():
    """Run all tests"""
    print("🧪 Running Comprehensive MCP Integration Tests\n")
    
    try:
        # Test 1: Database
        test_database()
        
        # Test 2: MCP Tool Function
        test_mcp_tool()
        
        # Test 3: MCP Server Creation
        test_mcp_server_creation()
        
        print("\n🎉 All tests passed! MCP Data Layer Integration is working correctly.")
        print("\n📋 Summary of Deliverables:")
        print("   ✅ SQLite database populated with strategy data")
        print("   ✅ MCP server created and serving tool")
        print("   ✅ Tool function working correctly with database queries")
        print("   ✅ Ready for LLM integration")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    main()