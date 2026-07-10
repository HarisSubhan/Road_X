import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProviderActiveBooking, fetchProviderEarnings } from '../../store/bookingSlice';
import { emitToggleOnline, setIncomingRequestCallback } from '../../services/socketService';
import Geolocation from 'react-native-geolocation-service';
import MapLibreGL from '@maplibre/maplibre-react-native';

MapLibreGL.setAccessToken(null);

const ProviderHomeScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { activeBooking } = useSelector((state) => state.booking);
  const [isOnline, setIsOnline] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchProviderActiveBooking());
    loadEarnings();
    
    setIncomingRequestCallback((data) => {
      navigation.navigate('IncomingRequest', { booking: data.booking });
    });

    return () => {
      setIncomingRequestCallback(null);
    };
  }, [dispatch, navigation]);

  useEffect(() => {
    if (activeBooking) {
      navigation.navigate('ActiveJob');
    }
  }, [activeBooking, navigation]);

  const loadEarnings = async () => {
    setLoading(true);
    try {
      const result = await dispatch(fetchProviderEarnings('day'));
      setEarnings(result.payload);
    } catch (error) {
      console.error('Failed to load earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOnline = async () => {
    const newStatus = !isOnline;
    
    if (newStatus) {
      Geolocation.requestAuthorization('whenInUse').then(granted => {
        if (granted) {
          Geolocation.getCurrentPosition(
            position => {
              setCurrentLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude
              });
              emitToggleOnline(true, position.coords.latitude, position.coords.longitude);
              setIsOnline(true);
            },
            error => {
              Alert.alert('Error', 'Failed to get location');
            },
            { enableHighAccuracy: true }
          );
        }
      });
    } else {
      emitToggleOnline(false);
      setIsOnline(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()}, {user?.full_name?.split(' ')[0] || 'Provider'}!</Text>
        <View style={[styles.statusBadge, isOnline ? styles.statusOnline : styles.statusOffline]}>
          <Text style={styles.statusText}>{isOnline ? '🟢 Online' : '⚫ Offline'}</Text>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <MapLibreGL.MapView
          style={styles.map}
          styleURL="https://tiles.openfreemap.org/styles/liberty"
        >
          {currentLocation && (
            <MapLibreGL.PointAnnotation
              coordinate={[currentLocation.lng, currentLocation.lat]}
              id="currentLocation"
            >
              <View style={styles.marker}>
                <Text style={styles.markerText}>🧑‍🔧</Text>
              </View>
            </MapLibreGL.PointAnnotation>
          )}
        </MapLibreGL.MapView>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={[styles.toggleButton, isOnline ? styles.toggleButtonOnline : styles.toggleButtonOffline]}
          onPress={handleToggleOnline}
        >
          <Text style={styles.toggleButtonText}>
            {isOnline ? t('provider.goOffline') : t('provider.goOnline')}
          </Text>
        </TouchableOpacity>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>💰</Text>
            <Text style={styles.statValue}>PKR {earnings?.net || '0'}</Text>
            <Text style={styles.statLabel}>{t('provider.earnings')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>📋</Text>
            <Text style={styles.statValue}>{earnings?.transactions || '0'}</Text>
            <Text style={styles.statLabel}>{t('provider.jobs')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statValue}>{user?.rating || '0.0'}</Text>
            <Text style={styles.statLabel}>{t('provider.rating')}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOnline: {
    backgroundColor: '#D1FAE5',
  },
  statusOffline: {
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mapContainer: {
    height: 200,
  },
  map: {
    flex: 1,
  },
  marker: {
    alignItems: 'center',
  },
  markerText: {
    fontSize: 30,
  },
  content: {
    padding: 20,
  },
  toggleButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  toggleButtonOnline: {
    backgroundColor: '#FEE2E2',
  },
  toggleButtonOffline: {
    backgroundColor: '#DCFCE7',
  },
  toggleButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default ProviderHomeScreen;
