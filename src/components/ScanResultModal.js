import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import {
  Card,
  Heading,
  BodyText,
  Caption,
  Button,
  Icon,
  theme,
} from './index';

/**
 * INKED DRAW Scan Result Modal
 * 
 * Displays AI scan results with luxury styling
 * Includes confidence indicator and add to collection functionality
 */

const ScanResultModal = ({ 
  visible, 
  onClose, 
  scanResult, 
  onAddToCollection,
  onScanAgain 
}) => {
  if (!scanResult) return null;

  const { data } = scanResult;
  const confidencePercentage = Math.round(data.confidence * 100);
  
  // Determine confidence color
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return theme.colors.success;
    if (confidence >= 0.6) return theme.colors.warning;
    return theme.colors.error;
  };

  const confidenceColor = getConfidenceColor(data.confidence);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          <Heading level={3} style={styles.headerTitle}>
            Scan Results
          </Heading>
          
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Result Card */}
          <Card style={styles.resultCard}>
            {/* Product Image Placeholder */}
            <View style={styles.imageContainer}>
              <View style={styles.imagePlaceholder}>
                <Icon 
                  name={data.type === 'cigar' ? 'cigarette' : data.type === 'wine' ? 'wine' : 'beer'} 
                  size="large" 
                  color={theme.colors.textSecondary} 
                />
              </View>
            </View>

            {/* Product Info */}
            <View style={styles.productInfo}>
              <View style={styles.productHeader}>
                <View style={styles.productTitleContainer}>
                  <Heading level={4} style={styles.productName}>
                    {data.name}
                  </Heading>
                  {data.brand && (
                    <Caption style={styles.brandName}>
                      by {data.brand}
                    </Caption>
                  )}
                </View>
                
                {/* Product Type Badge */}
                <View style={[styles.typeBadge, { backgroundColor: theme.colors.surface }]}>
                  <Caption style={styles.typeText}>
                    {data.type.toUpperCase()}
                  </Caption>
                </View>
              </View>

              {/* Description */}
              {data.description && (
                <BodyText style={styles.description}>
                  {data.description}
                </BodyText>
              )}

              {/* Confidence Indicator */}
              <View style={styles.confidenceContainer}>
                <View style={styles.confidenceHeader}>
                  <BodyText weight="medium" style={styles.confidenceLabel}>
                    Identification Confidence
                  </BodyText>
                  <BodyText 
                    weight="bold" 
                    style={[styles.confidenceValue, { color: confidenceColor }]}
                  >
                    {confidencePercentage}%
                  </BodyText>
                </View>
                
                {/* Confidence Bar */}
                <View style={styles.confidenceBarContainer}>
                  <View style={styles.confidenceBarBackground}>
                    <View 
                      style={[
                        styles.confidenceBarFill, 
                        { 
                          width: `${confidencePercentage}%`,
                          backgroundColor: confidenceColor 
                        }
                      ]} 
                    />
                  </View>
                </View>
                
                <Caption style={styles.confidenceMessage}>
                  {data.confidenceMessage}
                </Caption>
              </View>
            </View>
          </Card>

          {/* Additional Details */}
          <Card style={styles.detailsCard}>
            <Heading level={5} style={styles.detailsTitle}>
              Scan Details
            </Heading>
            
            <View style={styles.detailRow}>
              <BodyText style={styles.detailLabel}>Scan ID:</BodyText>
              <BodyText style={styles.detailValue}>{data.id}</BodyText>
            </View>
            
            <View style={styles.detailRow}>
              <BodyText style={styles.detailLabel}>Type:</BodyText>
              <BodyText style={styles.detailValue}>
                {data.type.charAt(0).toUpperCase() + data.type.slice(1)}
              </BodyText>
            </View>
            
            <View style={styles.detailRow}>
              <BodyText style={styles.detailLabel}>Scanned:</BodyText>
              <BodyText style={styles.detailValue}>
                {new Date().toLocaleString()}
              </BodyText>
            </View>
          </Card>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <Button
            title="SCAN AGAIN"
            variant="secondary"
            size="large"
            onPress={onScanAgain}
            style={styles.scanAgainButton}
          />
          
          <Button
            title="ADD TO COLLECTION"
            variant="primary"
            size="large"
            onPress={() => onAddToCollection(data)}
            style={styles.addButton}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  
  // Content
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  
  // Result Card
  resultCard: {
    marginBottom: theme.spacing.lg,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  
  // Product Info
  productInfo: {
    gap: theme.spacing.md,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productTitleContainer: {
    flex: 1,
  },
  productName: {
    marginBottom: theme.spacing.xs,
  },
  brandName: {
    color: theme.colors.textSecondary,
  },
  typeBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 6,
  },
  typeText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  description: {
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  
  // Confidence
  confidenceContainer: {
    gap: theme.spacing.sm,
  },
  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidenceLabel: {
    color: theme.colors.textSecondary,
  },
  confidenceValue: {
    fontSize: 18,
  },
  confidenceBarContainer: {
    marginVertical: theme.spacing.xs,
  },
  confidenceBarBackground: {
    height: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  confidenceMessage: {
    color: theme.colors.textTertiary,
    fontStyle: 'italic',
  },
  
  // Details Card
  detailsCard: {
    marginBottom: theme.spacing.lg,
  },
  detailsTitle: {
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  detailLabel: {
    color: theme.colors.textSecondary,
  },
  detailValue: {
    fontWeight: '500',
  },
  
  // Actions
  actionContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  scanAgainButton: {
    flex: 1,
  },
  addButton: {
    flex: 2,
  },
});

export default ScanResultModal;
