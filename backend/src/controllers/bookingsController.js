const Booking = require('../models/Booking');
const ServiceProvider = require('../models/ServiceProvider');
const Transaction = require('../models/Transaction');
const RatingReview = require('../models/RatingReview');
const CommissionSettings = require('../models/CommissionSettings');
const { calculateFare, estimateFareWithoutProvider } = require('../services/fareCalculator');
const { broadcastNewRequest } = require('../config/socket');
const { sendPushNotification } = require('../services/fcmService');
const db = require('../config/db');

const createBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category_id, pickup_lat, pickup_lng, pickup_address, payment_method, additional_fields, notes } = req.body;
    
    const fareEstimate = await estimateFareWithoutProvider(category_id, pickup_lat, pickup_lng, db);
    
    const bookingData = {
      customer_id: userId,
      category_id,
      pickup_lat,
      pickup_lng,
      pickup_address,
      payment_method: payment_method || 'cash',
      additional_fields,
      notes,
      estimated_fare: fareEstimate.estimated_fare,
      distance_km: fareEstimate.distance_km
    };
    
    const result = await Booking.create(bookingData);
    const booking = await Booking.findById(result.id);
    
    const radiusKm = await db.query('SELECT setting_value FROM app_settings WHERE setting_key = ?', ['default_search_radius_km']);
    const searchRadius = radiusKm[0] ? parseFloat(radiusKm[0].setting_value) : 10;
    
    broadcastNewRequest(booking, category_id, searchRadius);
    
    res.status(201).json(booking);
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const bookings = await Booking.getCustomerBookings(userId, page, limit);
    res.json(bookings);
  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    if (booking.customer_id !== req.user.id && booking.provider_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    if (booking.customer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot cancel this booking' });
    }
    
    await Booking.update(id, { status: 'cancelled' });
    await Booking.addStatusHistory(id, 'cancelled', req.user.id, req.user.role, 'Booking cancelled');
    
    if (booking.provider_id) {
      const provider = await ServiceProvider.findById(booking.provider_id);
      if (provider) {
        await sendPushNotification(
          provider.user_id,
          'Booking Cancelled',
          'بکنگ منسوخ کر دی گئی',
          `Booking ${booking.booking_ref} has been cancelled by the customer`,
          `بکنگ ${booking.booking_ref} کو صارف نے منسوخ کر دیا ہے`
        );
      }
    }
    
    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    if (req.user.role === 'provider') {
      const provider = await ServiceProvider.findByUserId(req.user.id);
      if (!provider || provider.id !== booking.provider_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    const validTransitions = {
      'pending': ['accepted', 'cancelled'],
      'accepted': ['en_route', 'cancelled'],
      'en_route': ['arrived', 'cancelled'],
      'arrived': ['in_progress'],
      'in_progress': ['completed']
    };
    
    if (!validTransitions[booking.status]?.includes(status)) {
      return res.status(400).json({ error: 'Invalid status transition' });
    }
    
    await Booking.update(id, { status });
    await Booking.addStatusHistory(id, status, req.user.id, req.user.role);
    
    if (status === 'completed') {
      await Booking.update(id, { final_fare: booking.estimated_fare });
    }
    
    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
};

const rateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    if (booking.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'Can only rate completed bookings' });
    }
    
    const existingRating = await RatingReview.findByBookingId(id);
    if (existingRating) {
      return res.status(400).json({ error: 'Already rated this booking' });
    }
    
    await RatingReview.create({
      booking_id: id,
      customer_id: req.user.id,
      provider_id: booking.provider_id,
      rating,
      review
    });
    
    await RatingReview.updateProviderRating(booking.provider_id);
    
    res.json({ message: 'Rating submitted successfully' });
  } catch (error) {
    console.error('Rate booking error:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
};

const getProviderActiveBooking = async (req, res) => {
  try {
    const provider = await ServiceProvider.findByUserId(req.user.id);
    if (!provider) {
      return res.status(404).json({ error: 'Provider profile not found' });
    }
    
    const booking = await Booking.getProviderActiveBooking(provider.id);
    res.json(booking || null);
  } catch (error) {
    console.error('Get provider active booking error:', error);
    res.status(500).json({ error: 'Failed to fetch active booking' });
  }
};

const getProviderHistory = async (req, res) => {
  try {
    const provider = await ServiceProvider.findByUserId(req.user.id);
    if (!provider) {
      return res.status(404).json({ error: 'Provider profile not found' });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const bookings = await Booking.getProviderBookings(provider.id, page, limit);
    res.json(bookings);
  } catch (error) {
    console.error('Get provider history error:', error);
    res.status(500).json({ error: 'Failed to fetch booking history' });
  }
};

const confirmCashPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'Booking must be completed first' });
    }
    
    const provider = await ServiceProvider.findByUserId(req.user.id);
    if (!provider || provider.id !== booking.provider_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const commissionSetting = await CommissionSettings.getByCategoryId(booking.category_id) || await CommissionSettings.getGlobal();
    const commissionPercentage = commissionSetting ? commissionSetting.commission_percentage : 15;
    
    const commissionAmount = (booking.final_fare * commissionPercentage) / 100;
    const providerAmount = booking.final_fare - commissionAmount;
    
    await Transaction.create({
      booking_id: id,
      customer_id: booking.customer_id,
      provider_id: booking.provider_id,
      amount: booking.final_fare,
      commission_percentage: commissionPercentage,
      commission_amount: commissionAmount,
      provider_amount: providerAmount,
      payment_method: 'cash',
      payment_status: 'paid'
    });
    
    await Booking.update(id, { payment_status: 'paid' });
    
    await ServiceProvider.update(provider.id, {
      total_jobs: provider.total_jobs + 1,
      total_earnings: provider.total_earnings + providerAmount
    });
    
    res.json({ message: 'Cash payment confirmed successfully' });
  } catch (error) {
    console.error('Confirm cash payment error:', error);
    res.status(500).json({ error: 'Failed to confirm cash payment' });
  }
};

const getBookingStatusHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await Booking.getStatusHistory(id);
    res.json(history);
  } catch (error) {
    console.error('Get booking status history error:', error);
    res.status(500).json({ error: 'Failed to fetch status history' });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  updateBookingStatus,
  rateBooking,
  getProviderActiveBooking,
  getProviderHistory,
  confirmCashPayment,
  getBookingStatusHistory
};
