import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';
import { changeLanguage } from '../../i18n/i18n';
import { providersAPI } from '../../services/api';

const ProviderProfileScreen = () => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [providerData, setProviderData] = useState(null);

  useEffect(() => {
    loadProviderData();
  }, []);

  const loadProviderData = async () => {
    try {
      const response = await providersAPI.getMe();
      setProviderData(response.data);
    } catch (error) {
      console.error('Failed to load provider data:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          onPress: async () => {
            await dispatch(logout());
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        }
      ]
    );
  };

  const handleLanguageToggle = async () => {
    const newLang = i18n.language === 'en' ? 'ur' : 'en';
    await changeLanguage(newLang);
  };

  const settings = [
    { icon: '👤', label: t('profile.editProfile'), onPress: () => {} },
    { icon: '🌐', label: t('profile.language'), onPress: handleLanguageToggle },
    { icon: '🔔', label: t('profile.notifications'), onPress: () => {} },
    { icon: '❓', label: t('profile.helpCenter'), onPress: () => {} },
    { icon: '📞', label: t('profile.callSupport'), onPress: () => {} },
    { icon: '📄', label: t('profile.terms'), onPress: () => {} },
    { icon: '🔒', label: t('profile.privacy'), onPress: () => {} },
    { icon: '📱', label: t('profile.appVersion'), onPress: () => {}, value: '1.0.0' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.full_name?.charAt(0) || 'P'}</Text>
        </View>
        <Text style={styles.name}>{user?.full_name || 'Provider'}</Text>
        <Text style={styles.phone}>{user?.phone_number || ''}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Text style={styles.statValue}>{providerData?.total_jobs || '0'}</Text>
            <Text style={styles.statLabel}>Jobs</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statValue}>⭐ {providerData?.rating_average || '0.0'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statValue}>PKR {providerData?.total_earnings || '0'}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
        </View>
      </View>

      <View style={styles.vehicleCard}>
        <Text style={styles.cardTitle}>Vehicle Information</Text>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleLabel}>Make</Text>
          <Text style={styles.vehicleValue}>{providerData?.vehicle_make || 'N/A'}</Text>
        </View>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleLabel}>Model</Text>
          <Text style={styles.vehicleValue}>{providerData?.vehicle_model || 'N/A'}</Text>
        </View>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleLabel}>Year</Text>
          <Text style={styles.vehicleValue}>{providerData?.vehicle_year || 'N/A'}</Text>
        </View>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleLabel}>Plate</Text>
          <Text style={styles.vehicleValue}>{providerData?.vehicle_plate || 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.settings}>
        {settings.map((setting, index) => (
          <TouchableOpacity
            key={index}
            style={styles.settingItem}
            onPress={setting.onPress}
          >
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>{setting.icon}</Text>
              <Text style={styles.settingLabel}>{setting.label}</Text>
            </View>
            <View style={styles.settingRight}>
              {setting.value && <Text style={styles.settingValue}>{setting.value}</Text>}
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>{t('auth.logout')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#F9FAFB',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  phone: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBadge: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  vehicleCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    margin: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  vehicleInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  vehicleLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  vehicleValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  settings: {
    marginTop: 20,
    backgroundColor: 'white',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#1F2937',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  chevron: {
    fontSize: 24,
    color: '#9CA3AF',
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
    margin: 20,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProviderProfileScreen;
