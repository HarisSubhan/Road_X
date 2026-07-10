const AdminUser = require('../models/AdminUser');
const User = require('../models/User');
const ServiceProvider = require('../models/ServiceProvider');
const Booking = require('../models/Booking');
const ServiceCategory = require('../models/ServiceCategory');
const Transaction = require('../models/Transaction');
const AppSettings = require('../models/AppSettings');
const CommissionSettings = require('../models/CommissionSettings');
const Notification = require('../models/Notification');
const { sendBroadcastNotification } = require('../services/fcmService');
const db = require('../config/db');

const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const admin = await AdminUser.findByUsername(username);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (!admin.is_active) {
      return res.status(403).json({ error: 'Admin account is inactive' });
    }
    
    const isValidPassword = await AdminUser.verifyPassword(password, admin.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    await AdminUser.updateLastLogin(admin.id);
    
    const accessToken = require('jsonwebtoken').sign(
      { adminId: admin.id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );
    
    res.json({
      access_token: accessToken,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        full_name: admin.full_name,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

const getDashboard = async (req, res) => {
  try {
    const totalCustomers = await User.getCustomerStats();
    const providerStats = await ServiceProvider.getStats();
    const bookingStats = await Booking.getStats();
    
    const [pendingApprovals] = await db.query(
      'SELECT COUNT(*) as count FROM service_providers WHERE approval_status = ?',
      ['pending']
    );
    
    res.json({
      total_customers: totalCustomers,
      approved_providers: providerStats.approved_count,
      pending_approvals: pendingApprovals[0].count,
      online_providers: providerStats.online_count,
      active_bookings: bookingStats.active_bookings,
      today_bookings: bookingStats.today_bookings,
      today_revenue: bookingStats.today_revenue,
      month_revenue: bookingStats.month_revenue
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

const getProviders = async (req, res) => {
  try {
    const filters = {
      approval_status: req.query.approval_status,
      category_id: req.query.category_id,
      search: req.query.search,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    };
    
    const providers = await ServiceProvider.getProviders(filters);
    res.json(providers);
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
};

const updateProviderApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejection_reason } = req.body;
    
    const provider = await ServiceProvider.findById(id);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    const updateData = { approved_by: req.admin.id };
    
    if (action === 'approve') {
      updateData.approval_status = 'approved';
      updateData.approved_at = new Date();
      updateData.rejection_reason = null;
    } else if (action === 'reject') {
      updateData.approval_status = 'rejected';
      updateData.rejection_reason = rejection_reason;
    } else if (action === 'suspend') {
      updateData.approval_status = 'suspended';
      updateData.rejection_reason = rejection_reason;
    } else if (action === 'reinstate') {
      updateData.approval_status = 'approved';
      updateData.rejection_reason = null;
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    await ServiceProvider.update(id, updateData);
    
    const user = await User.findById(provider.user_id);
    if (user) {
      await sendBroadcastNotification(
        'providers',
        'Account Status Updated',
        'اکاؤنٹ کی حیثیت اپ ڈیٹ ہو گئی',
        `Your provider account has been ${action}d`,
        `آپ کا پرووائیڈر اکاؤنٹ ${action} کر دیا گیا ہے`
      );
    }
    
    res.json({ message: 'Provider approval updated successfully' });
  } catch (error) {
    console.error('Update provider approval error:', error);
    res.status(500).json({ error: 'Failed to update approval' });
  }
};

const getBookings = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      category_id: req.query.category_id,
      payment_method: req.query.payment_method,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      search: req.query.search,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    };
    
    const bookings = await Booking.getAllBookings(filters);
    res.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

const getBookingDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const statusHistory = await Booking.getStatusHistory(id);
    const transaction = await Transaction.findByBookingId(id);
    const rating = await db.query(
      'SELECT * FROM ratings_reviews WHERE booking_id = ?',
      [id]
    );
    
    res.json({
      ...booking,
      status_history: statusHistory,
      transaction: transaction || null,
      rating: rating[0] || null
    });
  } catch (error) {
    console.error('Get booking detail error:', error);
    res.status(500).json({ error: 'Failed to fetch booking detail' });
  }
};

const getEarningsReport = async (req, res) => {
  try {
    const { date_from, date_to, group_by } = req.query;
    
    if (!date_from || !date_to) {
      return res.status(400).json({ error: 'Date range required' });
    }
    
    const report = await Transaction.getEarningsReport(date_from, date_to, group_by || 'day');
    res.json(report);
  } catch (error) {
    console.error('Get earnings report error:', error);
    res.status(500).json({ error: 'Failed to fetch earnings report' });
  }
};

const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const status = req.query.status || 'all';
    
    const users = await User.getCustomers(page, limit, search, status);
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (action === 'block') {
      await User.update(id, { is_blocked: true });
    } else if (action === 'unblock') {
      await User.update(id, { is_blocked: false });
    } else if (action === 'activate') {
      await User.update(id, { is_active: true });
    } else if (action === 'deactivate') {
      await User.update(id, { is_active: false });
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};

const getSettings = async (req, res) => {
  try {
    const settings = await AppSettings.getAll();
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    const setting = await AppSettings.get(key);
    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    await AppSettings.update(key, value, req.admin.id);
    
    res.json({ message: 'Setting updated successfully' });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
};

const broadcastNotification = async (req, res) => {
  try {
    const { target, title_en, title_ur, body_en, body_ur, data } = req.body;
    
    await sendBroadcastNotification(target, title_en, title_ur, body_en, body_ur, data || {});
    
    await Notification.create({
      title_en,
      title_ur,
      body_en,
      body_ur,
      type: 'broadcast',
      data: data || {}
    });
    
    res.json({ message: 'Notification broadcast successfully' });
  } catch (error) {
    console.error('Broadcast notification error:', error);
    res.status(500).json({ error: 'Failed to broadcast notification' });
  }
};

const getCommissionSettings = async (req, res) => {
  try {
    const settings = await CommissionSettings.getAll();
    res.json(settings);
  } catch (error) {
    console.error('Get commission settings error:', error);
    res.status(500).json({ error: 'Failed to fetch commission settings' });
  }
};

const createCommissionSetting = async (req, res) => {
  try {
    const { category_id, commission_percentage, is_global } = req.body;
    
    const settingId = await CommissionSettings.create({
      category_id,
      commission_percentage,
      is_global,
      created_by: req.admin.id
    });
    
    res.status(201).json({ id: settingId, message: 'Commission setting created' });
  } catch (error) {
    console.error('Create commission setting error:', error);
    res.status(500).json({ error: 'Failed to create commission setting' });
  }
};

const registerProvider = async (req, res) => {
  try {
    const { full_name, phone_number, email, cnic_number, service_category_id, 
            vehicle_make, vehicle_model, vehicle_year, vehicle_plate } = req.body;
    
    // Check if phone number already exists
    const existingUser = await User.findByPhone(phone_number);
    if (existingUser) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }
    
    // Check if CNIC already exists
    const [existingCNIC] = await db.query(
      'SELECT id FROM service_providers WHERE cnic_number = ?',
      [cnic_number]
    );
    if (existingCNIC.length > 0) {
      return res.status(400).json({ error: 'CNIC number already registered' });
    }
    
    // Create user account with provider role
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const crypto = require('crypto');
    
    // Generate random password
    const randomPassword = crypto.randomBytes(8).toString('hex');
    const passwordHash = await bcrypt.hash(randomPassword, 10);
    
    const userId = await User.create({
      phone_number: phone_number,
      full_name: full_name,
      username: phone_number, // Use phone as username
      password: randomPassword,
      role: 'provider',
      preferred_language: 'en',
      email: email || null,
      is_active: true
    });
    
    // Create provider profile
    const providerId = await ServiceProvider.create({
      user_id: userId,
      cnic_number: cnic_number,
      service_category_id: service_category_id,
      vehicle_make: vehicle_make,
      vehicle_model: vehicle_model,
      vehicle_year: vehicle_year,
      vehicle_plate: vehicle_plate,
      approval_status: 'pending'
    });
    
    // Handle document uploads
    const ProviderDocument = require('../models/ProviderDocument');
    if (req.files) {
      for (const [key, file] of Object.entries(req.files)) {
        const fileUrl = `/uploads/provider-documents/${file.filename}`;
        await ProviderDocument.create({
          provider_id: providerId,
          document_type: key,
          file_url: fileUrl,
          file_name: file.originalname
        });
      }
    }
    
    const provider = await ServiceProvider.findById(providerId);
    
    res.status(201).json({
      message: 'Provider registered successfully',
      provider: provider
    });
  } catch (error) {
    console.error('Register provider error:', error);
    res.status(500).json({ error: 'Failed to register provider' });
  }
};

module.exports = {
  adminLogin,
  getDashboard,
  getProviders,
  updateProviderApproval,
  getBookings,
  getBookingDetail,
  getEarningsReport,
  getUsers,
  updateUserStatus,
  getSettings,
  updateSetting,
  broadcastNotification,
  getCommissionSettings,
  createCommissionSetting,
  registerProvider
};
