/**
 * Cigar Recognition Component
 * Camera interface for capturing and recognizing cigars
 */

import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useTheme } from '../../theme/ThemeProvider';
import { 
  Heading2, 
  Body, 
  Caption, 
  Button, 
  Card 
} from '../ui';
import { CigarRecognitionResult } from '../../hooks/useCigarRecognition';

const { width: screenWidth } = Dimensions.get('window');

interface CigarRecognitionProps {
  onRecognitionComplete: (result: CigarRecognitionResult) => void;
  onClose: () => void;
}

export const CigarRecognition: React.FC<CigarRecognitionProps> = ({
  onRecognitionComplete,
  onClose,
}) => {
  const theme = useTheme();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState(CameraType.back);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const cameraRef = useRef<Camera>(null);

  React.useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      const locationPermission = await Location.requestForegroundPermissionsAsync();
      
      setHasPermission(cameraPermission.status === 'granted');
      
      if (cameraPermission.status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access to use cigar recognition.',
          [{ text: 'OK', onPress: onClose }]
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setHasPermission(false);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      setIsProcessing(true);
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      await processImage(photo.uri);
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
      setIsProcessing(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsProcessing(true);
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const processImage = async (imageUri: string) => {
    try {
      // Get user location for nearby shop search
      let userLocation = null;
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        userLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
      } catch (locationError) {
        console.warn('Could not get user location:', locationError);
      }

      // In a real implementation, you would upload the image to your backend
      // and call the vision recognition API
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'cigar.jpg',
      } as any);

      if (userLocation) {
        formData.append('userLatitude', userLocation.latitude.toString());
        formData.append('userLongitude', userLocation.longitude.toString());
      }

      // Mock API call for development
      // Replace with actual API call to your backend
      const mockResult: CigarRecognitionResult = {
        recognition: {
          brand: 'Cohiba',
          model: 'Behike 52',
          size: 'Robusto',
          wrapper: 'Maduro',
          confidence: 0.89,
          extractedText: ['COHIBA', 'BEHIKE', '52', 'HABANA', 'CUBA'],
          detectedLabels: ['Cigar', 'Tobacco', 'Brown', 'Cylinder'],
          matchedProducts: [
            {
              id: '1',
              name: 'Cohiba Behike 52',
              brand: 'Cohiba',
              confidence: 0.92,
              similarity: 0.88,
            },
            {
              id: '2',
              name: 'Cohiba Siglo VI',
              brand: 'Cohiba',
              confidence: 0.76,
              similarity: 0.71,
            },
          ],
        },
        nearbyShops: [
          {
            id: '1',
            name: 'Premium Cigars NYC',
            address: '123 Madison Ave',
            city: 'New York',
            state: 'NY',
            zipCode: '10016',
            country: 'United States',
            latitude: 40.7505,
            longitude: -73.9934,
            phone: '(212) 555-0123',
            website: 'https://premiumcigarsnyc.com',
            specialties: ['cigars', 'humidors'],
            brands: ['Cohiba', 'Montecristo'],
            rating: 4.5,
            reviewCount: 127,
            distance: 2.3,
            hasProduct: true,
            productAvailability: {
              inStock: true,
              price: 45.99,
              lastUpdated: new Date(),
            },
          },
        ],
        searchLocation: userLocation,
        searchRadius: 25,
        timestamp: new Date(),
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      onRecognitionComplete(mockResult);
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert(
        'Recognition Failed',
        'Could not recognize the cigar. Please try again with a clearer image.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleCameraType = () => {
    setCameraType(current => 
      current === CameraType.back ? CameraType.front : CameraType.back
    );
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Body style={[styles.loadingText, { color: theme.colors.text }]}>
          Requesting camera permission...
        </Body>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Heading2 style={[styles.title, { color: theme.colors.text }]}>
          Camera Access Required
        </Heading2>
        <Body style={[styles.description, { color: theme.colors.textSecondary }]}>
          To use cigar recognition, please enable camera access in your device settings.
        </Body>
        <Button
          title="Close"
          onPress={onClose}
          variant="secondary"
          style={styles.button}
        />
      </View>
    );
  }

  if (isProcessing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Heading2 style={[styles.title, { color: theme.colors.text }]}>
          Recognizing Cigar...
        </Heading2>
        <Body style={[styles.description, { color: theme.colors.textSecondary }]}>
          Analyzing image and finding nearby shops
        </Body>
      </View>
    );
  }

  if (!showCamera) {
    return (
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        <Card style={styles.instructionCard}>
          <Heading2 style={[styles.title, { color: theme.colors.text }]}>
            Cigar Recognition
          </Heading2>
          <Body style={[styles.description, { color: theme.colors.textSecondary }]}>
            Take a photo of a cigar to identify its brand, model, and find nearby shops that carry it.
          </Body>
          
          <View style={styles.tipsContainer}>
            <Caption style={[styles.tipsTitle, { color: theme.colors.text }]}>
              Tips for best results:
            </Caption>
            <Caption style={[styles.tip, { color: theme.colors.textSecondary }]}>
              • Ensure good lighting
            </Caption>
            <Caption style={[styles.tip, { color: theme.colors.textSecondary }]}>
              • Keep the cigar band visible
            </Caption>
            <Caption style={[styles.tip, { color: theme.colors.textSecondary }]}>
              • Hold the camera steady
            </Caption>
            <Caption style={[styles.tip, { color: theme.colors.textSecondary }]}>
              • Fill the frame with the cigar
            </Caption>
          </View>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            title="Take Photo"
            onPress={() => setShowCamera(true)}
            style={styles.button}
          />
          <Button
            title="Choose from Gallery"
            onPress={pickImage}
            variant="secondary"
            style={styles.button}
          />
          <Button
            title="Cancel"
            onPress={onClose}
            variant="outline"
            style={styles.button}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={cameraType}
        ratio="4:3"
      >
        <View style={styles.cameraOverlay}>
          <View style={styles.topControls}>
            <Button
              title="Close"
              onPress={() => setShowCamera(false)}
              variant="secondary"
              style={styles.controlButton}
            />
            <Button
              title="Flip"
              onPress={toggleCameraType}
              variant="secondary"
              style={styles.controlButton}
            />
          </View>

          <View style={styles.focusFrame} />

          <View style={styles.bottomControls}>
            <Button
              title="Gallery"
              onPress={() => {
                setShowCamera(false);
                pickImage();
              }}
              variant="secondary"
              style={styles.controlButton}
            />
            <Button
              title="Capture"
              onPress={takePicture}
              style={[styles.captureButton, { backgroundColor: theme.colors.primary }]}
            />
            <View style={styles.controlButton} />
          </View>
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  controlButton: {
    minWidth: 80,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusFrame: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: screenWidth * 0.8,
    height: screenWidth * 0.6,
    marginTop: -(screenWidth * 0.3),
    marginLeft: -(screenWidth * 0.4),
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  instructionCard: {
    marginBottom: 30,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  tipsContainer: {
    marginTop: 16,
  },
  tipsTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  tip: {
    marginBottom: 4,
    paddingLeft: 8,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    marginBottom: 12,
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
});
