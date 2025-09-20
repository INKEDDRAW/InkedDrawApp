# Content Moderation System Guide

## Overview

The Inked Draw content moderation system provides comprehensive, AI-powered content analysis and community-driven moderation to ensure a safe, high-quality environment for connoisseurs of cigars, craft beer, and fine wine.

## Architecture

### Backend Services

#### ModerationService
- **Main orchestrator** for content moderation
- Combines AI analysis, rule-based filtering, and human review
- Supports bulk moderation for performance
- Tracks confidence scores and processing metrics

#### TextModerationService
- **AI-powered text analysis** using multiple techniques:
  - Toxicity detection with sentiment analysis
  - Profanity filtering with comprehensive word lists
  - Spam detection using pattern matching
  - Hate speech identification
  - Personal information exposure detection
- **Confidence scoring** based on multiple factors
- **Contextual analysis** for platform relevance

#### ImageModerationService
- **AI-powered image analysis** (integrates with Google Vision API, AWS Rekognition)
- **Content detection** for adult content, violence, inappropriate material
- **Quality assessment** and manipulation detection
- **OCR text extraction** for embedded text moderation
- **Batch processing** with rate limiting

#### UserReportingService
- **Community-driven moderation** with user reports
- **Priority-based triage** (urgent, high, medium, low)
- **Evidence collection** and duplicate detection
- **Resolution tracking** with moderator actions
- **Appeal system** for disputed decisions

#### AutoModerationService
- **Rule-based automatic actions** with configurable rules
- **Behavioral analysis** for suspicious user patterns
- **Spam detection** with multiple pattern matching
- **Rate limiting** and excessive posting prevention
- **User risk scoring** based on history

#### ModerationQueueService
- **Human review queue** management
- **Priority-based assignment** to moderators
- **Workload balancing** across review team
- **SLA tracking** with wait time metrics
- **Escalation workflows** for complex cases

### Database Schema

#### Core Tables
- `moderation_results` - AI and manual moderation decisions
- `user_reports` - Community-submitted reports
- `moderation_queue` - Items requiring human review
- `moderation_appeals` - Appeals of moderation decisions
- `auto_moderation_rules` - Configurable automation rules

#### Performance Optimizations
- **Comprehensive indexing** for fast queries
- **Full-text search** for content analysis
- **Materialized views** for dashboard statistics
- **Automatic cleanup** of old data

## Features

### AI-Powered Content Analysis

#### Text Moderation
```typescript
// Comprehensive text analysis
const textResult = await textModerationService.moderateText(content);
// Returns: toxicity, profanity, spam, hate, harassment scores
```

#### Image Moderation
```typescript
// AI image analysis
const imageResult = await imageModerationService.moderateImage(imageUrl);
// Returns: adult, violence, racy content detection
```

#### Content Quality Assessment
```typescript
// Quality metrics analysis
const qualityMetrics = await contentAnalysisService.analyzeContent(content);
// Returns: readability, coherence, relevance, originality scores
```

### User Reporting System

#### Report Submission
```typescript
// Submit user report
const report = await userReportingService.submitReport({
  reportType: 'harassment',
  reason: 'User is sending threatening messages',
  evidence: ['screenshot1.png', 'message_link'],
  contentId: 'post_123',
});
```

#### Report Categories
- **Spam** - Unwanted commercial content
- **Harassment** - Bullying, threats, targeted harassment
- **Hate Speech** - Content promoting hatred or discrimination
- **Violence** - Threats or graphic violent content
- **Inappropriate Content** - Sexual content, nudity
- **Fake Account** - Impersonation or fake profiles
- **Copyright** - Unauthorized use of copyrighted material
- **Other** - Other community guideline violations

### Moderation Queue

#### Queue Management
```typescript
// Get pending items for review
const queueItems = await moderationQueueService.getQueueItems({
  status: 'pending',
  priority: 'high',
  limit: 50,
});
```

#### Review Workflow
1. **Auto-assignment** based on moderator workload
2. **Priority-based ordering** (urgent → high → medium → low)
3. **Review interface** with content preview and context
4. **Decision tracking** with notes and reasoning
5. **Appeal handling** for disputed decisions

### Auto-Moderation Rules

#### Built-in Rules
- **Spam Detection** - Pattern-based spam identification
- **Excessive Posting** - Rate limiting (>10 posts/hour)
- **New User Restrictions** - Enhanced review for new accounts
- **Multiple Reports** - Auto-hide content with 3+ reports
- **Suspicious Links** - Flag shortened URLs and suspicious domains
- **Duplicate Content** - Prevent content reposting

#### Custom Rules
```typescript
// Create custom moderation rule
const rule = {
  name: 'High-Risk User Content',
  condition: 'user_risk_score > 0.8',
  action: 'require_approval',
  severity: 'high',
};
```

