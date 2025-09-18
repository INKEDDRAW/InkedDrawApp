import { Alert } from 'react-native';
import AuthService from './AuthService';

const API_BASE_URL = 'http://localhost:3000/api/v1'; // Update this for production

class ImageProcessingService {
  constructor() {
    this.maxImageSize = 2 * 1024 * 1024; // 2MB max file size
    this.maxDimension = 1920; // Max width/height
    this.compressionQuality = 0.8; // JPEG quality
  }

  /**
   * Process and upload image to scanner endpoint
   * @param {string} imagePath - Path to the captured image
   * @param {string} scanType - Type of scan: 'cigar', 'wine', or 'beer'
   * @returns {Promise<Object>} Scan result from API
   */
  async processAndUploadImage(imagePath, scanType = 'cigar') {
    try {
      // Step 1: Prepare the image for upload
      const processedImage = await this.prepareImageForUpload(imagePath);

      if (!processedImage.success) {
        throw new Error(processedImage.error);
      }

      // Step 2: Upload to scanner API
      const scanResult = await this.uploadToScanner(processedImage.imageData, scanType);

      return {
        success: true,
        result: scanResult,
      };
    } catch (error) {
      console.error('Error processing and uploading image:', error);
      return {
        success: false,
        error: error.message || 'Failed to process image',
      };
    }
  }

  /**
   * Scan image and add directly to collection in one step
   * @param {string} imagePath - Path to the captured image
   * @param {string} collectionId - ID of the collection to add to
   * @param {string} scanType - Type of scan: 'cigar', 'wine', or 'beer'
   * @returns {Promise<Object>} Combined scan result and collection item
   */
  async scanAndAddToCollection(imagePath, collectionId, scanType = 'cigar') {
    try {
      // Step 1: Prepare the image for upload
      const processedImage = await this.prepareImageForUpload(imagePath);

      if (!processedImage.success) {
        throw new Error(processedImage.error);
      }

      // Step 2: Upload to scan-and-add endpoint
      const result = await this.uploadToScanAndAdd(processedImage.imageData, collectionId, scanType);

      return {
        success: true,
        result: result,
      };
    } catch (error) {
      console.error('Error scanning and adding to collection:', error);
      return {
        success: false,
        error: error.message || 'Failed to scan and add to collection',
      };
    }
  }

  /**
   * Prepare image for upload (compression, format conversion)
   * @param {string} imagePath - Path to the image file
   * @returns {Promise<Object>} Processed image data
   */
  async prepareImageForUpload(imagePath) {
    try {
      // For React Native, we'll use the image path directly
      // In a real implementation, you might want to:
      // 1. Resize the image if it's too large
      // 2. Compress the image to reduce file size
      // 3. Convert to optimal format for API

      // Basic validation
      if (!imagePath) {
        throw new Error('Image path is required');
      }

      // Create form data compatible object
      const imageData = {
        uri: imagePath,
        type: 'image/jpeg',
        name: `scan_${Date.now()}.jpg`,
      };

      return {
        success: true,
        imageData,
      };
    } catch (error) {
      console.error('Error preparing image:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Upload image to scanner API endpoint
   * @param {Object} imageData - Processed image data
   * @param {string} scanType - Type of scan: 'cigar', 'wine', or 'beer'
   * @returns {Promise<Object>} API response
   */
  async uploadToScanner(imageData, scanType) {
    try {
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('image', imageData);

      // Determine the correct endpoint
      const endpoint = this.getScannerEndpoint(scanType);
      
      // Make authenticated request
      const response = await AuthService.authenticatedRequest(endpoint, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error uploading to scanner:', error);
      throw error;
    }
  }

  /**
   * Upload image to scan-and-add API endpoint
   * @param {Object} imageData - Processed image data
   * @param {string} collectionId - ID of the collection to add to
   * @param {string} scanType - Type of scan: 'cigar', 'wine', or 'beer'
   * @returns {Promise<Object>} API response with scan result and collection item
   */
  async uploadToScanAndAdd(imageData, collectionId, scanType) {
    try {
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('image', imageData);

      // Use the scan-and-add endpoint
      const endpoint = `/scanner/scan-and-add/${collectionId}`;

      // Make authenticated request
      const response = await AuthService.authenticatedRequest(endpoint, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error uploading to scan-and-add:', error);
      throw error;
    }
  }

  /**
   * Get the appropriate scanner endpoint for the scan type
   * @param {string} scanType - Type of scan
   * @returns {string} API endpoint path
   */
  getScannerEndpoint(scanType) {
    const endpoints = {
      cigar: '/scanner/identify-cigar',
      wine: '/scanner/identify-wine',
      beer: '/scanner/identify-beer',
    };

    const endpoint = endpoints[scanType];
    if (!endpoint) {
      throw new Error(`Unsupported scan type: ${scanType}`);
    }

    return endpoint;
  }

  /**
   * Validate image before processing
   * @param {string} imagePath - Path to the image
   * @returns {Promise<Object>} Validation result
   */
  async validateImage(imagePath) {
    try {
      // Basic path validation
      if (!imagePath || typeof imagePath !== 'string') {
        return {
          valid: false,
          error: 'Invalid image path',
        };
      }

      // Check if path looks like a valid file URI
      if (!imagePath.startsWith('file://') && !imagePath.startsWith('/')) {
        return {
          valid: false,
          error: 'Invalid image file format',
        };
      }

      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  /**
   * Handle scan result and provide user feedback
   * @param {Object} scanResult - Result from scanner API
   * @returns {Object} Formatted result for UI
   */
  formatScanResult(scanResult) {
    if (!scanResult) {
      return {
        success: false,
        message: 'No scan result received',
      };
    }

    const { name, brand, confidence, description, type } = scanResult;
    
    // Determine confidence level for user feedback
    let confidenceLevel = 'low';
    let confidenceMessage = 'Low confidence - please try again with better lighting';
    
    if (confidence >= 0.8) {
      confidenceLevel = 'high';
      confidenceMessage = 'High confidence match';
    } else if (confidence >= 0.6) {
      confidenceLevel = 'medium';
      confidenceMessage = 'Good match found';
    }

    return {
      success: true,
      data: {
        id: scanResult.id,
        type,
        name,
        brand,
        description,
        confidence,
        confidenceLevel,
        confidenceMessage,
      },
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} identified: ${name}`,
    };
  }

  /**
   * Show error alert to user
   * @param {string} error - Error message
   */
  showErrorAlert(error) {
    Alert.alert(
      'Scan Failed',
      error || 'Unable to process the image. Please try again.',
      [{ text: 'OK' }]
    );
  }

  /**
   * Show success alert with scan results
   * @param {Object} result - Formatted scan result
   */
  showSuccessAlert(result) {
    Alert.alert(
      'Scan Complete',
      `${result.message}\n\nConfidence: ${Math.round(result.data.confidence * 100)}%`,
      [
        { text: 'Try Again', style: 'cancel' },
        { text: 'Add to Collection', style: 'default' },
      ]
    );
  }
}

export default new ImageProcessingService();
