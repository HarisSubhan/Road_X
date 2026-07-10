-- RoadX Seed Data
-- Service categories, admin user, app settings, and commission settings

-- 7 Service Categories
INSERT INTO service_categories (name_en, name_ur, icon_emoji, base_fare, price_per_km, estimated_time_minutes, sort_order, required_fields) VALUES
('Fuel Delivery','ایندھن کی ترسیل','⛽',200,25,20,1,'[{"key":"fuel_type","label_en":"Fuel Type","label_ur":"ایندھن کی قسم","type":"select","options":["Petrol","Diesel","CNG"],"required":true},{"key":"liters","label_en":"Liters Needed","label_ur":"لیٹر درکار","type":"number","required":true}]'),
('Car Towing','کار ٹوونگ','🚗',500,50,30,2,'[{"key":"vehicle_type","label_en":"Vehicle Type","label_ur":"گاڑی کی قسم","type":"select","options":["Sedan","SUV","Van","Pickup"],"required":true}]'),
('Bike Mechanic','بائیک مکینک','🏍️',150,20,25,3,'[{"key":"bike_type","label_en":"Bike Type","label_ur":"بائیک کی قسم","type":"text","required":true},{"key":"issue_description","label_en":"Issue Description","label_ur":"مسئلے کی تفصیل","type":"text","required":true}]'),
('Car Mechanic','کار مکینک','🔧',300,30,35,4,'[{"key":"vehicle_make","label_en":"Vehicle Make","label_ur":"گاڑی کی بنیاد","type":"text","required":true},{"key":"issue_description","label_en":"Issue Description","label_ur":"مسئلے کی تفصیل","type":"text","required":true}]'),
('Battery Jumpstart','بیٹری جمپ اسٹارٹ','🔋',250,20,15,5,'[{"key":"vehicle_type","label_en":"Vehicle Type","label_ur":"گاڑی کی قسم","type":"select","options":["Car","Bike","Van","Truck"],"required":true}]'),
('Tire Change','ٹائر تبدیلی','🛞',200,20,20,6,'[{"key":"tire_size","label_en":"Tire Size","label_ur":"ٹائر کا سائز","type":"text","required":false},{"key":"has_spare","label_en":"Have Spare Tire?","label_ur":"اسپیئر ٹائر ہے؟","type":"boolean","required":true}]'),
('Key Unlock','چابی انلاک','🔑',300,25,20,7,'[{"key":"vehicle_make","label_en":"Vehicle Make/Model","label_ur":"گاڑی کا ماڈل","type":"text","required":true}]');

-- Admin user (password: Admin@123 - bcrypt hash)
INSERT INTO admin_users (username, email, password_hash, full_name, role)
VALUES ('admin', 'admin@roadx.pk', '$2a$10$zLKS0yiTc9LfArCna0IgH.CPlKchtYOBNvMP/GWZVJ4CURXe44NHm', 'RoadX Admin', 'super_admin');

-- App Settings
INSERT INTO app_settings (setting_key, setting_value, setting_type, description, category) VALUES
('default_search_radius_km','10','number','Radius in KM to search for nearby providers','general'),
('provider_request_timeout_seconds','45','number','Seconds before request auto-declines','booking'),
('global_commission_percentage','15','number','Default platform commission %','commission'),
('cash_payment_enabled','true','boolean','Enable cash payment method','payment'),
('jazzcash_enabled','true','boolean','Enable JazzCash payment','payment'),
('easypaisa_enabled','true','boolean','Enable Easypaisa payment','payment'),
('otp_expiry_minutes','5','number','OTP expiry in minutes','auth'),
('otp_max_attempts','3','number','Maximum OTP verification attempts','auth'),
('support_phone','+92-300-ROADX','string','Customer support phone','general'),
('support_email','support@roadx.pk','string','Customer support email','general');

-- Global Commission Setting (15%)
INSERT INTO commission_settings (is_global, commission_percentage, is_active) VALUES (1, 15.00, 1);