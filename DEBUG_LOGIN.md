# Mobile App Login Debugging Guide

## Current Status
✅ Fixed: ServiceRequestScreen error (required_fields.map issue)
✅ Fixed: Backend CORS configuration for React Native
✅ Fixed: Added better error logging in LoginScreen
⚠️ **Issue: Mobile app login still failing**

---

## Step-by-Step Debugging

### Step 1: Verify Backend is Running

**Open a terminal and run:**
```bash
cd backend
npm run dev
```

**You should see:**
```
🚀 RoadX API server running on port 5000
Environment: development
✅ Database connected
```

**If you see errors:**
- Database connection error → Check MySQL is running
- Port already in use → Kill the process using port 5000
- Module not found → Run `npm install`

---

### Step 2: Test Backend API Directly

**In a NEW terminal, run:**
```bash
cd backend
node src/scripts/test-login.js
```

**Expected output:**
```
🔍 Testing Login API...

1️⃣  Testing backend connection...
   ✅ Backend is running

2️⃣  Testing database connection...
   ✅ Database connected
   ✅ Found 2 user(s):
      - Test User (test@example.com) - Role: customer - Active: 1
      - RoadX Admin (admin@roadx.pk) - Role: super_admin - Active: 1

3️⃣  Testing login API...
   ✅ Test Customer (email): SUCCESS
   ✅ Test Customer (username): SUCCESS
   ✅ Admin: SUCCESS

==================================================
📊 TEST SUMMARY
==================================================
Backend Running:     ✅
Database Connected:  ✅
Login API Working:   ✅
==================================================

🎉 All tests passed! Login should work.
```

**If tests fail:**
- Backend not running → Start it with `npm run dev`
- No users → Run `npm run seed` then `node src/scripts/create-test-user.js`
- Login API fails → Check error message for details

---

### Step 3: Check Mobile App Configuration

