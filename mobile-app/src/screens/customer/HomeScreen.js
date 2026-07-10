import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCategories } from '../../store/categoriesSlice';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { BlurView } from '@react-native-community/blur';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 3;

const HomeScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { list: categories, isLoading } = useSelector((state) => state.categories);
  const { searchingForProvider } = useSelector((state) => state.booking);
  const { user } = useSelector((state) => state.auth);
  
  const [greeting, setGreeting] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const headerScale = useRef(new Animated.Value(0.9)).current;
  
  // Scroll animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    dispatch(fetchCategories());
    
    // Animate entry
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(headerScale, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, [dispatch]);

  const handleCategoryPress = (category) => {
    setSelectedCategory(category);
    navigation.navigate('ServiceRequest', { category });
  };

  const renderCategory = ({ item, index }) => {
    const animationDelay = index * 60;
    const translateY = new Animated.Value(40);
    const opacity = new Animated.Value(0);
    const scale = new Animated.Value(0.8);

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        delay: animationDelay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay: animationDelay,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        delay: animationDelay,
        useNativeDriver: true,
      }),
    ]).start();

    const colors = [
      ['#FEF2F2', '#FEE2E2'],
      ['#EFF6FF', '#DBEAFE'],
      ['#F0FDF4', '#DCFCE7'],
      ['#FEFCE8', '#FEF9C3'],
      ['#FDF2F8', '#FCE7F3'],
      ['#F3E8FF', '#E9D5FF'],
    ];

    return (
      <Animated.View
        style={[
          styles.categoryWrapper,
          {
            opacity,
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.categoryCard,
            selectedCategory?.id === item.id && styles.categoryCardSelected,
          ]}
          onPress={() => handleCategoryPress(item)}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={colors[index % colors.length]}
            style={styles.iconContainer}
          >
            <Text style={styles.icon}>{item.icon_emoji}</Text>
          </LinearGradient>
          <Text style={styles.categoryName} numberOfLines={1}>
            {item.name_en}
          </Text>
          <View style={styles.fareBadge}>
            <Text style={styles.baseFare}>PKR {item.base_fare}</Text>
          </View>
          <View style={styles.cardShadow} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const FeaturedService = ({ title, subtitle, icon, color, onPress }) => (
    <TouchableOpacity style={styles.featuredCard} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={[color, color + 'CC']}
        style={styles.featuredGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.featuredContent}>
          <View style={styles.featuredIconContainer}>
            <Icon name={icon} size={24} color="white" />
          </View>
          <View style={styles.featuredTextContainer}>
            <Text style={styles.featuredTitle}>{title}</Text>
            <Text style={styles.featuredSubtitle}>{subtitle}</Text>
          </View>
          <Icon name="arrow-forward" size={20} color="white" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const QuickAction = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.quickActionIcon}>
        <Icon name={icon} size={24} color="#DC2626" />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greetingText}>{greeting} 👋</Text>
              <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Icon name="notifications-outline" size={24} color="#1F2937" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton}>
              <Image
                source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'User')}&size=40&background=DC2626&color=fff` }}
                style={styles.profileImage}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Icon name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      <Animated.ScrollView
        style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Quick Actions Grid */}
        <View style={styles.quickActionsGrid}>
          <QuickAction icon="car-outline" label="Book Ride" onPress={() => {}} />
          <QuickAction icon="time-outline" label="History" onPress={() => {}} />
          <QuickAction icon="card-outline" label="Payment" onPress={() => {}} />
          <QuickAction icon="headset-outline" label="Support" onPress={() => {}} />
        </View>

      
      

        {/* Categories Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>All Services</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{categories.length}</Text>
              </View>
            </View>
           
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#DC2626" />
              <Text style={styles.loadingText}>Loading services...</Text>
            </View>
          ) : (
            <FlatList
              data={categories}
              renderItem={renderCategory}
              keyExtractor={(item) => item.id.toString()}
              numColumns={3}
              contentContainerStyle={styles.categoriesList}
              showsVerticalScrollIndicator={false}
              columnWrapperStyle={styles.columnWrapper}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Promo Banner */}
        <LinearGradient
          colors={['#DC2626', '#B91C1C']}
          style={styles.promoBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.promoContent}>
            <View style={styles.promoTextContainer}>
              <Text style={styles.promoTitle}>Get 20% Off</Text>
              <Text style={styles.promoSubtitle}>On your first ride</Text>
              <TouchableOpacity style={styles.promoButton}>
                <Text style={styles.promoButtonText}>Claim Now</Text>
                <Icon name="arrow-forward" size={16} color="white" />
              </TouchableOpacity>
            </View>
            <View style={styles.promoIconContainer}>
              <Icon name="gift-outline" size={64} color="rgba(255,255,255,0.2)" />
            </View>
          </View>
        </LinearGradient>

        <View style={styles.footerSpacing} />
      </Animated.ScrollView>

     
      {searchingForProvider && (
        <BlurView
          style={styles.searchingOverlay}
          blurType="dark"
          blurAmount={10}
          reducedTransparencyFallbackColor="rgba(0,0,0,0.7)"
        >
          <Animated.View style={styles.searchingCard}>
            <View style={styles.searchingIconContainer}>
              <ActivityIndicator size="large" color="#DC2626" />
            </View>
            <Text style={styles.searchingText}>Finding nearby providers...</Text>
            <Text style={styles.searchingSubtext}>Please wait, we're connecting you</Text>
            <View style={styles.progressContainer}>
              <Animated.View style={[styles.progressBar, { width: '65%' }]} />
            </View>
            <TouchableOpacity style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </BlurView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 0 : 10,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  greetingContainer: {
    flexDirection: 'column',
  },
  greetingText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: 'white',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#DC2626',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    padding: 0,
    height: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 24,
    gap: 10,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionContainer: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  countBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  featuredScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  featuredCard: {
    width: width * 0.42,
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  featuredGradient: {
    padding: 16,
    height: 100,
  },
  featuredContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featuredIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredTextContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  featuredSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  categoriesList: {
    paddingBottom: 4,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  categoryWrapper: {
    width: CARD_WIDTH,
  },
  categoryCard: {
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    position: 'relative',
  },
  categoryCardSelected: {
    borderColor: '#DC2626',
    borderWidth: 2,
    elevation: 8,
    shadowColor: '#DC2626',
    shadowOpacity: 0.15,
  },
  cardShadow: {
    position: 'absolute',
    bottom: -6,
    left: '10%',
    width: '80%',
    height: 12,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 26,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  fareBadge: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  baseFare: {
    fontSize: 9,
    fontWeight: '600',
    color: '#6B7280',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  promoBanner: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  promoContent: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promoTextContainer: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  promoSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    marginBottom: 12,
  },
  promoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  promoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  promoIconContainer: {
    marginLeft: 16,
  },
  footerSpacing: {
    height: 20,
  },
  searchingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  searchingCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    paddingHorizontal: 36,
    paddingVertical: 36,
    alignItems: 'center',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    width: width * 0.8,
    alignSelf: 'center',
    top: '35%',
  },
  searchingIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  searchingText: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  searchingSubtext: {
    color: '#6B7280',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#DC2626',
    borderRadius: 2,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
});

export default HomeScreen;