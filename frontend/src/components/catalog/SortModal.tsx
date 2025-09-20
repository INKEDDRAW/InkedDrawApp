/**
 * Sort Modal Component
 * Modal for selecting sort options
 */

import React from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { H2, Body } from '../ui/Typography';

type SortOption = 'name' | 'rating' | 'price' | 'newest';

interface SortModalProps {
  visible: boolean;
  selectedSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  onClose: () => void;
}

export const SortModal: React.FC<SortModalProps> = ({
  visible,
  selectedSort,
  onSortChange,
  onClose,
}) => {
  const theme = useTheme();

  const sortOptions = [
    { key: 'rating', label: 'Highest Rated', icon: '⭐' },
    { key: 'name', label: 'Name (A-Z)', icon: '🔤' },
    { key: 'price', label: 'Price (Low to High)', icon: '💰' },
    { key: 'newest', label: 'Newest First', icon: '🆕' },
  ] as const;

  const styles = StyleSheet.create({
    modal: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: theme.colors.onyx,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 32,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.charcoal,
    },
    title: {
      color: theme.colors.alabaster,
    },
    closeButton: {
      padding: 8,
    },
    closeButtonText: {
      color: theme.colors.alabaster,
      fontSize: 16,
    },
    optionsList: {
      paddingTop: 8,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    selectedOption: {
      backgroundColor: theme.colors.charcoal,
    },
    optionIcon: {
      fontSize: 20,
      marginRight: 16,
    },
    optionText: {
      color: theme.colors.alabaster,
      fontSize: 16,
      flex: 1,
    },
    selectedOptionText: {
      color: theme.colors.goldLeaf,
      fontWeight: '600',
    },
    checkmark: {
      color: theme.colors.goldLeaf,
      fontSize: 16,
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.modal} onPress={onClose} activeOpacity={1}>
        <TouchableOpacity style={styles.container} activeOpacity={1}>
          {/* Header */}
          <View style={styles.header}>
            <H2 style={styles.title}>Sort By</H2>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Body style={styles.closeButtonText}>✕</Body>
            </TouchableOpacity>
          </View>

          {/* Options */}
          <View style={styles.optionsList}>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.option,
                  selectedSort === option.key && styles.selectedOption,
                ]}
                onPress={() => onSortChange(option.key)}
              >
                <Body style={styles.optionIcon}>{option.icon}</Body>
                <Body style={[
                  styles.optionText,
                  selectedSort === option.key && styles.selectedOptionText,
                ]}>
                  {option.label}
                </Body>
                {selectedSort === option.key && (
                  <Body style={styles.checkmark}>✓</Body>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};
