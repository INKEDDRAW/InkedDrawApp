import { Camera, useCameraDevices, useCameraPermission } from 'react-native-vision-camera';
import { Alert, Linking } from 'react-native';

class CameraService {
  constructor() {
    this.camera = null;
  }

  // Check and request camera permissions
  async requestCameraPermission() {
    try {
      const { hasPermission, requestPermission } = useCameraPermission();
      
      if (hasPermission) {
        return true;
      }

      const permission = await requestPermission();
      
      if (permission === 'denied') {
        Alert.alert(
          'Camera Permission Required',
          'InkedDraw needs camera access to scan cigars, wines, and beers. Please enable camera permission in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return false;
      }

      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  }

  // Get available camera devices
  getCameraDevices() {
    const devices = useCameraDevices();
    return {
      back: devices.back,
      front: devices.front,
    };
  }

  // Set camera reference
  setCameraRef(ref) {
    this.camera = ref;
  }

  // Take a photo
  async takePhoto() {
    try {
      if (!this.camera) {
        throw new Error('Camera reference not set');
      }

      const photo = await this.camera.takePhoto({
        qualityPrioritization: 'balanced',
        flash: 'auto',
        enableAutoRedEyeReduction: true,
      });

      return {
        success: true,
        photo: {
          path: photo.path,
          width: photo.width,
          height: photo.height,
          uri: `file://${photo.path}`,
        },
      };
    } catch (error) {
      console.error('Error taking photo:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Check if camera is available
  async isCameraAvailable() {
    try {
      const devices = this.getCameraDevices();
      return !!(devices.back || devices.front);
    } catch (error) {
      console.error('Error checking camera availability:', error);
      return false;
    }
  }

  // Get camera format for optimal scanning
  getCameraFormat(device) {
    if (!device) return null;

    // Find the best format for scanning (good balance of quality and performance)
    const formats = device.formats;
    
    // Prefer formats with good resolution for text recognition
    const preferredFormat = formats.find(format => 
      format.photoWidth >= 1920 && 
      format.photoHeight >= 1080 &&
      format.maxFps >= 30
    );

    return preferredFormat || formats[0];
  }

  // Process image for scanning (compress and prepare for API)
  async processImageForScanning(photoPath) {
    try {
      // In a real implementation, you might want to:
      // 1. Compress the image to reduce file size
      // 2. Convert to base64 for API upload
      // 3. Apply image filters for better recognition
      
      // For now, return the basic photo info
      return {
        success: true,
        processedImage: {
          uri: photoPath,
          type: 'image/jpeg',
          name: `scan_${Date.now()}.jpg`,
        },
      };
    } catch (error) {
      console.error('Error processing image:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default new CameraService();
