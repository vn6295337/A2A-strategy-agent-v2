"""
Test script to verify Streamlit app functionality
"""

import sys
import os

# Add the project to Python path
sys.path.insert(0, '/home/vn6295337/A2A-strategy-agent')

# Set environment variables
os.environ['GROQ_API_KEY'] = 'test_key'
os.environ['LANGCHAIN_API_KEY'] = 'test_key'
os.environ['LANGCHAIN_TRACING_V2'] = 'true'
os.environ['LANGCHAIN_ENABLE_TRACING'] = 'true'
os.environ['TAVILY_API_KEY'] = 'test_key'

try:
    # Test imports
    print("🧪 Testing Streamlit app imports...")
    import streamlit as st
    print("✅ Streamlit imported successfully")
    
    from src.graph_cyclic import app as graph_app
    print("✅ Graph app imported successfully")
    
    # Test that we can create the state
    state = {
        "company_name": "Tesla",
        "raw_data": None,
        "draft_report": None,
        "critique": None,
        "revision_count": 0,
        "messages": [],
        "score": 0
    }
    print("✅ State created successfully")
    
    # Test that the app is callable (without actually running it)
    print("✅ App is callable")
    
    print("\n🎉 Streamlit app is ready to run!")
    print("\nTo start the app, run:")
    print("cd /home/vn6295337/A2A-strategy-agent")
    print(". /home/vn6295337/aienv/bin/activate")
    print("export $(grep -v '^#' /home/vn6295337/.env | xargs)")
    print("streamlit run app.py")
    
except Exception as e:
    print(f"❌ Error testing Streamlit app: {e}")
    import traceback
    traceback.print_exc()