## Frontend Integration

### React Hooks

#### useModeration Hook
```typescript
const {
  moderateContent,
  submitReport,
  appealModeration,
  useReportsQuery,
  useQueueQuery,
  isLoading,
} = useModeration();
```

### UI Components

#### ReportModal
- **User-friendly reporting interface**
- **Evidence collection** with file uploads
- **Report type selection** with descriptions
- **Real-time validation** and submission

#### ModerationDashboard
- **Comprehensive statistics** and metrics
- **Recent reports** and queue items
- **Time-range filtering** (24h, 7d, 30d)
- **Quick action buttons** for common tasks

#### ContentModerationIndicator
- **Real-time moderation status** display
- **Report button** for community moderation
- **Appeal interface** for disputed decisions
- **Moderator actions** for privileged users

## API Endpoints

### Content Moderation
```
POST /moderation/moderate
POST /moderation/moderate/bulk
GET  /moderation/status/:contentId/:contentType
POST /moderation/appeal
```

### User Reports
```
POST /moderation/report
GET  /moderation/reports (moderators only)
PUT  /moderation/reports/:reportId/resolve (moderators only)
```

### Moderation Queue
```
GET  /moderation/queue (moderators only)
PUT  /moderation/queue/:queueItemId/assign (moderators only)
PUT  /moderation/queue/:queueItemId/review (moderators only)
```

### Statistics & Management
```
GET  /moderation/statistics (moderators only)
GET  /moderation/rules (moderators only)
PUT  /moderation/rules/:ruleId (admins only)
GET  /moderation/health
```

## Configuration

### Environment Variables
```env
# AI Services (optional - falls back to rule-based)
GOOGLE_VISION_API_KEY=your_api_key
AWS_REKOGNITION_ACCESS_KEY=your_access_key
AWS_REKOGNITION_SECRET_KEY=your_secret_key

# Moderation Settings
MODERATION_AUTO_APPROVE_THRESHOLD=0.8
MODERATION_AUTO_REJECT_THRESHOLD=0.3
MODERATION_REQUIRE_REVIEW_THRESHOLD=0.6

# Rate Limits
MODERATION_MAX_POSTS_PER_HOUR=10
MODERATION_MAX_REPORTS_PER_DAY=20
```

### Database Configuration
```sql
-- Enable moderation features
UPDATE user_profiles SET is_moderator = true WHERE user_id = 'moderator_user_id';
UPDATE user_profiles SET is_admin = true WHERE user_id = 'admin_user_id';

-- Configure auto-moderation rules
UPDATE auto_moderation_rules SET is_active = true WHERE rule_type = 'spam_detection';
```

## Security & Privacy

### Data Protection
- **Encrypted storage** of sensitive moderation data
- **Access controls** with role-based permissions
- **Audit logging** of all moderation actions
- **Data retention** policies with automatic cleanup

### Privacy Considerations
- **Anonymized reporting** options available
- **GDPR compliance** with data deletion rights
- **Minimal data collection** for moderation purposes
- **Secure evidence handling** with encryption

## Performance & Scalability

### Optimization Strategies
- **Batch processing** for bulk moderation
- **Caching** of moderation results
- **Database indexing** for fast queries
- **Rate limiting** to prevent abuse
- **Background job processing** for heavy tasks

### Monitoring & Metrics
- **Processing time** tracking
- **Confidence score** distributions
- **False positive/negative** rates
- **Moderator workload** balancing
- **System health** monitoring

## Best Practices

### Content Guidelines
1. **Clear community standards** with examples
2. **Graduated enforcement** (warning → suspension → ban)
3. **Transparent appeals process** with timely responses
4. **Regular policy updates** based on community feedback

### Moderation Workflow
1. **AI-first screening** for efficiency
2. **Human review** for edge cases
3. **Community reporting** for distributed monitoring
4. **Regular audits** of moderation decisions
5. **Continuous improvement** based on metrics

### User Experience
1. **Clear feedback** on moderation decisions
2. **Educational messaging** about community standards
3. **Easy reporting** mechanisms
4. **Timely resolution** of appeals
5. **Consistent enforcement** across all content

## Troubleshooting

### Common Issues
- **High false positive rates** → Adjust confidence thresholds
- **Slow processing times** → Enable batch processing
- **Moderator overload** → Implement auto-assignment
- **User complaints** → Review appeal process

### Monitoring Alerts
- **Queue backlog** > 100 items
- **Processing time** > 5 seconds
- **Error rate** > 5%
- **Appeal response time** > 24 hours

This comprehensive moderation system ensures Inked Draw maintains a premium, safe environment while scaling efficiently with the community's growth.
