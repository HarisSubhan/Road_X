import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { loadStoredAuth } from '../../store/authSlice';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

const PendingApprovalScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const bounceValue = useSharedValue(0);

  useEffect(() => {
    bounceValue.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(0, { duration: 500 })
      ),
      -1,
      true
    );

    const interval = setInterval(() => {
      dispatch(loadStoredAuth());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounceValue.value * -20 }],
  }));

  const getStatusEmoji = () => {
    if (user?.approval_status === 'pending') return '⏳';
    if (user?.approval_status === 'rejected') return '❌';
    if (user?.approval_status === 'suspended') return '⚠️';
    return '⏳';
  };

  const getStatusColor = () => {
    if (user?.approval_status === 'pending') return ['#F59E0B', '#D97706'];
    if (user?.approval_status === 'rejected') return ['#6B7280', '#4B5563'];
    if (user?.approval_status === 'suspended') return ['#EF4444', '#DC2626'];
    return ['#F59E0B', '#D97706'];
  };

  const handleLogout = async () => {
    dispatch({ type: 'auth/logout' });
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <LinearGradient colors={getStatusColor()} style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={animatedStyle}>
          <Text style={styles.emoji}>{getStatusEmoji()}</Text>
        </Animated.View>

        <Text style={styles.title}>
          {user?.approval_status === 'pending' && 'Account Pending Approval'}
          {user?.approval_status === 'rejected' && 'Account Rejected'}
          {user?.approval_status === 'suspended' && 'Account Suspended'}
        </Text>

        <Text style={styles.subtitle}>
          {user?.approval_status === 'pending' && 'Your provider account is under review. We will notify you once approved.'}
          {user?.approval_status === 'rejected' && 'Your account was rejected. Please contact support for more information.'}
          {user?.approval_status === 'suspended' && 'Your account has been suspended. Please contact support.'}
        </Text>

        {user?.rejection_reason && (
          <View style={styles.reasonBox}>
            <Text style={styles.reasonTitle}>Reason:</Text>
            <Text style={styles.reasonText}>{user.rejection_reason}</Text>
          </View>
        )}

        <View style={styles.steps}>
          <View style={styles.step}>
            <View style={styles.stepDot} />
            <Text style={styles.stepText}>Registration</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.step}>
            <View style={[styles.stepDot, styles.stepDotActive]} />
            <Text style={[styles.stepText, styles.stepTextActive]}>Document Review</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.step}>
            <View style={styles.stepDot} />
            <Text style={styles.stepText}>Approval</Text>
          </View>
        </View>

        {(user?.approval_status === 'rejected' || user?.approval_status === 'suspended') && (
          <TouchableOpacity style={styles.resubmitButton}>
            <Text style={styles.resubmitText}>Contact Support</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.9,
  },
  reasonBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    width: '100%',
  },
  reasonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 14,
    color: 'white',
  },
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  step: {
    alignItems: 'center',
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  stepDotActive: {
    backgroundColor: 'white',
  },
  stepText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
  },
  stepTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 8,
  },
  resubmitButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  resubmitText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    borderWidth: 2,
    borderColor: 'white',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PendingApprovalScreen;
