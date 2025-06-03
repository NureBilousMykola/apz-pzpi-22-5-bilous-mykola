#!/bin/bash

# PrintNet Mobile Test Script

echo "🧪 PrintNet Mobile Testing Guide"
echo "================================"

echo ""
echo "📱 Before Testing the Mobile App:"
echo "1. Ensure backend is running on localhost:3000"
echo "2. Open the mobile project in Android Studio"
echo "3. Sync the project and resolve any dependencies"
echo ""

echo "🔧 Backend Setup:"
echo "cd /Users/nickbel/Documents/study/nure/printnet/printnet-backend"
echo "npm run start:dev"
echo ""

echo "📋 Test Scenarios:"
echo ""
echo "1. 🔐 Authentication Testing:"
echo "   - Register a new user with valid email/password"
echo "   - Login with the registered credentials"
echo "   - Verify persistent login (app restart)"
echo "   - Test logout functionality"
echo ""

echo "2. 👤 Profile Testing:"
echo "   - View profile information"
echo "   - Edit profile (first name, last name, email)"
echo "   - Save changes and verify updates"
echo ""

echo "3. 📦 Orders Testing:"
echo "   - View orders list (will be empty initially)"
echo "   - Create test orders via backend/admin panel"
echo "   - Refresh orders list"
echo "   - View order details"
echo "   - Test order history/status timeline"
echo ""

echo "4. 🏗️ To Create Test Orders (via Backend):"
echo "   You'll need to create orders through your backend API or admin panel"
echo "   since the mobile app currently focuses on viewing orders."
echo ""

echo "5. 🌐 Network Configuration:"
echo "   For Android Emulator: Already configured (10.0.2.2:3000)"
echo "   For Physical Device: Update ApiConfig.kt with your IP address"
echo ""

echo "📝 Test Checklist:"
echo "□ User registration works"
echo "□ User login works"
echo "□ Profile loading works"
echo "□ Profile editing works"
echo "□ Orders list loads (even if empty)"
echo "□ Navigation between screens works"
echo "□ Logout works"
echo "□ App handles network errors gracefully"
echo ""

echo "🐛 Common Issues & Solutions:"
echo "- Connection refused: Check backend is running on port 3000"
echo "- Login fails: Verify user exists in backend database"
echo "- Physical device issues: Update IP address in ApiConfig.kt"
echo "- Orders not loading: Create test orders in backend first"
echo ""

echo "✅ Ready to test! Start with user registration/login."