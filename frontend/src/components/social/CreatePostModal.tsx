/**
 * Create Post Modal Component
 * Modal for creating new social posts with product tagging and image upload
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { useCreatePost } from '../../hooks/useOfflineMutation';
import { H2, Body, Caption } from '../ui/Typography';
import { Button } from '../ui/Button';
import { ProductSelector } from './ProductSelector';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  visible,
  onClose,
  onPostCreated,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const createPost = useCreatePost();

  const [content, setContent] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string;
    type: 'cigar' | 'beer' | 'wine';
    name: string;
  } | null>(null);
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState<any[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('public');

  const resetForm = useCallback(() => {
    setContent('');
    setSelectedProduct(null);
    setLocation('');
    setTags([]);
    setTagInput('');
    setImages([]);
    setVisibility('public');
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleAddTag = useCallback(() => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags(prev => [...prev, trimmedTag]);
      setTagInput('');
    }
  }, [tagInput, tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  }, []);

  const handlePickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled) {
        const newImages = result.assets.map(asset => ({
          url: asset.uri,
          localPath: asset.uri,
          uploaded: false,
          width: asset.width,
          height: asset.height,
        }));
        setImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  }, []);

  const handleRemoveImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content for your post.');
      return;
    }

    try {
      await createPost.mutate({
        content: content.trim(),
        images: images.length > 0 ? images : undefined,
        productId: selectedProduct?.id,
        productType: selectedProduct?.type,
        location: location.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        visibility,
      });

      onPostCreated();
      resetForm();
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    }
  }, [content, images, selectedProduct, location, tags, visibility, createPost, onPostCreated, resetForm]);

  const styles = StyleSheet.create({
    modal: {
      flex: 1,
      backgroundColor: theme.colors.onyx,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.charcoal,
    },
    headerTitle: {
      color: theme.colors.alabaster,
    },
    cancelButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    cancelText: {
      color: theme.colors.alabaster,
      fontSize: 16,
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
    },
    contentInput: {
      color: theme.colors.alabaster,
      fontSize: 16,
      lineHeight: 24,
      minHeight: 120,
      textAlignVertical: 'top',
      marginVertical: 16,
    },
    section: {
      marginVertical: 16,
    },
    sectionTitle: {
      color: theme.colors.alabaster,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
    },
    locationInput: {
      backgroundColor: theme.colors.charcoal,
      color: theme.colors.alabaster,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      fontSize: 16,
    },
    tagContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    tagInput: {
      flex: 1,
      backgroundColor: theme.colors.charcoal,
      color: theme.colors.alabaster,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      fontSize: 16,
      marginRight: 8,
    },
    addTagButton: {
      backgroundColor: theme.colors.goldLeaf,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
    },
    addTagText: {
      color: theme.colors.onyx,
      fontWeight: '600',
    },
    tagsDisplay: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tag: {
      backgroundColor: theme.colors.charcoal,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    tagText: {
      color: theme.colors.goldLeaf,
      fontSize: 14,
      marginRight: 8,
    },
    removeTagButton: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: theme.colors.alabaster,
      justifyContent: 'center',
      alignItems: 'center',
    },
    removeTagText: {
      color: theme.colors.onyx,
      fontSize: 12,
      fontWeight: '600',
    },
    imageSection: {
      marginVertical: 16,
    },
    addImageButton: {
      backgroundColor: theme.colors.charcoal,
      paddingVertical: 16,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.colors.goldLeaf,
      borderStyle: 'dashed',
    },
    addImageText: {
      color: theme.colors.goldLeaf,
      fontSize: 16,
      fontWeight: '500',
    },
    imagesPreview: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    imagePreview: {
      width: 80,
      height: 80,
      borderRadius: 8,
      position: 'relative',
    },
    removeImageButton: {
      position: 'absolute',
      top: -8,
      right: -8,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.alabaster,
      justifyContent: 'center',
      alignItems: 'center',
    },
    removeImageText: {
      color: theme.colors.onyx,
      fontSize: 16,
      fontWeight: '600',
    },
    visibilitySection: {
      marginVertical: 16,
    },
    visibilityOptions: {
      flexDirection: 'row',
      gap: 12,
    },
    visibilityOption: {
      flex: 1,
      backgroundColor: theme.colors.charcoal,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    visibilityOptionActive: {
      borderColor: theme.colors.goldLeaf,
      backgroundColor: theme.colors.goldLeaf,
    },
    visibilityText: {
      color: theme.colors.alabaster,
      fontSize: 14,
      fontWeight: '500',
    },
    visibilityTextActive: {
      color: theme.colors.onyx,
      fontWeight: '600',
    },
    footer: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.charcoal,
    },
    submitButton: {
      backgroundColor: theme.colors.goldLeaf,
    },
    submitButtonDisabled: {
      backgroundColor: theme.colors.charcoal,
      opacity: 0.6,
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modal}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Body style={styles.cancelText}>Cancel</Body>
            </TouchableOpacity>
            <H2 style={styles.headerTitle}>Create Post</H2>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Content Input */}
            <TextInput
              style={styles.contentInput}
              placeholder="Share your experience..."
              placeholderTextColor={theme.colors.alabaster + '80'}
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={2000}
            />

            {/* Product Selector */}
            <View style={styles.section}>
              <Body style={styles.sectionTitle}>Tag a Product (Optional)</Body>
              <ProductSelector
                selectedProduct={selectedProduct}
                onProductSelect={setSelectedProduct}
              />
            </View>

            {/* Location */}
            <View style={styles.section}>
              <Body style={styles.sectionTitle}>Location (Optional)</Body>
              <TextInput
                style={styles.locationInput}
                placeholder="Where are you?"
                placeholderTextColor={theme.colors.alabaster + '80'}
                value={location}
                onChangeText={setLocation}
                maxLength={100}
              />
            </View>

            {/* Tags */}
            <View style={styles.section}>
              <Body style={styles.sectionTitle}>Tags (Optional)</Body>
              <View style={styles.tagContainer}>
                <TextInput
                  style={styles.tagInput}
                  placeholder="Add a tag..."
                  placeholderTextColor={theme.colors.alabaster + '80'}
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={handleAddTag}
                  maxLength={20}
                />
                <TouchableOpacity style={styles.addTagButton} onPress={handleAddTag}>
                  <Caption style={styles.addTagText}>Add</Caption>
                </TouchableOpacity>
              </View>
              {tags.length > 0 && (
                <View style={styles.tagsDisplay}>
                  {tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Caption style={styles.tagText}>#{tag}</Caption>
                      <TouchableOpacity
                        style={styles.removeTagButton}
                        onPress={() => handleRemoveTag(tag)}
                      >
                        <Caption style={styles.removeTagText}>×</Caption>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Images */}
            <View style={styles.imageSection}>
              <Body style={styles.sectionTitle}>Photos (Optional)</Body>
              <TouchableOpacity style={styles.addImageButton} onPress={handlePickImage}>
                <Body style={styles.addImageText}>📷 Add Photos</Body>
              </TouchableOpacity>
              {images.length > 0 && (
                <View style={styles.imagesPreview}>
                  {images.map((image, index) => (
                    <View key={index} style={styles.imagePreview}>
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => handleRemoveImage(index)}
                      >
                        <Caption style={styles.removeImageText}>×</Caption>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Visibility */}
            <View style={styles.visibilitySection}>
              <Body style={styles.sectionTitle}>Who can see this?</Body>
              <View style={styles.visibilityOptions}>
                {(['public', 'friends', 'private'] as const).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.visibilityOption,
                      visibility === option && styles.visibilityOptionActive,
                    ]}
                    onPress={() => setVisibility(option)}
                  >
                    <Caption style={[
                      styles.visibilityText,
                      visibility === option && styles.visibilityTextActive,
                    ]}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </Caption>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              title="Share Post"
              onPress={handleSubmit}
              loading={createPost.loading}
              disabled={!content.trim() || createPost.loading}
              style={[
                styles.submitButton,
                (!content.trim() || createPost.loading) && styles.submitButtonDisabled,
              ]}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};
