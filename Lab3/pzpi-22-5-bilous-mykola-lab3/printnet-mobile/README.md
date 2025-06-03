# PrintNet Mobile Application

A simple Android mobile application for the PrintNet printing service, built with Jetpack Compose and Kotlin.

## Features

- **Authentication**: Login and registration functionality
- **Profile Management**: View and edit user profile information
- **Orders Management**: View orders list and detailed order information
- **Order Tracking**: See order status history and cancel pending orders

## Quick Start

### 1. Start the Backend
```bash
cd /Users/nickbel/Documents/study/nure/printnet/printnet-backend
npm run start:dev
```

### 2. Run the Mobile App
1. Open the project in Android Studio
2. Sync dependencies
3. Run on emulator or device

## Network Configuration

- **Android Emulator**: Uses `http://10.0.2.2:3000` (already configured)
- **Physical Device**: Update `BASE_URL` in `ApiClient.kt` with your computer's IP address

## Architecture

- **MVVM** with ViewModels and UI State
- **Jetpack Compose** for declarative UI
- **Retrofit** for API communication
- **DataStore** for local storage
- **Navigation Compose** for navigation

## Project Structure

```
app/src/main/java/com/printnet/mobile/
├── data/          # API, models, repositories
├── navigation/    # Navigation setup
├── ui/           # Screens, ViewModels, theme
├── utils/        # Utility functions
└── MainActivity.kt
```

## API Endpoints

- `POST /auth/login` - User authentication
- `POST /auth` - User registration  
- `GET /users/profile` - Get user profile
- `PUT /users/{id}` - Update user profile
- `GET /orders` - Get user's orders
- `GET /orders/{id}` - Get order details
- `POST /orders/{id}/cancel` - Cancel order

## App Screens

1. **Login/Registration**: Toggle between modes with validation
2. **Orders List**: View all orders with status indicators
3. **Order Details**: Complete order info with status history
4. **Profile**: View/edit user information and logout

## Troubleshooting

**Connection Issues**:
- Ensure backend runs on port 3000
- For physical devices, update IP in `ApiClient.kt`
- Check firewall settings

**Authentication Issues**:
- Verify user accounts in backend database
- Check backend logs for errors
- Ensure password meets requirements

## Key Dependencies

- Navigation Compose 2.7.6
- Retrofit 2.9.0 
- Lifecycle ViewModel Compose 2.7.0
- DataStore Preferences 1.0.0
- Material Icons Extended 1.5.15