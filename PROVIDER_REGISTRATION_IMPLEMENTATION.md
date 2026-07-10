# Service Provider Registration Implementation

## Overview
A complete service provider registration system has been implemented in the RoadX admin panel. This allows administrators to register new service providers with all necessary details and documents.

## Features Implemented

### 1. Frontend - Registration Form (`admin-panel/src/pages/ProviderRegistration.js`)
- **Personal Information Section:**
  - Full Name (required)
  - Phone Number (required)
  - Email (optional)
  - CNIC Number (required)

- **Service Information Section:**
  - Service Category dropdown (required)
  - Dynamically loads all active categories

- **Vehicle Information Section:**
  - Vehicle Make (required)
  - Vehicle Model (required)
  - Vehicle Year (required) - dropdown with last 50 years
  - Vehicle Plate Number (required)

- **Documents Section (Optional):**
  - CNIC Front image upload
  - CNIC Back image upload
  - Driving License upload
  - Vehicle Registration upload
  - Accepts images (JPEG, JPG, PNG) and PDFs
  - 5MB file size limit per file

- **Form Features:**
  - Client-side validation
  - Success/error message display
  - Auto-redirect to providers list after successful registration
  - Cancel button to return to providers list

### 2. Backend - Registration API

#### Controller (`backend/src/controllers/adminController.js`)
- **Function:** `registerProvider`
- **Features:**
  - Validates phone number uniqueness
  - Validates CNIC uniqueness
  - Creates user account with 'provider' role
  - Generates random password for the provider
  - Creates provider profile with 'pending' approval status
  - Handles multiple document uploads
  - Returns created provider data

#### Routes (`backend/src/routes/admin.js`)
- **Endpoint:** `POST /api/admin/providers/register`
- **Authentication:** Requires admin authentication
- **File Upload:** Configured with multer for 4 document types
- **Validation:** Admin-only access

### 3. Navigation & Integration

#### App Routing (`admin-panel/src/App.js`)
- Added route: `/providers/register`
- Protected with admin authentication

#### Providers Page (`admin-panel/src/pages/Providers.js`)
- Added "Register Provider" button (green)
- Button navigates to `/providers/register`
- Positioned in the filter bar for easy access

## File Structure

```
backend/
├── src/
│   ├── controllers/
│   │   └── adminController.js (updated - added registerProvider function)
│   └── routes/
│       └── admin.js (updated - added registration endpoint with multer)
│
admin-panel/
└── src/
    ├── App.js (updated - added ProviderRegistration route)
    ├── pages/
    │   ├── ProviderRegistration.js (new - registration form)
    │   └── Providers.js (updated - added register button)
    └── services/
        └── api.js (existing - no changes needed)

backend/
└── uploads/
    └── provider-documents/ (created - stores uploaded documents)
```

## API Endpoint Details

**URL:** `POST /api/admin/providers/register`

**Headers:**
- `Authorization: Bearer <admin_token>`
- `Content-Type: multipart/form-data`

**Form Data Fields:**
- `full_name` (required)
- `phone_number` (required)
- `email` (optional)
- `cnic_number` (required)
- `service_category_id` (required)
- `vehicle_make` (required)
- `vehicle_model` (required)
- `vehicle_year` (required)
- `vehicle_plate` (required)
- `cnic_front` (optional - file)
- `cnic_back` (optional - file)
- `driving_license` (optional - file)
- `vehicle_registration` (optional - file)

**Success Response (201):**
```json
{
  "message": "Provider registered successfully",
  "provider": {
    "id": 1,
    "user_id": 5,
    "cnic_number": "XXXXX-XXXXXXX-X",
    "service_category_id": 1,
    "vehicle_make": "Honda",
    "vehicle_model": "Civic",
    "vehicle_year": "2020",
    "vehicle_plate": "ABC-1234",
    "approval_status": "pending",
    ...
  }
}
```

**Error Responses:**
- `400`: Phone number already registered
- `400`: CNIC number already registered
- `400`: Missing required fields
- `401`: Unauthorized (admin token missing/invalid)
- `500`: Server error

## Database Flow

1. **User Creation:**
   - Creates new user with role='provider'
   - Generates random password
   - Phone number used as username

2. **Provider Profile Creation:**
   - Creates service provider record
   - Sets approval_status='pending'
   - Links to user account

3. **Document Storage:**
   - Saves files to `/uploads/provider-documents/`
   - Creates ProviderDocument records
   - Links documents to provider profile

## Security Features

- Admin authentication required
- Phone number uniqueness validation
- CNIC uniqueness validation
- File type validation (images and PDF only)
- File size limit (5MB per file)
- Secure filename generation with timestamp and random suffix

## Usage Instructions

1. **Access the Form:**
   - Login to admin panel
   - Navigate to Providers page
   - Click "Register Provider" button

2. **Fill the Form:**
   - Complete all required fields (marked with *)
   - Optionally upload documents
   - Click "Register Provider"

3. **After Registration:**
   - Success message displayed
   - Auto-redirect to providers list after 2 seconds
   - Provider appears in "Pending" tab
   - Admin can approve/reject the provider

## Testing Checklist

- [ ] Navigate to `/providers/register` from providers page
- [ ] Form loads with empty fields
- [ ] Service categories load in dropdown
- [ ] Submit form with missing required fields (should show error)
- [ ] Submit form with all required fields (should succeed)
- [ ] Upload documents (should accept images/PDFs)
- [ ] Verify provider appears in pending list
- [ ] Check uploaded files in `/uploads/provider-documents/`
- [ ] Verify user created with provider role
- [ ] Test with duplicate phone number (should fail)
- [ ] Test with duplicate CNIC (should fail)
- [ ] Cancel button returns to providers list

## Dependencies

All required dependencies are already installed:
- `multer` - File upload handling
- `bcryptjs` - Password hashing
- `jsonwebtoken` - Token generation
- `express-validator` - Input validation

## Notes

- Provider accounts are created with random passwords
- Providers will need password reset functionality to login
- All new providers start with 'pending' status
- Admin must approve providers before they can go online
- Documents are optional but recommended for verification
- File uploads are stored locally (consider cloud storage for production)