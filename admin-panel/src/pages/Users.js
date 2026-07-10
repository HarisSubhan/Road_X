import React, { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [search, statusFilter, page]);

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAll({ search, status: statusFilter, page, limit: 20 });
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUnblock = async (userId, action) => {
    try {
      await usersAPI.updateStatus(userId, action);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Customers</h1>
      
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex gap-4 flex-wrap">
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg"
          />
          <div className="flex gap-2">
            {['all', 'active', 'blocked'].map((filter) => (
              <button
                key={filter}
                onClick={() => { setStatusFilter(filter); setPage(1); }}
                className={`px-4 py-2 rounded-lg ${statusFilter === filter ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Language</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold mr-3">
                      {user.full_name?.charAt(0) || 'U'}
                    </div>
                    <span className="font-medium">{user.full_name || 'N/A'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{user.phone_number || 'N/A'}</td>
                <td className="px-6 py-4 text-gray-600">{user.email || 'N/A'}</td>
                <td className="px-6 py-4">
                  <span className="text-lg">{user.preferred_language === 'ur' ? '🇵🇰' : '🇬🇧'}</span>
                </td>
                <td className="px-6 py-4">
                  {user.is_blocked ? (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Blocked</span>
                  ) : user.is_active ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Active</span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">Inactive</span>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-600 text-sm">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  {user.is_blocked ? (
                    <button
                      onClick={() => handleBlockUnblock(user.id, 'unblock')}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      Unblock
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to block this user?')) {
                          handleBlockUnblock(user.id, 'block');
                        }
                      }}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Block
                    </button>
                  )}
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
          disabled={users.length < 20}
          className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Users;
