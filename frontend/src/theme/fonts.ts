/**
 * Font Configuration for Inked Draw
 * Handles loading and configuration of custom fonts (Lora and Inter)
 */

import { Platform } from 'react-native';

// Font family mappings for different platforms
export const fontFamilies = {
  heading: Platform.select({
    ios: 'Lora',
    android: 'Lora-Regular',
    default: 'Lora',
  }),
  body: Platform.select({
    ios: 'Inter',
    android: 'Inter-Regular',
    default: 'Inter',
  }),
} as const;

// Font weights mapping for Inter
export const interWeights = {
  normal: Platform.select({
    ios: 'Inter',
    android: 'Inter-Regular',
    default: 'Inter',
  }),
  medium: Platform.select({
    ios: 'Inter-Medium',
    android: 'Inter-Medium',
    default: 'Inter-Medium',
  }),
  semibold: Platform.select({
    ios: 'Inter-SemiBold',
    android: 'Inter-SemiBold',
    default: 'Inter-SemiBold',
  }),
  bold: Platform.select({
    ios: 'Inter-Bold',
    android: 'Inter-Bold',
    default: 'Inter-Bold',
  }),
} as const;

// Font weights mapping for Lora
export const loraWeights = {
  normal: Platform.select({
    ios: 'Lora',
    android: 'Lora-Regular',
    default: 'Lora',
  }),
  medium: Platform.select({
    ios: 'Lora-Medium',
    android: 'Lora-Medium',
    default: 'Lora-Medium',
  }),
  semibold: Platform.select({
    ios: 'Lora-SemiBold',
    android: 'Lora-SemiBold',
    default: 'Lora-SemiBold',
  }),
  bold: Platform.select({
    ios: 'Lora-Bold',
    android: 'Lora-Bold',
    default: 'Lora-Bold',
  }),
} as const;

// Helper function to get the correct font family with weight
export const getFontFamily = (
  type: 'heading' | 'body',
  weight: 'normal' | 'medium' | 'semibold' | 'bold' = 'normal'
): string => {
  if (type === 'heading') {
    return loraWeights[weight];
  } else {
    return interWeights[weight];
  }
};

// Font loading configuration for expo-font
export const fontAssets = {
  // Lora fonts
  'Lora-Regular': require('../../assets/fonts/Lora-Regular.ttf'),
  'Lora-Medium': require('../../assets/fonts/Lora-Medium.ttf'),
  'Lora-SemiBold': require('../../assets/fonts/Lora-SemiBold.ttf'),
  'Lora-Bold': require('../../assets/fonts/Lora-Bold.ttf'),
  
  // Inter fonts
  'Inter-Regular': require('../../assets/fonts/Inter-Regular.ttf'),
  'Inter-Medium': require('../../assets/fonts/Inter-Medium.ttf'),
  'Inter-SemiBold': require('../../assets/fonts/Inter-SemiBold.ttf'),
  'Inter-Bold': require('../../assets/fonts/Inter-Bold.ttf'),
};
