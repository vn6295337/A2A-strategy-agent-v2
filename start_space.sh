#!/bin/bash

echo "🚀 Starting A2A Strategy Agent Space"
echo "==================================="

# Start the FastAPI backend in the background
echo "🌐 Starting FastAPI backend..."
python api_real.py > backend.log 2>&1 &
BACKEND_PID=$!

# Give the backend time to start (increased for Space environment)
sleep 15

# Check if backend is running
echo "🔍 Checking backend status..."
if curl -s http://localhost:8002/api/health > /dev/null 2>&1; then
    echo "✅ Backend is running successfully!"
else
    echo "❌ Backend failed to start. Check backend.log for details."
    echo "📝 Backend logs:"
    tail -30 backend.log
    exit 1
fi

# Start the React frontend
echo "🎨 Starting React frontend..."
serve -s frontend/dist -l 3000