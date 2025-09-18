import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { theme, getTypography } from '../theme';

/**
 * INKED DRAW Typography Components
 * 
 * Consistent typography using Playfair Display for headings and Inter for body text
 * Follows luxury aesthetic with proper hierarchy and spacing
 */

// === HEADING COMPONENT (Playfair Display) ===
export const Heading = ({
  children,
  level = 1,           // 1-6 for different heading levels
  color = theme.colors.text,
  style = {},
  ...props
}) => {
  const getLevelStyle = () => {
    switch (level) {
      case 1: return getTypography('heading', 'xxxl'); // Brand wordmark
      case 2: return getTypography('heading', 'xxl');  // Page titles
      case 3: return getTypography('heading', 'xl');   // Section headings
      case 4: return getTypography('heading', 'lg');   // Subheadings
      case 5: return getTypography('heading', 'md');   // Small headings
      case 6: return getTypography('heading', 'sm');   // Tiny headings
      default: return getTypography('heading', 'xl');
    }
  };

  return (
    <Text
      style={[
        getLevelStyle(),
        { color },
        styles.heading,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

// === BODY TEXT COMPONENT (Inter) ===
export const BodyText = ({
  children,
  size = 'md',         // xs, sm, md, lg, xl
  weight = 'regular',  // regular, medium, bold
  color = theme.colors.text,
  style = {},
  ...props
}) => {
  const getWeightVariant = () => {
    switch (weight) {
      case 'medium': return 'bodyMedium';
      case 'bold': return 'bodyBold';
      default: return 'body';
    }
  };

  return (
    <Text
      style={[
        getTypography(getWeightVariant(), size),
        { color },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

// === SPECIALIZED TEXT COMPONENTS ===

// Brand Wordmark (INKED DRAW)
export const BrandText = ({
  children,
  style = {},
  ...props
}) => (
  <Heading
    level={1}
    style={[
      styles.brandText,
      style,
    ]}
    {...props}
  >
    {children}
  </Heading>
);

// Caption text for images and secondary info
export const Caption = ({
  children,
  style = {},
  ...props
}) => (
  <BodyText
    size="sm"
    color={theme.colors.textSecondary}
    style={[
      styles.caption,
      style,
    ]}
    {...props}
  >
    {children}
  </BodyText>
);

// Label text for form fields and UI elements
export const Label = ({
  children,
  style = {},
  ...props
}) => (
  <BodyText
    size="sm"
    weight="medium"
    color={theme.colors.textSecondary}
    style={[
      styles.label,
      style,
    ]}
    {...props}
  >
    {children}
  </BodyText>
);

// Stats text for numbers and metrics
export const StatsText = ({
  children,
  style = {},
  ...props
}) => (
  <BodyText
    size="lg"
    weight="bold"
    color={theme.colors.premium}
    style={[
      styles.statsText,
      style,
    ]}
    {...props}
  >
    {children}
  </BodyText>
);

// Error text for validation messages
export const ErrorText = ({
  children,
  style = {},
  ...props
}) => (
  <BodyText
    size="sm"
    color={theme.colors.error}
    style={[
      styles.errorText,
      style,
    ]}
    {...props}
  >
    {children}
  </BodyText>
);

// Success text for confirmation messages
export const SuccessText = ({
  children,
  style = {},
  ...props
}) => (
  <BodyText
    size="sm"
    color={theme.colors.success}
    style={[
      styles.successText,
      style,
    ]}
    {...props}
  >
    {children}
  </BodyText>
);

const styles = StyleSheet.create({
  heading: {
    marginBottom: theme.spacing.sm,
  },
  brandText: {
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: theme.spacing.lg,
  },
  caption: {
    lineHeight: theme.typography.lineHeights.sm * 1.2,
    marginTop: theme.spacing.xs,
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.xs,
  },
  statsText: {
    textAlign: 'center',
  },
  errorText: {
    marginTop: theme.spacing.xs,
  },
  successText: {
    marginTop: theme.spacing.xs,
  },
});

// === USAGE EXAMPLES ===
/*

// Headings
<Heading level={1}>INKED DRAW</Heading>
<Heading level={2}>Welcome Back</Heading>
<Heading level={3}>My Collections</Heading>

// Body Text
<BodyText>Regular body text content</BodyText>
<BodyText weight="medium">Medium weight text</BodyText>
<BodyText weight="bold" size="lg">Bold large text</BodyText>

// Specialized Components
<BrandText>INKED DRAW</BrandText>
<Caption>Posted 2 hours ago</Caption>
<Label>Email Address</Label>
<StatsText>142 Cigars</StatsText>
<ErrorText>Please enter a valid email</ErrorText>
<SuccessText>Account created successfully!</SuccessText>

// Custom styling
<BodyText 
  size="lg" 
  color={theme.colors.premium}
  style={{ textAlign: 'center' }}
>
  Premium content
</BodyText>

*/
