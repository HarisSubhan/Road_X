const fs = require('fs');

const fixes = {
  'IncomingRequestScreen.js': `import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Vibration } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { setActiveBooking, setSearchingForProvider } from '../../store/bookingSlice';
import { acceptBooking } from '../../services/socketService';
import LinearGradient from 'react-native-linear-gradient';

const IncomingRequestScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { booking } = route.params;
  
  const slideAnim = useRef(new Animated.Value(500)).current;
  const [remainingTime, setRemainingTime] = useState(45);

  useEffect(() => {
    Vibration.vibrate([0, 400, 100, 400, 100, 400]);
    
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAccept = () => {
    acceptBooking(booking.id);
    dispatch(setActiveBooking({ booking }));
    dispatch(setSearchingForProvider(false));
    navigation.navigate('ActiveJob');
  };

  const handleDecline = () => {
    Animated.timing(slideAnim, {
      toValue: 500,
      duration: 300,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      navigation.goBack();
    });
  };

  const getColorForTime = () => {
    if (remainingTime > 30) return '#10B981';
    if (remainingTime > 15) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <LinearGradient colors={['#DC2626', '#B91C1C']} style={styles.header}>
        <Text style={styles.emoji}>{booking?.icon_emoji}</Text>
        <Text style={styles.serviceName}>{booking?.category_name}</Text>
        <Text style={styles.title}>{t('provider.incomingRequest')}</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Pickup Address</Text>
          <Text style={styles.infoValue}>{booking?.pickup_address}</Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Distance</Text>
            <Text style={styles.infoValue}>{booking?.distance_km || '3'} km</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Estimated Fare</Text>
            <Text style={styles.infoValue}>PKR {booking?.estimated_fare}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Payment Method</Text>
          <Text style={styles.infoValue}>
            {booking?.payment_method?.charAt(0).toUpperCase() + booking?.payment_method?.slice(1)}
          </Text>
        </View>

        <View style={styles.countdownContainer}>
          <Text style={styles.countdownLabel}>Auto-decline in</Text>
          <Text style={[styles.countdownTime, { color: getColorForTime() }]}>
            {remainingTime}s
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.declineButton} onPress={handleDecline}>
            <Text style={styles.declineButtonText}>{t('provider.decline')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
            <Text style={styles.acceptButtonText}>{t('provider.accept')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    padding: 30,
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  emoji: { fontSize: 60, marginBottom: 12 },
  serviceName: { fontSize: 20, color: 'white', opacity: 0.9, marginBottom: 4 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  content: { padding: 20 },
  infoCard: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 16, marginBottom: 12 },
  infoLabel: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  infoValue: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  countdownContainer: { alignItems: 'center', marginVertical: 20 },
  countdownLabel: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  countdownTime: { fontSize: 48, fontWeight: 'bold' },
  buttonContainer: { flexDirection: 'row', gap: 12 },
  declineButton: { flex: 1, backgroundColor: '#FEE2E2', padding: 16, borderRadius: 12, alignItems: 'center' },
  declineButtonText: { color: '#DC2626', fontSize: 18, fontWeight: 'bold' },
  acceptButton: { flex: 1, backgroundColor: '#10B981', padding: 16, borderRadius: 12, alignItems: 'center' },
  acceptButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default IncomingRequestScreen;
`,
  'ProviderOrderHistoryScreen.js': `import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProviderHistory } from '../../store/bookingSlice';

const ProviderOrderHistoryScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { providerBookings, isLoading } = useSelector((state) => state.booking);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchProviderHistory());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchProviderHistory());
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#F59E0B',
      accepted: '#3B82F6',
      en_route: '#8B5CF6',
      arrived: '#6366F1',
      in_progress: '#F97316',
      completed: '#10B981',
      cancelled: '#EF4444'
    };
    return colors[status] || '#6B7280';
  };

  const renderBooking = ({ item }) => (
    <TouchableOpacity
      style={styles.bookingCard}
      onPress={() => {}}
    >
      <View style={styles.bookingHeader}>
        <Text style={styles.categoryEmoji}>{item.icon_emoji}</Text>
        <View style={styles.bookingInfo}>
          <Text style={styles.categoryName}>{item.category_name}</Text>
          <Text style={styles.bookingRef}>{item.booking_ref}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
        </View>
      </View>
      <View style={styles.bookingDetails}>
        <Text style={styles.detailText}>📅 {new Date(item.created_at).toLocaleDateString()}</Text>
        <Text style={styles.detailText}>📍 {item.pickup_address}</Text>
        <Text style={styles.detailText}>💰 PKR {item.final_fare || item.estimated_fare}</Text>
        <Text style={styles.detailText}>⭐ {item.rating || 'N/A'}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading && providerBookings.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('history.orderHistory')}</Text>
      
      <FlatList
        data={providerBookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>{t('history.noOrders')}</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 20 },
  listContent: { paddingBottom: 20 },
  bookingCard: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  bookingHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  categoryEmoji: { fontSize: 32, marginRight: 12 },
  bookingInfo: { flex: 1 },
  categoryName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  bookingRef: { fontSize: 12, color: '#6B7280', fontFamily: 'monospace' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600', color: 'white' },
  bookingDetails: { gap: 4 },
  detailText: { fontSize: 14, color: '#6B7280' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyText: { fontSize: 18, color: '#6B7280' },
});

export default ProviderOrderHistoryScreen;`
};

fs.writeFileSync('src/screens/provider/IncomingRequestScreen.js', fixes['IncomingRequestScreen.js'], 'utf8');
fs.writeFileSync('src/screens/provider/ProviderOrderHistoryScreen.js', fixes['ProviderOrderHistoryScreen.js'], 'utf8');
console.log('Fixed!');