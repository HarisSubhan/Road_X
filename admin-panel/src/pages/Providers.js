import React, { useState, useEffect } from 'react';
import { providersAPI } from '../services/api';

const Providers = () => {
  const [providers, setProviders] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchProviders();
  }, [activeTab, search]);

  const fetchProviders = async () => {
    try {
      const response = await providersAPI.getAll({ approval_status: activeTab, search });
      setProviders(response.data);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = async (providerId, action) => {
    try {
      await providersAPI.updateApproval(providerId, action, rejectionReason);
      fetchProviders();
      setShowDetailModal(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Failed to update provider approval:', error);
    }
  };

  const tabs = [
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'suspended', label: 'Suspended' },
  ];

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Providers</h1>

      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex gap-4 flex-wrap items-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearch(''); }}
              className={`px-4 py-2 rounded-lg ${activeTab === tab.id ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
            >
              {tab.label}
              {tab.id === 'pending' && providers.length > 0 && (
                <span className="ml-2 bg-yellow-400 text-black text-xs px-2 py-0.5 rounded-full">
                  {providers.length}
                </span>
              )}
            </button>
          ))}
          <input
            type="text"
            placeholder="Search by name, phone, or CNIC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg ml-auto"
          />
          <button
            onClick={() => window.location.href = '/providers/register'}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <span>+</span>
            <span>Register Provider</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map((provider) => (
          <div key={provider.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-xl mr-3">
                  {provider.full_name?.charAt(0) || 'P'}
                </div>
                <div>
                  <h3 className="font-bold">{provider.full_name || 'N/A'}</h3>
                  <p className="text-gray-600 text-sm">{provider.phone_number || 'N/A'}</p>
                </div>
              </div>
              {provider.is_online && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Online</span>
              )}
            </div>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <p><span className="font-medium">Category:</span> {provider.category_name || 'N/A'}</p>
              <p><span className="font-medium">CNIC:</span> {provider.cnic_number || 'N/A'}</p>
              <p><span className="font-medium">Rating:</span> ⭐ {provider.rating_average || '0.00'} ({provider.total_jobs || 0} jobs)</p>
              <p><span className="font-medium">Documents:</span> {provider.document_count || 0}</p>
            </div>
            <button
              onClick={() => { setSelectedProvider(provider); setShowDetailModal(true); }}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              View Details
            </button>
          </div>
        ))}
      </div>

      {showDetailModal && selectedProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Provider Details</h2>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Personal Information</h3>
                <p><span className="font-medium">Name:</span> {selectedProvider.full_name}</p>
                <p><span className="font-medium">Phone:</span> {selectedProvider.phone_number}</p>
                <p><span className="font-medium">Email:</span> {selectedProvider.email || 'N/A'}</p>
                <p><span className="font-medium">CNIC:</span> {selectedProvider.cnic_number}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Vehicle Information</h3>
                <p><span className="font-medium">Make:</span> {selectedProvider.vehicle_make || 'N/A'}</p>
                <p><span className="font-medium">Model:</span> {selectedProvider.vehicle_model || 'N/A'}</p>
                <p><span className="font-medium">Year:</span> {selectedProvider.vehicle_year || 'N/A'}</p>
                <p><span className="font-medium">Plate:</span> {selectedProvider.vehicle_plate || 'N/A'}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Statistics</h3>
                <p><span className="font-medium">Rating:</span> ⭐ {selectedProvider.rating_average || '0.00'}</p>
                <p><span className="font-medium">Total Jobs:</span> {selectedProvider.total_jobs || 0}</p>
                <p><span className="font-medium">Total Earnings:</span> PKR {selectedProvider.total_earnings || '0.00'}</p>
                <p><span className="font-medium">Joined:</span> {new Date(selectedProvider.created_at).toLocaleDateString()}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Documents</h3>
                <p className="text-gray-600">{selectedProvider.document_count || 0} documents uploaded</p>
              </div>

              {selectedProvider.rejection_reason && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-bold mb-2 text-red-800">Rejection Reason</h3>
                  <p className="text-red-700">{selectedProvider.rejection_reason}</p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                {selectedProvider.approval_status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprovalAction(selectedProvider.id, 'approve')}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Enter rejection reason:');
                        if (reason) {
                          setRejectionReason(reason);
                          handleApprovalAction(selectedProvider.id, 'reject');
                        }
                      }}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </>
                )}
                {selectedProvider.approval_status === 'approved' && (
                  <button
                    onClick={() => {
                      const reason = prompt('Enter suspension reason:');
                      if (reason) {
                        setRejectionReason(reason);
                        handleApprovalAction(selectedProvider.id, 'suspend');
                      }
                    }}
                    className="flex-1 bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700"
                  >
                    Suspend
                  </button>
                )}
                {(selectedProvider.approval_status === 'rejected' || selectedProvider.approval_status === 'suspended') && (
                  <button
                    onClick={() => handleApprovalAction(selectedProvider.id, 'reinstate')}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  >
                    Reinstate
                  </button>
                )}
                <button
                  onClick={() => { setShowDetailModal(false); setSelectedProvider(null); }}
                  className="flex-1 bg-gray-300 py-2 rounded-lg hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Providers;
