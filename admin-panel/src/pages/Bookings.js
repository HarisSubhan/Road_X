import React, { useState, useEffect } from 'react';
import { bookingsAPI } from '../services/api';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const statuses = ['all', 'pending', 'accepted', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled'];

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, search, page]);

  const fetchBookings = async () => {
    try {
      const response = await bookingsAPI.getAll({ 
        status: statusFilter === 'all' ? undefined : statusFilter,
        search,
        page,
        limit: 20
      });
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingDetail = async (bookingId) => {
    try {
      const response = await bookingsAPI.getById(bookingId);
      setSelectedBooking(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Failed to fetch booking detail:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      en_route: 'bg-purple-100 text-purple-800',
      arrived: 'bg-indigo-100 text-indigo-800',
      in_progress: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Bookings</h1>

      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex gap-4 flex-wrap items-center">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setSearch(''); setPage(1); }}
              className={`px-4 py-2 rounded-lg ${statusFilter === status ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
            </button>
          ))}
          <input
            type="text"
            placeholder="Search by ref, customer, or provider..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg ml-auto"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ref</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fare</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{booking.icon_emoji}</span>
                    <span className="font-medium">{booking.category_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-sm">{booking.booking_ref}</td>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium">{booking.customer_name}</p>
                    <p className="text-gray-600 text-sm">{booking.customer_phone}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{booking.provider_name || 'N/A'}</td>
                <td className="px-6 py-4 text-gray-600 text-sm max-w-xs truncate">{booking.pickup_address}</td>
                <td className="px-6 py-4 font-medium">PKR {booking.final_fare || booking.estimated_fare}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs capitalize">{booking.payment_method}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs capitalize ${getStatusColor(booking.status)}`}>
                    {booking.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => fetchBookingDetail(booking.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-gray-600">Page {page}</span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={bookings.length < 20}
          className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {showDetailModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Booking Details - {selectedBooking.booking_ref}</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Customer</h3>
                <p><span className="font-medium">Name:</span> {selectedBooking.customer_name}</p>
                <p><span className="font-medium">Phone:</span> {selectedBooking.customer_phone}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Provider</h3>
                <p><span className="font-medium">Name:</span> {selectedBooking.provider_name || 'N/A'}</p>
                <p><span className="font-medium">Vehicle:</span> {selectedBooking.vehicle_make || 'N/A'} {selectedBooking.vehicle_plate || ''}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-bold mb-2">Financial Breakdown</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Estimated Fare</p>
                  <p className="font-bold text-lg">PKR {selectedBooking.estimated_fare}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Final Fare</p>
                  <p className="font-bold text-lg">PKR {selectedBooking.final_fare || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Platform Commission (15%)</p>
                  <p className="font-bold text-lg text-red-600">PKR {selectedBooking.final_fare ? (selectedBooking.final_fare * 0.15).toFixed(2) : 'N/A'}</p>
                </div>
              </div>
              {selectedBooking.transaction && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-gray-600 text-sm">Provider Payout</p>
                  <p className="font-bold text-lg text-green-600">PKR {selectedBooking.transaction.provider_amount}</p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-bold mb-2">Status Timeline</h3>
              <div className="space-y-2">
                {selectedBooking.status_history?.map((history, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-red-600 rounded-full mt-1"></div>
                    <div>
                      <p className="font-medium capitalize">{history.status.replace('_', ' ')}</p>
                      <p className="text-gray-600 text-sm">
                        {new Date(history.created_at).toLocaleString()} by {history.changed_by_role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedBooking.rating && (
              <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                <h3 className="font-bold mb-2">Customer Rating</h3>
                <p className="text-2xl">⭐ {selectedBooking.rating.rating}/5</p>
                <p className="text-gray-600">{selectedBooking.rating.review || 'No review'}</p>
              </div>
            )}

            <button
              onClick={() => { setShowDetailModal(false); setSelectedBooking(null); }}
              className="w-full bg-gray-300 py-2 rounded-lg hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
