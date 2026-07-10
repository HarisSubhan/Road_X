import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { clearActiveBooking } from '../../store/bookingSlice';
import { joinBookingRoom } from '../../services/socketService';
import MapLibreGL from '@maplibre/maplibre-react-native';

MapLibreGL.setAccessToken(null);

const LiveTrackingScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { activeBooking, providerLocation } = useSelector((state) => state.booking);

  useEffect(() => {
    if (activeBooking) {
      joinBookingRoom(activeBooking.id);
    }

    return () => {
      dispatch(clearActiveBooking());
    };
  }, [activeBooking, dispatch]);

  useEffect(() => {
    if (activeBooking?.status === 'completed') {
      navigation.navigate('Rating');
    }
  }, [activeBooking?.status, navigation]);

  const handleCall = () => {
    if (activeBooking?.provider_phone) {
      Linking.openURL(`tel:${activeBooking.provider_phone}`);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: () => navigation.goBack() }
      ]
    );
  };

  const getStatusStep = (status) => {
    const steps = ['accepted', 'en_route', 'arrived', 'in_progress', 'completed'];
    return steps.indexOf(status);
  };

  const currentStep = getStatusStep(activeBooking?.status);

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapLibreGL.MapView
          style={styles.map}
          styleURL="https://tiles.openfreemap.org/styles/liberty"
        >
          <MapLibreGL.PointAnnotation
            coordinate={[67.0011, 24.8607]}
            id="customer"
          >
            <View style={styles.customerMarker}>
              <Text style={styles.markerText}>📍</Text>
            </View>
          </MapLibreGL.PointAnnotation>

          {providerLocation && (
            <MapLibreGL.PointAnnotation
              coordinate={[providerLocation.lng, providerLocation.lat]}
              id="provider"
            >
              <View style={styles.providerMarker}>
                <Text style={styles.providerMarkerText}>🚗</Text>
              </View>
            </MapLibreGL.PointAnnotation>
          )}
        </MapLibreGL.MapView>
      </View>

      <View style={styles.bottomCard}>
        <View style={styles.progressIndicator}>
          {['accepted', 'en_route', 'arrived', 'in_progress', 'completed'].map((step, index) => (
            <View key={step} style={styles.progressStep}>
              <View style={[
                styles.progressDot,
                index <= currentStep && styles.progressDotActive
              ]}>
                <Text style={styles.progressDotText}>{index + 1}</Text>
              </View>
              {index < 4 && <View style={[
                styles.progressLine,
                index < currentStep && styles.progressLineActive
              ]} />}
            </View>
          ))}
        </View>

        <View style={styles.providerInfo}>
          <View style={styles.providerHeader}>
            <Text style={styles.providerName}>Provider</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
                <Text style={styles.actionButtonText}>📞</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>💬</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.estimatedFare}>
            {t('booking.estimatedFare')}: PKR {activeBooking?.estimated_fare}
          </Text>
        </View>

        {activeBooking?.status !== 'in_progress' && activeBooking?.status !== 'completed' && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>{t('tracking.cancel')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  customerMarker: {
    alignItems: 'center',
  },
  markerText: {
    fontSize: 30,
  },
  providerMarker: {
    alignItems: 'center',
  },
  providerMarkerText: {
    fontSize: 30,
  },
  bottomCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    padding: 20,
  },
  progressIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: {
    backgroundColor: '#DC2626',
  },
  progressDotText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  progressLine: {
    height: 2,
    backgroundColor: '#E5E7EB',
    flex: 1,
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: '#DC2626',
  },
  providerInfo: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  providerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 20,
  },
  estimatedFare: {
    fontSize: 16,
    color: '#6B7280',
  },
  cancelButton: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LiveTrackingScreen;
