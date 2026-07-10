# FIX LOGIN NOW - Step-by-Step Action Plan

## The login is failing. Here's exactly what to do RIGHT NOW:

---

## ⚡ QUICK FIX (5 Minutes)

### Step 1: Start Backend Server

**Open a NEW terminal and run:**
```bash
cd backend
npm run dev
```

**Keep this terminal open!** You should see:
```
🚀 RoadX API server running on port 5000
Environment: development
```

**If you see errors:**
- "Database connection error" → Start MySQL service
- "Port already in use" → Run `netstat -ano | findstr :5000` then `taskkill /PID <PID> /F`
- "Module not found" → Run `npm install`

---

### Step 2: Setup Database (First Time Only)

**In the SAME terminal where backend is running, open ANOTHER NEW terminal:**

```bash
cd backend

# Run this ONLY if you haven't before:
npm run migrate
npm run seed
node src/scripts/create-test-user.js
```

**Expected output:**
```
✅ Database seeded successfully!
📋 Admin Credentials:
   Username: admin
   Password: Admin@123

✅ Test user created successfully
   Email: test@example.com
   Password: test123
```

---

### Step 3: Verify Backend is Working

**In the new terminal, run:**
```bash
node src/scripts/test-login.js
```

**You MUST see:**
```
✅ Backend is running
✅ Database connected
✅ Found 2 user(s)
✅ Test Customer (email): SUCCESS
✅ Login API Working: ✅
```

**If any of these fail, fix that first before continuing!**

---

### Step 4: Test Login in Mobile App

**Now try logging in from your mobile app:**

**Use these EXACT credentials:**
- **Username/Email:** `test@example.com`
- **Password:** `test123`

**OR**

- **Username:** `testuser`
- **Password:** `test123`

---

## 🔍 IF LOGIN STILL FAILS - DEBUGGING

### Check 1: Watch Backend Terminal

**When you click Login in the app, look at the backend terminal.**

**You should see:**
```
[2024-01-10T08:30:45.123Z] POST /api/auth/login - Origin: null
```

**If you see this:**
- ✅ Request is reaching backend
- Check the response code (200 = success, 401 = wrong credentials, 500 = error)

**If you see NOTHING:**
- ❌ Request is not reaching backend
- Problem: Network/CORS/Emulator issue

---

### Check 2: Common Error Messages

#### Error: "Network request failed"
**Cause:** Emulator cannot connect to backend

**Fix for Android Emulator:**
```bash
# In terminal, run:
adb reverse tcp:5000 tcp:5000
```

**Fix for iOS Simulator:**
- Change `mobile-app/src/config.js` line 7 from `10.0.2.2` to `localhost`

**Fix for Physical Device:**
1. Find your PC's IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Change `mobile-app/src/config.js` to use your IP:
   ```javascript
   const API_HOST = '192.168.1.100'; // Your PC's IP
   ```
3. Ensure phone and PC are on same WiFi
4. Disable Windows Firewall or allow port 5000

---

#### Error: "Invalid credentials"
**Cause:** User doesn't exist or password is wrong

**Fix:**
```bash
cd backend

# Check if user exists:
mysql -u root -p roadx -e "SELECT email, username, password_hash FROM users;"

# If no users, create them:
node src/scripts/create-test-user.js
```

---

#### Error: "Too many authentication attempts"
**Cause:** Rate limit exceeded (10 attempts per 15 minutes)

**Fix:** Wait 15 minutes or restart backend

---

#### Error: "Cannot read property 'xxx' of undefined"
**Cause:** Backend bug

**Fix:** Check backend terminal for full error stack trace

---

### Check 3: Test API Directly from Browser

**Open your PC's browser and go to:**
```
http://localhost:5000/api/health
```

**You should see:**
```json
{"status":"ok","message":"RoadX API is running"}
```

**If this works but mobile app doesn't:**
- Problem is with emulator network configuration
- Try `adb reverse tcp:5000 tcp:5000` for Android

---

### Check 4: Test Login with curl

**Open terminal and run:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"test123\"}"
```

**Expected response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "email": "test@example.com",
    "username": "testuser",
    "full_name": "Test User",
    "role": "customer"
  }
}
```

**If this works but mobile app doesn't:**
- Problem is with mobile app network configuration
- Check `mobile-app/src/config.js`

---

## 📋 COMPLETE DIAGNOSTIC CHECKLIST

Run through EVERY item:

### Backend (Terminal 1)
- [ ] Backend is running: `npm run dev`
- [ ] No errors in backend terminal
- [ ] MySQL is running
- [ ] Database `roadx` exists
- [ ] Tables are created (`npm run migrate`)
- [ ] Seed data exists (`npm run seed`)
- [ ] Test user exists (`node src/scripts/create-test-user.js`)
- [ ] Health check works: `http://localhost:5000/api/health`
- [ ] Login test works: `node src/scripts/test-login.js`

