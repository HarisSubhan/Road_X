import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { loadStoredAuth } from '../store/authSlice';
import { fetchCategories } from '../store/categoriesSlice';
import { connectSocket, disconnectSocket } from '../services/socketService';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Auth Screens
import SplashScreen from '../screens/auth/SplashScreen';
import LanguageSelectScreen from '../screens/auth/LanguageSelectScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import RoleSelectScreen from '../screens/auth/RoleSelectScreen';
import CustomerProfileScreen from '../screens/auth/CustomerProfileScreen';
import PendingApprovalScreen from '../screens/auth/PendingApprovalScreen';

// Customer Screens
import HomeScreen from '../screens/customer/HomeScreen';
import ServiceRequestScreen from '../screens/customer/ServiceRequestScreen';
import LiveTrackingScreen from '../screens/customer/LiveTrackingScreen';
import PaymentScreen from '../screens/customer/PaymentScreen';
import RatingScreen from '../screens/customer/RatingScreen';
import OrderHistoryScreen from '../screens/customer/OrderHistoryScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';

// Provider Screens
import ProviderRegistrationScreen from '../screens/provider/ProviderRegistrationScreen';
import ProviderHomeScreen from '../screens/provider/ProviderHomeScreen';
import IncomingRequestScreen from '../screens/provider/IncomingRequestScreen';
import ActiveJobScreen from '../screens/provider/ActiveJobScreen';
import EarningsScreen from '../screens/provider/EarningsScreen';
import ProviderOrderHistoryScreen from '../screens/provider/ProviderOrderHistoryScreen';
import ProviderProfileScreen from '../screens/provider/ProviderProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const CustomerTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'History') iconName = 'history';
          else if (route.name === 'Profile') iconName = 'account';
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#DC2626',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Tab.Screen name="History" component={OrderHistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const ProviderTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'ProviderHome') iconName = 'home';
          else if (route.name === 'Earnings') iconName = 'cash';
          else if (route.name === 'ProviderHistory') iconName = 'history';
          else if (route.name === 'ProviderProfile') iconName = 'account';
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#DC2626',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="ProviderHome" component={ProviderHomeScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Earnings" component={EarningsScreen} />
      <Tab.Screen name="ProviderHistory" component={ProviderOrderHistoryScreen} />
      <Tab.Screen name="ProviderProfile" component={ProviderProfileScreen} />
    </Tab.Navigator>
  );
};

const AppNavigator = ({ navigationRef }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, isBootstrapping, user, token } = useSelector((state) => state.auth);
  const hasNavigated = useRef(false);

  useEffect(() => {
    dispatch(loadStoredAuth());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && token) {
      connectSocket(token);
      dispatch(fetchCategories());
    }
    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, token, dispatch]);

  // Navigate when auth state changes
  useEffect(() => {
    if (!isBootstrapping && !hasNavigated.current) {
      if (isAuthenticated && user) {
        hasNavigated.current = true;
        // Let the conditional rendering handle navigation
        // The Stack.Navigator will automatically show the right screen
      }
    }
  }, [isAuthenticated, user, isBootstrapping]);

  if (isBootstrapping) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
      </Stack.Navigator>
    );
  }

  // Determine which screen to show first
  const getInitialRoute = () => {
    if (isAuthenticated && user) {
      if (user.role === 'customer') return 'CustomerTabs';
      if (user.role === 'provider') {
        return user.approval_status === 'pending' ? 'PendingApproval' : 'ProviderTabs';
      }
    }
    return 'Splash';
  };

  // Force navigator to remount when auth state changes
  const navigatorKey = isAuthenticated ? 'authenticated' : 'guest';
  
  return (
    <Stack.Navigator 
      key={navigatorKey}
      screenOptions={{ headerShown: false }}
      initialRouteName={getInitialRoute()}
    >
      {/* Auth Screens */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="LanguageSelect" component={LanguageSelectScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
      <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
      <Stack.Screen name="CustomerProfile" component={CustomerProfileScreen} />
      <Stack.Screen name="ProviderProfile" component={ProviderProfileScreen} />
      <Stack.Screen name="ProviderRegistration" component={ProviderRegistrationScreen} />
      <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
      
      {/* Customer Screens */}
      <Stack.Screen name="CustomerTabs" component={CustomerTabNavigator} />
      <Stack.Screen name="ServiceRequest" component={ServiceRequestScreen} />
      <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="Rating" component={RatingScreen} />
      
      {/* Provider Screens */}
      <Stack.Screen name="ProviderTabs" component={ProviderTabNavigator} />
      <Stack.Screen name="IncomingRequest" component={IncomingRequestScreen} />
      <Stack.Screen name="ActiveJob" component={ActiveJobScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;