/**
 * Flavor Tags Component
 * Displays flavor notes as styled tags
 */

import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Caption } from '../ui/Typography';

interface FlavorTagsProps {
  notes: string[];
  productType: 'cigar' | 'beer' | 'wine';
  maxTags?: number;
}

export const FlavorTags: React.FC<FlavorTagsProps> = ({
  notes,
  productType,
  maxTags = 6,
}) => {
  const theme = useTheme();

  const getTagColor = (note: string) => {
    // Color coding based on flavor categories
    const fruitNotes = ['apple', 'cherry', 'citrus', 'berry', 'tropical', 'stone fruit'];
    const spiceNotes = ['pepper', 'cinnamon', 'clove', 'nutmeg', 'ginger'];
    const earthyNotes = ['leather', 'cedar', 'wood', 'earth', 'mineral'];
    const sweetNotes = ['chocolate', 'vanilla', 'caramel', 'honey', 'toffee'];

    if (fruitNotes.some(fruit => note.toLowerCase().includes(fruit))) {
      return '#FF6B6B'; // Red for fruity
    }
    if (spiceNotes.some(spice => note.toLowerCase().includes(spice))) {
      return '#FF8E53'; // Orange for spicy
    }
    if (earthyNotes.some(earth => note.toLowerCase().includes(earth))) {
      return '#8B4513'; // Brown for earthy
    }
    if (sweetNotes.some(sweet => note.toLowerCase().includes(sweet))) {
      return '#DDA0DD'; // Purple for sweet
    }
    
    return theme.colors.goldLeaf; // Default gold
  };

  const displayNotes = notes.slice(0, maxTags);
  const remainingCount = notes.length - maxTags;

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    tag: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
    },
    tagText: {
      fontSize: 11,
      fontWeight: '500',
      textTransform: 'capitalize',
    },
    moreTag: {
      backgroundColor: theme.colors.charcoal,
      borderColor: theme.colors.charcoal,
    },
    moreTagText: {
      color: theme.colors.alabaster,
      opacity: 0.7,
    },
  });

  return (
    <View style={styles.container}>
      {displayNotes.map((note, index) => {
        const tagColor = getTagColor(note);
        return (
          <View
            key={index}
            style={[
              styles.tag,
              {
                backgroundColor: tagColor + '20',
                borderColor: tagColor,
              }
            ]}
          >
            <Caption style={[
              styles.tagText,
              { color: tagColor }
            ]}>
              {note}
            </Caption>
          </View>
        );
      })}
      
      {remainingCount > 0 && (
        <View style={[styles.tag, styles.moreTag]}>
          <Caption style={[styles.tagText, styles.moreTagText]}>
            +{remainingCount} more
          </Caption>
        </View>
      )}
    </View>
  );
};
