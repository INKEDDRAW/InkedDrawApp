# Inked Draw Design System

A sophisticated design system for connoisseurs of cigars, craft beer, and fine wine. This design system implements the specifications from `State-Styles.md` and provides a comprehensive set of design tokens and components.

## Overview

The Inked Draw design system is built around a dark, warm, and sophisticated palette designed to feel like a private lounge or cellar. It combines classic typography with modern interaction patterns to create a premium user experience.

## Architecture

```
src/theme/
├── index.ts          # Main theme export
├── colors.ts         # Color palette
├── typography.ts     # Typography system
├── spacing.ts        # Spacing and layout
├── animations.ts     # Animation system
├── fonts.ts          # Font configuration
├── ThemeProvider.tsx # React context provider
└── README.md         # This file
```

## Usage

### Basic Setup

```tsx
import { ThemeProvider } from './src/theme/ThemeProvider';
import { useInkedTheme } from './src/theme/ThemeProvider';

// Wrap your app with ThemeProvider
function App() {
  return (
    <ThemeProvider>
      <YourApp />
    </ThemeProvider>
  );
}

// Use theme in components
function MyComponent() {
  const theme = useInkedTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.background.primary }}>
      <Text style={theme.textStyles.h1}>Hello World</Text>
    </View>
  );
}
```

### Using UI Components

```tsx
import { Button, Card, Input, H1, Body } from './src/components/ui';

function MyScreen() {
  return (
    <Card>
      <H1>Welcome to Inked Draw</H1>
      <Body>A premium social community for connoisseurs.</Body>
      <Input label="Email" placeholder="Enter your email" />
      <Button title="Get Started" onPress={() => {}} variant="primary" />
    </Card>
  );
}
```

## Design Tokens

### Colors

- **Primary**: Onyx (#121212), Charcoal (#1E1E1E), Alabaster (#EAEAEA)
- **Accent**: Gold Leaf (#C4A464), Gold Leaf Light (#D4B880)
- **Functional**: Success Green (#3A8E5A), Error Red (#C75450), Warning Amber (#D9A05B)
- **Neutral**: 700 (#333333), 500 (#888888)

### Typography

- **Heading Font**: Lora (serif) - for titles and headings
- **Body Font**: Inter (sans-serif) - for UI text and body copy
- **Scale**: 12px to 28px with corresponding line heights

### Spacing

- **Grid System**: 8px base unit
- **Semantic Spacing**: xs (4px) to 2xl (40px)
- **Component Dimensions**: Standardized button heights (50px), card padding (16px)

### Animations

- **Duration**: 300ms standard transition
- **Easing**: ease-in-out curve
- **Special**: Spring physics for modals, cross-fade for screens

## Components

### Button
- Primary: Gold Leaf background with Onyx text
- Secondary: Transparent with border
- States: Default, hover, active, disabled, loading

### Card
- Charcoal background (#1E1E1E)
- 12px border radius
- 16px padding
- Optional elevation with shadows

### Input
- Transparent background
- Bottom border that animates to Gold Leaf on focus
- Label positioning above input
- Error state support

### Typography
- H1: Screen titles (Lora, 28px)
- H2: Section headers (Lora, 22px)
- H3: Card titles (Inter Semibold, 18px)
- Body: Regular text (Inter, 16px)
- Body Secondary: Metadata (Inter, 14px)
- Label: Form labels (Inter, 12px, uppercase)
- Caption: Small text (Inter, 12px)

## Storybook Integration

The design system includes Storybook stories for component documentation:

```bash
npm run storybook-generate
```

## Best Practices

1. **Always use theme tokens** instead of hardcoded values
2. **Prefer semantic spacing** over raw pixel values
3. **Use typography components** instead of raw Text components
4. **Follow the 8px grid system** for consistent spacing
5. **Test components in both light and dark modes** (though dark is primary)

## Accessibility

- High contrast ratios between text and backgrounds
- Focus states for all interactive elements
- Screen reader support with proper labels
- Dynamic type support for font scaling

## Performance

- Theme tokens are memoized for performance
- Components use React.memo where appropriate
- Animations use native driver when possible
