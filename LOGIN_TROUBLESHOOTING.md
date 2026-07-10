# Login API Troubleshooting Guide

## Problem Analysis

After reviewing the entire login flow, here are the **most common reasons** why login fails:

### 1. **No Users in Database** ⚠️ MOST LIKELY
The `seed.sql` file only creates an **admin user**, NOT regular customer/users.

**Admin credentials (from seed.sql):**
- Username: `admin`
- Password: `Admin@123`
- Email: `admin@roadx.pk`
- Role: super_admin

**Regular users must be created via:**
- OTP/Phone verification flow (recommended for production)
- OR using the `create-test-user.js` script

### 2. **Database Not Set Up**
The database and tables might not exist.

### 3. **Backend Server Not Running**
The API server at `http://10.0.2.2:5000/api` must be running.

### 4. **Wrong Credentials**
The login screen sends the username field as "email" to the API, which supports both email and username.

---

## Step-by-Step Fix

### Step 1: Verify Backend is Running

```bash
cd backend
npm run dev
```

You should see:
```
🚀 Server running on port 5000
✅ Database connected
```

### Step 2: Setup Database (First Time Only)

```bash
# Run migrations to create tables
npm run migrate

# Seed initial data (creates admin user and service categories)
npm run seed
```

Expected output:
```
✅ Database seeded successfully!
📋 Admin Credentials:
   Username: admin
   Password: Admin@123
```

### Step 3: Create a Test Customer User

```bash
node src/scripts/create-test-user.js
```

Expected output:
```
✅ Test user created successfully
   Email: test@example.com
   Username: testuser
   Password: test123
```

### Step 4: Test Login

You can now login with either:

**Option A - Using Email:**
- Email: `test@example.com`
- Password: `test123`

**Option B - Using Username:**
- Username: `testuser`
- Password: `test123`

**Option C - Admin (for testing admin features):**
- Username: `admin`
- Password: `Admin@123`

---

## Login Flow Explanation

### Frontend (LoginScreen.js)
```javascript
const handlePasswordLogin = async () => {
  const result = await dispatch(login({ 
    email: username,  // Note: sends username as "email"
    password 
  })).unwrap();
};
```

### Backend (authController.js - loginWithEmailHandler)
```javascript
// Determines if input is email or username
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isEmail = emailRegex.test(email);

if (isEmail) {
  user = await User.findByEmail(email);
} else {
  user = await User.findByUsername(email);
}
```

**This means you can login with EITHER email OR username!**

---

## Common Issues & Solutions

### Issue: "Invalid credentials"
**Cause:** User doesn't exist or password is wrong
**Solution:** 
1. Run `npm run seed` to create admin user
2. Run `node src/scripts/create-test-user.js` to create test customer
3. Verify you're using correct credentials

### Issue: "No token provided" or 401 errors
**Cause:** Backend not running or wrong API URL
**Solution:**
1. Ensure backend is running on port 5000
2. For Android emulator, use `http://10.0.2.2:5000/api`
3. For iOS simulator, use `http://localhost:5000/api`

### Issue: "Session expired. Please login again."
**Cause:** JWT token expired or invalid
**Solution:** Clear app data and login again

### Issue: "Account is blocked or inactive"
**Cause:** User account is blocked
**Solution:** Check database - user.is_blocked should be 0

### Issue: "Please set a password first"
**Cause:** User created via OTP but no password set
**Solution:** This is for users who registered via phone OTP. They need to set a password first (feature not implemented yet).

---

## Database Verification

Check if users exist:

```bash
mysql -u root -p roadx -e "SELECT id, email, username, full_name, role, is_active, is_blocked FROM users;"
```

You should see at least:
- admin user (role: super_admin)
- test user (role: customer)

If no users, run the seed script again.

---

## Quick Start Script

Create a new file `backend/quick-start.sh` (Linux/Mac) or `backend/quick-start.bat` (Windows):

**For Windows (quick-start.bat):**
```batch
@echo off
echo 🚀 Starting RoadX Backend Setup...
echo.

echo 📦 Installing dependencies...
npm install

echo.
echo 🗄️  Running database migrations...
npm run migrate

echo.
echo 🌱 Seeding database...
npm run seed

echo.
echo 👤 Creating test user...
node src/scripts/create-test-user.js

echo.
echo ✅ Setup complete!
echo.
echo 📋 Test Credentials:
echo    Customer - Email: test@example.com / Password: test123
echo    Customer - Username: testuser / Password: test123
echo    Admin - Username: admin / Password: Admin@123
echo.
echo 🚀 Starting server...
npm run dev
pause
```

**For Linux/Mac (quick-start.sh):**
```bash
#!/bin/bash
echo "🚀 Starting RoadX Backend Setup..."
echo ""

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🗄️  Running database migrations..."
npm run migrate

echo ""
echo "🌱 Seeding database..."
npm run seed

echo ""
echo "👤 Creating test user..."
node src/scripts/create-test-user.js

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Test Credentials:"
echo "   Customer - Email: test@example.com / Password: test123"
echo "   Customer - Username: testuser / Password: test123"
echo "   Admin - Username: admin / Password: Admin@123"
echo ""
echo "🚀 Starting server..."
npm run dev
```

---

## Testing the API Directly

Use the test script to verify the API works:

```bash
node src/scripts/test-login.js
```

Or test with curl:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

Expected response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "email": "test@example.com",
    "username": "testuser",
    "full_name": "Test User",
    "role": "customer",
    ...
  }
}
```

---

## Summary

**The #1 reason login fails: NO USERS IN DATABASE**

Run these commands in order:
```bash
cd backend
npm install
npm run migrate
npm run seed
node src/scripts/create-test-user.js
npm run dev
```

Then login with:
- **Email:** `test@example.com`
- **Password:** `test123`

OR

- **Username:** `testuser`
- **Password:** `test123`