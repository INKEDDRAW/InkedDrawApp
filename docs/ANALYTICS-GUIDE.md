# Analytics & Event Tracking Guide

This document outlines the comprehensive analytics system implemented for Inked Draw using PostHog, providing detailed user behavior tracking, feature flags, and business intelligence.

## 🎯 Overview

The analytics system captures user interactions, product engagement, social behavior, and business metrics to provide insights for product optimization and growth strategies.

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Mobile App    │───▶│   Backend API    │───▶│   PostHog API   │
│                 │    │                  │    │                 │
│ • Auto Tracking │    │ • Event Capture  │    │ • Data Storage  │
│ • Manual Events │    │ • User Identity  │    │ • Analytics     │
│ • Feature Flags │    │ • Middleware     │    │ • Feature Flags │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   PostHog UI     │
                       │                  │
                       │ • Dashboards     │
                       │ • Insights       │
                       │ • A/B Testing    │
                       └──────────────────┘
```

## 🔧 Backend Implementation

### Core Services

#### 1. PostHogService (`backend/src/analytics/posthog.service.ts`)
- **Purpose**: Direct integration with PostHog API
- **Key Methods**:
  - `capture()`: Track events with properties
  - `identify()`: Set user properties and identity
  - `setUserProperties()`: Update user attributes
  - `getFeatureFlag()`: Check feature flag status
  - `trackConversion()`: Track conversion events
  - `trackRevenue()`: Track revenue and monetization

#### 2. AnalyticsService (`backend/src/analytics/analytics.service.ts`)
- **Purpose**: High-level business logic for analytics
- **Key Methods**:
  - `trackUserRegistration()`: Complete user onboarding tracking
  - `trackProductInteraction()`: Product engagement analytics
  - `trackSocialInteraction()`: Social feature usage
  - `trackAgeVerification()`: Compliance and verification flow
  - `trackSubscription()`: Monetization and subscription events

#### 3. AnalyticsMiddleware (`backend/src/analytics/middleware/analytics.middleware.ts`)
- **Purpose**: Automatic API request/response tracking
- **Features**:
  - Request/response time monitoring
  - Error rate tracking
  - Performance metrics collection
  - User activity monitoring

### Event Categories

#### User Lifecycle Events
```typescript
// Registration and authentication
trackUserRegistration(userId, userProfile, source)
trackUserLogin(userId, method)
trackUserLogout(userId, sessionDuration)

// Age verification compliance
trackAgeVerification(userId, status, metadata)

// Onboarding flow
trackOnboardingStep(userId, step, completed, stepNumber)
```

#### Product Engagement Events
```typescript
// Product interactions
trackProductInteraction(userId, {
  productId: 'cigar-123',
  productType: 'cigar',
  action: 'view' | 'like' | 'review' | 'share' | 'purchase',
  rating?: number,
  price?: number,
  brand?: string,
  category?: string
})

// Search behavior
trackSearch(userId, query, category, resultsCount)
```

#### Social Interaction Events
```typescript
// Social features
trackSocialInteraction(userId, {
  action: 'follow' | 'unfollow' | 'like' | 'comment' | 'share' | 'post_create',
  targetUserId?: string,
  postId?: string,
  commentId?: string,
  content_type?: 'text' | 'image' | 'video'
})
```

#### Business & Monetization Events
```typescript
// Subscription tracking
trackSubscription(userId, action, tier, price)

// Revenue tracking
trackRevenue(userId, amount, currency, properties)

