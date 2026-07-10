const ServiceProvider = require('../models/ServiceProvider');
const ProviderDocument = require('../models/ProviderDocument');
const User = require('../models/User');
const { sendPushNotification } = require('../services/fcmService');
const db = require('../config/db');

const registerProvider = async (req, res) => {
  try {
    const { phone_number, full_name, cnic_number, password, service_category_id, vehicle_make, vehicle_model, vehicle_year, vehicle_plate } = req.body;
    
    // For unauthenticated users, we need phone_number, full_name, and password
    if (!phone_number || !full_name) {
      return res.status(400).json({ error: 'Phone number and full name are required' });
    }
    
    // Check if user exists
    let user = await User.findByPhone(phone_number);
    
    if (!user) {
      // Create new user with provided password
      const bcrypt = require('bcryptjs');
      
      const userPassword = password || 'default123';
      const passwordHash = await bcrypt.hash(userPassword, 10);
      
      const userId = await User.create({
        phone_number: phone_number,
        full_name: full_name,
        username: phone_number,
        password: userPassword,
        role: 'provider',
        preferred_language: 'en',
        email: null,
        is_active: true
      });
      
      user = await User.findById(userId);
    } else {
      // Update existing user to provider role
      await User.update(user.id, { role: 'provider' });
    }
    
    // Check if provider profile already exists
    const existingProvider = await ServiceProvider.findByUserId(user.id);
    if (existingProvider) {
      return res.status(400).json({ error: 'Provider profile already exists' });
    }
    
    // Create provider profile
    const providerId = await ServiceProvider.create({
      user_id: user.id,
      cnic_number,
      service_category_id,
      vehicle_make,
      vehicle_model,
      vehicle_year,
      vehicle_plate
    });
    
    const provider = await ServiceProvider.findById(providerId);
    
    // Generate JWT token for the new user
    const jwt = require('jsonwebtoken');
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
    
    res.status(201).json({
      message: 'Provider registered successfully',
      access_token: accessToken,
      refresh_token: refreshToken,
      provider: provider
    });
  } catch (error) {
    console.error('Register provider error:', error);
    res.status(500).json({ error: 'Failed to register provider' });
  }
};

const uploadDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    const provider = await ServiceProvider.findByUserId(userId);
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider profile not found' });
    }
    
    const documents = [];
    
    if (req.files) {
      for (const [key, file] of Object.entries(req.files)) {
        const documentType = key;
        const fileUrl = `/uploads/${file.filename}`;
        
        const docId = await ProviderDocument.create({
          provider_id: provider.id,
          document_type: documentType,
          file_url: fileUrl,
          file_name: file.originalname
        });
        
        documents.push({
          id: docId,
          document_type: documentType,
          file_url: fileUrl,
          file_name: file.originalname
        });
      }
    }
    
    res.status(201).json(documents);
  } catch (error) {
    console.error('Upload documents error:', error);
    res.status(500).json({ error: 'Failed to upload documents' });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const provider = await ServiceProvider.findByUserId(userId);
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider profile not found' });
    }
    
    const documents = await ProviderDocument.findByProviderId(provider.id);
    
    res.json({
      ...provider,
      documents
    });
  } catch (error) {
    console.error('Get provider profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

const updateAvailability = async (req, res) => {
  try {
    const userId = req.user.id;
    const { is_online, lat, lng } = req.body;
    
    const provider = await ServiceProvider.findByUserId(userId);
    if (!provider) {
      return res.status(404).json({ error: 'Provider profile not found' });
    }
    
    if (provider.approval_status !== 'approved') {
      return res.status(403).json({ error: 'Provider must be approved to go online' });
    }
    
    await ServiceProvider.update(provider.id, {
      is_online,
      current_lat: lat,
      current_lng: lng
    });
    
    if (lat && lng) {
      await db.query(`
        INSERT INTO provider_locations (provider_id, latitude, longitude)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE latitude = ?, longitude = ?, updated_at = NOW()
      `, [provider.id, lat, lng, lat, lng]);
    }
    
    res.json({ message: 'Availability updated successfully', is_online });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
};

const getNearbyProviders = async (req, res) => {
  try {
    const { lat, lng, category_id, radius_km } = req.query;
    
    if (!lat || !lng || !category_id) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const radius = parseFloat(radius_km) || 10;
    const providers = await ServiceProvider.getNearbyProviders(lat, lng, category_id, radius);
    
    res.json(providers);
  } catch (error) {
    console.error('Get nearby providers error:', error);
    res.status(500).json({ error: 'Failed to fetch nearby providers' });
  }
};

const getEarnings = async (req, res) => {
  try {
    const userId = req.user.id;
    const provider = await ServiceProvider.findByUserId(userId);
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider profile not found' });
    }
    
    const period = req.query.period || 'day';
    const earnings = await ServiceProvider.getEarnings(provider.id, period);
    
    res.json(earnings);
  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
};

module.exports = {
  registerProvider,
  uploadDocuments,
  getMyProfile,
  updateAvailability,
  getNearbyProviders,
  getEarnings
};
