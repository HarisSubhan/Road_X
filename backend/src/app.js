const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { initializeSocket } = require('./config/socket');
const { generalLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/auth');
const categoriesRoutes = require('./routes/categories');
const bookingsRoutes = require('./routes/bookings');
const providersRoutes = require('./routes/providers');
const paymentsRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const fareRoutes = require('./routes/fare');

const app = express();
const server = http.createServer(app);

initializeSocket(server);

app.use(helmet());
// CORS configuration - allow mobile app origins
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization']
};

// For React Native apps, we need to handle null origin
app.use(cors(corsOptions));

// Handle preflight requests for React Native
app.options('*', cors(corsOptions));
// Request logging middleware for debugging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - Origin: ${req.get('origin') || 'N/A'}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(process.env.UPLOAD_DIR || './uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/providers', providersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/fare', fareRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'RoadX API is running' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`RoadX API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
