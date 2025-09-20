# Age Verification System Guide

This document outlines the comprehensive age verification system implemented for Inked Draw, ensuring legal compliance for alcohol and tobacco-related content.

## 🎯 Overview

The age verification system uses Veriff's identity verification service to ensure users are 21 years or older before accessing premium content related to cigars, craft beer, and fine wine.

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Mobile App    │───▶│   Backend API    │───▶│   Veriff API    │
│                 │    │                  │    │                 │
│ • Age Gate      │    │ • Session Mgmt   │    │ • ID Scanning   │
│ • Verification  │    │ • Webhook        │    │ • Face Match    │
│ • Status Check  │    │ • Compliance     │    │ • Age Extract   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Supabase DB    │
                       │                  │
                       │ • Verifications  │
                       │ • Audit Logs     │
                       │ • User Status    │
                       └──────────────────┘
```

## 🔧 Backend Implementation

### Core Services

#### 1. VeriffService (`backend/src/age-verification/veriff.service.ts`)
- **Purpose**: Direct integration with Veriff API
- **Key Methods**:
  - `createSession()`: Start verification process
  - `getDecision()`: Retrieve verification results
  - `validateDocument()`: Extract and validate age data
  - `verifyWebhookSignature()`: Secure webhook processing

#### 2. AgeVerificationService (`backend/src/age-verification/age-verification.service.ts`)
- **Purpose**: Business logic and database management
- **Key Methods**:
  - `startVerification()`: Initiate verification flow
  - `processWebhook()`: Handle Veriff callbacks
  - `getVerificationStatus()`: Check user verification state
  - `isUserAgeVerified()`: Quick verification check

### Database Schema

#### age_verifications Table
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key to auth.users)
- session_id: VARCHAR (Veriff session ID)
- status: ENUM ('pending', 'approved', 'rejected', 'expired')
- verification_method: ENUM ('veriff', 'manual')
- date_of_birth: DATE
- age: INTEGER
- document_type: VARCHAR
- document_number: VARCHAR (encrypted)
- nationality: VARCHAR
- verified_at: TIMESTAMPTZ
- expires_at: TIMESTAMPTZ
- attempts: INTEGER
- max_attempts: INTEGER (default: 3)
- metadata: JSONB
```

#### verification_audit_log Table
```sql
- id: UUID (Primary Key)
- user_id: UUID
- verification_id: UUID
- action: VARCHAR
- old_status: VARCHAR
- new_status: VARCHAR
- performed_by: UUID
- ip_address: INET
- user_agent: TEXT
- metadata: JSONB
```

### API Endpoints

#### POST /age-verification/start
- **Purpose**: Start verification process
- **Auth**: Required (JWT)
- **Body**: `{ callbackUrl?: string, language?: string }`
- **Response**: Verification URL and session details

#### GET /age-verification/status
- **Purpose**: Get current verification status
- **Auth**: Required (JWT)
- **Response**: Verification status and details

#### POST /age-verification/webhook
- **Purpose**: Receive Veriff callbacks
- **Auth**: HMAC signature verification
- **Body**: Veriff decision payload

#### GET /age-verification/history
- **Purpose**: Get verification history
- **Auth**: Required (JWT)
- **Response**: Array of verification attempts

## 📱 Frontend Implementation

### Core Components

#### 1. AgeVerificationContext (`frontend/src/contexts/AgeVerificationContext.tsx`)
- **Purpose**: Global state management for verification
- **Features**:
  - Verification status tracking
  - API integration
  - Real-time status updates

#### 2. AgeVerificationScreen (`frontend/src/screens/verification/AgeVerificationScreen.tsx`)
- **Purpose**: Main verification interface
- **Features**:
  - Process explanation
  - Verification initiation
  - Status monitoring
  - Error handling

#### 3. AgeGate Component (`frontend/src/components/AgeGate.tsx`)
- **Purpose**: Content protection wrapper
- **Features**:
  - Automatic verification checking
  - Content restriction
  - Verification prompts

### Usage Examples

#### Protecting Content with AgeGate
```tsx
import { AgeGate } from '../components/AgeGate';

const PremiumContent = () => (
  <AgeGate requireVerification={true}>
    <CigarCatalog />
    <BeerReviews />
    <WineCollection />
  </AgeGate>
);
```

