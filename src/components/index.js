/**
 * INKED DRAW Component Library
 * 
 * Centralized export for all reusable components
 * Following luxury design system with consistent theming
 */

// === CORE COMPONENTS ===
export { default as Button } from './Button';
export { default as Card } from './Card';
export { default as Icon, TabIcon, SocialIcon, PremiumIcon, NavIcon, AVAILABLE_ICONS } from './Icon';
export { default as ScanResultModal } from './ScanResultModal';

// === TYPOGRAPHY COMPONENTS ===
export {
  Heading,
  BodyText,
  BrandText,
  Caption,
  Label,
  StatsText,
  ErrorText,
  SuccessText,
} from './Typography';

// === THEME SYSTEM ===
export {
  theme,
  getSpacing,
  getTypography,
  getButtonStyle,
  getCardStyle
} from '../theme';

// === COMPONENT USAGE GUIDE ===
/*

DESIGN PRINCIPLES:
- Private member's lounge aesthetic
- Leather-bound journal feel  
- Deliberate, weighty motion (no bouncy animations)
- Premium, tactile, sophisticated

COLOR PALETTE:
- Background: #1A1A1A (Charcoal Gray)
- Surface: #2C2C2E (Surface Gray)
- Text: #F4F1ED (Parchment White)
- Primary: #c3a154 (Golden Brass)
- Secondary: #2A2A2A (Charcoal)
- Premium: #c3a154 (Golden Brass)

TYPOGRAPHY:
- Headings: Playfair Display (Bold, 700)
- Body/UI: Inter (Regular 400, Medium 500, Bold 700)

COMPONENT SPECIFICATIONS:
- Buttons: 8dp corner radius, 48dp height
- Cards: 12dp corner radius, "precisely cut tiles"
- Icons: 1.5dp stroke, 24dp size
- Spacing: 8dp grid system
- Touch targets: Minimum 44dp

USAGE EXAMPLES:

// Buttons
<Button title="SIGN UP" variant="primary" onPress={handleSignUp} />
<Button title="UPGRADE" variant="premium" onPress={handleUpgrade} />

// Cards
<Card variant="collection" imageSource={humidorImage} onPress={handlePress}>
  <Heading level={3}>My Virtual Humidor</Heading>
  <StatsText>142 Cigars | $8,400 Value</StatsText>
</Card>

// Typography
<BrandText>INKED DRAW</BrandText>
<Heading level={2}>Welcome Back</Heading>
<BodyText weight="medium">Enjoying a fantastic Opus X...</BodyText>

// Icons
<Icon name="home" size="medium" />
<TabIcon name="collections" active={true} />
<SocialIcon name="heart" active={true} count={24} />

*/
