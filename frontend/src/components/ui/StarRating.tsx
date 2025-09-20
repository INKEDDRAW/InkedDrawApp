/**
 * Star Rating Component
 * Interactive and display-only star rating component
 */

import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Body } from './Typography';

interface StarRatingProps {
  rating: number;
  size?: number;
  color?: string;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  maxRating?: number;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  size = 16,
  color,
  interactive = false,
  onRatingChange,
  maxRating = 5,
}) => {
  const theme = useTheme();
  const [tempRating, setTempRating] = useState(0);
  
  const starColor = color || theme.colors.goldLeaf;
  const displayRating = interactive && tempRating > 0 ? tempRating : rating;

  const handleStarPress = (starIndex: number) => {
    if (interactive && onRatingChange) {
      const newRating = starIndex + 1;
      onRatingChange(newRating);
      setTempRating(0);
    }
  };

  const handleStarPressIn = (starIndex: number) => {
    if (interactive) {
      setTempRating(starIndex + 1);
    }
  };

  const handleStarPressOut = () => {
    if (interactive) {
      setTempRating(0);
    }
  };

  const renderStar = (index: number) => {
    const isFilled = index < Math.floor(displayRating);
    const isHalfFilled = index === Math.floor(displayRating) && displayRating % 1 !== 0;
    
    const StarComponent = interactive ? TouchableOpacity : View;
    const starProps = interactive ? {
      onPress: () => handleStarPress(index),
      onPressIn: () => handleStarPressIn(index),
      onPressOut: handleStarPressOut,
      activeOpacity: 0.7,
    } : {};

    return (
      <StarComponent
        key={index}
        style={[styles.star, { width: size, height: size }]}
        {...starProps}
      >
        <Body style={[
          styles.starText,
          {
            fontSize: size,
            color: isFilled || isHalfFilled ? starColor : theme.colors.charcoal,
          }
        ]}>
          {isFilled ? '★' : isHalfFilled ? '☆' : '☆'}
        </Body>
      </StarComponent>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    star: {
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 2,
    },
    starText: {
      lineHeight: size,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      {Array.from({ length: maxRating }, (_, index) => renderStar(index))}
    </View>
  );
};