#### Using Higher-Order Component
```tsx
import { withAgeGate } from '../components/AgeGate';

const ProtectedCigarScreen = withAgeGate(CigarScreen, {
  requireVerification: true,
  fallbackContent: <CustomRestrictedMessage />
});
```

## 🔒 Security & Compliance

### Data Protection
- **Encryption**: All personal data encrypted at rest
- **Minimal Storage**: Only necessary verification data stored
- **Automatic Expiry**: Verification expires after 1 year
- **Audit Trail**: Complete verification history logged

### Privacy Compliance
- **GDPR Compliant**: Right to deletion and data portability
- **CCPA Compliant**: California privacy rights respected
- **Data Minimization**: Only collect required verification data
- **Consent Management**: Clear consent for data processing

### Security Measures
- **HMAC Verification**: Webhook signature validation
- **Rate Limiting**: Maximum 3 attempts per 30 days
- **Session Security**: Secure session management
- **Input Validation**: Comprehensive data validation

## 🚀 Deployment & Configuration

### Environment Variables

#### Backend Configuration
```bash
# Veriff API Configuration
VERIFF_API_KEY="your-veriff-api-key"
VERIFF_SECRET_KEY="your-veriff-secret-key"

# API Configuration
API_BASE_URL="https://api.inked-draw.com"
```

#### Frontend Configuration
```bash
# API Endpoint
EXPO_PUBLIC_API_URL="https://api.inked-draw.com"
```

### Database Migration
```bash
# Run age verification migration
cd backend
npm run db:migrate
# Or manually execute: backend/supabase/migrations/003_age_verification_tables.sql
```

### Testing
```bash
# Test age verification system
cd backend
npm run test:age-verification

# Test Veriff connectivity
npm run test:supabase
```

## 📊 Monitoring & Analytics

### Key Metrics
- **Verification Success Rate**: Percentage of successful verifications
- **Average Completion Time**: Time from start to completion
- **Rejection Reasons**: Common failure patterns
- **Geographic Distribution**: Verification by country/region

### Compliance Reporting
- **Daily Verification Reports**: Automated compliance reports
- **Audit Trail Export**: Complete verification history
- **Age Distribution**: Anonymous age statistics
- **Document Type Analysis**: ID document usage patterns

## 🛠️ Troubleshooting

### Common Issues

#### 1. Verification Fails
- **Cause**: Poor image quality, expired ID, underage user
- **Solution**: Clear instructions, retry mechanism, support contact

#### 2. Webhook Not Received
- **Cause**: Network issues, invalid signature, server downtime
- **Solution**: Retry mechanism, webhook validation, monitoring

#### 3. Session Expired
- **Cause**: User took too long to complete verification
- **Solution**: Clear expiry communication, easy restart process

### Debug Commands
```bash
# Check verification status
curl -H "Authorization: Bearer $TOKEN" \
  https://api.inked-draw.com/age-verification/status

# Test webhook endpoint
curl -X POST https://api.inked-draw.com/age-verification/webhook \
  -H "Content-Type: application/json" \
  -H "X-HMAC-SIGNATURE: test-signature" \
  -d '{"test": "data"}'

# Health check
curl https://api.inked-draw.com/age-verification/health
```

## 📋 Legal Considerations

### Age Requirements
- **United States**: 21 years minimum for tobacco and alcohol content
- **International**: Varies by jurisdiction (18-21 years)
- **Compliance**: Automatic age calculation and validation

### Document Acceptance
- **Government-Issued ID**: Driver's license, passport, national ID
- **Biometric Verification**: Face matching for identity confirmation
- **Document Validation**: Authenticity and tampering detection

### Data Retention
- **Verification Records**: Retained for compliance (typically 3-7 years)
- **Personal Data**: Minimized and encrypted storage
- **Audit Logs**: Complete verification history for compliance

## 🔄 Maintenance

### Regular Tasks
- **Weekly**: Review verification success rates and failure patterns
- **Monthly**: Update supported countries and document types
- **Quarterly**: Compliance audit and data retention review
- **Annually**: Security assessment and penetration testing

### Updates & Patches
- **Veriff SDK**: Regular updates for security and features
- **Compliance Rules**: Updates for changing legal requirements
- **Security Patches**: Immediate application of security updates

This age verification system ensures legal compliance while providing a smooth user experience for accessing premium content on Inked Draw.
