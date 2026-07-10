import React, { useState, useEffect } from 'react';
import { providersAPI, categoriesAPI } from '../services/api';

const ProviderRegistration = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    // Personal Information
    full_name: '',
    phone_number: '',
    email: '',
    cnic_number: '',
    
    // Service Information
    service_category_id: '',
    
    // Vehicle Information
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: '',
    vehicle_plate: '',
    
    // Documents
    cnic_front: null,
    cnic_back: null,
    driving_license: null,
    vehicle_registration: null
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll(true);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setError('Failed to load service categories');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData({ ...formData, [name]: files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      // Validate required fields
      if (!formData.full_name || !formData.phone_number || !formData.cnic_number ||
          !formData.service_category_id || !formData.vehicle_make || 
          !formData.vehicle_model || !formData.vehicle_year || !formData.vehicle_plate) {
        throw new Error('Please fill in all required fields');
      }

      // Create FormData for multipart/form-data submission
      const data = new FormData();
      data.append('full_name', formData.full_name);
      data.append('phone_number', formData.phone_number);
      if (formData.email) data.append('email', formData.email);
      data.append('cnic_number', formData.cnic_number);
      data.append('service_category_id', formData.service_category_id);
      data.append('vehicle_make', formData.vehicle_make);
      data.append('vehicle_model', formData.vehicle_model);
      data.append('vehicle_year', formData.vehicle_year);
      data.append('vehicle_plate', formData.vehicle_plate);

      // Append files if provided
      if (formData.cnic_front) data.append('cnic_front', formData.cnic_front);
      if (formData.cnic_back) data.append('cnic_back', formData.cnic_back);
      if (formData.driving_license) data.append('driving_license', formData.driving_license);
      if (formData.vehicle_registration) data.append('vehicle_registration', formData.vehicle_registration);

      // Get admin token for authorization
      const token = localStorage.getItem('admin_token');
      
      const response = await fetch('http://localhost:5000/api/admin/providers/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to register provider');
      }

      setSuccess('Provider registered successfully!');
      resetForm();
      
      // Redirect to providers list after 2 seconds
      setTimeout(() => {
        window.location.href = '/providers';
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      phone_number: '',
      email: '',
      cnic_number: '',
      service_category_id: '',
      vehicle_make: '',
      vehicle_model: '',
      vehicle_year: '',
      vehicle_plate: '',
      cnic_front: null,
      cnic_back: null,
      driving_license: null,
      vehicle_registration: null
    });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Register Service Provider</h1>
        <p className="text-gray-600 mb-6">Add a new service provider to the platform</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Personal Information Section */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="03XXXXXXXXX"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CNIC Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="cnic_number"
                  value={formData.cnic_number}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="XXXXX-XXXXXXX-X"
                  required
                />
              </div>
            </div>
          </div>

          {/* Service Information Section */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
              Service Information
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Category <span className="text-red-600">*</span>
              </label>
              <select
                name="service_category_id"
                value={formData.service_category_id}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon_emoji} {category.name_en} - {category.name_ur}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vehicle Information Section */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
              Vehicle Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Make <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="vehicle_make"
                  value={formData.vehicle_make}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., Honda, Toyota, Suzuki"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Model <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="vehicle_model"
                  value={formData.vehicle_model}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., Civic, Corolla, Mehran"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Year <span className="text-red-600">*</span>
                </label>
                <select
                  name="vehicle_year"
                  value={formData.vehicle_year}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                >
                  <option value="">Select year</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Plate Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="vehicle_plate"
                  value={formData.vehicle_plate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., ABC-1234"
                  required
                />
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
              Documents (Optional)
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Upload required documents for verification
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CNIC Front
                </label>
                <input
                  type="file"
                  name="cnic_front"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CNIC Back
                </label>
                <input
                  type="file"
                  name="cnic_back"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Driving License
                </label>
                <input
                  type="file"
                  name="driving_license"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Registration
                </label>
                <input
                  type="file"
                  name="vehicle_registration"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4 border-t">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {submitting ? 'Registering...' : 'Register Provider'}
            </button>
            <button
              type="button"
              onClick={() => window.location.href = '/providers'}
              className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProviderRegistration;