import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { providersAPI } from '../../services/api';

const EarningsScreen = () => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState('day');
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEarnings();
  }, [period]);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const response = await providersAPI.getEarnings(period);
      setEarnings(response.data);
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const periods = [
    { id: 'day', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('provider.earnings')}</Text>

      <View style={styles.periodSelector}>
        {periods.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[styles.periodButton, period === p.id && styles.periodButtonActive]}
            onPress={() => setPeriod(p.id)}
          >
            <Text style={[styles.periodButtonText, period === p.id && styles.periodButtonTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
        </View>
      ) : earnings ? (
        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>Net Earnings</Text>
          <Text style={styles.earningsAmount}>PKR {earnings.net || '0'}</Text>

          <View style={styles.breakdown}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Gross Revenue</Text>
              <Text style={styles.breakdownValue}>PKR {earnings.gross || '0'}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Platform Commission (15%)</Text>
              <Text style={[styles.breakdownValue, styles.commissionValue]}>
                - PKR {earnings.commission || '0'}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Completed Jobs</Text>
              <Text style={styles.breakdownValue}>{earnings.transactions || '0'}</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No earnings data available</Text>
        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Commission Structure</Text>
        <Text style={styles.infoText}>Platform takes 15% commission on each job</Text>
        <Text style={styles.infoText}>You receive 85% of the fare</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: 'white',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: '#DC2626',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  earningsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  earningsLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  earningsAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 20,
  },
  breakdown: {
    width: '100%',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  breakdownLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  commissionValue: {
    color: '#DC2626',
  },
  infoCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
});

export default EarningsScreen;
