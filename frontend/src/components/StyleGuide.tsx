/**
 * Style Guide Component
 * Comprehensive showcase of the Inked Draw design system
 * Based on State-Styles.md specifications
 */

import React from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
} from 'react-native';
import { useInkedTheme } from '../theme/ThemeProvider';
import { Button, Card, Input, H1, H2, H3, Body, BodySecondary, Label, Caption } from './ui';

export const StyleGuide: React.FC = () => {
  const theme = useInkedTheme();

  const ColorSwatch: React.FC<{ color: string; name: string }> = ({ color, name }) => (
    <View style={styles.colorSwatch}>
      <View style={[styles.colorBox, { backgroundColor: color }]} />
      <Caption style={styles.colorName}>{name}</Caption>
      <Caption style={styles.colorValue}>{color}</Caption>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Header */}
      <View style={styles.section}>
        <H1>Inked Draw Design System</H1>
        <BodySecondary>
          A sophisticated design language for connoisseurs of cigars, craft beer, and fine wine.
        </BodySecondary>
      </View>

      {/* Colors */}
      <View style={styles.section}>
        <H2>Color Palette</H2>
        <Body style={styles.sectionDescription}>
          Dark, warm, and sophisticated palette designed to feel like a private lounge or cellar.
        </Body>
        
        <View style={styles.subsection}>
          <H3>Primary Colors</H3>
          <View style={styles.colorGrid}>
            <ColorSwatch color={theme.colors.primary.onyx} name="Onyx" />
            <ColorSwatch color={theme.colors.primary.charcoal} name="Charcoal" />
            <ColorSwatch color={theme.colors.primary.alabaster} name="Alabaster" />
          </View>
        </View>

        <View style={styles.subsection}>
          <H3>Accent Colors</H3>
          <View style={styles.colorGrid}>
            <ColorSwatch color={theme.colors.accent.goldLeaf} name="Gold Leaf" />
            <ColorSwatch color={theme.colors.accent.goldLeafLight} name="Gold Leaf Light" />
          </View>
        </View>

        <View style={styles.subsection}>
          <H3>Functional Colors</H3>
          <View style={styles.colorGrid}>
            <ColorSwatch color={theme.colors.functional.successGreen} name="Success Green" />
            <ColorSwatch color={theme.colors.functional.errorRed} name="Error Red" />
            <ColorSwatch color={theme.colors.functional.warningAmber} name="Warning Amber" />
          </View>
        </View>
      </View>

      {/* Typography */}
      <View style={styles.section}>
        <H2>Typography</H2>
        <Body style={styles.sectionDescription}>
          Classic serif for headings paired with modern sans-serif for UI text.
        </Body>
        
        <View style={styles.typographyExample}>
          <H1>H1 - Screen Title (Lora, 28px)</H1>
          <H2>H2 - Section Header (Lora, 22px)</H2>
          <H3>H3 - Card Title (Inter Semibold, 18px)</H3>
          <Body>Body - Regular text (Inter, 16px)</Body>
          <BodySecondary>Body Secondary - Metadata (Inter, 14px)</BodySecondary>
          <Label>Label - Form Labels (Inter, 12px)</Label>
          <Caption>Caption - Small text (Inter, 12px)</Caption>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.section}>
        <H2>Buttons</H2>
        <Body style={styles.sectionDescription}>
          Primary actions use Gold Leaf accent, secondary actions are transparent with borders.
        </Body>
        
        <View style={styles.buttonGrid}>
          <Button title="Primary Button" onPress={() => {}} variant="primary" />
          <Button title="Secondary Button" onPress={() => {}} variant="secondary" />
          <Button title="Disabled Primary" onPress={() => {}} variant="primary" disabled />
          <Button title="Loading..." onPress={() => {}} variant="primary" loading />
        </View>
      </View>

      {/* Cards */}
      <View style={styles.section}>
        <H2>Cards</H2>
        <Body style={styles.sectionDescription}>
          Charcoal background with 12px border radius and 16px padding.
        </Body>
        
        <Card style={styles.cardExample}>
          <H3>Card Title</H3>
          <Body>This is a card with the standard Inked Draw styling.</Body>
          <BodySecondary>Secondary information goes here.</BodySecondary>
        </Card>
      </View>

      {/* Inputs */}
      <View style={styles.section}>
        <H2>Input Fields</H2>
        <Body style={styles.sectionDescription}>
          Transparent background with bottom border that animates to Gold Leaf on focus.
        </Body>
        
        <View style={styles.inputExample}>
          <Input label="Label" placeholder="Enter text here..." />
          <Input label="With Error" placeholder="Invalid input" error="This field is required" />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  subsection: {
    marginBottom: 24,
  },
  sectionDescription: {
    marginBottom: 16,
    marginTop: 8,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  colorSwatch: {
    alignItems: 'center',
    marginBottom: 16,
  },
  colorBox: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: 8,
  },
  colorName: {
    marginBottom: 4,
  },
  colorValue: {
    fontFamily: 'monospace',
  },
  typographyExample: {
    gap: 12,
  },
  buttonGrid: {
    gap: 12,
  },
  cardExample: {
    marginTop: 8,
  },
  inputExample: {
    gap: 16,
  },
});
