@echo off
echo ========================================
echo   RoadX Backend - Diagnostic Tool
echo ========================================
echo.

echo [CHECK 1] Checking if MySQL is running...
tasklist | findstr "mysqld.exe" >nul
if %errorlevel% equ 0 (
    echo ✅ MySQL is running
) else (
    echo ❌ MySQL is NOT running
    echo 💡 Start MySQL service from XAMPP/WAMP or services.msc
    pause
    exit /b 1
)

echo.
echo [CHECK 2] Checking if port 5000 is in use...
netstat -ano | findstr ":5000" >nul
if %errorlevel% equ 0 (
    echo ⚠️  Port 5000 is already in use
    echo 💡 Kill the process or use a different port
    netstat -ano | findstr ":5000"
    pause
) else (
    echo ✅ Port 5000 is available
)

echo.
echo [CHECK 3] Checking if database exists...
mysql -u root -e "USE roadx" 2>nul
if %errorlevel% equ 0 (
    echo ✅ Database 'roadx' exists
) else (
    echo ❌ Database 'roadx' does not exist
    echo 💡 Run: npm run migrate
    pause
    exit /b 1
)

echo.
echo [CHECK 4] Checking if users exist...
mysql -u root roadx -e "SELECT COUNT(*) as user_count FROM users;" 2>nul | findstr "user_count"
echo 💡 If count is 0, run: node src/scripts/create-test-user.js

echo.
echo [CHECK 5] Listing all users...
mysql -u root roadx -e "SELECT id, email, username, full_name, role, is_active FROM users;" 2>nul

echo.
echo [CHECK 6] Testing backend health endpoint...
curl -s http://localhost:5000/api/health 2>nul
if %errorlevel% equ 0 (
    echo ✅ Backend is running
) else (
    echo ❌ Backend is NOT running
    echo 💡 Start backend with: npm run dev
)

echo.
echo ========================================
echo   Diagnostic Complete
echo ========================================
echo.
echo If backend is not running, start it with:
echo   cd backend
echo   npm run dev
echo.
pause