import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { updateBookingStatus, clearActiveBooking } from '../../store/bookingSlice';
import { emitLocation, emitStatusUpdate, joinBookingRoom } from '../../services/socketService';
import MapLibreGL from '@maplibre/maplibre-react-native';
import Geolocation from 'react-native-geolocation-service';

MapLibreGL.setAccessToken(null);

const ActiveJobScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { activeBooking } = useSelector((state) => state.booking);
  const [currentLocation, setCurrentLocation] = React.useState(null);

  useEffect(() => {
    if (activeBooking) {
      joinBookingRoom(activeBooking.id);
    }

    const locationWatch = Geolocation.watchPosition(
      position => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCurrentLocation(location);
        emitLocation(location.lat, location.lng, activeBooking?.id);
      },
      error => console.log('Location error:', error),
      { enableHighAccuracy: true, distanceFilter: 10 }
    );

    return () => {
      Geolocation.clearWatch(locationWatch);
      dispatch(clearActiveBooking());
    };
  }, [activeBooking, dispatch]);

  useEffect(() => {
    if (activeBooking?.status === 'completed') {
      navigation.navigate('ProviderTabs');
    }
  }, [activeBooking?.status, navigation]);

  const handleCallCustomer = () => {
    if (activeBooking?.customer_phone) {
      Linking.openURL(`tel:${activeBooking.customer_phone}`);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    Alert.alert(
      'Confirm',
      `Are you sure you want to change status to ${newStatus}?`,
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          onPress: async () => {
            await dispatch(updateBookingStatus({ booking_id: activeBooking.id, status: newStatus }));
            emitStatusUpdate(activeBooking.id, newStatus);
          }
        }
      ]
    );
  };

  const getStatusStep = (status) => {
    const steps = ['accepted', 'en_route', 'arrived', 'in_progress', 'completed'];
    return steps.indexOf(status);
  };

  const currentStep = getStatusStep(activeBooking?.status);

  const renderActionButton = () => {
    switch (activeBooking?.status) {
      case 'accepted':
        return (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleStatusUpdate('en_route')}
          >
            <Text style={styles.actionButtonText}>{t('provider.startNavigation')}</Text>
          </TouchableOpacity>
        );
      case 'en_route':
        return (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleStatusUpdate('arrived')}
          >
            <Text style={styles.actionButtonText}>{t('provider.arrived')}</Text>
          </TouchableOpacity>
        );
      case 'arrived':
        return (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleStatusUpdate('in_progress')}
          >
            <Text style={styles.actionButtonText}>{t('provider.startService')}</Text>
          </TouchableOpacity>
        );
      case 'in_progress':
        return (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => handleStatusUpdate('completed')}
          >
            <Text style={styles.actionButtonText}>{t('provider.markComplete')}</Text>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

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

          {currentLocation && (
            <MapLibreGL.PointAnnotation
              coordinate={[currentLocation.lng, currentLocation.lat]}
              id="provider"
            >
              <View style={styles.providerMarker}>
                <Text style={styles.providerMarkerText}>🧑‍🔧</Text>
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

        <View style={styles.customerInfo}>
          <View style={styles.customerHeader}>
            <Text style={styles.customerName}>Customer</Text>
            <TouchableOpacity style={styles.callButton} onPress={handleCallCustomer}>
              <Text style={styles.callButtonText}>📞</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.address}>{activeBooking?.pickup_address}</Text>
          <Text style={styles.fare}>
            {t('booking.estimatedFare')}: PKR {activeBooking?.estimated_fare}
          </Text>
        </View>

        {renderActionButton()}
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
  customerInfo: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callButtonText: {
    fontSize: 20,
  },
  address: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  fare: {
    fontSize: 16,
    color: '#6B7280',
  },
  actionButton: {
    backgroundColor: '#DC2626',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ActiveJobScreen;
