# RoadX - Quick Start Guide

## 🚀 System Status: READY TO RUN

All components are installed, configured, and ready to run locally.

## 📡 Currently Running Services

### Backend API Server
- **Status**: ✅ Running
- **URL**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health
- **Database**: MySQL (roadx) - Connected and seeded

### Admin Panel
- **Status**: ✅ Running
- **URL**: http://localhost:3000
- **Default Login**: 
  - Username: `admin`
  - Password: `admin123`

### Mobile App
- **Status**: ✅ Configured and Ready
- **Dependencies**: Installed
- **Configuration**: API pointing to backend

## 🎯 How to Access Each Component

### 1. Admin Panel (Web)
Open your browser and navigate to:
```
http://localhost:3000
```

Login with:
- Username: `admin`
- Password: `admin123`

### 2. Backend API
The backend is running at:
```
http://localhost:5000
```

Test the health endpoint:
```bash
curl http://localhost:5000/api/health
```

### 3. Mobile App (React Native)

#### For Android Emulator:
```bash
cd mobile-app
npx react-native start
```

#### For iOS Simulator (macOS only):
```bash
cd mobile-app
cd ios
pod install
cd ..
npm run ios
```

#### For Physical Device:
1. Update `mobile-app/src/config.js`:
   - Change `API_HOST` to your PC's local IP address
   - Example: `const API_HOST = '192.168.1.9';`
2. Run the app:
```bash
cd mobile-app
npm run android  # or npm run ios
```

## 📱 Mobile App Configuration

The mobile app is currently configured for Android Emulator. To change the target:

Edit `mobile-app/src/config.js`:
```javascript
// For Android Emulator
const API_HOST = '10.0.2.2';

// For iOS Simulator
const API_HOST = 'localhost';

// For Physical Device (use your PC's IP)
const API_HOST = '192.168.1.9'; // Replace with your actual IP
```

## 🔧 Admin Panel Features

Once logged in, you can:
- **Dashboard**: View stats, revenue charts, booking trends
- **Service Categories**: Add/edit/delete services (Fuel Delivery, Towing, etc.)
- **Customers**: View and manage user accounts
- **Providers**: Approve/reject providers, view details
- **Bookings**: View all bookings, filter by status
- **Earnings & Finance**: Commission settings, transactions, payouts
- **Notifications**: Send push notifications
- **Settings**: Configure OTP, provider, payment settings

## 📱 Mobile App Features

### Customer App:
- OTP-based authentication
- Service selection (Fuel, Towing, Mechanic, etc.)
- GPS location detection
- Real-time provider tracking
- Payment options (Cash, Easypaisa, JazzCash)
- Booking history
- Profile management

### Provider App:
- OTP-based authentication
- Online/offline toggle
- Incoming job requests with countdown
- Job workflow (En Route → Arrived → In Progress → Completed)
- Earnings dashboard
- Profile and document management

## 🗄️ Database Information

- **Database Name**: roadx
- **Host**: localhost
- **Port**: 3306
- **User**: root
- **Tables**: 13 (users, service_providers, bookings, transactions, etc.)

## 🔄 Stopping Services

### Stop Backend:
```bash
# Find the process and kill it, or press Ctrl+C in the terminal
```

### Stop Admin Panel:
```bash
# Press Ctrl+C in the terminal
```

## 🐛 Troubleshooting

### Backend won't start:
- Check MySQL is running
- Verify database credentials in `backend/.env`
- Ensure port 5000 is not in use

### Admin panel won't load:
- Verify backend is running on port 5000
- Check browser console for errors
- Clear browser cache

### Mobile app can't connect:
- Update API_HOST in `mobile-app/src/config.js`
- For physical device, use your PC's IP address
- For emulator, use `10.0.2.2` (Android) or `localhost` (iOS)

### Database connection issues:
```bash
# Check MySQL is running
mysql --version

# Test connection
mysql -u root -p roadx
```

## 📚 Additional Documentation

See `README.md` for:
- Complete API documentation
- Socket.io events
- Database schema details
- Deployment guide
- Multi-country setup

## ✅ Next Steps

1. **Test Admin Panel**: Login and explore the dashboard
2. **Add Services**: Create service categories in the admin panel
3. **Test Mobile App**: Run the app and test user/provider flows
4. **Configure Payments**: Set up Easypaisa/JazzCash credentials in settings
5. **Add Providers**: Register provider accounts through the mobile app
6. **Test Bookings**: Create test bookings and verify the complete flow

## 🎉 You're Ready!

The complete RoadX roadside assistance platform is now running locally. All three components (Backend, Admin Panel, Mobile App) are configured and ready for testing and development.
