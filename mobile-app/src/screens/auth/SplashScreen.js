import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { changeLanguage } from '../../i18n/i18n';

const SplashScreen = () => {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    const checkLanguageAndNavigate = async () => {
      const savedLanguage = await AsyncStorage.getItem('language');
      
      setTimeout(() => {
        if (savedLanguage) {
          navigation.replace('Login');
        } else {
          navigation.replace('LanguageSelect');
        }
      }, 2200);
    };

    checkLanguageAndNavigate();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.logo}>RX</Text>
        <Text style={styles.tagline}>RoadX - Roadside Assistance</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 80,
    fontWeight: 'bold',
    color: 'white',
  },
  tagline: {
    fontSize: 18,
    color: 'white',
    marginTop: 10,
  },
});

export default SplashScreen;