**Verify the API URL in `mobile-app/src/config.js`:**
```javascript
const API_HOST = '10.0.2.2';  // For Android Emulator
const API_PORT = '5000';
export const API_BASE_URL = `http://${API_HOST}:${API_PORT}/api`;
```

**For iOS Simulator, change to:**
```javascript
const API_HOST = 'localhost';  // For iOS Simulator
```

**For Physical Device:**
```javascript
const API_HOST = '192.168.1.100';  // Replace with your PC's IP address
```

---

### Step 4: Test Network Connectivity from Emulator

**Start the backend server, then test from the emulator:**

**Option A: Use the React Native Debugger**
1. Shake the device or press `Ctrl+M` (Android) / `Cmd+D` (iOS)
2. Select "Debug"
3. Open browser console and run:
```javascript
fetch('http://10.0.2.2:5000/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

**Option B: Add a test button in LoginScreen**

Add this temporary test function to LoginScreen.js:
```javascript
const testAPI = async () => {
  try {
    const response = await fetch('http://10.0.2.2:5000/api/health');
    const data = await response.json();
    alert('API Test: ' + JSON.stringify(data));
  } catch (error) {
    alert('API Test Failed: ' + error.message);
  }
};
```

Then add a button:
```javascript
<TouchableOpacity onPress={testAPI} style={styles.testButton}>
  <Text style={styles.testButtonText}>Test API Connection</Text>
</TouchableOpacity>
```

---

### Step 5: Check Backend Logs

**When you try to login from the app, check the backend terminal for logs:**

**You should see:**
```
POST /api/auth/login 200 123.456 ms - 456
```

**If you see errors:**
```
Error: Cannot read property 'xxx' of undefined
```
→ There's a bug in the backend code

```
POST /api/auth/login 401 5.123 ms - 23
```
→ Login failed (wrong credentials or user doesn't exist)

**If you see NOTHING:**
→ The request is not reaching the backend (network/CORS issue)

---

### Step 6: Common Issues and Solutions

#### Issue 1: "Network request failed" or "fetch failed"

**Cause:** Emulator cannot reach the backend

**Solutions:**
1. **For Android Emulator:**
   - Ensure you're using `10.0.2.2` (not `localhost`)
   - Check if backend is running on port 5000
   - Try: `adb reverse tcp:5000 tcp:5000`

2. **For iOS Simulator:**
   - Use `localhost` instead of `10.0.2.2`
   - Ensure backend is running

3. **For Physical Device:**
   - Use your PC's local IP (e.g., `192.168.1.100`)
   - Ensure phone and PC are on the same WiFi network
   - Disable firewall or allow port 5000

#### Issue 2: "Invalid credentials"

**Cause:** User doesn't exist or password is wrong

**Solution:**
```bash
cd backend
# Create test user
node src/scripts/create-test-user.js

# Or check existing users
mysql -u root -p roadx -e "SELECT email, username, full_name FROM users;"
```

#### Issue 3: CORS Error

**Cause:** Backend CORS not configured properly

**Solution:** Already fixed in the latest code. Restart backend:
```bash
cd backend
npm run dev
```

#### Issue 4: "No token provided" or 401 errors

**Cause:** Backend running but auth middleware blocking

**Solution:** This is normal for unauthenticated requests. The login endpoint should work without a token.

---

### Step 7: Enable Detailed Logging

**Add this to the top of `backend/src/app.js` to see all requests:**
```javascript
// Add after line 28
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

**Now you'll see every request in the backend console.**

---

### Step 8: Test with Exact Credentials

**Use these exact credentials in the mobile app:**

**Test Customer:**
- Username/Email: `test@example.com` OR `testuser`
- Password: `test123`

**Admin:**
- Username: `admin`
- Password: `Admin@123`

---

## Quick Diagnostic Checklist

Run through this checklist:

- [ ] Backend server is running (`npm run dev`)
- [ ] Database is running (MySQL service is active)
- [ ] Database has users (`npm run seed` + `node src/scripts/create-test-user.js`)
- [ ] Backend health check works: `http://localhost:5000/api/health`
- [ ] Login API test works: `node src/scripts/test-login.js`
- [ ] Mobile app API URL is correct (`10.0.2.2:5000` for Android)
- [ ] Emulator can ping backend (test with browser or curl)
- [ ] Backend logs show incoming requests
- [ ] No CORS errors in backend logs
- [ ] Using correct credentials

---

## Advanced Debugging

### Enable React Native Debugger

1. Install React Native Debugger:
```bash
npm install -g react-native-debugger
```

2. Start it:
```bash
react-native-debugger
```

3. Connect from emulator:
   - Android: Shake device → Debug → Select debugger
   - iOS: Shake device → Debug → Select debugger

4. Watch the Network tab to see API requests

### Check Redux DevTools

If using Redux DevTools, you can see:
- The exact action being dispatched
- The payload being sent
- The error being returned
- The state changes

---

## Most Likely Issues (In Order)

1. **Backend not running** → Start with `npm run dev`
2. **No users in database** → Run `npm run seed` and `node src/scripts/create-test-user.js`
3. **Wrong API URL** → Check `mobile-app/src/config.js`
4. **Emulator network issue** → Try `adb reverse tcp:5000 tcp:5000` for Android
5. **CORS issue** → Already fixed, restart backend
6. **Wrong credentials** → Use test credentials above

---

## Final Test

Once you've gone through all steps, test with this exact flow:

1. **Backend terminal:**
```bash
cd backend
npm run dev
```

2. **New terminal - verify backend:**
```bash
node src/scripts/test-login.js
```

3. **Mobile app:**
   - Open app
   - Enter: `test@example.com`
   - Password: `test123`
   - Click Login

4. **Watch backend terminal** - you should see:
```
POST /api/auth/login 200 45.123 ms - 789
```

5. **If successful**, you'll be navigated to the HomeScreen

---

## Still Not Working?

If login still fails after all these steps, provide:

1. **Backend terminal output** when you try to login
2. **Metro bundler console output** (any errors)
3. **Exact error message** shown in the app
4. **Output of test-login.js script**
5. **Screenshot of the login screen** (if possible)

This will help identify the exact issue.