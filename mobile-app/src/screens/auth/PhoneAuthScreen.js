import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { sendOTP, verifyOTP } from '../../store/authSlice';

const PhoneAuthScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState('customer'); // 'customer' or 'provider'
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert(t('error'), t('invalidPhone'));
      return;
    }

    setLoading(true);
    try {
      await dispatch(sendOTP({ phone, role })).unwrap();
      setShowOTP(true);
      setTimer(60);
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      Alert.alert(t('error'), error.message || t('otpSendFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 4) {
      Alert.alert(t('error'), t('invalidOTP'));
      return;
    }

    setLoading(true);
    try {
      const result = await dispatch(verifyOTP({ phone, otp, role })).unwrap();
      if (result.is_new_user) {
        navigation.navigate(role === 'customer' ? 'CustomerProfile' : 'ProviderProfile');
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: role === 'customer' ? 'CustomerTabs' : 'ProviderTabs' }],
        });
      }
    } catch (error) {
      Alert.alert(t('error'), error.message || t('otpVerifyFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0) return;
    await handleSendOTP();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>RoadX</Text>
          <Text style={styles.subtitle}>{t('roadsideAssistance')}</Text>
        </View>

        <View style={styles.roleSelector}>
          <TouchableOpacity
            style={[styles.roleButton, role === 'customer' && styles.activeRole]}
            onPress={() => setRole('customer')}
          >
            <Text style={[styles.roleText, role === 'customer' && styles.activeRoleText]}>
              {t('customer')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleButton, role === 'provider' && styles.activeRole]}
            onPress={() => setRole('provider')}
          >
            <Text style={[styles.roleText, role === 'provider' && styles.activeRoleText]}>
              {t('provider')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>{t('phoneNumber')}</Text>
          <TextInput
            style={styles.input}
            placeholder="+92 3XX XXXXXXX"
            placeholderTextColor="#999"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={15}
          />

          {showOTP && (
            <>
              <Text style={styles.label}>{t('enterOTP')}</Text>
              <TextInput
                style={styles.input}
                placeholder="XXXX"
                placeholderTextColor="#999"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
              <TouchableOpacity
                onPress={handleResendOTP}
                disabled={timer > 0}
                style={styles.resendButton}
              >
                <Text style={[styles.resendText, timer > 0 && styles.resendTextDisabled]}>
                  {timer > 0 ? `${t('resendIn')} ${timer}s` : t('resendOTP')}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={showOTP ? handleVerifyOTP : handleSendOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {showOTP ? t('verify') : t('sendOTP')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  roleSelector: {
    flexDirection: 'row',
    marginBottom: 30,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 5,
  },
  roleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeRole: {
    backgroundColor: '#dc2626',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeRoleText: {
    color: '#fff',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f9fafb',
  },
  button: {
    backgroundColor: '#dc2626',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendButton: {
    alignSelf: 'flex-end',
    marginTop: -10,
    marginBottom: 20,
  },
  resendText: {
    color: '#dc2626',
    fontSize: 14,
  },
  resendTextDisabled: {
    color: '#999',
  },
});

export default PhoneAuthScreen;
