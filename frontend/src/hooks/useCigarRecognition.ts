/**
 * Cigar Recognition Hook
 * React hook for cigar image recognition and smoke shop discovery
 */

import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface CigarRecognitionData {
  brand?: string;
  model?: string;
  size?: string;
  wrapper?: string;
  confidence: number;
  extractedText: string[];
  detectedLabels: string[];
  matchedProducts: Array<{
    id: string;
    name: string;
    brand: string;
    confidence: number;
    similarity: number;
  }>;
}

export interface SmokeShop {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  email?: string;
  hours?: {
    [day: string]: string;
  };
  specialties: string[];
  brands: string[];
  rating: number;
  reviewCount: number;
  distance?: number;
  hasProduct?: boolean;
  productAvailability?: {
    inStock: boolean;
    price?: number;
    lastUpdated: Date;
  };
}

export interface CigarRecognitionResult {
  recognition: CigarRecognitionData;
  nearbyShops: SmokeShop[];
  searchLocation: {
    latitude: number;
    longitude: number;
  } | null;
  searchRadius: number;
  timestamp: Date;
}

export interface RecognizeCigarParams {
  imageUrl: string;
  userLatitude?: number;
  userLongitude?: number;
  searchRadius?: number;
}

export interface FindNearbyShopsParams {
  latitude: number;
  longitude: number;
  radius?: number;
  productId?: string;
  productType?: 'cigar' | 'beer' | 'wine';
  brand?: string;
  limit?: number;
  sortBy?: 'distance' | 'rating' | 'availability';
}

export interface ShopSearchResult {
  shops: SmokeShop[];
  totalCount: number;
  searchRadius: number;
  searchLocation: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Hook for cigar recognition functionality
 */
export const useCigarRecognition = () => {
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [lastResult, setLastResult] = useState<CigarRecognitionResult | null>(null);

  // Recognize cigar from image
  const recognizeCigarMutation = useMutation({
    mutationFn: async (params: RecognizeCigarParams): Promise<CigarRecognitionResult> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/vision/recognize-cigar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to recognize cigar');
      }

      return response.json();
    },
    onMutate: () => {
      setIsRecognizing(true);
    },
    onSuccess: (result) => {
      setLastResult(result);
      setIsRecognizing(false);
    },
    onError: () => {
      setIsRecognizing(false);
    },
  });

  // Find nearby smoke shops
  const findNearbyShopsMutation = useMutation({
    mutationFn: async (params: FindNearbyShopsParams): Promise<ShopSearchResult> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/location/nearby-shops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to find nearby shops');
      }

      return response.json();
    },
  });

  // Get shops that carry a specific product
  const getShopsWithProduct = useCallback(async (
    productId: string,
    productType: 'cigar' | 'beer' | 'wine',
    latitude: number,
    longitude: number,
    radius: number = 25
  ): Promise<SmokeShop[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Authentication required');
    }

    const params = new URLSearchParams({
      productType,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius: radius.toString(),
    });

    const response = await fetch(`/api/location/shops-with-product/${productId}?${params}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to find shops with product');
    }

    const result = await response.json();
    return result.shops;
  }, []);

  // Get shops that carry a specific brand
  const getShopsWithBrand = useCallback(async (
    brand: string,
    latitude: number,
    longitude: number,
    radius: number = 25
  ): Promise<SmokeShop[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Authentication required');
    }

    const params = new URLSearchParams({
      brand,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius: radius.toString(),
    });

    const response = await fetch(`/api/location/shops-with-brand?${params}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to find shops with brand');
    }

    const result = await response.json();
    return result.shops;
  }, []);

  // Get popular shops in an area
  const getPopularShops = useCallback(async (
    latitude: number,
    longitude: number,
    radius: number = 50,
    limit: number = 10
  ): Promise<SmokeShop[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Authentication required');
    }

    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius: radius.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(`/api/location/popular-shops?${params}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to find popular shops');
    }

    const result = await response.json();
    return result.shops;
  }, []);

  // Get shop details
  const getShopDetails = useCallback(async (shopId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`/api/location/shops/${shopId}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get shop details');
    }

    return response.json();
  }, []);

  // Recognize cigar and find shops
  const recognizeCigar = useCallback(async (params: RecognizeCigarParams) => {
    return recognizeCigarMutation.mutateAsync(params);
  }, [recognizeCigarMutation]);

  // Find nearby shops
  const findNearbyShops = useCallback(async (params: FindNearbyShopsParams) => {
    return findNearbyShopsMutation.mutateAsync(params);
  }, [findNearbyShopsMutation]);

  // Clear last result
  const clearResult = useCallback(() => {
    setLastResult(null);
  }, []);

  return {
    // State
    isRecognizing,
    lastResult,
    
    // Actions
    recognizeCigar,
    findNearbyShops,
    getShopsWithProduct,
    getShopsWithBrand,
    getPopularShops,
    getShopDetails,
    clearResult,
    
    // Mutation states
    isRecognizingCigar: recognizeCigarMutation.isPending,
    recognitionError: recognizeCigarMutation.error,
    isFindingShops: findNearbyShopsMutation.isPending,
    shopsError: findNearbyShopsMutation.error,
  };
};

/**
 * Hook for vision API status
 */
export const useVisionStatus = () => {
  return useQuery({
    queryKey: ['vision-status'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/vision/status', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get vision status');
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

/**
 * Hook for location services
 */
export const useLocationServices = () => {
  // Geocode address to coordinates
  const geocodeAddress = useCallback(async (address: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch('/api/location/geocode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ address }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to geocode address');
    }

    return response.json();
  }, []);

  // Calculate distance between two points
  const calculateDistance = useCallback(async (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
    unit: 'miles' | 'kilometers' = 'miles'
  ) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Authentication required');
    }

    const params = new URLSearchParams({
      lat1: lat1.toString(),
      lon1: lon1.toString(),
      lat2: lat2.toString(),
      lon2: lon2.toString(),
      unit,
    });

    const response = await fetch(`/api/location/distance?${params}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to calculate distance');
    }

    return response.json();
  }, []);

  return {
    geocodeAddress,
    calculateDistance,
  };
};
