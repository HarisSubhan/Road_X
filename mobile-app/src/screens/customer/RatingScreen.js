import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { rateBooking } from '../../store/bookingSlice';
import LinearGradient from 'react-native-linear-gradient';

const RatingScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { activeBooking } = useSelector((state) => state.booking);
  
  const booking = route.params?.booking || activeBooking;
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [review, setReview] = useState('');

  const tags = [
    { id: 'professional', emoji: '👍', label: 'Professional' },
    { id: 'fast', emoji: '⚡', label: 'Fast' },
    { id: 'polite', emoji: '💬', label: 'Polite' },
    { id: 'skilled', emoji: '🔧', label: 'Skilled' },
    { id: 'friendly', emoji: '😊', label: 'Friendly' },
    { id: 'reliable', emoji: '✅', label: 'Reliable' },
  ];

  const handleRating = (value) => {
    setRating(value);
  };

  const handleTagToggle = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    const result = await dispatch(rateBooking({
      booking_id: booking.id,
      rating,
      review: review || undefined
    }));

    if (rateBooking.fulfilled.match(result)) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'CustomerTabs' }],
      });
    }
  };

  const handleSkip = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'CustomerTabs' }],
    });
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#DC2626', '#B91C1C']} style={styles.header}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.title}>Service Completed!</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.providerCard}>
          <LinearGradient colors={['#DC2626', '#B91C1C']} style={styles.providerGradient}>
            <Text style={styles.providerEmoji}>🔧</Text>
            <Text style={styles.providerName}>Provider</Text>
            <Text style={styles.serviceName}>{booking?.category_name}</Text>
          </LinearGradient>
        </View>

        <Text style={styles.sectionTitle}>Rate your experience</Text>
        
        <View style={styles.starContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => handleRating(star)}
              onLongPress={() => handleRating(star)}
              delayLongPress={200}
            >
              <Text style={[
                styles.star,
                star <= rating && styles.starActive
              ]}>
                {star <= rating ? '⭐' : '☆'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {rating >= 4 && (
          <View style={styles.tagsSection}>
            <Text style={styles.tagsTitle}>What did you like?</Text>
            <View style={styles.tagsContainer}>
              {tags.map((tag) => (
                <TouchableOpacity
                  key={tag.id}
                  style={[
                    styles.tag,
                    selectedTags.includes(tag.id) && styles.tagActive
                  ]}
                  onPress={() => handleTagToggle(tag.id)}
                >
                  <Text style={styles.tagEmoji}>{tag.emoji}</Text>
                  <Text style={styles.tagLabel}>{tag.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>{t('rating.review')}</Text>
          <TextInput
            style={styles.reviewInput}
            placeholder="Share your experience (optional)"
            value={review}
            onChangeText={setReview}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>{t('rating.submitRating')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>{t('rating.skip')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    padding: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  emoji: {
    fontSize: 60,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    padding: 20,
  },
  providerCard: {
    marginBottom: 30,
  },
  providerGradient: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  providerEmoji: {
    fontSize: 50,
    marginBottom: 8,
  },
  providerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  star: {
    fontSize: 50,
    marginHorizontal: 8,
    color: '#D1D5DB',
  },
  starActive: {
    color: '#FBBF24',
  },
  tagsSection: {
    marginBottom: 24,
  },
  tagsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tagActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  tagEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  tagLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  reviewSection: {
    marginBottom: 24,
  },
  reviewLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
    color: '#1F2937',
  },
  submitButton: {
    backgroundColor: '#DC2626',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    padding: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 16,
  },
});

export default RatingScreen;
