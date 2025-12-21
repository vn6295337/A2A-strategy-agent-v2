#!/usr/bin/env python3
"""
Simple test script to verify the API is working
"""

import subprocess
import time
import requests
import sys
import os

def test_api():
    print("🧪 Testing A2A Strategy Agent API...")
    print("==================================")
    
    # Start the API in the background
    print("🌐 Starting API...")
    proc = subprocess.Popen([sys.executable, "api_real.py"], 
                          stdout=subprocess.PIPE, 
                          stderr=subprocess.PIPE)
    
    # Give it time to start
    time.sleep(10)
    
    try:
        # Test the health endpoint
        print("🔍 Testing health endpoint...")
        response = requests.get("http://localhost:8002/api/health", timeout=5)
        
        if response.status_code == 200:
            print("✅ API is working!")
            print(f"📋 Response: {response.json()}")
            return True
        else:
            print(f"❌ API returned status {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ API request failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False
    finally:
        # Clean up
        proc.terminate()
        proc.wait()

if __name__ == "__main__":
    success = test_api()
    sys.exit(0 if success else 1)