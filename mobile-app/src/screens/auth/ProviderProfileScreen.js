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
import { updateProfile } from '../../store/authSlice';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ProviderProfileScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [name, setName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [cnic, setCnic] = useState('');
  const [vehicleType, setVehicleType] = useState('car');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);

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
    if (!name || !cnic || !vehiclePlate) {
      Alert.alert(t('error'), 'Please fill all required fields');
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
        formData.append('email', email);
        formData.append('phone_number', phoneNumber);
        formData.append('cnic', cnic);
        formData.append('vehicle_type', vehicleType);
        formData.append('vehicle_plate', vehiclePlate);
        formData.append('vehicle_make', vehicleMake);
        formData.append('vehicle_model', vehicleModel);
        formData.append('vehicle_year', vehicleYear);
        result = await dispatch(updateProfile(formData)).unwrap();
      } else {
        // No image, send as JSON
        result = await dispatch(updateProfile({
          full_name: name,
          email,
          phone_number: phoneNumber,
          cnic,
          vehicle_type: vehicleType,
          vehicle_plate: vehiclePlate,
          vehicle_make: vehicleMake,
          vehicle_model: vehicleModel,
          vehicle_year: vehicleYear
        })).unwrap();
      }
      
      Alert.alert(t('success'), 'Profile submitted successfully! Please wait for admin approval.', [
        {
          text: t('ok'),
          onPress: () => navigation.reset({
            index: 0,
            routes: [{ name: 'PendingApproval' }],
          })
        }
      ]);
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
          <Text style={styles.title}>{t('completeProfile')}</Text>
          <Text style={styles.subtitle}>Complete your provider profile to start earning</Text>
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

          <Text style={styles.label}>{t('fullName')} *</Text>
          <TextInput
            style={styles.input}
            placeholder={t('enterName')}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>{t('auth.phone')}</Text>
          <View style={styles.phoneInputContainer}>
            <Text style={styles.countryCode}>+92</Text>
            <TextInput
              style={styles.phoneInput}
              placeholder="3XXXXXXXXX"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={10}
              editable={false}
            />
          </View>

          <Text style={styles.label}>{t('email')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('enterEmail')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>{t('cnic')} *</Text>
          <TextInput
            style={styles.input}
            placeholder="XXXXX-XXXXXXX-X"
            value={cnic}
            onChangeText={(text) => setCnic(formatCNIC(text))}
            keyboardType="number-pad"
            maxLength={15}
          />

          <Text style={styles.label}>{t('vehicleType')} *</Text>
          <View style={styles.vehicleTypes}>
            {['car', 'bike', 'truck'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.vehicleType, vehicleType === type && styles.selectedVehicleType]}
                onPress={() => setVehicleType(type)}
              >
                <Text style={[styles.vehicleTypeText, vehicleType === type && styles.selectedVehicleTypeText]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{t('vehiclePlate')} *</Text>
          <TextInput
            style={styles.input}
            placeholder={t('enterPlate')}
            value={vehiclePlate}
            onChangeText={setVehiclePlate}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Vehicle Make (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Toyota, Honda"
            value={vehicleMake}
            onChangeText={setVehicleMake}
          />

          <Text style={styles.label}>Vehicle Model (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Corolla, Civic"
            value={vehicleModel}
            onChangeText={setVehicleModel}
          />

          <Text style={styles.label}>Vehicle Year (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 2020"
            value={vehicleYear}
            onChangeText={setVehicleYear}
            keyboardType="numeric"
            maxLength={4}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t('submitProfile') || 'Submit Profile'}</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.note}>Your profile will be reviewed by admin before you can start accepting requests.</Text>
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
    marginBottom: 20,
    backgroundColor: '#f9fafb',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginBottom: 20,
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
  vehicleTypes: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  vehicleType: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  selectedVehicleType: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  vehicleTypeText: {
    fontSize: 14,
    color: '#666',
  },
  selectedVehicleTypeText: {
    color: '#fff',
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
  note: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 15,
  },
});

export default ProviderProfileScreen;
