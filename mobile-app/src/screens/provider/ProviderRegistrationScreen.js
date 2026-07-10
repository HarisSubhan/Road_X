import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { launchImageLibrary } from 'react-native-image-picker';
import { providersAPI, storeAuthData, authAPI } from '../../services/api';
import { updateUser, updateProfile } from '../../store/authSlice';

const OTP_EXPIRY_SECONDS = 300; // 5 minutes

const ProviderRegistrationScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const timerRef = useRef(null);
  
  // Step 1: Personal Info
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [userPhoneNumber, setUserPhoneNumber] = useState('');
  const [cnicNumber, setCnicNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Step 2: Service & Vehicle
  const [categoryId, setCategoryId] = useState(null);
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  
  // Step 3: Documents
  const [documents, setDocuments] = useState({
    cnic_front: null,
    cnic_back: null,
    license: null
  });

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // OTP Timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      timerRef.current = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [otpSent]);

  // ============ OTP HANDLERS ============
  const handleSendOTP = async () => {
    if (!userPhoneNumber || userPhoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    
    setOtpLoading(true);
    try {
      const response = await authAPI.sendOTP(userPhoneNumber);
      setOtpSent(true);
      setOtpTimer(OTP_EXPIRY_SECONDS);
      Alert.alert('OTP Sent', 'A verification code has been sent to your phone');
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to send OTP';
      Alert.alert('Error', errorMessage);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length < 4) {
      Alert.alert('Error', 'Please enter the OTP code');
      return;
    }
    
    setOtpLoading(true);
    try {
      // Use verify-otp-only endpoint that just verifies OTP without creating user
      await authAPI.verifyOTPOnly(userPhoneNumber, otpCode);
      setOtpVerified(true);
      Alert.alert('Success', 'Phone number verified');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Invalid OTP code';
      Alert.alert('Error', errorMessage);
    } finally {
      setOtpLoading(false);
    }
  };

  const formatCNIC = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 5) {
      return cleaned;
    }
    if (cleaned.length <= 12) {
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    }
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12, 13)}`;
  };

  const handleNext = () => {
    if (step === 1) {
      if (!userPhoneNumber || !fullName || !cnicNumber || !password) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
      if (!otpVerified) {
        Alert.alert('Error', 'Please verify your phone number first');
        return;
      }
    }
    if (step === 2 && !categoryId) {
      Alert.alert('Error', 'Please select a service category');
      return;
    }
    if (step === 3) {
      handleSubmit();
    } else {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      console.log('Starting provider registration...');
      console.log('Phone:', userPhoneNumber);
      console.log('Name:', fullName);
      console.log('CNIC:', cnicNumber);
      
      // Register as provider (creates user account if doesn't exist)
      const response = await providersAPI.register({
        phone_number: userPhoneNumber,
        full_name: fullName,
        cnic_number: cnicNumber,
        password: password,
        service_category_id: categoryId,
        vehicle_make: vehicleMake,
        vehicle_model: vehicleModel,
        vehicle_year: vehicleYear,
        vehicle_plate: vehiclePlate
      });
      
      console.log('Registration response:', response.data);
      
      // Store auth tokens (user is now logged in)
      if (response.data.access_token) {
        await storeAuthData(
          response.data.access_token,
          response.data.refresh_token,
          response.data.provider
        );
      }
      
      // Upload documents if selected
      if (Object.values(documents).some(doc => doc)) {
        const formData = new FormData();
        Object.entries(documents).forEach(([key, value]) => {
          if (value) {
            formData.append(key, {
              uri: value.uri,
              type: value.type,
              name: value.name
            });
          }
        });
        await providersAPI.uploadDocuments(formData);
      }
      
      dispatch(updateUser({ approval_status: 'pending' }));
      navigation.reset({
        index: 0,
        routes: [{ name: 'PendingApproval' }],
      });
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      
      // Show detailed error message
      let errorMessage = 'Failed to register as provider';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Registration Failed', errorMessage);
      // Stay on screen - don't navigate away
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentPick = async (documentType) => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
      });

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setDocuments({
          ...documents,
          [documentType]: {
            uri: asset.uri,
            type: asset.type,
            name: asset.fileName || `document_${Date.now()}.jpg`
          }
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      
      {/* Phone Number with OTP */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Phone Number</Text>
        <View style={styles.phoneRow}>
          <TextInput
            style={[styles.input, styles.phoneInput]}
            value={userPhoneNumber}
            onChangeText={setUserPhoneNumber}
            placeholder="03XXXXXXXXX"
            keyboardType="phone-pad"
            editable={!otpSent}
          />
          {!otpSent ? (
            <TouchableOpacity
              style={styles.otpButton}
              onPress={handleSendOTP}
              disabled={otpLoading}
            >
              {otpLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.otpButtonText}>Send OTP</Text>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* OTP Verification */}
      {otpSent && !otpVerified && (
        <View style={styles.otpContainer}>
          <Text style={styles.fieldLabel}>Enter OTP Code</Text>
          <View style={styles.phoneRow}>
            <TextInput
              style={[styles.input, styles.otpInput]}
              value={otpCode}
              onChangeText={setOtpCode}
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
            />
            <TouchableOpacity
              style={[styles.otpButton, otpLoading && styles.buttonDisabled]}
              onPress={handleVerifyOTP}
              disabled={otpLoading}
            >
              {otpLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.otpButtonText}>Verify</Text>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.otpActions}>
            {otpTimer > 0 ? (
              <Text style={styles.timerText}>Resend in {otpTimer}s</Text>
            ) : (
              <TouchableOpacity onPress={handleSendOTP}>
                <Text style={styles.resendText}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Verified Badge */}
      {otpVerified && (
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>✓ Phone Verified</Text>
        </View>
      )}

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter your full name"
        />
      </View>
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>CNIC Number</Text>
        <TextInput
          style={styles.input}
          value={cnicNumber}
          onChangeText={(text) => setCnicNumber(formatCNIC(text))}
          placeholder="XXXXX-XXXXXXX-X"
          maxLength={15}
          keyboardType="numeric"
        />
      </View>
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Create password (min 6 characters)"
          secureTextEntry
        />
      </View>
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm password"
          secureTextEntry
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Service & Vehicle</Text>
      <Text style={styles.fieldLabel}>Select Service Category</Text>
      <View style={styles.categoryGrid}>
        {['Fuel Delivery', 'Car Towing', 'Bike Mechanic', 'Car Mechanic', 'Battery Jumpstart', 'Tire Change', 'Key Unlock'].map((cat, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.categoryOption, categoryId === index + 1 && styles.categoryOptionActive]}
            onPress={() => setCategoryId(index + 1)}
          >
            <Text style={styles.categoryEmoji}>⛽</Text>
            <Text style={styles.categoryName}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Vehicle Make (Optional)</Text>
        <TextInput
          style={styles.input}
          value={vehicleMake}
          onChangeText={setVehicleMake}
          placeholder="e.g., Toyota, Honda"
        />
      </View>
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Vehicle Model (Optional)</Text>
        <TextInput
          style={styles.input}
          value={vehicleModel}
          onChangeText={setVehicleModel}
          placeholder="e.g., Corolla, Civic"
        />
      </View>
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Vehicle Year (Optional)</Text>
        <TextInput
          style={styles.input}
          value={vehicleYear}
          onChangeText={setVehicleYear}
          placeholder="e.g., 2020"
          keyboardType="numeric"
          maxLength={4}
        />
      </View>
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Vehicle Plate (Optional)</Text>
        <TextInput
          style={styles.input}
          value={vehiclePlate}
          onChangeText={setVehiclePlate}
          placeholder="e.g., ABC-1234"
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Upload Documents</Text>
      <Text style={styles.stepSubtitle}>Upload CNIC and license photos</Text>
      
      {['cnic_front', 'cnic_back', 'license'].map((doc) => (
        <TouchableOpacity
          key={doc}
          style={styles.documentCard}
          onPress={() => handleDocumentPick(doc)}
        >
          {documents[doc] ? (
            <Image source={{ uri: documents[doc].uri }} style={styles.documentPreview} />
          ) : (
            <Text style={styles.documentIcon}>📷</Text>
          )}
          <Text style={styles.documentLabel}>
            {doc.replace('_', ' ').charAt(0).toUpperCase() + doc.replace('_', ' ').slice(1)}
          </Text>
          <Text style={styles.documentStatus}>
            {documents[doc] ? '✓ Tap to change' : 'Tap to upload'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.progress}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={[styles.progressDot, s <= step && styles.progressDotActive]} />
        ))}
      </View>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}

      <View style={styles.buttonContainer}>
        {step > 1 && (
          <TouchableOpacity
            style={[styles.button, styles.backButton]}
            onPress={() => setStep(step - 1)}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Submitting...' : step === 3 ? 'Submit' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    gap: 12,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  progressDotActive: {
    backgroundColor: '#DC2626',
  },
  stepContent: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6B7280',
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
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: 'white',
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 10,
  },
  phoneInput: {
    flex: 1,
  },
  otpInput: {
    flex: 1,
  },
  otpButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
  },
  otpButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  otpContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  otpActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  timerText: {
    color: '#6B7280',
    fontSize: 14,
  },
  resendText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  verifiedText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: 'bold',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  categoryOption: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryOptionActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  documentCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  documentPreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  documentIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  documentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  documentStatus: {
    fontSize: 14,
    color: '#6B7280',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 30,
  },
  button: {
    flex: 1,
    backgroundColor: '#DC2626',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#E5E7EB',
  },
  backButtonText: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProviderRegistrationScreen;