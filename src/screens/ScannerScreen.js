import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { Camera, useCameraDevices, useCameraPermission } from 'react-native-vision-camera';
import {
  BodyText,
  Button,
  Icon,
  ScanResultModal,
  theme,
} from '../components';
import CameraService from '../services/CameraService';
import ImageProcessingService from '../services/ImageProcessingService';
import CollectionsService from '../services/CollectionsService';

/**
 * INKED DRAW AI Cigar Scanner Screen
 * 
 * Simulates camera view with overlay and cutout section
 * Guides user to position cigar band in frame for AI recognition
 */

const ScannerScreen = ({ navigation }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress] = useState(new Animated.Value(0));
  const [hasPermission, setHasPermission] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);

  const cameraRef = useRef(null);
  const devices = useCameraDevices();
  const device = devices.back;
  const { hasPermission: cameraPermission, requestPermission } = useCameraPermission();

  useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    if (cameraPermission) {
      setHasPermission(true);
      return;
    }

    const permission = await requestPermission();
    if (permission === 'granted') {
      setHasPermission(true);
    } else {
      Alert.alert(
        'Camera Permission Required',
        'InkedDraw needs camera access to scan cigars, wines, and beers.',
        [
          { text: 'Cancel', onPress: () => navigation.goBack() },
          { text: 'Grant Permission', onPress: checkCameraPermission },
        ]
      );
    }
  };

  const handleScan = async () => {
    if (!cameraRef.current || isScanning) return;

    setIsScanning(true);

    try {
      // Take photo
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'balanced',
        flash: isFlashOn ? 'on' : 'off',
        enableAutoRedEyeReduction: true,
      });

      console.log('Photo taken:', photo.path);

      // Start scan animation
      Animated.timing(scanProgress, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      }).start();

      // Process and upload image
      const result = await ImageProcessingService.processAndUploadImage(
        `file://${photo.path}`,
        'cigar' // Default to cigar for now, could be made dynamic
      );

      setIsScanning(false);

      if (result.success) {
        const formattedResult = ImageProcessingService.formatScanResult(result.result);

        if (formattedResult.success) {
          // Add original image path to the result for quick add functionality
          formattedResult.data.originalImagePath = `file://${photo.path}`;

          // Show result modal
          setScanResult(formattedResult);
          setShowResultModal(true);
        } else {
          ImageProcessingService.showErrorAlert(formattedResult.message);
        }
      } else {
        ImageProcessingService.showErrorAlert(result.error);
      }

    } catch (error) {
      setIsScanning(false);
      console.error('Error in scan process:', error);
      ImageProcessingService.showErrorAlert('Failed to process scan. Please try again.');
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const toggleFlash = () => {
    setIsFlashOn(!isFlashOn);
  };

  const handleCloseModal = () => {
    setShowResultModal(false);
    setScanResult(null);
  };

  const handleScanAgain = () => {
    setShowResultModal(false);
    setScanResult(null);
    // Reset scan progress
    scanProgress.setValue(0);
  };

  const handleAddToCollection = async (scanData) => {
    try {
      // First, get user's collections to let them choose
      const collections = await CollectionsService.getCollections();

      if (collections.length === 0) {
        // No collections exist, prompt to create one
        Alert.alert(
          'No Collections Found',
          'You need to create a collection first. Would you like to create one now?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Create Collection',
              onPress: () => {
                setShowResultModal(false);
                setScanResult(null);
                navigation.navigate('CollectionHome');
              }
            }
          ]
        );
        return;
      }

      // Show collection picker with streamlined option
      const collectionOptions = collections.map(collection => ({
        text: collection.name,
        onPress: () => addToSpecificCollection(collection.id, scanData)
      }));

      // Add option for quick add (if we have the original image)
      if (scanData.originalImagePath) {
        collectionOptions.unshift({
          text: '⚡ Quick Add (Rescan & Add)',
          onPress: () => showQuickAddOptions(scanData)
        });
      }

      Alert.alert(
        'Choose Collection',
        'Which collection would you like to add this item to?',
        [
          { text: 'Cancel', style: 'cancel' },
          ...collectionOptions
        ]
      );

    } catch (error) {
      console.error('Error loading collections:', error);
      Alert.alert('Error', 'Failed to load collections. Please try again.');
    }
  };

  const addToSpecificCollection = async (collectionId, scanData) => {
    try {
      const itemData = {
        name: scanData.name || 'Scanned Item',
        brand: scanData.brand,
        type: scanData.type || 'cigar', // Default to cigar for now
        description: scanData.description,
        scan_id: scanData.scan_id,
        confidence: scanData.confidence,
        image_url: scanData.image_url,
      };

      await CollectionsService.addItemToCollection(collectionId, itemData);

      Alert.alert(
        'Success!',
        'Item added to your collection successfully.',
        [
          {
            text: 'View Collection',
            onPress: () => {
              setShowResultModal(false);
              setScanResult(null);
              navigation.navigate('CollectionHome');
            }
          },
          {
            text: 'Scan Another',
            onPress: () => {
              setShowResultModal(false);
              setScanResult(null);
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error adding item to collection:', error);
      Alert.alert('Error', 'Failed to add item to collection. Please try again.');
    }
  };

  const showQuickAddOptions = (scanData) => {
    // Get collections for quick add
    CollectionsService.getCollections()
      .then(collections => {
        const quickAddOptions = collections.map(collection => ({
          text: `📁 ${collection.name}`,
          onPress: () => quickAddToCollection(collection.id, scanData)
        }));

        Alert.alert(
          '⚡ Quick Add',
          'Rescan the image and add directly to collection:',
          [
            { text: 'Cancel', style: 'cancel' },
            ...quickAddOptions
          ]
        );
      })
      .catch(error => {
        console.error('Error loading collections for quick add:', error);
        Alert.alert('Error', 'Failed to load collections. Please try again.');
      });
  };

  const quickAddToCollection = async (collectionId, scanData) => {
    try {
      if (!scanData.originalImagePath) {
        Alert.alert('Error', 'Original image not available for quick add.');
        return;
      }

      setIsScanning(true);

      // Use the streamlined scan-and-add endpoint
      const result = await ImageProcessingService.scanAndAddToCollection(
        scanData.originalImagePath,
        collectionId,
        scanData.type || 'cigar'
      );

      if (result.success) {
        Alert.alert(
          'Success!',
          'Item rescanned and added to your collection successfully.',
          [
            {
              text: 'View Collection',
              onPress: () => {
                setShowResultModal(false);
                setScanResult(null);
                navigation.navigate('CollectionHome');
              }
            },
            {
              text: 'Scan Another',
              onPress: () => {
                setShowResultModal(false);
                setScanResult(null);
              }
            }
          ]
        );
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('Error with quick add:', error);
      Alert.alert('Error', 'Failed to add item to collection. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  // Show loading or permission request if camera not ready
  if (!hasPermission || !device) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.permissionContainer}>
          <Icon name="camera" size="large" color={theme.colors.textSecondary} />
          <BodyText style={styles.permissionText}>
            {!hasPermission ? 'Camera permission required' : 'Camera not available'}
          </BodyText>
          <Button
            title={!hasPermission ? 'Grant Permission' : 'Close'}
            variant="primary"
            onPress={!hasPermission ? checkCameraPermission : handleClose}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Real Camera View */}
      <View style={styles.cameraView}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          device={device}
          isActive={true}
          photo={true}
          format={CameraService.getCameraFormat(device)}
        />
        
        {/* Header Controls */}
        <View style={styles.headerControls}>
          <TouchableOpacity style={styles.controlButton} onPress={handleClose}>
            <Icon name="close" color={theme.colors.text} />
          </TouchableOpacity>
          
          <BodyText weight="medium" color={theme.colors.text}>
            Intelligence Capture
          </BodyText>
          
          <TouchableOpacity style={styles.controlButton}>
            <Icon name="settings" color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Scanning Overlay */}
        <View style={styles.scanningOverlay}>
          
          {/* Top Overlay */}
          <View style={styles.overlayTop} />
          
          {/* Middle Section with Cutout */}
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            
            {/* Scan Frame */}
            <View style={styles.scanFrame}>
              {/* Corner Indicators */}
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
              
              {/* Scanning Line */}
              {isScanning && (
                <Animated.View 
                  style={[
                    styles.scanLine,
                    {
                      transform: [{
                        translateY: scanProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 200],
                        })
                      }]
                    }
                  ]} 
                />
              )}
            </View>
            
            <View style={styles.overlaySide} />
          </View>
          
          {/* Bottom Overlay */}
          <View style={styles.overlayBottom} />
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <BodyText
            size="lg"
            weight="medium"
            color={theme.colors.text}
            style={styles.instructionTitle}
          >
            Center target within analysis frame
          </BodyText>
          <BodyText
            size="md"
            color={theme.colors.textSecondary}
            style={styles.instructionSubtitle}
          >
            Optimal lighting will enhance data extraction
          </BodyText>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity style={styles.galleryButton}>
            <Icon name="camera" color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          <Button
            title={isScanning ? "ANALYZING..." : "CAPTURE INTEL"}
            variant="primary"
            onPress={handleScan}
            disabled={isScanning}
            loading={isScanning}
            style={styles.scanButton}
          />
          
          <TouchableOpacity style={styles.flashButton} onPress={toggleFlash}>
            <Icon
              name="zap"
              color={isFlashOn ? theme.colors.primary : theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scan Result Modal */}
      <ScanResultModal
        visible={showResultModal}
        scanResult={scanResult}
        onClose={handleCloseModal}
        onScanAgain={handleScanAgain}
        onAddToCollection={handleAddToCollection}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  cameraView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },

  // Permission Container
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  permissionText: {
    textAlign: 'center',
    marginVertical: theme.spacing.lg,
    color: theme.colors.textSecondary,
  },
  
  // Header Controls
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Stronger overlay for better contrast
  },
  controlButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Stronger overlay for better visibility
  },
  
  // Scanning Overlay
  scanningOverlay: {
    flex: 1,
    justifyContent: 'center',
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Stronger black overlay for better contrast
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: 200,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Stronger black overlay for better contrast
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Stronger black overlay for better contrast
  },
  
  // Scan Frame
  scanFrame: {
    width: 250,
    height: 200,
    position: 'relative',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: theme.colors.premium,
    borderWidth: 3,
  },
  cornerTopLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: theme.borderRadius.md,
  },
  cornerTopRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: theme.borderRadius.md,
  },
  cornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: theme.borderRadius.md,
  },
  cornerBottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: theme.borderRadius.md,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: theme.colors.premium,
    shadowColor: theme.colors.premium,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  
  // Instructions
  instructionsContainer: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Stronger overlay for better readability
  },
  instructionTitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  instructionSubtitle: {
    textAlign: 'center',
  },
  
  // Bottom Controls
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  galleryButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  scanButton: {
    flex: 1,
    marginHorizontal: theme.spacing.lg,
  },
  flashButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default ScannerScreen;
