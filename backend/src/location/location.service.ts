/**
 * Location Service
 * Geolocation utilities and location-based calculations
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationInfo {
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode?: string;
  coordinates: Coordinates;
}

export interface DistanceResult {
  distance: number;
  unit: 'miles' | 'kilometers';
}

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Calculate distance between two coordinates
   */
  calculateDistance(
    point1: Coordinates,
    point2: Coordinates,
    unit: 'miles' | 'kilometers' = 'miles'
  ): number {
    const R = unit === 'miles' ? 3959 : 6371; // Earth's radius in miles or kilometers
    
    const lat1Rad = this.toRadians(point1.latitude);
    const lat2Rad = this.toRadians(point2.latitude);
    const deltaLatRad = this.toRadians(point2.latitude - point1.latitude);
    const deltaLonRad = this.toRadians(point2.longitude - point1.longitude);

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  /**
   * Get coordinates from address using geocoding
   */
  async geocodeAddress(address: string): Promise<Coordinates | null> {
    try {
      // In production, this would use Google Maps Geocoding API or similar
      // For now, we'll return mock coordinates for development
      this.logger.log(`Geocoding address: ${address}`);
      
      // Mock geocoding - in production, implement actual API call
      const mockCoordinates = this.getMockCoordinates(address);
      
      return mockCoordinates;
    } catch (error) {
      this.logger.error('Error geocoding address:', error);
      return null;
    }
  }

  /**
   * Get address from coordinates using reverse geocoding
   */
  async reverseGeocode(coordinates: Coordinates): Promise<LocationInfo | null> {
    try {
      // In production, this would use Google Maps Geocoding API or similar
      this.logger.log(`Reverse geocoding: ${coordinates.latitude}, ${coordinates.longitude}`);
      
      // Mock reverse geocoding - in production, implement actual API call
      const mockLocation = this.getMockLocationInfo(coordinates);
      
      return mockLocation;
    } catch (error) {
      this.logger.error('Error reverse geocoding coordinates:', error);
      return null;
    }
  }

  /**
   * Find locations within a radius
   */
  findLocationsWithinRadius(
    center: Coordinates,
    locations: Array<{ id: string; coordinates: Coordinates; [key: string]: any }>,
    radius: number,
    unit: 'miles' | 'kilometers' = 'miles'
  ): Array<{ id: string; distance: number; [key: string]: any }> {
    return locations
      .map(location => ({
        ...location,
        distance: this.calculateDistance(center, location.coordinates, unit),
      }))
      .filter(location => location.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
  }

  /**
   * Get bounding box for a given center point and radius
   */
  getBoundingBox(
    center: Coordinates,
    radius: number,
    unit: 'miles' | 'kilometers' = 'miles'
  ): {
    northEast: Coordinates;
    southWest: Coordinates;
  } {
    const earthRadius = unit === 'miles' ? 3959 : 6371;
    
    // Convert radius to radians
    const radiusInRadians = radius / earthRadius;
    
    const lat = this.toRadians(center.latitude);
    const lon = this.toRadians(center.longitude);
    
    const minLat = lat - radiusInRadians;
    const maxLat = lat + radiusInRadians;
    
    const deltaLon = Math.asin(Math.sin(radiusInRadians) / Math.cos(lat));
    const minLon = lon - deltaLon;
    const maxLon = lon + deltaLon;
    
    return {
      southWest: {
        latitude: this.toDegrees(minLat),
        longitude: this.toDegrees(minLon),
      },
      northEast: {
        latitude: this.toDegrees(maxLat),
        longitude: this.toDegrees(maxLon),
      },
    };
  }

  /**
   * Validate coordinates
   */
  validateCoordinates(coordinates: Coordinates): boolean {
    const { latitude, longitude } = coordinates;
    
    return (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180 &&
      !isNaN(latitude) &&
      !isNaN(longitude)
    );
  }

  /**
   * Format distance for display
   */
  formatDistance(distance: number, unit: 'miles' | 'kilometers' = 'miles'): string {
    const roundedDistance = Math.round(distance * 10) / 10;
    const unitLabel = unit === 'miles' ? 'mi' : 'km';
    
    if (roundedDistance < 0.1) {
      return `< 0.1 ${unitLabel}`;
    }
    
    return `${roundedDistance} ${unitLabel}`;
  }

  /**
   * Get user's location from IP address (for fallback)
   */
  async getLocationFromIP(ipAddress: string): Promise<Coordinates | null> {
    try {
      // In production, this would use IP geolocation service
      this.logger.log(`Getting location from IP: ${ipAddress}`);
      
      // Mock IP geolocation - return coordinates for major cities
      const mockLocation = this.getMockIPLocation(ipAddress);
      
      return mockLocation;
    } catch (error) {
      this.logger.error('Error getting location from IP:', error);
      return null;
    }
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Convert radians to degrees
   */
  private toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }

  /**
   * Get mock coordinates for development
   */
  private getMockCoordinates(address: string): Coordinates {
    const addressLower = address.toLowerCase();
    
    // Mock coordinates for common cities
    if (addressLower.includes('new york') || addressLower.includes('nyc')) {
      return { latitude: 40.7128, longitude: -74.0060 };
    } else if (addressLower.includes('los angeles') || addressLower.includes('la')) {
      return { latitude: 34.0522, longitude: -118.2437 };
    } else if (addressLower.includes('chicago')) {
      return { latitude: 41.8781, longitude: -87.6298 };
    } else if (addressLower.includes('miami')) {
      return { latitude: 25.7617, longitude: -80.1918 };
    } else if (addressLower.includes('san francisco')) {
      return { latitude: 37.7749, longitude: -122.4194 };
    } else {
      // Default to a random location in the US
      return {
        latitude: 39.8283 + (Math.random() - 0.5) * 10,
        longitude: -98.5795 + (Math.random() - 0.5) * 20,
      };
    }
  }

  /**
   * Get mock location info for development
   */
  private getMockLocationInfo(coordinates: Coordinates): LocationInfo {
    // Simple mock based on coordinates
    const { latitude, longitude } = coordinates;
    
    let city = 'Unknown City';
    let state = 'Unknown State';
    let country = 'United States';
    
    if (latitude > 40 && latitude < 41 && longitude > -75 && longitude < -73) {
      city = 'New York';
      state = 'NY';
    } else if (latitude > 33 && latitude < 35 && longitude > -119 && longitude < -117) {
      city = 'Los Angeles';
      state = 'CA';
    } else if (latitude > 41 && latitude < 42 && longitude > -88 && longitude < -87) {
      city = 'Chicago';
      state = 'IL';
    }
    
    return {
      address: `${Math.floor(Math.random() * 9999)} Main St`,
      city,
      state,
      country,
      zipCode: `${Math.floor(Math.random() * 90000) + 10000}`,
      coordinates,
    };
  }

  /**
   * Get mock IP location for development
   */
  private getMockIPLocation(ipAddress: string): Coordinates {
    // Mock IP geolocation - return different locations based on IP
    const ipHash = ipAddress.split('.').reduce((acc, octet) => acc + parseInt(octet), 0);
    
    const locations = [
      { latitude: 40.7128, longitude: -74.0060 }, // New York
      { latitude: 34.0522, longitude: -118.2437 }, // Los Angeles
      { latitude: 41.8781, longitude: -87.6298 }, // Chicago
      { latitude: 29.7604, longitude: -95.3698 }, // Houston
      { latitude: 33.4484, longitude: -112.0740 }, // Phoenix
    ];
    
    return locations[ipHash % locations.length];
  }
}
