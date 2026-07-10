import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const RoleSelectScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);

  const handleRoleSelect = async (role) => {
    setSelected(role);
    
    if (role === 'provider') {
      // Navigate to provider registration form directly
      navigation.reset({
        index: 0,
        routes: [{ name: 'ProviderRegistration' }],
      });
    } else {
      // Navigate to customer profile
      navigation.reset({
        index: 0,
        routes: [{ name: 'CustomerProfile' }],
      });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="arrow-left" size={24} color="#1F2937" />
      </TouchableOpacity>
      
      <Text style={styles.title}>Select Your Role</Text>
      <Text style={styles.subtitle}>Choose how you want to use RoadX</Text>

      <TouchableOpacity
        style={[styles.card, selected === 'customer' && styles.selectedCard]}
        onPress={() => handleRoleSelect('customer')}
      >
        <LinearGradient
          colors={selected === 'customer' ? ['#DC2626', '#B91C1C'] : ['#F3F4F6', '#E5E7EB']}
          style={styles.cardGradient}
        >
          <Text style={styles.icon}>🚗</Text>
          <Text style={[styles.cardTitle, selected === 'customer' && styles.selectedText]}>
            {t('onboarding.requestService')}
          </Text>
          <Text style={[styles.cardSubtitle, selected === 'customer' && styles.selectedText]}>
            Get help when your vehicle breaks down
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.card, selected === 'provider' && styles.selectedCard]}
        onPress={() => handleRoleSelect('provider')}
      >
        <LinearGradient
          colors={selected === 'provider' ? ['#DC2626', '#B91C1C'] : ['#F3F4F6', '#E5E7EB']}
          style={styles.cardGradient}
        >
          <Text style={styles.icon}>🔧</Text>
          <Text style={[styles.cardTitle, selected === 'provider' && styles.selectedText]}>
            {t('onboarding.provideService')}
          </Text>
          <Text style={[styles.cardSubtitle, selected === 'provider' && styles.selectedText]}>
            Earn money by helping others
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedCard: {
    borderWidth: 3,
    borderColor: '#DC2626',
  },
  cardGradient: {
    padding: 30,
    alignItems: 'center',
  },
  icon: {
    fontSize: 60,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  selectedText: {
    color: 'white',
  },
});

export default RoleSelectScreen;
