/**
 * Report Modal Component
 * Modal for reporting content or users
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useModeration } from '../../hooks/useModeration';
import { useTheme } from '../../contexts/ThemeContext';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  reportedUserId?: string;
  contentId?: string;
  contentType?: 'post' | 'comment' | 'profile' | 'message';
  reportedUserName?: string;
}

const REPORT_TYPES = [
  {
    id: 'spam',
    label: 'Spam',
    description: 'Unwanted commercial content or repetitive posts',
    icon: 'mail-unread-outline',
  },
  {
    id: 'harassment',
    label: 'Harassment',
    description: 'Bullying, threats, or targeted harassment',
    icon: 'warning-outline',
  },
  {
    id: 'hate_speech',
    label: 'Hate Speech',
    description: 'Content that promotes hatred or discrimination',
    icon: 'ban-outline',
  },
  {
    id: 'violence',
    label: 'Violence',
    description: 'Threats of violence or graphic violent content',
    icon: 'alert-circle-outline',
  },
  {
    id: 'inappropriate_content',
    label: 'Inappropriate Content',
    description: 'Sexual content, nudity, or other inappropriate material',
    icon: 'eye-off-outline',
  },
  {
    id: 'fake_account',
    label: 'Fake Account',
    description: 'Impersonation or fake profile',
    icon: 'person-outline',
  },
  {
    id: 'copyright',
    label: 'Copyright Violation',
    description: 'Unauthorized use of copyrighted material',
    icon: 'document-outline',
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Other violations of community guidelines',
    icon: 'ellipsis-horizontal-outline',
  },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  onClose,
  reportedUserId,
  contentId,
  contentType,
  reportedUserName,
}) => {
  const { colors } = useTheme();
  const { submitReport, isLoading } = useModeration();
  
  const [selectedType, setSelectedType] = useState<string>('');
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState<string[]>([]);
  const [evidenceInput, setEvidenceInput] = useState('');

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert('Error', 'Please select a report type');
      return;
    }

    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for your report');
      return;
    }

    try {
      await submitReport({
        reportedUserId,
        contentId,
        contentType,
        reportType: selectedType as any,
        reason: reason.trim(),
        evidence: evidence.filter(e => e.trim().length > 0),
      });

      Alert.alert(
        'Report Submitted',
        'Thank you for your report. Our moderation team will review it shortly.',
        [{ text: 'OK', onPress: handleClose }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    }
  };

  const handleClose = () => {
    setSelectedType('');
    setReason('');
    setEvidence([]);
    setEvidenceInput('');
    onClose();
  };

  const addEvidence = () => {
    if (evidenceInput.trim()) {
      setEvidence([...evidence, evidenceInput.trim()]);
      setEvidenceInput('');
    }
  };

  const removeEvidence = (index: number) => {
    setEvidence(evidence.filter((_, i) => i !== index));
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modal: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      margin: 20,
      maxHeight: '90%',
      width: '90%',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    closeButton: {
      padding: 4,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
    },
    subtitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 16,
    },
    reportTypeContainer: {
      marginBottom: 24,
    },
    reportType: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      marginBottom: 12,
    },
    reportTypeSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    reportTypeIcon: {
      marginRight: 12,
    },
    reportTypeContent: {
      flex: 1,
    },
    reportTypeLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 4,
    },
    reportTypeDescription: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    reasonContainer: {
      marginBottom: 24,
    },
    reasonInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.background,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    evidenceContainer: {
      marginBottom: 24,
    },
    evidenceInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    evidenceInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.background,
      marginRight: 8,
    },
    addEvidenceButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 12,
    },
    evidenceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
    },
    evidenceText: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },
    removeEvidenceButton: {
      padding: 4,
      marginLeft: 8,
    },
    footer: {
      flexDirection: 'row',
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 12,
    },
    button: {
      flex: 1,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    submitButton: {
      backgroundColor: colors.primary,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: colors.text,
    },
    submitButtonText: {
      color: colors.surface,
    },
    disabledButton: {
      opacity: 0.5,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>
              Report {reportedUserName ? `@${reportedUserName}` : 'Content'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.scrollContent}>
              <Text style={styles.subtitle}>What's the issue?</Text>
              
              <View style={styles.reportTypeContainer}>
                {REPORT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.reportType,
                      selectedType === type.id && styles.reportTypeSelected,
                    ]}
                    onPress={() => setSelectedType(type.id)}
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={24}
                      color={selectedType === type.id ? colors.primary : colors.textSecondary}
                      style={styles.reportTypeIcon}
                    />
                    <View style={styles.reportTypeContent}>
                      <Text style={styles.reportTypeLabel}>{type.label}</Text>
                      <Text style={styles.reportTypeDescription}>
                        {type.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.reasonContainer}>
                <Text style={styles.subtitle}>Additional Details</Text>
                <TextInput
                  style={styles.reasonInput}
                  placeholder="Please provide more details about why you're reporting this..."
                  placeholderTextColor={colors.textSecondary}
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  maxLength={500}
                />
              </View>

              <View style={styles.evidenceContainer}>
                <Text style={styles.subtitle}>Evidence (Optional)</Text>
                <View style={styles.evidenceInputContainer}>
                  <TextInput
                    style={styles.evidenceInput}
                    placeholder="Add links, screenshots, or other evidence..."
                    placeholderTextColor={colors.textSecondary}
                    value={evidenceInput}
                    onChangeText={setEvidenceInput}
                  />
                  <TouchableOpacity
                    style={styles.addEvidenceButton}
                    onPress={addEvidence}
                    disabled={!evidenceInput.trim()}
                  >
                    <Ionicons name="add" size={20} color={colors.surface} />
                  </TouchableOpacity>
                </View>
                
                {evidence.map((item, index) => (
                  <View key={index} style={styles.evidenceItem}>
                    <Text style={styles.evidenceText}>{item}</Text>
                    <TouchableOpacity
                      style={styles.removeEvidenceButton}
                      onPress={() => removeEvidence(index)}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                (!selectedType || !reason.trim() || isLoading) && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={!selectedType || !reason.trim() || isLoading}
            >
              <Text style={[styles.buttonText, styles.submitButtonText]}>
                {isLoading ? 'Submitting...' : 'Submit Report'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
