import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en.json';
import ur from './ur.json';
import 'intl-pluralrules';

const resources = {
  en: { translation: en },
  ur: { translation: ur }
};

const initI18n = async () => {
  let savedLanguage = await AsyncStorage.getItem('language');
  
  if (!savedLanguage) {
    const deviceLocales = getLocales();
    savedLanguage = deviceLocales[0]?.languageCode || 'en';
  }
  
  await i18n.use(initReactI18next).init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });
  
  return savedLanguage;
};

export const changeLanguage = async (language) => {
  await i18n.changeLanguage(language);
  await AsyncStorage.setItem('language', language);
};

export default initI18n;
