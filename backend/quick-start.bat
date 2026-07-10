@echo off
echo ========================================
echo   RoadX Backend - Quick Start Setup
echo ========================================
echo.

echo [1/5] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/5] Running database migrations...
call npm run migrate
if %errorlevel% neq 0 (
    echo ❌ Failed to run migrations
    pause
    exit /b 1
)

echo.
echo [3/5] Seeding database with initial data...
call npm run seed
if %errorlevel% neq 0 (
    echo ❌ Failed to seed database
    pause
    exit /b 1
)

echo.
echo [4/5] Creating test customer user...
node src/scripts/create-test-user.js
if %errorlevel% neq 0 (
    echo ❌ Failed to create test user
    pause
    exit /b 1
)

echo.
echo [5/5] Starting development server...
echo.
echo ========================================
echo   ✅ Setup Complete!
echo ========================================
echo.
echo 📋 Test Credentials:
echo    Customer - Email: test@example.com
echo    Customer - Password: test123
echo.
echo    Customer - Username: testuser
echo    Customer - Password: test123
echo.
echo    Admin - Username: admin
echo    Admin - Password: Admin@123
echo.
echo 🚀 Server will start on http://localhost:5000
echo 📱 Mobile app should use: http://10.0.2.2:5000/api
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

call npm run dev
pause