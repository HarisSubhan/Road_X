-- RoadX Database Schema - MySQL 8+
-- Complete schema with 13 tables for roadside assistance platform

-- 1. admin_users: Admin panel accounts
CREATE TABLE admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin', -- admin | super_admin | support
  is_active TINYINT(1) DEFAULT 1,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. users: All app users (customers + providers share this table)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE,
  email VARCHAR(255) UNIQUE,
  username VARCHAR(100) UNIQUE,
  full_name VARCHAR(255),
  role VARCHAR(20) DEFAULT 'customer', -- customer | provider
  profile_image VARCHAR(500),
  fcm_token VARCHAR(500),
  preferred_language VARCHAR(10) DEFAULT 'en', -- en | ur
  password_hash VARCHAR(255),
  email_verified TINYINT(1) DEFAULT 0,
  cnic VARCHAR(20),
  vehicle_type VARCHAR(20),
  vehicle_plate VARCHAR(20),
  vehicle_make VARCHAR(100),
  vehicle_model VARCHAR(100),
  vehicle_year VARCHAR(10),
  is_active TINYINT(1) DEFAULT 1,
  is_blocked TINYINT(1) DEFAULT 0,
  otp_code VARCHAR(10),
  otp_expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. service_categories: Dynamic service types managed by admin
CREATE TABLE service_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name_en VARCHAR(255) NOT NULL,
  name_ur VARCHAR(255),
  icon_url VARCHAR(500),
  icon_emoji VARCHAR(20),
  base_fare DECIMAL(10,2) DEFAULT 0,
  price_per_km DECIMAL(10,2) DEFAULT 0,
  estimated_time_minutes INT DEFAULT 30,
  is_active TINYINT(1) DEFAULT 1,
  required_fields JSON DEFAULT ('[]'), -- [{key, label_en, label_ur, type, options[], required}]
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. service_providers: Extended profile for users with role=provider
CREATE TABLE service_providers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  cnic_number VARCHAR(20),
  service_category_id INT,
  vehicle_make VARCHAR(100),
  vehicle_model VARCHAR(100),
  vehicle_year VARCHAR(10),
  vehicle_plate VARCHAR(20),
  approval_status VARCHAR(20) DEFAULT 'pending', -- pending | approved | rejected | suspended
  rejection_reason TEXT,
  approved_at TIMESTAMP NULL,
  approved_by INT,
  is_online TINYINT(1) DEFAULT 0,
  current_lat DECIMAL(10,8),
  current_lng DECIMAL(11,8),
  rating_average DECIMAL(3,2) DEFAULT 0.00,
  total_jobs INT DEFAULT 0,
  total_earnings DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (service_category_id) REFERENCES service_categories(id),
  FOREIGN KEY (approved_by) REFERENCES admin_users(id)
);

-- 5. provider_documents: CNIC front/back, license photos
CREATE TABLE provider_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  provider_id INT NOT NULL,
  document_type VARCHAR(50), -- cnic_front | cnic_back | license | certification
  file_url VARCHAR(500),
  file_name VARCHAR(255),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES service_providers(id) ON DELETE CASCADE
);

-- 6. bookings: Every service request
CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_ref VARCHAR(20) UNIQUE,
  customer_id INT,
  provider_id INT,
  category_id INT,
  pickup_lat DECIMAL(10,8),
  pickup_lng DECIMAL(11,8),
  pickup_address TEXT,
  status VARCHAR(30) DEFAULT 'pending',
  -- pending | accepted | en_route | arrived | in_progress | completed | cancelled
  estimated_fare DECIMAL(10,2),
  final_fare DECIMAL(10,2),
  distance_km DECIMAL(8,2),
  payment_method VARCHAR(20) DEFAULT 'cash', -- cash | jazzcash | easypaisa
  payment_status VARCHAR(20) DEFAULT 'pending', -- pending | paid | failed | refunded
  additional_fields JSON DEFAULT ('{}'),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (provider_id) REFERENCES service_providers(id),
  FOREIGN KEY (category_id) REFERENCES service_categories(id)
);

-- 7. booking_status_history: Full audit trail
CREATE TABLE booking_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  status VARCHAR(30),
  changed_by INT,
  changed_by_role VARCHAR(20), -- customer | provider | admin | system
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- 8. transactions: Financial record per completed booking
CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT,
  customer_id INT,
  provider_id INT,
  amount DECIMAL(10,2),
  commission_percentage DECIMAL(5,2),
  commission_amount DECIMAL(10,2),
  provider_amount DECIMAL(10,2),
  payment_method VARCHAR(20),
  payment_status VARCHAR(20) DEFAULT 'pending',
  gateway_reference VARCHAR(255),
  gateway_response JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (provider_id) REFERENCES service_providers(id)
);

-- 9. ratings_reviews: Customer ratings (1-5 stars)
CREATE TABLE ratings_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT,
  customer_id INT,
  provider_id INT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (provider_id) REFERENCES service_providers(id)
);

-- 10. provider_locations: Latest GPS per provider (use Redis in production)
CREATE TABLE provider_locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  provider_id INT UNIQUE,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  heading DECIMAL(5,2),
  speed DECIMAL(5,2),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES service_providers(id) ON DELETE CASCADE
);

-- 11. notifications: Push notification log (bilingual)
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  title_en VARCHAR(255),
  title_ur VARCHAR(255),
  body_en TEXT,
  body_ur TEXT,
  type VARCHAR(50), -- broadcast | booking_update | promo | system
  data JSON DEFAULT ('{}'),
  is_read TINYINT(1) DEFAULT 0,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 12. app_settings: Key-value config store
CREATE TABLE app_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(50) DEFAULT 'string', -- string | number | boolean | json
  description TEXT,
  category VARCHAR(50) DEFAULT 'general',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by INT,
  FOREIGN KEY (updated_by) REFERENCES admin_users(id)
);

-- 13. commission_settings: Platform commission % (global or per-category)
CREATE TABLE commission_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT,
  commission_percentage DECIMAL(5,2) NOT NULL,
  is_global TINYINT(1) DEFAULT 0,
  effective_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT,
  is_active TINYINT(1) DEFAULT 1,
  FOREIGN KEY (category_id) REFERENCES service_categories(id),
  FOREIGN KEY (created_by) REFERENCES admin_users(id)
);

-- INDEXES
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_provider ON bookings(provider_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_created ON bookings(created_at DESC);
CREATE INDEX idx_providers_status ON service_providers(approval_status);
CREATE INDEX idx_providers_online ON service_providers(is_online);
CREATE INDEX idx_transactions_date ON transactions(created_at DESC);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
