#!/bin/bash

# PrintNet Development Setup Script

echo "🚀 PrintNet Development Setup"
echo "=============================="

# Check if we're in the right directory
if [ ! -f "printnet-backend/package.json" ] || [ ! -f "printnet-mobile/app/build.gradle.kts" ]; then
    echo "❌ Please run this script from the printnet directory containing both backend and mobile folders"
    exit 1
fi

echo "📦 Installing backend dependencies..."
cd printnet-backend
if command -v bun &> /dev/null; then
    echo "Using bun..."
    bun install
else
    echo "Using npm..."
    npm install
fi

echo "🔧 Starting backend server..."
if command -v bun &> /dev/null; then
    echo "Starting with bun..."
    bun run start:dev &
else
    echo "Starting with npm..."
    npm run start:dev &
fi

BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait a moment for backend to start
sleep 3

echo "🌐 Testing backend connection..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Backend is running on http://localhost:3000"
else
    echo "❌ Backend is not responding. Check the logs above."
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "✅ Setup complete!"
echo "📱 Now open Android Studio and run the mobile app"
echo "🔗 Backend is running at: http://localhost:3000"
echo ""
echo "To stop the backend, run: kill $BACKEND_PID"
echo "Or press Ctrl+C in this terminal"

# Keep the script running to maintain the backend
wait $BACKEND_PID