// Conversion tracking
trackConversion(userId, conversionType, value, properties)
```

## 📱 Frontend Implementation

### Core Components

#### 1. AnalyticsContext (`frontend/src/contexts/AnalyticsContext.tsx`)
- **Purpose**: Global analytics state management
- **Features**:
  - Event tracking methods
  - Feature flag management
  - API integration
  - Error handling

#### 2. Screen Tracking Hooks (`frontend/src/hooks/useScreenTracking.ts`)
- **Purpose**: Automatic and manual screen tracking
- **Hooks Available**:
  - `useScreenTracking()`: Automatic screen view tracking
  - `useInteractionTracking()`: User interaction tracking
  - `useTimeTracking()`: Time spent on screen tracking

### Usage Examples

#### Basic Event Tracking
```tsx
import { useAnalytics } from '../contexts/AnalyticsContext';

const CigarScreen = () => {
  const { trackProductInteraction, trackScreenView } = useAnalytics();

  useEffect(() => {
    trackScreenView('CigarCatalogScreen', {
      category: 'cigars',
      filter: 'premium'
    });
  }, []);

  const handleCigarView = (cigar) => {
    trackProductInteraction({
      productId: cigar.id,
      productType: 'cigar',
      action: 'view',
      brand: cigar.brand,
      category: cigar.category
    });
  };
};
```

#### Automatic Screen Tracking
```tsx
import { useScreenTracking } from '../hooks/useScreenTracking';

const ProfileScreen = () => {
  useScreenTracking({
    screenName: 'ProfileScreen',
    properties: { tab: 'preferences' },
    trackOnMount: true,
    trackOnFocus: true
  });

  return <ProfileContent />;
};
```

#### Feature Flags Usage
```tsx
import { useAnalytics } from '../contexts/AnalyticsContext';

const ExperimentalFeature = () => {
  const { isFeatureEnabled } = useAnalytics();
  
  if (!isFeatureEnabled('new_ui_experiment')) {
    return <OldUIComponent />;
  }
  
  return <NewUIComponent />;
};
```

## 🔐 Privacy & Compliance

### Data Collection Principles
- **User Consent**: Clear opt-in/opt-out mechanisms
- **Data Minimization**: Only collect necessary analytics data
- **Anonymization**: Personal data anonymized where possible
- **Retention Limits**: Automatic data expiry and cleanup

### GDPR Compliance
- **Right to Access**: Users can view their analytics data
- **Right to Deletion**: Complete data removal on request
- **Data Portability**: Export user analytics data
- **Consent Management**: Granular consent controls

### Privacy Controls
```typescript
// User privacy settings
interface PrivacySettings {
  analytics_enabled: boolean;
  performance_tracking: boolean;
  error_reporting: boolean;
  feature_flags: boolean;
}
```

## 📊 Key Metrics & KPIs

### User Engagement Metrics
- **Daily/Monthly Active Users (DAU/MAU)**
- **Session Duration**: Average time spent in app
- **Screen Views**: Most visited screens and user flows
- **Feature Adoption**: Usage rates of key features
- **Retention Rates**: User return patterns

### Product Metrics
- **Product Views**: Most viewed cigars, beers, wines
- **Engagement Rate**: Likes, reviews, shares per product
- **Search Behavior**: Popular search terms and categories
- **Conversion Funnel**: View → Like → Review → Purchase

### Social Metrics
- **Social Interactions**: Follows, likes, comments, shares
- **Content Creation**: Posts, reviews, photos shared
- **Community Growth**: Network effects and viral coefficients
- **Engagement Quality**: Time spent on social features

### Business Metrics
- **Subscription Conversion**: Free to paid conversion rates
- **Revenue Per User (ARPU)**: Average revenue metrics
- **Churn Rate**: User retention and subscription cancellations
- **Customer Lifetime Value (CLV)**: Long-term user value

## 🚀 PostHog Configuration

### Project Setup
1. **Create PostHog Account**: Sign up at posthog.com
2. **Create Project**: Set up "Inked Draw" project
3. **Get API Keys**: Project API key and Personal API key
4. **Configure Environment**: Add keys to backend .env

### Feature Flags Setup
```javascript
// Example feature flags in PostHog
{
  "new_ui_experiment": {
    "enabled": true,
    "rollout_percentage": 50,
    "filters": {
      "age_verified": true,
      "subscription_tier": ["premium", "premium_plus"]
    }
  },
  "advanced_search": {
    "enabled": true,
    "rollout_percentage": 100
  },
  "social_features_v2": {
    "enabled": false,
    "rollout_percentage": 0
  }
}
```

### Dashboard Configuration
- **User Journey Dashboard**: Registration → Verification → Engagement
- **Product Analytics Dashboard**: Views, ratings, purchases by category
- **Social Engagement Dashboard**: Posts, interactions, community growth
- **Business Metrics Dashboard**: Revenue, subscriptions, churn
- **Performance Dashboard**: API response times, error rates

## 🧪 A/B Testing

### Experiment Examples
```typescript
// UI/UX Experiments
const experimentVariant = await getFeatureFlag(userId, 'checkout_flow_experiment');
if (experimentVariant === 'variant_a') {
  return <SinglePageCheckout />;
} else {
  return <MultiStepCheckout />;
}

