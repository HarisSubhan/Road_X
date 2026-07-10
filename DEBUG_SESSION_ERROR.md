# Debug Session Expired Error

## Problem
When a new user tries to register as a provider, they get: "Session expired. Please login again."

## Why This Happens

The "Session expired" error comes from the API interceptor in `mobile-app/src/services/api.js` (line 60). It's triggered when:
1. Backend returns 401 (Unauthorized)
2. The interceptor tries to refresh the token
3. No refresh token exists
4. Interceptor shows "Session expired. Please login again."

## This Means the Backend is Rejecting the Request

The backend `/api/providers/register` endpoint is returning 401, which means:
- Token is missing or invalid
- User doesn't exist in database
- User is blocked/inactive

## Debug Steps

### Step 1: Check Console Logs

I've added debug logging to `ProviderRegistrationScreen.js`. When you test, check the Metro console for:

```
Starting provider registration...
User: {user object}
CNIC: {cnic number}
Registration response: {response data}
```

OR

```
Registration error: {error object}
Error response: {detailed error from backend}
Error message: {error message}
```

### Step 2: Check Backend Logs

Look at your backend terminal/console. You should see:
```
[timestamp] POST /api/providers/register - Origin: http://10.0.2.2:8081
```

If you see an error, it will show:
- "No token provided" - Token not being sent
- "Invalid token" - Token is malformed
- "User not found" - User doesn't exist in database
- "User account is inactive or blocked" - User is blocked

### Step 3: Verify Token Exists

Add this check before registration:

```javascript
const token = await AsyncStorage.getItem('accessToken');
console.log('Token exists:', !!token);
console.log('Token value:', token);
```

## Most Likely Causes

### 1. **User Not Properly Logged In**
The user might have reached the registration screen without a valid token.

**Solution:** Make sure the user completes the full login flow:
- OTP verification OR
- Email/password login

### 2. **Token Not Stored After Login**
The token might not be saved to AsyncStorage.

**Solution:** Check `storeAuthData` function in `api.js` is working.

### 3. **Backend Database Issue**
The user exists in the app but not in the database.

**Solution:** Check if the user was created during OTP verification or login.

### 4. **Wrong API URL**
The mobile app might be pointing to the wrong backend URL.

**Solution:** Check `mobile-app/src/config.js`:
```javascript
const API_HOST = '10.0.2.2'; // For Android emulator
const API_PORT = '5000';
```

## Quick Fixes to Try

### Fix 1: Restart Everything
1. Stop backend server
2. Stop Metro bundler
3. Clear app data on emulator
4. Restart backend
5. Restart Metro
6. Reinstall app
7. Login again and try registration

### Fix 2: Check Backend is Running
```bash
cd backend
npm start
```

Should show: `RoadX API server running on port 5000`

### Fix 3: Test Backend Directly
Use Postman or curl to test:
```bash
curl -X POST http://localhost:5000/api/providers/register \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"cnic_number":"12345-1234567-1","service_category_id":1,"vehicle_make":"Toyota","vehicle_model":"Corolla","vehicle_year":"2020","vehicle_plate":"ABC-1234"}'
```

## What to Tell Me

Please share:
1. The console.log output from the app (User object, error details)
2. The backend logs when you try to register
3. How the user logged in (OTP or email/password)
4. Did the login succeed? (Did they get a token?)

This will help me identify the exact issue.

## Temporary Workaround

If you need to test quickly, you can bypass the token check temporarily in the backend (NOT recommended for production):

```javascript
// In backend/src/routes/providers.js
// Temporarily remove authenticate middleware
router.post('/register', (req, res, next) => {
  req.user = { id: 1 }; // Hardcode user ID
  next();
}, [
  body('cnic_number').notEmpty().withMessage('CNIC number is required'),
  body('service_category_id').isInt().withMessage('Service category ID must be an integer')
], handleValidationErrors, registerProvider);
```

This will let you test the registration flow without authentication.