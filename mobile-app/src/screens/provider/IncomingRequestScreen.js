import React, { useEffect, useState, useRef } from 'react';
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
