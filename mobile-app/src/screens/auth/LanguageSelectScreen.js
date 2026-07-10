import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { changeLanguage } from '../../i18n/i18n';

const LanguageSelectScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [selected, setSelected] = React.useState('en');

  const handleSelect = async (lang) => {
    setSelected(lang);
    await changeLanguage(lang);
    setTimeout(() => {
      navigation.replace('Login');
    }, 300);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('onboarding.selectLanguage')}</Text>
        
        <TouchableOpacity
          style={[styles.card, selected === 'en' && styles.selectedCard]}
          onPress={() => handleSelect('en')}
        >
          <Text style={styles.flag}>🇬🇧</Text>
          <Text style={styles.language}>{t('onboarding.english')}</Text>
          <View style={[styles.radio, selected === 'en' && styles.selectedRadio]}>
            {selected === 'en' && <View style={styles.radioDot} />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, selected === 'ur' && styles.selectedCard]}
          onPress={() => handleSelect('ur')}
        >
          <Text style={styles.flag}>🇵🇰</Text>
          <Text style={styles.language}>{t('onboarding.urdu')}</Text>
          <View style={[styles.radio, selected === 'ur' && styles.selectedRadio]}>
            {selected === 'ur' && <View style={styles.radioDot} />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => handleSelect(selected)}
        >
          <Text style={styles.continueText}>{t('onboarding.continue')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#1F2937',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  flag: {
    fontSize: 40,
    marginRight: 16,
  },
  language: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRadio: {
    borderColor: '#DC2626',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#DC2626',
  },
  continueButton: {
    backgroundColor: '#DC2626',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  continueText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default LanguageSelectScreen;