### Mobile App (Terminal 2)
- [ ] Metro bundler is running: `npm start`
- [ ] App builds without errors
- [ ] No red screen errors
- [ ] Can see login screen

### Network
- [ ] For Android: Using `10.0.2.2` in config.js
- [ ] For iOS: Using `localhost` in config.js
- [ ] Backend port 5000 is not blocked by firewall
- [ ] `adb reverse tcp:5000 tcp:5000` executed (Android only)

### Credentials
- [ ] Using `test@example.com` or `testuser`
- [ ] Password is exactly `test123` (case-sensitive)
- [ ] No extra spaces in username/password

---

## 🎯 MOST LIKELY ISSUES (In Order of Probability)

### 1. Backend Not Running (40%)
**Symptom:** "Network request failed" or no logs in backend terminal

**Fix:**
```bash
cd backend
npm run dev
```

---

### 2. No Users in Database (30%)
**Symptom:** "Invalid credentials" error

**Fix:**
```bash
cd backend
npm run seed
node src/scripts/create-test-user.js
```

---

### 3. Wrong API URL (15%)
**Symptom:** "Network request failed"

**Fix:** Check `mobile-app/src/config.js`:
- Android: `10.0.2.2`
- iOS: `localhost`
- Physical: Your PC's IP

---

### 4. Emulator Network Issue (10%)
**Symptom:** Backend works in browser but not from app

**Fix:**
```bash
adb reverse tcp:5000 tcp:5000
```

---

### 5. CORS Issue (5%)
**Symptom:** CORS error in backend logs

**Fix:** Already fixed in code. Restart backend:
```bash
cd backend
npm run dev
```

---

## 🚀 COMPLETE SETUP FROM SCRATCH

If nothing works, start completely fresh:

### Terminal 1 - Backend:
```bash
cd backend
npm install
npm run migrate
npm run seed
node src/scripts/create-test-user.js
npm run dev
```

### Terminal 2 - Mobile App:
```bash
cd mobile-app
npm install
npm start
```

### Then in another terminal - Test:
```bash
cd backend
node src/scripts/test-login.js
```

### Finally - Mobile App:
1. Open app
2. Username: `test@example.com`
3. Password: `test123`
4. Click Login

---

## 📞 STILL NOT WORKING?

If login still fails after ALL of the above, here's what to provide for help:

1. **Backend terminal output** (copy-paste everything)
2. **Metro bundler output** (any errors)
3. **Exact error message** from the app
4. **Output of test-login.js**
5. **Your setup:**
   - Android or iOS?
   - Emulator or physical device?
   - Windows or Mac?

---

## ✅ SUCCESS INDICATORS

You'll know login is working when:

1. **Backend terminal shows:**
   ```
   POST /api/auth/login 200 45.123 ms - 789
   ```

2. **Mobile app navigates to HomeScreen**

3. **You can see your name in the app header**

---

## 🎓 UNDERSTANDING THE LOGIN FLOW

```
Mobile App (LoginScreen)
    ↓
dispatch(login({ email: username, password }))
    ↓
authSlice.js → authAPI.login()
    ↓
axios.post('http://10.0.2.2:5000/api/auth/login', { email, password })
    ↓
Backend (authController.js → loginWithEmailHandler)
    ↓
Database (User.findByEmail or User.findByUsername)
    ↓
Returns: { access_token, refresh_token, user }
    ↓
Stored in AsyncStorage
    ↓
Navigation to HomeScreen
```

**The login API supports BOTH email and username!**

---

## 🔧 TROUBLESHOOTING COMMANDS

```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Check if MySQL is running
mysql -u root -p -e "SHOW DATABASES;"

# Check if users exist
mysql -u root -p roadx -e "SELECT email, username FROM users;"

# Check what's using port 5000
netstat -ano | findstr :5000

# Kill process on port 5000 (Windows)
taskkill /PID <PID> /F

# Test login API
node src/scripts/test-login.js

# Start backend
npm run dev

# Reset backend (kill and restart)
Ctrl+C
npm run dev
```

---

## 💡 PRO TIPS

1. **Always keep backend terminal visible** - Watch for requests and errors
2. **Run test-login.js first** - Verify backend works before testing mobile app
3. **Use exact credentials** - `test@example.com` / `test123`
4. **Check backend logs** - They tell you exactly what's happening
5. **Restart backend after changes** - Code changes require server restart

---

## 🎯 BOTTOM LINE

**90% of login issues are caused by:**
1. Backend not running → Start it!
2. No users in database → Run seed + create-test-user scripts
3. Wrong credentials → Use test@example.com / test123

**Follow the steps above in order and login WILL work!**