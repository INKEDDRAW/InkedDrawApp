/**
 * Search Bar Component
 * Reusable search input with styling
 */

import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Body } from './Typography';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onPress?: () => void;
  editable?: boolean;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onPress,
  editable = true,
  autoFocus = false,
}) => {
  const theme = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.charcoal,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 16,
    },
    searchIcon: {
      color: theme.colors.alabaster,
      opacity: 0.6,
      fontSize: 16,
      marginRight: 12,
    },
    input: {
      flex: 1,
      color: theme.colors.alabaster,
      fontSize: 16,
      padding: 0,
    },
    clearButton: {
      padding: 4,
      marginLeft: 8,
    },
    clearButtonText: {
      color: theme.colors.alabaster,
      opacity: 0.6,
      fontSize: 16,
    },
  });

  const handleClear = () => {
    onChangeText('');
  };

  if (onPress && !editable) {
    return (
      <TouchableOpacity style={styles.container} onPress={onPress}>
        <Body style={styles.searchIcon}>🔍</Body>
        <Body style={[styles.input, { opacity: 0.7 }]}>
          {value || placeholder}
        </Body>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Body style={styles.searchIcon}>🔍</Body>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.alabaster + '60'}
        autoFocus={autoFocus}
        editable={editable}
      />
      {value.length > 0 && (
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Body style={styles.clearButtonText}>✕</Body>
        </TouchableOpacity>
      )}
    </View>
  );
};
