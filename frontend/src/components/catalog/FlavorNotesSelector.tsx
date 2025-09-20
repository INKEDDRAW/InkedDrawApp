/**
 * Flavor Notes Selector Component
 * Interactive selector for flavor notes based on product type
 */

import React, { useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Body, Caption } from '../ui/Typography';

interface FlavorNotesSelectorProps {
  productType: 'cigar' | 'beer' | 'wine';
  selectedNotes: string[];
  onNotesChange: (notes: string[]) => void;
  maxSelections?: number;
}

export const FlavorNotesSelector: React.FC<FlavorNotesSelectorProps> = ({
  productType,
  selectedNotes,
  onNotesChange,
  maxSelections = 8,
}) => {
  const theme = useTheme();

  const flavorOptions = useMemo(() => {
    switch (productType) {
      case 'cigar':
        return {
          'Earthy': ['leather', 'cedar', 'wood', 'earth', 'barnyard'],
          'Spicy': ['pepper', 'cinnamon', 'nutmeg', 'clove', 'chili'],
          'Sweet': ['chocolate', 'vanilla', 'caramel', 'honey', 'molasses'],
          'Nutty': ['almond', 'walnut', 'hazelnut', 'peanut', 'pecan'],
          'Fruity': ['raisin', 'fig', 'cherry', 'plum', 'citrus'],
          'Creamy': ['cream', 'butter', 'milk', 'custard'],
          'Roasted': ['coffee', 'cocoa', 'toast', 'roasted nuts'],
        };
      case 'beer':
        return {
          'Malty': ['caramel', 'toffee', 'biscuit', 'bread', 'honey'],
          'Hoppy': ['citrus', 'pine', 'floral', 'herbal', 'tropical'],
          'Fruity': ['apple', 'pear', 'banana', 'berry', 'stone fruit'],
          'Spicy': ['pepper', 'clove', 'coriander', 'ginger'],
          'Roasted': ['coffee', 'chocolate', 'burnt', 'smoky'],
          'Yeasty': ['bread', 'dough', 'funky', 'barnyard'],
          'Sour': ['tart', 'acidic', 'vinegar', 'lactic'],
        };
      case 'wine':
        return {
          'Fruity': ['cherry', 'blackberry', 'apple', 'pear', 'citrus', 'tropical'],
          'Floral': ['rose', 'violet', 'lavender', 'jasmine'],
          'Earthy': ['mineral', 'stone', 'soil', 'mushroom'],
          'Spicy': ['pepper', 'cinnamon', 'clove', 'vanilla'],
          'Herbal': ['grass', 'bell pepper', 'eucalyptus', 'mint'],
          'Oak': ['vanilla', 'toast', 'smoke', 'cedar'],
          'Other': ['leather', 'tobacco', 'chocolate', 'coffee'],
        };
      default:
        return {};
    }
  }, [productType]);

  const handleNoteToggle = (note: string) => {
    if (selectedNotes.includes(note)) {
      onNotesChange(selectedNotes.filter(n => n !== note));
    } else if (selectedNotes.length < maxSelections) {
      onNotesChange([...selectedNotes, note]);
    }
  };

  const styles = StyleSheet.create({
    container: {
      maxHeight: 300,
    },
    categorySection: {
      marginBottom: 16,
    },
    categoryTitle: {
      color: theme.colors.alabaster,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
    },
    notesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    noteChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.colors.onyx,
      borderWidth: 1,
      borderColor: theme.colors.charcoal,
    },
    selectedNoteChip: {
      backgroundColor: theme.colors.goldLeaf,
      borderColor: theme.colors.goldLeaf,
    },
    disabledNoteChip: {
      opacity: 0.5,
    },
    noteText: {
      color: theme.colors.alabaster,
      fontSize: 12,
      fontWeight: '500',
      textTransform: 'capitalize',
    },
    selectedNoteText: {
      color: theme.colors.onyx,
      fontWeight: '600',
    },
    selectionCounter: {
      color: theme.colors.alabaster,
      opacity: 0.7,
      fontSize: 12,
      textAlign: 'center',
      marginTop: 8,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {Object.entries(flavorOptions).map(([category, notes]) => (
          <View key={category} style={styles.categorySection}>
            <Body style={styles.categoryTitle}>{category}</Body>
            <View style={styles.notesContainer}>
              {notes.map((note) => {
                const isSelected = selectedNotes.includes(note);
                const isDisabled = !isSelected && selectedNotes.length >= maxSelections;
                
                return (
                  <TouchableOpacity
                    key={note}
                    style={[
                      styles.noteChip,
                      isSelected && styles.selectedNoteChip,
                      isDisabled && styles.disabledNoteChip,
                    ]}
                    onPress={() => handleNoteToggle(note)}
                    disabled={isDisabled}
                  >
                    <Caption style={[
                      styles.noteText,
                      isSelected && styles.selectedNoteText,
                    ]}>
                      {note}
                    </Caption>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
      
      <Caption style={styles.selectionCounter}>
        {selectedNotes.length}/{maxSelections} selected
      </Caption>
    </View>
  );
};
