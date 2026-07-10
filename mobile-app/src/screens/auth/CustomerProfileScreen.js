import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile, sendOTP, verifyOTP } from '../../store/authSlice';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const CustomerProfileScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [name, setName] = useState(user?.full_name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const handleSendOTP = async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter your phone number first');
      return;
    }

    // Validate phone number format (10 digits for Pakistan)
    const phoneRegex = /^3[0-9]{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid phone number (3XXXXXXXXX)');
      return;
    }

    setLoading(true);
    try {
      // Send OTP verification using Redux thunk
      await dispatch(sendOTP(phoneNumber)).unwrap();
      Alert.alert('Success', 'OTP sent to your phone number');
      setShowVerification(true);
    } catch (error) {
      Alert.alert('Error', error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    // Validate verification code
    if (!otpCode || otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP code');
      return;
    }

    // Validate name
    if (!name || name.trim().length === 0) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    // Validate username
    if (!username || username.trim().length === 0) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    if (username.trim().length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      Alert.alert('Error', 'Username can only contain letters, numbers, and underscores');
      return;
    }

    // Validate password - MANDATORY
    if (!password || password.length < 6) {
      Alert.alert('Error', 'Password is required and must be at least 6 characters');
      return;
    }

    // Validate confirm password
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Verify OTP and create account using Redux thunk
      await dispatch(verifyOTP({
        phone_number: phoneNumber,
        otp_code: otpCode,
        full_name: name.trim(),
        username: username.trim(),
        password: password
      })).unwrap();
      
      setPhoneVerified(true);
      setShowVerification(false);
      
      Alert.alert(
        'Success', 
        'Phone number verified and account created successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate after user dismisses the alert
              navigation.reset({
                index: 0,
                routes: [{ name: 'CustomerTabs' }],
              });
            }
          }
        ]
      );

    } catch (error) {
      Alert.alert('Error', error || 'Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      allowsEditing: true,
      aspectRatio: [1, 1],
      quality: 0.5,
    });

    if (!result.didCancel && result.assets && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    // If phone is verified, we can update profile
    if (!phoneVerified) {
      Alert.alert('Error', 'Please verify your phone number first');
      return;
    }

    if (!name) {
      Alert.alert(t('error'), 'Please enter your full name');
      return;
    }

    if (!username) {
      Alert.alert(t('error'), 'Please enter your username');
      return;
    }

    setLoading(true);
    try {
      let result;
      
      // If profile image is selected, use FormData
      if (profileImage) {
        const formData = new FormData();
        formData.append('profile_image', {
          uri: profileImage,
          type: 'image/jpeg',
          name: 'profile.jpg'
        });
        formData.append('full_name', name);
        formData.append('username', username);
        formData.append('phone_number', phoneNumber);
        result = await dispatch(updateProfile(formData)).unwrap();
      } else {
        // No image, send as JSON
        result = await dispatch(updateProfile({
          full_name: name,
          username: username,
          phone_number: phoneNumber
        })).unwrap();
      }
      
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert(t('error'), error.message || t('profileUpdateFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('RoleSelect')}>
          <Icon name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Complete your profile to get started</Text>
        </View>

        <View style={styles.form}>
          {/* Profile Image */}
          <TouchableOpacity style={styles.profileImageContainer} onPress={pickImage}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileImagePlaceholderText}>📷</Text>
                <Text style={styles.profileImagePlaceholderLabel}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Full Name - REQUIRED */}
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
          />

          {/* Username - REQUIRED */}
          <Text style={styles.label}>Username *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          {/* Phone Number - REQUIRED */}
          <Text style={styles.label}>Phone Number *</Text>
          <View style={styles.phoneInputContainer}>
            <Text style={styles.countryCode}>+92</Text>
            <TextInput
              style={styles.phoneInput}
              placeholder="3XXXXXXXXX"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={10}
              editable={!phoneVerified}
            />
            {!phoneVerified && !showVerification && (
              <TouchableOpacity 
                style={styles.verifyButton} 
                onPress={handleSendOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.verifyButtonText}>Send OTP</Text>
                )}
              </TouchableOpacity>
            )}
            {phoneVerified && (
              <View style={styles.verifiedBadge}>
                <Icon name="check-circle" size={24} color="#10B981" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>

          {/* Verification Section with Password - MANDATORY */}
          {showVerification && !phoneVerified && (
            <View style={styles.verificationSection}>
              <Text style={styles.sectionTitle}>Verify Your Phone</Text>
              <Text style={styles.sectionSubtitle}>
                Enter the 6-digit code sent to +92{phoneNumber}
              </Text>

              {/* OTP Code */}
              <Text style={styles.label}>OTP Code *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit OTP"
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="number-pad"
                maxLength={6}
              />

              {/* Password - MANDATORY */}
              <Text style={styles.label}>Create Password *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Enter password (min 6 characters)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Icon 
                    name={showPassword ? 'eye-off' : 'eye'} 
                    size={24} 
                    color="#6B7280" 
                  />
                </TouchableOpacity>
              </View>

              {/* Confirm Password - MANDATORY */}
              <Text style={styles.label}>Confirm Password *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Icon 
                    name={showConfirmPassword ? 'eye-off' : 'eye'} 
                    size={24} 
                    color="#6B7280" 
                  />
                </TouchableOpacity>
              </View>

              {/* Password Match Indicator */}
              {password.length > 0 && confirmPassword.length > 0 && (
                <View style={styles.passwordMatchContainer}>
                  {password === confirmPassword ? (
                    <View style={styles.matchIndicator}>
                      <Icon name="check-circle" size={16} color="#10B981" />
                      <Text style={styles.matchText}>Passwords match</Text>
                    </View>
                  ) : (
                    <View style={styles.matchIndicator}>
                      <Icon name="close-circle" size={16} color="#EF4444" />
                      <Text style={styles.noMatchText}>Passwords do not match</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Password Requirements */}
              <View style={styles.passwordRequirements}>
                <Text style={styles.requirementTitle}>Password must contain:</Text>
                <View style={styles.requirementItem}>
                  <Icon 
                    name={password.length >= 6 ? 'check-circle' : 'circle-outline'} 
                    size={16} 
                    color={password.length >= 6 ? '#10B981' : '#6B7280'} 
                  />
                  <Text style={[styles.requirementText, password.length >= 6 && styles.requirementMet]}>
                    At least 6 characters
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[
                  styles.verifySubmitButton,
                  (!otpCode || !password || password !== confirmPassword) && styles.buttonDisabled
                ]} 
                onPress={handleVerifyOTP}
                disabled={loading || !otpCode || !password || password !== confirmPassword}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.verifySubmitButtonText}>
                    Create Account
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.resendButton}
                onPress={handleSendOTP}
                disabled={loading}
              >
                <Text style={styles.resendText}>Resend OTP</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Save Button - Only shown after phone verification */}
          {phoneVerified && (
            <TouchableOpacity
              style={styles.button}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Save & Continue</Text>
              )}
            </TouchableOpacity>
          )}
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
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 4,
  },
  profileImageContainer: {
    alignSelf: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#DC2626',
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholderText: {
    fontSize: 40,
    marginBottom: 4,
  },
  profileImagePlaceholderLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f9fafb',
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
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginBottom: 16,
    backgroundColor: '#f3f4f6',
  },
  countryCode: {
    fontSize: 16,
    color: '#6B7280',
    marginRight: 8,
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#6B7280',
    paddingVertical: 10,
  },
  verifyButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 4,
  },
  verifiedText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
  verificationSection: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  verifySubmitButton: {
    backgroundColor: '#10B981',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  verifySubmitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  passwordInput: {
    flex: 1,
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
  passwordMatchContainer: {
    marginVertical: 8,
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500',
  },
  noMatchText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
  },
  passwordRequirements: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  requirementTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 6,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  requirementText: {
    fontSize: 13,
    color: '#6B7280',
  },
  requirementMet: {
    color: '#10B981',
  },
  resendButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  resendText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#dc2626',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CustomerProfileScreen;