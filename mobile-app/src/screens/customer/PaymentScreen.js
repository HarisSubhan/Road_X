import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { confirmCash } from '../../store/bookingSlice';
import { paymentsAPI } from '../../services/api';
import LinearGradient from 'react-native-linear-gradient';

const PaymentScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { activeBooking } = useSelector((state) => state.booking);
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const booking = route.params?.booking || activeBooking;

  const handleCashPayment = async () => {
    Alert.alert(
      'Confirm Cash Payment',
      'Confirm that you have paid the provider in cash?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          onPress: async () => {
            setLoading(true);
            try {
              await paymentsAPI.confirmCash(booking.id);
              setPaymentSuccess(true);
              setTimeout(() => {
                navigation.navigate('Rating');
              }, 2000);
            } catch (error) {
              Alert.alert('Error', 'Failed to confirm payment');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDigitalPayment = async () => {
    setLoading(true);
    try {
      const response = await paymentsAPI.initiate({
        booking_id: booking.id,
        payment_method: booking.payment_method
      });
      // Open payment gateway URL
      Alert.alert('Payment', 'Redirecting to payment gateway...');
    } catch (error) {
      Alert.alert('Error', 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const commission = booking?.final_fare ? (booking.final_fare * 0.15).toFixed(2) : 0;
  const providerPayout = booking?.final_fare ? (booking.final_fare - commission).toFixed(2) : 0;

  if (paymentSuccess) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>{t('payment.paymentSuccessful')}</Text>
          <Text style={styles.successAmount}>PKR {booking?.final_fare}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#DC2626', '#B91C1C']} style={styles.invoiceCard}>
        <Text style={styles.invoiceTitle}>RoadX Invoice</Text>
        <Text style={styles.bookingRef}>{booking?.booking_ref}</Text>
        <Text style={styles.serviceName}>{booking?.category_name}</Text>
      </LinearGradient>

      <View style={styles.fareBreakdown}>
        <View style={styles.fareRow}>
          <Text style={styles.fareLabel}>Gross Fare</Text>
          <Text style={styles.fareValue}>PKR {booking?.final_fare || booking?.estimated_fare}</Text>
        </View>
        <View style={styles.fareRow}>
          <Text style={styles.fareLabel}>Platform Commission (15%)</Text>
          <Text style={[styles.fareValue, styles.commissionValue]}>- PKR {commission}</Text>
        </View>
        <View style={[styles.fareRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Amount Due</Text>
          <Text style={styles.totalValue}>PKR {providerPayout}</Text>
        </View>
      </View>

      <View style={styles.paymentMethodCard}>
        <Text style={styles.paymentMethodTitle}>Payment Method</Text>
        <Text style={styles.paymentMethodValue}>
          {booking?.payment_method?.charAt(0).toUpperCase() + booking?.payment_method?.slice(1)}
        </Text>
      </View>

      {booking?.payment_method === 'cash' ? (
        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handleCashPayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.payButtonText}>{t('payment.confirmCash')}</Text>
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handleDigitalPayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.payButtonText}>{t('payment.initiatePayment')}</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
  },
  invoiceCard: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  bookingRef: {
    fontSize: 18,
    color: 'white',
    opacity: 0.9,
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 16,
    color: 'white',
    opacity: 0.8,
  },
  fareBreakdown: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  fareLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  fareValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  commissionValue: {
    color: '#DC2626',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  paymentMethodCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  paymentMethodTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  paymentMethodValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  payButton: {
    backgroundColor: '#DC2626',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  successAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#DC2626',
  },
});

export default PaymentScreen;
