import React, { useState } from 'react';
import { notificationsAPI } from '../services/api';

const Notifications = () => {
  const [target, setTarget] = useState('everyone');
  const [titleEn, setTitleEn] = useState('');
  const [titleUr, setTitleUr] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [bodyUr, setBodyUr] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentHistory, setSentHistory] = useState([]);

  const handleSend = async () => {
    if (!titleEn || !bodyEn) return;

    setLoading(true);
    try {
      await notificationsAPI.broadcast({
        target,
        title_en: titleEn,
        title_ur: titleUr,
        body_en: bodyEn,
        body_ur: bodyUr,
        data: {}
      });
      
      setSentHistory([
        {
          id: Date.now(),
          title_en: titleEn,
          title_ur: titleUr,
          target,
          sent_at: new Date().toISOString()
        },
        ...sentHistory
      ]);

      setTitleEn('');
      setTitleUr('');
      setBodyEn('');
      setBodyUr('');
    } catch (error) {
      console.error('Failed to send notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const canSend = titleEn && bodyEn;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Push Notification Center</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Compose Notification</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Target Audience</label>
            <div className="grid grid-cols-3 gap-4">
              {['everyone', 'customers', 'providers'].map((option) => (
                <button
                  key={option}
                  onClick={() => setTarget(option)}
                  className={`p-4 rounded-lg border-2 ${
                    target === option ? 'border-red-600 bg-red-50' : 'border-gray-200'
                  }`}
                >
                  <div className="text-2xl mb-2">
                    {option === 'everyone' ? '🌍' : option === 'customers' ? '👥' : '🔧'}
                  </div>
                  <p className="font-medium capitalize">{option}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title (English)</label>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Enter title in English"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Title (اردو)</label>
              <input
                type="text"
                value={titleUr}
                onChange={(e) => setTitleUr(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Enter title in Urdu"
                dir="rtl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message Body (English)</label>
              <textarea
                value={bodyEn}
                onChange={(e) => setBodyEn(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg h-32"
                placeholder="Enter message in English"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message Body (اردو)</label>
              <textarea
                value={bodyUr}
                onChange={(e) => setBodyUr(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg h-32"
                placeholder="Enter message in Urdu"
                dir="rtl"
              />
            </div>
          </div>

          <button
            onClick={handleSend}
            disabled={!canSend || loading}
            className="w-full mt-6 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Notification'}
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Live Preview</h2>
            <div className="bg-gray-100 rounded-lg p-4 max-w-sm mx-auto">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
                    R
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">RoadX</p>
                    <p className="text-xs text-gray-500">now</p>
                  </div>
                </div>
                <p className="font-medium mb-1">{titleEn || 'Title'}</p>
                <p className="text-sm text-gray-600">{bodyEn || 'Message body will appear here...'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Notification Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-red-600">{sentHistory.length}</p>
                <p className="text-gray-600 text-sm">Sent Today</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-green-600">
                  {sentHistory.filter(n => n.target === 'customers').length}
                </p>
                <p className="text-gray-600 text-sm">To Customers</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {sentHistory.filter(n => n.target === 'providers').length}
                </p>
                <p className="text-gray-600 text-sm">To Providers</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {sentHistory.filter(n => n.target === 'everyone').length}
                </p>
                <p className="text-gray-600 text-sm">Broadcast</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Sent History</h2>
            {sentHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No notifications sent yet</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {sentHistory.map((notification) => (
                  <div key={notification.id} className="border-b pb-3">
                    <p className="font-medium">{notification.title_en}</p>
                    <p className="text-sm text-gray-600 capitalize">{notification.target}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(notification.sent_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
