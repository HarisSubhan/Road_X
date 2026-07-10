import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { authAPI } from './services/api';
import Categories from './pages/Categories';
import Users from './pages/Users';
import Providers from './pages/Providers';
import ProviderRegistration from './pages/ProviderRegistration';
import Bookings from './pages/Bookings';
import Earnings from './pages/Earnings';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';

const RequireAuth = ({ children }) => {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(username, password);
      localStorage.setItem('admin_token', response.data.access_token);
      localStorage.setItem('admin_user', JSON.stringify(response.data.admin));
      window.location.href = '/';
    } catch (err) {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-red-600 mb-2">RoadX</h1>
          <p className="text-gray-600">Admin Panel</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

const Sidebar = ({ onLogout }) => {
  const location = useLocation();
  const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/categories', label: 'Service Categories', icon: '📋' },
    { path: '/users', label: 'Customers', icon: '👥' },
    { path: '/providers', label: 'Providers', icon: '🔧' },
    { path: '/bookings', label: 'Bookings', icon: '📅' },
    { path: '/earnings', label: 'Earnings & Finance', icon: '💰' },
    { path: '/notifications', label: 'Notifications', icon: '🔔' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-red-500">RoadX</h1>
        <p className="text-sm text-gray-400">Admin Panel</p>
      </div>
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <a
            key={item.path}
            href={item.path}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              location.pathname === item.path
                ? 'bg-red-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
        <div className="border-t border-gray-700 pt-4 mt-auto">
    <div className="mb-4">
      <p className="text-sm text-gray-400">{adminUser.full_name || 'Admin'}</p>
      <p className="text-xs text-gray-500">{adminUser.role || 'admin'}</p>
    </div>
    <button
      onClick={onLogout}
      className="w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
    >
      Logout
    </button>
  </div>
      
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/admin/dashboard', {
          headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
        });
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  const kpiCards = [
    { label: 'Total Customers', value: stats?.total_customers || 0, icon: '👥' },
    { label: 'Active Providers', value: stats?.approved_providers || 0, icon: '🔧', subtitle: `${stats?.online_providers || 0} online` },
    { label: 'Active Jobs', value: stats?.active_bookings || 0, icon: '🚗' },
    { label: "Today's Bookings", value: stats?.today_bookings || 0, icon: '📅' },
    { label: "Today's Revenue", value: `PKR ${stats?.today_revenue || 0}`, icon: '💵' },
    { label: 'Monthly Revenue', value: `PKR ${stats?.month_revenue || 0}`, icon: '💰' },
    { label: 'Pending Approvals', value: stats?.pending_approvals || 0, icon: '⏳', highlight: true },
    { label: 'Online Providers', value: stats?.online_providers || 0, icon: '🟢' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiCards.map((card, index) => (
          <div
            key={index}
            className={`bg-white rounded-lg shadow p-6 ${card.highlight ? 'border-2 border-yellow-500' : ''}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{card.icon}</span>
              {card.highlight && <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded">Pending</span>}
            </div>
            <p className="text-3xl font-bold">{card.value}</p>
            <p className="text-gray-600 text-sm">{card.label}</p>
            {card.subtitle && <p className="text-gray-500 text-xs">{card.subtitle}</p>}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Revenue Overview</h2>
          <div className="h-64 flex items-center justify-center text-gray-400">
            [Revenue Chart - Recharts AreaChart]
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Bookings by Status</h2>
          <div className="h-64 flex items-center justify-center text-gray-400">
            [Status Pie Chart - Recharts PieChart]
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/login';
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <div className="flex">
                <Sidebar onLogout={handleLogout} />
                <div className="flex-1 bg-gray-100">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/providers" element={<Providers />} />
                    <Route path="/providers/register" element={<ProviderRegistration />} />
                    <Route path="/bookings" element={<Bookings />} />
                    <Route path="/earnings" element={<Earnings />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </div>
              </div>
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
