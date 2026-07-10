import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { createBooking } from '../../store/bookingSlice';
import MapLibreGL from '@maplibre/maplibre-react-native';

MapLibreGL.setAccessToken(null);

const ServiceRequestScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { category } = route.params;
  
  const [pickupAddress, setPickupAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [additionalFields, setAdditionalFields] = useState({});
  const [estimatedFare, setEstimatedFare] = useState(category?.base_fare || 200);

  const renderRequiredFields = () => {
    if (!category?.required_fields || !Array.isArray(category.required_fields)) return null;
    
    return category.required_fields.map((field) => {
      if (field.type === 'select') {
        return (
          <View key={field.key} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{field.label_en}</Text>
            <View style={styles.chipsContainer}>
              {field.options.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.chip,
                    additionalFields[field.key] === option && styles.chipActive
                  ]}
                  onPress={() => setAdditionalFields({ ...additionalFields, [field.key]: option })}
                >
                  <Text style={[
                    styles.chipText,
                    additionalFields[field.key] === option && styles.chipTextActive
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      }
      
      if (field.type === 'boolean') {
        return (
          <View key={field.key} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{field.label_en}</Text>
            <View style={styles.booleanContainer}>
              <TouchableOpacity
                style={[
                  styles.booleanOption,
                  additionalFields[field.key] === true && styles.booleanOptionActive
                ]}
                onPress={() => setAdditionalFields({ ...additionalFields, [field.key]: true })}
              >
                <Text style={styles.booleanText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.booleanOption,
                  additionalFields[field.key] === false && styles.booleanOptionActive
                ]}
                onPress={() => setAdditionalFields({ ...additionalFields, [field.key]: false })}
              >
                <Text style={styles.booleanText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }
      
      return (
        <View key={field.key} style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{field.label_en}</Text>
          <TextInput
            style={styles.textInput}
            placeholder={field.label_en}
            value={additionalFields[field.key] || ''}
            onChangeText={(text) => setAdditionalFields({ ...additionalFields, [field.key]: text })}
            keyboardType={field.type === 'number' ? 'numeric' : 'default'}
          />
        </View>
      );
    });
  };

  const handleConfirmRequest = async () => {
    if (!pickupAddress) {
      Alert.alert('Error', 'Please enter pickup address');
      return;
    }

    if (!category?.id) {
      Alert.alert('Error', 'Invalid service category');
      return;
    }

    const bookingData = {
      category_id: category.id,
      pickup_lat: 24.8607, // Default Lahore coordinates
      pickup_lng: 67.0011,
      pickup_address: pickupAddress,
      payment_method: paymentMethod,
      additional_fields: additionalFields
    };

    const result = await dispatch(createBooking(bookingData));
    
    if (createBooking.fulfilled.match(result)) {
      navigation.navigate('LiveTracking');
    } else {
      Alert.alert('Error', result.payload || 'Failed to create booking');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.mapContainer}>
        <MapLibreGL.MapView
          style={styles.map}
          styleURL="https://tiles.openfreemap.org/styles/liberty"
        >
          <MapLibreGL.PointAnnotation
            coordinate={[67.0011, 24.8607]}
            id="pickup"
          >
            <View style={styles.pinMarker}>
              <Text style={styles.pinEmoji}>{category?.icon_emoji}</Text>
            </View>
          </MapLibreGL.PointAnnotation>
        </MapLibreGL.MapView>
      </View>

      <View style={styles.form}>
        <Text style={styles.title}>{category?.name_en}</Text>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{t('booking.pickupAddress')}</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter pickup address"
            value={pickupAddress}
            onChangeText={setPickupAddress}
          />
        </View>

        {renderRequiredFields()}

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{t('booking.paymentMethod')}</Text>
          <View style={styles.paymentMethods}>
            {['cash', 'jazzcash', 'easypaisa'].map((method) => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.paymentMethod,
                  paymentMethod === method && styles.paymentMethodActive
                ]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text style={[
                  styles.paymentMethodText,
                  paymentMethod === method && styles.paymentMethodTextActive
                ]}>
                  {method.charAt(0).toUpperCase() + method.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.fareBox}>
          <Text style={styles.fareLabel}>{t('booking.estimatedFare')}</Text>
          <Text style={styles.fareAmount}>PKR {estimatedFare}</Text>
        </View>

        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmRequest}>
          <Text style={styles.confirmButtonText}>{t('booking.confirmRequest')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  mapContainer: {
    height: 300,
  },
  map: {
    flex: 1,
  },
  pinMarker: {
    alignItems: 'center',
  },
  pinEmoji: {
    fontSize: 40,
  },
  form: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  chipActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  chipText: {
    color: '#6B7280',
    fontSize: 14,
  },
  chipTextActive: {
    color: '#DC2626',
    fontWeight: '600',
  },
  booleanContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  booleanOption: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  booleanOptionActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  booleanText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentMethod: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  paymentMethodActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  paymentMethodTextActive: {
    color: '#DC2626',
  },
  fareBox: {
    backgroundColor: '#F3F4F6',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  fareLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  fareAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  confirmButton: {
    backgroundColor: '#DC2626',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ServiceRequestScreen;
