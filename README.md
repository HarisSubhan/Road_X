# RoadX - Roadside Assistance Platform

A complete roadside assistance platform for Pakistan with multi-country readiness. The system consists of a mobile app (for Users and Service Providers) and a role-based admin panel.

## 📋 Project Overview

- **Mobile App**: React Native (JavaScript, no Expo)
- **Admin Panel**: React (JavaScript)
- **Backend**: Node.js (Express.js)
- **Database**: MySQL

## 🏗️ Project Structure

```
roadx/
├── backend/           # Node.js/Express backend API
├── mobile-app/        # React Native mobile application
└── admin-panel/       # React admin panel
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development - macOS only)

### 1. Database Setup

#### Install MySQL
- Windows: Download from [mysql.com](https://dev.mysql.com/downloads/mysql/)
- macOS: `brew install mysql`
- Linux: `sudo apt-get install mysql-server`

#### Create Database
```sql
CREATE DATABASE roadx;
```

#### Configure Backend
```bash
cd backend
cp .env.example .env
```

Edit `.env` with your MySQL credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=roadx
DB_USER=root
DB_PASSWORD=your_password
```

#### Run Migrations
```bash
npm install
npm run db:setup
```

### 2. Start Backend Server

```bash
cd backend
npm install
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Start Admin Panel

```bash
cd admin-panel
npm install
npm start
```

The admin panel will run on `http://localhost:3000`

**Default Admin Credentials:**
- Username: `admin`
- Password: `Admin@123`

### 4. Start Mobile App

#### Install Dependencies
```bash
cd mobile-app
npm install
```

#### For Android
```bash
npm run android
```

#### For iOS (macOS only)
```bash
cd ios
pod install
cd ..
npm run ios
```

## 📱 Mobile App Features

### User App
- **Authentication**: OTP-based login with role selection (User/Provider)
- **Home Screen**: Dynamic service list (Fuel Delivery, Car Towing, Bike Mechanic, etc.)
- **Service Request**: GPS location detection, manual address input, notes
- **Real-Time Updates**: Socket.io for provider acceptance, live tracking
- **Payments**: Cash, Easypaisa, JazzCash (test mode)
- **Booking History**: Past/current bookings with status filters
- **Profile**: Manage details, vehicle info, phone number

### Provider App
- **Dashboard**: Earnings summary, online/offline toggle, active jobs
- **Job Requests**: Real-time notifications with countdown timer
- **Job Workflow**: En Route → Arrived → In Progress → Completed
- **Earnings & Wallet**: View earnings before/after commission
- **Profile**: Edit details, vehicle info, document uploads

## 🔧 Admin Panel Features

- **Dashboard**: Stats cards, revenue trends, booking charts
- **Service Categories**: CRUD operations for services
- **User Management**: View and manage customers
- **Provider Management**: Approve/reject providers, view details
- **Booking Management**: View all bookings, manual assignment
- **Earnings & Finance**: Commission settings, transactions, payouts
- **Notifications**: Send push notifications
- **Settings**: Dynamic system settings (OTP, provider, payment)

## 🌍 Multi-Country Support

The system is designed to support multiple countries:
- Country-specific services and payment methods
- Currency display based on country
- Admin panel country switcher
- Users automatically assigned to country based on phone number

**Phase 1**: Pakistan (PKR currency, Easypaisa, JazzCash)

## 🔐 Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_NAME=roadx
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=your_64_char_secret
JWT_REFRESH_SECRET=your_64_char_refresh_secret
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=30d
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="your_private_key"
FIREBASE_CLIENT_EMAIL=your_client_email
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_FROM_NUMBER=your_twilio_number
JAZZCASH_MERCHANT_ID=your_merchant_id
JAZZCASH_PASSWORD=your_password
JAZZCASH_INTEGRITY_SALT=your_salt
EASYPAISA_STORE_ID=your_store_id
EASYPAISA_HASH_KEY=your_hash_key
CORS_ORIGIN=*
```

### Admin Panel (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Mobile App
Update API base URL in `mobile-app/src/services/api.js`:
```javascript
const API_BASE_URL = 'http://YOUR_PC_IP:5000/api';
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone
- `POST /api/auth/verify-otp` - Verify OTP and login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (admin)
- `PUT /api/categories/:id` - Update category (admin)
- `DELETE /api/categories/:id` - Delete category (admin)

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user bookings
- `PUT /api/bookings/:id/status` - Update booking status
- `GET /api/bookings/:id/tracking` - Get live tracking

