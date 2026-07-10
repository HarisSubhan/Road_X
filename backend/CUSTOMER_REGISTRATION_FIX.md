# Customer Registration Fix - Email and Password Fields Missing

## Problem Description

When registering a customer account using phone OTP verification, the `email` and `password_hash` fields were being saved as `NULL` in the database, preventing users from logging in.

## Root Cause Analysis

### Issue 1: Password Hash Not Being Saved
**File:** `backend/src/controllers/authController.js` (Line 154-164)

**Before:**
```javascript
// Create user account
const passwordHash = await bcrypt.hash(password, 10);
const userId = await User.create({
  phone_number: formattedPhone,
  full_name: full_name.trim(),
  username: username.trim(),
  password_hash: passwordHash,  // ❌ WRONG: User.create() expects 'password', not 'password_hash'
  role: 'customer',
  preferred_language: 'en',
  email: null,
  is_active: true
});
```

**Why it failed:**
The `User.create()` method in `backend/src/models/User.js` (lines 37-56) expects a `password` field and handles the hashing internally:

```javascript
static async create(data) {
  const fields = ['phone_number', 'full_name', 'role', 'preferred_language', 'email'];
  const values = [data.phone_number, data.full_name || null, data.role || 'customer', data.preferred_language || 'en', data.email || null];
  
  // Add username and password if provided
  if (data.username) {
    fields.push('username');
    values.push(data.username);
  }
  if (data.password) {  // ✅ Expects 'password', not 'password_hash'
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(data.password, 10);
    fields.push('password_hash');
    values.push(passwordHash);
  }
  // ...
}
```

When `password_hash` was passed instead of `password`, the condition `if (data.password)` was false, so the password hashing code was never executed, leaving `password_hash` as NULL in the database.

### Issue 2: Email Hardcoded to NULL
**File:** `backend/src/controllers/authController.js` (Line 162)

```javascript
email: null,  // ❌ Email is always NULL for phone-registered users
```

While this is intentional (phone registration doesn't require email), it's documented here for clarity. Users registered via phone OTP won't have an email address.

## Solution

### Fixed Code
**File:** `backend/src/controllers/authController.js` (Lines 154-164)

**After:**
```javascript
// Create user account
const userId = await User.create({
  phone_number: formattedPhone,
  full_name: full_name.trim(),
  username: username.trim(),
  password: password,  // ✅ CORRECT: Pass plain password, User.create() will hash it
  role: 'customer',
  preferred_language: 'en',
  email: null,  // Expected: Phone-registered users don't have email
  is_active: true
});
```

## Changes Made

1. **Removed** the manual bcrypt hashing (line 154: `const passwordHash = await bcrypt.hash(password, 10);`)
2. **Changed** `password_hash: passwordHash` to `password: password` to match the expected parameter in `User.create()`

## Testing

A test file has been created at `backend/test-registration-fix.js` to verify the fix:

```bash
cd backend
node test-registration-fix.js
```

This test will:
1. Send OTP to a phone number
2. Verify OTP and create a new customer account
3. Verify the user can login with username and password

## Impact

- ✅ Customer registration via phone OTP now saves passwords correctly
- ✅ Users can login with their username and password
- ✅ No breaking changes to existing functionality
- ✅ Password hashing is still secure (handled by User.create())

## Related Files

- `backend/src/controllers/authController.js` - Fixed
- `backend/src/models/User.js` - No changes needed (already correct)
- `backend/database/schema.sql` - No changes needed (schema is correct)

## Notes

- Users registered via phone OTP will have `email = NULL` in the database
- This is expected behavior as phone registration doesn't require email
- Users can still login using their username (not email) since email is NULL
- The login handler (`loginWithEmailHandler`) supports both email and username login