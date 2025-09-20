/**
 * Rating Modal Component
 * Modal for creating and editing product ratings/reviews
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { H2, Body, Caption } from '../ui/Typography';
import { Button } from '../ui/Button';
import { StarRating } from '../ui/StarRating';
import { ImagePicker } from '../ui/ImagePicker';
import { FlavorNotesSelector } from './FlavorNotesSelector';

interface RatingModalProps {
  visible: boolean;
  product: any;
  productType: 'cigar' | 'beer' | 'wine';
  existingRating?: any;
  onSubmit: (ratingData: any) => Promise<void>;
  onClose: () => void;
  loading?: boolean;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  visible,
  product,
  productType,
  existingRating,
  onSubmit,
  onClose,
  loading = false,
}) => {
  const theme = useTheme();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [flavorNotes, setFlavorNotes] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [specificRatings, setSpecificRatings] = useState<Record<string, number>>({});

  // Initialize form with existing rating data
  useEffect(() => {
    if (existingRating) {
      setRating(existingRating.rating || 0);
      setReview(existingRating.review || '');
      setFlavorNotes(existingRating.flavorNotes || []);
      setImages(existingRating.images || []);
      setSpecificRatings(existingRating.specificRatings || {});
    } else {
      // Reset form
      setRating(0);
      setReview('');
      setFlavorNotes([]);
      setImages([]);
      setSpecificRatings({});
    }
  }, [existingRating, visible]);

  const handleSubmit = useCallback(async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    if (review.trim().length < 10) {
      Alert.alert('Review Too Short', 'Please write at least 10 characters for your review.');
      return;
    }

    try {
      await onSubmit({
        rating,
        review: review.trim(),
        flavorNotes,
        images,
        specificRatings,
      });
    } catch (error) {
      // Error handling is done in parent component
    }
  }, [rating, review, flavorNotes, images, specificRatings, onSubmit]);

  const handleSpecificRatingChange = useCallback((category: string, value: number) => {
    setSpecificRatings(prev => ({
      ...prev,
      [category]: value,
    }));
  }, []);

  const getSpecificRatingCategories = () => {
    switch (productType) {
      case 'cigar':
        return [
          { key: 'construction', label: 'Construction' },
          { key: 'burn', label: 'Burn Quality' },
          { key: 'draw', label: 'Draw' },
          { key: 'flavor', label: 'Flavor Complexity' },
        ];
      case 'beer':
        return [
          { key: 'appearance', label: 'Appearance' },
          { key: 'aroma', label: 'Aroma' },
          { key: 'taste', label: 'Taste' },
          { key: 'mouthfeel', label: 'Mouthfeel' },
        ];
      case 'wine':
        return [
          { key: 'appearance', label: 'Appearance' },
          { key: 'aroma', label: 'Aroma' },
          { key: 'taste', label: 'Taste' },
          { key: 'finish', label: 'Finish' },
        ];
      default:
        return [];
    }
  };

  const styles = StyleSheet.create({
    modal: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.9)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: theme.colors.onyx,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '90%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.charcoal,
    },
    title: {
      color: theme.colors.alabaster,
    },
    closeButton: {
      padding: 8,
    },
    closeButtonText: {
      color: theme.colors.alabaster,
      fontSize: 16,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    section: {
      marginVertical: 16,
    },
    sectionTitle: {
      color: theme.colors.alabaster,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
    },
    ratingContainer: {
      alignItems: 'center',
      paddingVertical: 16,
    },
    ratingValue: {
      color: theme.colors.alabaster,
      fontSize: 24,
      fontWeight: '600',
      marginTop: 8,
    },
    reviewInput: {
      backgroundColor: theme.colors.charcoal,
      color: theme.colors.alabaster,
      borderRadius: 8,
      padding: 16,
      fontSize: 16,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    characterCount: {
      color: theme.colors.alabaster,
      opacity: 0.7,
      fontSize: 12,
      textAlign: 'right',
      marginTop: 4,
    },
    specificRatingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    specificRatingLabel: {
      color: theme.colors.alabaster,
      fontSize: 14,
      flex: 1,
    },
    footer: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.charcoal,
    },
    submitButton: {
      marginBottom: 8,
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.modal}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <H2 style={styles.title}>
              {existingRating ? 'Update Review' : 'Write Review'}
            </H2>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Body style={styles.closeButtonText}>✕</Body>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Overall Rating */}
            <View style={styles.section}>
              <Body style={styles.sectionTitle}>Overall Rating</Body>
              <View style={styles.ratingContainer}>
                <StarRating
                  rating={rating}
                  size={32}
                  color={theme.colors.goldLeaf}
                  interactive
                  onRatingChange={setRating}
                />
                <Body style={styles.ratingValue}>
                  {rating > 0 ? `${rating}.0` : 'Tap to rate'}
                </Body>
              </View>
            </View>

            {/* Specific Ratings */}
            <View style={styles.section}>
              <Body style={styles.sectionTitle}>Detailed Ratings</Body>
              {getSpecificRatingCategories().map((category) => (
                <View key={category.key} style={styles.specificRatingItem}>
                  <Body style={styles.specificRatingLabel}>
                    {category.label}
                  </Body>
                  <StarRating
                    rating={specificRatings[category.key] || 0}
                    size={16}
                    color={theme.colors.goldLeaf}
                    interactive
                    onRatingChange={(value) => handleSpecificRatingChange(category.key, value)}
                  />
                </View>
              ))}
            </View>

            {/* Review Text */}
            <View style={styles.section}>
              <Body style={styles.sectionTitle}>Your Review</Body>
              <TextInput
                style={styles.reviewInput}
                placeholder={`Share your experience with this ${productType}...`}
                placeholderTextColor={theme.colors.alabaster + '60'}
                value={review}
                onChangeText={setReview}
                multiline
                maxLength={1000}
              />
              <Caption style={styles.characterCount}>
                {review.length}/1000 characters
              </Caption>
            </View>

            {/* Flavor Notes */}
            <View style={styles.section}>
              <Body style={styles.sectionTitle}>Flavor Notes</Body>
              <FlavorNotesSelector
                productType={productType}
                selectedNotes={flavorNotes}
                onNotesChange={setFlavorNotes}
              />
            </View>

            {/* Images */}
            <View style={styles.section}>
              <Body style={styles.sectionTitle}>Photos (Optional)</Body>
              <ImagePicker
                images={images}
                onImagesChange={setImages}
                maxImages={3}
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              title={existingRating ? 'Update Review' : 'Post Review'}
              onPress={handleSubmit}
              loading={loading}
              disabled={rating === 0 || review.trim().length < 10}
              style={styles.submitButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};