### Providers
- `GET /api/providers/nearby` - Find nearby providers
- `PUT /api/providers/:id/status` - Update provider status
- `POST /api/providers/:id/accept` - Accept job
- `POST /api/providers/:id/reject` - Reject job

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - Get all users
- `GET /api/admin/providers` - Get all providers
- `GET /api/admin/bookings` - Get all bookings

## 🔌 Socket.io Events

### Client → Server
- `join:user` - Join user room
- `join:provider` - Join provider room
- `booking:created` - Create new booking
- `provider:accept` - Provider accepts job
- `provider:reject` - Provider rejects job
- `booking:status` - Update booking status
- `location:update` - Update provider location

### Server → Client
- `new:booking` - New booking for provider
- `booking:accepted` - Booking accepted by user
- `booking:rejected` - Booking rejected by user
- `status:updated` - Booking status updated
- `location:updated` - Provider location updated

## 🌐 Language Support

The mobile app supports:
- English (en)
- Urdu (ur)

Translation files are located in `mobile-app/src/i18n/`

## 💳 Payment Gateways

### Easypaisa (Test Mode)
- Mock integration for Phase 1
- Configure in admin panel settings

### JazzCash (Test Mode)
- Mock integration for Phase 1
- Configure in admin panel settings

### Cash
- Always available
- Collected after service completion

## 🔔 Push Notifications

FCM (Firebase Cloud Messaging) is integrated for:
- Booking confirmations
- Provider acceptance
- Status updates
- Promotional notifications

Configure Firebase credentials in backend `.env`

## 📊 Database Schema

Key tables:
- `users` - Customer accounts
- `service_providers` - Provider accounts
- `service_categories` - Service types
- `bookings` - Booking records
- `transactions` - Payment records
- `app_settings` - System settings
- `admin_users` - Admin accounts
- `commission_settings` - Commission configuration

See `backend/database/schema.sql` for complete schema.

## 🧪 Testing

### Backend
```bash
cd backend
npm test
```

### Mobile App
```bash
cd mobile-app
npm test
```

## 🐛 Troubleshooting

### Backend won't start
- Check MySQL is running
- Verify database credentials in `.env`
- Ensure port 5000 is not in use

### Mobile App can't connect to backend
- Use your PC's IP address instead of localhost
- Check firewall settings
- Ensure backend is running

### Admin Panel login fails
- Verify backend is running
- Check admin credentials in database
- Clear browser cache

## 📝 Development Notes

### Adding New Services
1. Add service in admin panel under Service Categories
2. Service automatically appears in mobile app

### Adding New Countries
1. Add country in admin panel Countries section
2. Configure country-specific settings
3. Add country-specific payment methods

### Customizing Commission
1. Go to Earnings & Finance in admin panel
2. Set global commission percentage
3. Override per service if needed

## 🚢 Deployment

### Backend (Production)
- Use PM2 for process management
- Configure MySQL with proper backups
- Set up Redis for caching
- Use HTTPS with SSL certificate
- Configure CORS properly

### Mobile App (Production)
- Build APK/IPA for distribution
- Configure production API URL
- Set up proper signing certificates
- Submit to app stores

### Admin Panel (Production)
- Build with `npm run build`
- Deploy to Vercel, Netlify, or similar
- Configure environment variables
- Set up proper authentication

## 📄 License

ISC

## 👥 Support

For issues and questions, please contact the development team.

---

**Note**: This is Phase 1 of the RoadX platform, focused on Pakistan. Multi-country expansion features are built-in and ready for future deployment.