// Feature Experiments
const hasAdvancedFilters = await isFeatureEnabled(userId, 'advanced_product_filters');
if (hasAdvancedFilters) {
  trackFeatureUsage(userId, 'advanced_filters', 'enabled');
  return <AdvancedFilterComponent />;
}
```

### Experiment Tracking
- **Variant Assignment**: Track which users see which variants
- **Conversion Tracking**: Measure experiment success metrics
- **Statistical Significance**: Ensure reliable results
- **Rollout Management**: Gradual feature rollouts

## 🔧 Development & Testing

### Environment Configuration
```bash
# Backend Environment Variables
POSTHOG_API_KEY="phc_your_project_api_key"
POSTHOG_HOST="https://app.posthog.com"
POSTHOG_PERSONAL_API_KEY="phx_your_personal_api_key"
```

### Testing Analytics
```bash
# Test analytics system
cd backend
npm run test:analytics

# Test specific components
npm run test -- --grep "analytics"
```

### Debug Mode
```typescript
// Enable debug logging
const analytics = new AnalyticsService(posthogService);
analytics.setDebugMode(true);

// View events in console
console.log('Analytics event:', event, properties);
```

## 📈 Performance Optimization

### Event Batching
- **Batch Size**: 20 events per batch
- **Flush Interval**: 10 seconds
- **Memory Management**: Automatic cleanup of old events
- **Network Optimization**: Compress event payloads

### Caching Strategy
- **Feature Flags**: Cache for 5 minutes
- **User Properties**: Cache for 1 hour
- **Analytics Config**: Cache for 24 hours

### Error Handling
- **Graceful Degradation**: App continues if analytics fails
- **Retry Logic**: Automatic retry for failed events
- **Fallback Tracking**: Local storage backup for offline events

## 🛠️ Troubleshooting

### Common Issues

#### 1. Events Not Appearing
- **Check API Keys**: Verify PostHog configuration
- **Network Issues**: Check connectivity and firewall
- **Event Format**: Validate event structure and properties

#### 2. Feature Flags Not Working
- **Cache Issues**: Clear feature flag cache
- **User Identity**: Ensure user is properly identified
- **Flag Configuration**: Check PostHog dashboard settings

#### 3. Performance Issues
- **Batch Size**: Reduce batch size if memory issues
- **Flush Frequency**: Adjust flush interval
- **Event Volume**: Monitor event rate and optimize

### Debug Commands
```bash
# Check analytics health
curl https://api.inked-draw.com/analytics/health

# Test event tracking
curl -X POST https://api.inked-draw.com/analytics/track/event \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event": "test_event", "properties": {"test": true}}'

# Get feature flags
curl -H "Authorization: Bearer $TOKEN" \
  https://api.inked-draw.com/analytics/feature-flags
```

This analytics system provides comprehensive insights into user behavior, product engagement, and business performance while maintaining user privacy and enabling data-driven decision making for the Inked Draw platform.
