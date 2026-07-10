import React, { useState, useEffect } from 'react';
import { settingsAPI, commissionAPI } from '../services/api';

const Settings = () => {
  const [settings, setSettings] = useState({});
  const [commissionSettings, setCommissionSettings] = useState([]);
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
    fetchCommissionSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.getAll();
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommissionSettings = async () => {
    try {
      const response = await commissionAPI.getAll();
      setCommissionSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch commission settings:', error);
    }
  };

  const updateSetting = async (key, value, type) => {
    try {
      await settingsAPI.update(key, value);
      fetchSettings();
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  };

  const tabs = [
    { id: 'general', label: '⚙️ General' },
    { id: 'auth', label: '🔐 Authentication' },
    { id: 'payment', label: '💳 Payments' },
    { id: 'commission', label: '💰 Commission' },
    { id: 'booking', label: '📋 Booking' },
  ];

  const renderSettingInput = (setting) => {
    const value = setting.setting_type === 'boolean' 
      ? setting.setting_value === 'true' 
      : setting.setting_type === 'number' 
        ? parseFloat(setting.setting_value) 
        : setting.setting_value;

    if (setting.setting_type === 'boolean') {
      return (
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => updateSetting(setting.setting_key, e.target.checked)}
            className="w-5 h-5"
          />
        </div>
      );
    }

    if (setting.setting_type === 'number') {
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => updateSetting(setting.setting_key, parseFloat(e.target.value))}
          className="px-4 py-2 border rounded-lg w-32"
        />
      );
    }

    return (
      <input
        type="text"
        value={value}
        onChange={(e) => updateSetting(setting.setting_key, e.target.value)}
        className="px-4 py-2 border rounded-lg w-full"
      />
    );
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Platform Settings</h1>

      <div className="flex gap-4 mb-6 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 border-b-2 ${
              activeTab === tab.id ? 'border-red-600 text-red-600' : 'border-transparent text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === 'commission' ? (
          <div>
            <h2 className="text-xl font-bold mb-4">Commission Settings</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Global Commission</h3>
                {commissionSettings.filter(s => s.is_global).map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between">
                    <span>Global Commission Rate</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={setting.commission_percentage}
                        onChange={(e) => {
                          // Update commission setting
                        }}
                        className="px-4 py-2 border rounded-lg w-24"
                      />
                      <span>%</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Category-Specific Commissions</h3>
                {commissionSettings.filter(s => !s.is_global).map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between py-2 border-b">
                    <span>{setting.category_name}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={setting.commission_percentage}
                        className="px-4 py-2 border rounded-lg w-24"
                      />
                      <span>%</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Commission Formula</h3>
                <p className="text-gray-700">
                  Platform Earnings = Total Fare × Commission %<br />
                  Provider Payout = Total Fare - Platform Earnings
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {settings[activeTab]?.map((setting) => (
              <div key={setting.id} className="flex items-start justify-between py-4 border-b">
                <div className="flex-1">
                  <p className="font-medium">{setting.description}</p>
                  <p className="text-sm text-gray-500 font-mono">{setting.setting_key}</p>
                </div>
                <div className="ml-4">
                  {renderSettingInput(setting)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
