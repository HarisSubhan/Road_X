const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const User = require('../models/User');
const { generateOTP, sendOTP } = require('../services/otpService');

// Configure multer for profile image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/profile-images';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif)'));
  }
});

// ============= PHONE NUMBER VERIFICATION SYSTEM =============

// Send OTP to phone number
const sendOTPHandler = async (req, res) => {
  try {
    const { phone_number } = req.body;
    
    if (!phone_number) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Format phone number
    const formattedPhone = phone_number.startsWith('+92') ? phone_number : '+92' + phone_number.replace(/^0/, '');
    
    // Allow OTP for provider registration even if phone exists
    // (Phone existence check is done during registration, not OTP)

    // Generate 6-digit OTP
    const otpCode = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store OTP in memory (in production, use Redis)
    const otpStorage = req.app.get('otpStorage') || new Map();
    otpStorage.set(formattedPhone, {
      code: otpCode,
      expiresAt: expiresAt,
      full_name: null,
      username: null,
      password: null
    });
    req.app.set('otpStorage', otpStorage);

    // Send OTP via SMS
    try {
      await sendOTP(formattedPhone, otpCode);
    } catch (smsError) {
      console.error('SMS sending error:', smsError);
      if (process.env.NODE_ENV === 'development') {
        return res.json({ 
          message: 'OTP sent successfully',
          debug_otp: otpCode, // Only in development
          phone_number: formattedPhone
        });
      }
      return res.status(500).json({ error: 'Failed to send OTP' });
    }

    res.json({ 
      message: 'OTP sent successfully to your phone number',
      phone_number: formattedPhone 
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

// Verify OTP and create user
const verifyOTPHandler = async (req, res) => {
  try {
    const { phone_number, otp_code, full_name, username, password } = req.body;

    if (!phone_number || !otp_code) {
      return res.status(400).json({ error: 'Phone number and OTP code are required' });
    }

    // Format phone number
    const formattedPhone = phone_number.startsWith('+92') ? phone_number : '+92' + phone_number.replace(/^0/, '');
    
    // Get OTP data
    const otpStorage = req.app.get('otpStorage') || new Map();
    const otpData = otpStorage.get(formattedPhone);

    if (!otpData) {
      return res.status(400).json({ 
        error: 'No OTP request found. Please request a new OTP.' 
      });
    }

    // Check expiration
    if (Date.now() > otpData.expiresAt) {
      otpStorage.delete(formattedPhone);
      return res.status(400).json({ 
        error: 'OTP expired. Please request a new OTP.' 
      });
    }

    // Verify OTP
    if (otpData.code !== otp_code) {
      return res.status(400).json({ error: 'Invalid OTP code' });
    }

    // Validate required fields
    if (!full_name || full_name.trim().length === 0) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    if (!username || username.trim().length < 3) {
      return res.status(400).json({ error: 'Username is required and must be at least 3 characters' });
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password is required and must be at least 6 characters' });
    }

    // Create user account
    const userId = await User.create({
      phone_number: formattedPhone,
      full_name: full_name.trim(),
      username: username.trim(),
      password: password,
      role: 'customer',
      preferred_language: 'en',
      email: null,
      is_active: true
    });

    const user = await User.findById(userId);

    // Clear OTP
    otpStorage.delete(formattedPhone);

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRY || '30d' }
    );

    res.json({
      message: 'Phone number verified and account created successfully',
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        phone_number: user.phone_number,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        preferred_language: user.preferred_language,
        profile_image: user.profile_image,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
};

// ============= OTHER AUTH HANDLERS =============

const loginWithEmailHandler = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Login attempt:', { email, password: password ? '***' : 'undefined' });
    
    if (!email || !password) {
      console.log('❌ Missing credentials');
      return res.status(400).json({ error: 'Email/username and password are required' });
    }
    
    // Determine if input is email or username
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(email);
    console.log('📧 Input type:', isEmail ? 'email' : 'username');
    
    let user;
    if (isEmail) {
      user = await User.findByEmail(email);
      console.log('👤 User found by email:', user ? 'YES' : 'NO');
    } else {
      user = await User.findByUsername(email);
      console.log('👤 User found by username:', user ? 'YES' : 'NO');
    }
    
    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    console.log('👤 User details:', { id: user.id, email: user.email, username: user.username, role: user.role, is_active: user.is_active, is_blocked: user.is_blocked, has_password: !!user.password_hash });
    
    if (!user.password_hash) {
      console.log('❌ No password hash');
      return res.status(401).json({ error: 'Please set a password first' });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    console.log('🔑 Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (!user.is_active || user.is_blocked) {
      console.log('❌ Account blocked/inactive:', { is_active: user.is_active, is_blocked: user.is_blocked });
      return res.status(401).json({ error: 'Account is blocked or inactive' });
    }
    
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );
    
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRY || '30d' }
    );
    
    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        preferred_language: user.preferred_language,
        profile_image: user.profile_image,
        email_verified: user.email_verified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

const refreshTokenHandler = async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.is_active || user.is_blocked) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );

    res.json({ access_token: accessToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

const logoutHandler = async (req, res) => {
  try {
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to logout' });
  }
};

  const updateProfileHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, username, preferred_language, phone_number, cnic, vehicle_type, vehicle_plate, vehicle_make, vehicle_model, vehicle_year } = req.body;
    
    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (username !== undefined) updateData.username = username;
    if (preferred_language !== undefined) updateData.preferred_language = preferred_language;
    if (phone_number !== undefined) updateData.phone_number = phone_number;
    if (cnic !== undefined) updateData.cnic = cnic;
    if (vehicle_type !== undefined) updateData.vehicle_type = vehicle_type;
    if (vehicle_plate !== undefined) updateData.vehicle_plate = vehicle_plate;
    if (vehicle_make !== undefined) updateData.vehicle_make = vehicle_make;
    if (vehicle_model !== undefined) updateData.vehicle_model = vehicle_model;
    if (vehicle_year !== undefined) updateData.vehicle_year = vehicle_year;
    
    // Handle profile image upload
    if (req.file) {
      const user = await User.findById(userId);
      if (user.profile_image) {
        const oldImagePath = path.join(__dirname, '../../', user.profile_image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateData.profile_image = '/uploads/profile-images/' + req.file.filename;
    }
    
    await User.update(userId, updateData);
    
    const updatedUser = await User.findById(userId);
    
    res.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        phone_number: updatedUser.phone_number,
        full_name: updatedUser.full_name,
        role: updatedUser.role,
        preferred_language: updatedUser.preferred_language,
        profile_image: updatedUser.profile_image,
        email_verified: updatedUser.email_verified
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

const updateFCMTokenHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fcm_token } = req.body;
    
    await User.update(userId, { fcm_token });
    
    res.json({ message: 'FCM token updated successfully' });
  } catch (error) {
    console.error('Update FCM token error:', error);
    res.status(500).json({ error: 'Failed to update FCM token' });
  }
};

// Verify OTP only (no user creation - for provider registration)
const verifyOTPOnlyHandler = async (req, res) => {
  try {
    const { phone_number, otp_code } = req.body;

    if (!phone_number || !otp_code) {
      return res.status(400).json({ error: 'Phone number and OTP code are required' });
    }

    const formattedPhone = phone_number.startsWith('+92') ? phone_number : '+92' + phone_number.replace(/^0/, '');
    
    const otpStorage = req.app.get('otpStorage') || new Map();
    const otpData = otpStorage.get(formattedPhone);

    if (!otpData) {
      return res.status(400).json({ 
        error: 'No OTP request found. Please request a new OTP.' 
      });
    }

    if (Date.now() > otpData.expiresAt) {
      otpStorage.delete(formattedPhone);
      return res.status(400).json({ 
        error: 'OTP expired. Please request a new OTP.' 
      });
    }

    if (otpData.code !== otp_code) {
      return res.status(400).json({ error: 'Invalid OTP code' });
    }

    // Clear OTP after successful verification
    otpStorage.delete(formattedPhone);

    res.json({
      message: 'Phone number verified successfully',
      phone_number: formattedPhone,
      verified: true
    });

  } catch (error) {
    console.error('Verify OTP only error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
};

module.exports = {
  sendOTPHandler,
  verifyOTPHandler,
  verifyOTPOnlyHandler,
  loginWithEmailHandler,
  refreshTokenHandler,
  logoutHandler,
  updateProfileHandler,
  updateFCMTokenHandler,
  uploadProfileImage: upload.single('profile_image')
};
