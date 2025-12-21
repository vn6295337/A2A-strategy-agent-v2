#!/bin/bash

echo "🚀 Starting A2A Strategy Agent Space"
echo "==================================="

# Start the FastAPI backend in the background
echo "🌐 Starting FastAPI backend on port 8002..."
python api_real.py &
BACKEND_PID=$!

# Give the backend a moment to start
sleep 10

# Check if backend is running (with retry logic)
echo "🔍 Checking backend status..."
MAX_RETRIES=5
RETRY_COUNT=0
BACKEND_READY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:8002/api/health &> /dev/null; then
        echo "✅ Backend is running successfully!"
        BACKEND_READY=true
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "⏳ Retrying backend check ($RETRY_COUNT/$MAX_RETRIES)..."
    sleep 5
 done

if [ "$BACKEND_READY" = false ]; then
    echo "❌ Error: Backend failed to start after $MAX_RETRIES attempts"
    echo "📝 Backend logs:"
    tail -20 nohup.out 2>/dev/null || echo "No log file found"
    exit 1
fi

# Start the React frontend
echo "🎨 Starting React frontend on port 3000..."
serve -s frontend/dist -l 3000

echo "👋 Space is shutting down..."