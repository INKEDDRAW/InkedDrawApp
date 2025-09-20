# AI-Powered Recommendations System

## Overview

The Inked Draw AI-powered recommendations system provides intelligent, personalized product discovery using multiple machine learning algorithms. The system combines vector embeddings, collaborative filtering, and behavioral analysis to deliver highly relevant recommendations for cigars, beers, and wines.

## Architecture

### Core Components

```
AI Recommendation System
├── Vector Service (Similarity-based)
├── Collaborative Filtering (User & Item-based)
├── Personalization Service (Behavior-based)
├── Recommendation Service (Orchestrator)
└── Frontend Integration (React Native)
```

### Algorithm Stack

1. **Vector Embeddings**: Product similarity using 384-dimensional vectors
2. **Collaborative Filtering**: User-based and item-based recommendations
3. **Personalization**: Behavioral pattern analysis and preference learning
4. **Hybrid Approach**: Combines multiple algorithms for optimal results

## Key Features

### 🎯 **Personalized Recommendations**
- **User Preference Vectors**: Learn from rating history and behavior
- **Flavor Profile Matching**: Match products to user's taste preferences
- **Time-based Patterns**: Consider when users are most active
- **Social Influence**: Factor in recommendations from followed users

### 🤖 **Vector-Based Similarity**
- **Product Embeddings**: 384-dimensional vectors for each product
- **Cosine Similarity**: Find products with similar characteristics
- **Feature Engineering**: Extract meaningful features from product data
- **Real-time Similarity**: Fast vector operations using pgvector

### 👥 **Collaborative Filtering**
- **User-Based**: Find similar users and recommend their favorites
- **Item-Based**: Recommend products similar to user's rated items
- **Hybrid Approach**: Combine both methods for better accuracy
- **Cold Start Handling**: Special algorithms for new users

### 📊 **Advanced Analytics**
- **Recommendation Tracking**: Monitor performance and user engagement
- **Feedback Learning**: Improve recommendations based on user actions
- **A/B Testing**: Test different algorithms and parameters
- **Performance Metrics**: Precision, recall, diversity, and novelty

## Implementation Details

### Backend Services

#### Vector Service
```typescript
// Generate product embeddings
const embedding = await vectorService.generateProductEmbedding(product, 'cigar');

// Find similar products
const similar = await vectorService.findSimilarProducts('product-id', 'cigar', 10);

// Get personalized recommendations
const recommendations = await vectorService.getPersonalizedRecommendations('user-id', 20);
```

#### Collaborative Filtering
```typescript
// User-based recommendations
const userBased = await collaborativeService.getUserBasedRecommendations('user-id', 15);

// Item-based recommendations
const itemBased = await collaborativeService.getItemBasedRecommendations('user-id', 15);

// Hybrid approach
const hybrid = await collaborativeService.getHybridRecommendations('user-id', 20);
```

#### Personalization Service
```typescript
// Build user behavior profile
const profile = await personalizationService.buildUserBehaviorProfile('user-id', 90);

// Get personalized recommendations
const personalized = await personalizationService.getPersonalizedRecommendations('user-id', {
  productType: 'cigar',
  limit: 15,
  timeWindow: 90,
});
```

### Frontend Integration

#### Recommendations Screen
```typescript
const RecommendationsScreen = () => {
  const { recommendations, loading, refresh } = useRecommendations({
    productType: 'cigar',
    limit: 20,
    diversityWeight: 0.3,
    includeReasons: true,
  });

  return (
    <FlatList
      data={recommendations}
      renderItem={({ item }) => <RecommendationCard recommendation={item} />}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
    />
  );
};
```

#### Recommendation Hooks
```typescript
// Main recommendations hook
const { recommendations, loading, error } = useRecommendations();

// Similar products
const { data: similar } = useSimilarProducts('product-id', 'cigar');

// Trending products
const { data: trending } = useTrendingProducts('beer');

// User taste profile
const { data: profile } = useUserTasteProfile();

// Recommendation feedback
const feedback = useRecommendationFeedback();
```

## Database Schema

### Core Tables

```sql
-- Product embeddings for vector similarity
CREATE TABLE product_embeddings (
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL,
    product_type TEXT NOT NULL,
    embedding vector(384),
    characteristics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preference vectors
CREATE TABLE user_preference_vectors (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    vector_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recommendation history and tracking
CREATE TABLE recommendation_history (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    product_id UUID NOT NULL,
    product_type TEXT NOT NULL,
    algorithm TEXT NOT NULL,
    score DECIMAL(3,2),
    confidence DECIMAL(3,2),
    reason TEXT,
    shown_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User behavior analytics
CREATE TABLE user_behavior_analytics (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    behavior_type TEXT NOT NULL,
    product_id UUID,
    product_type TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Performance Indexes

```sql
-- Vector similarity index
CREATE INDEX idx_product_embeddings_embedding 
ON product_embeddings USING ivfflat (embedding vector_cosine_ops);

-- User recommendations index
CREATE INDEX idx_recommendation_history_user_shown 
ON recommendation_history(user_id, shown_at DESC);

-- Behavior analytics index
CREATE INDEX idx_user_behavior_user_type_created 
ON user_behavior_analytics(user_id, behavior_type, created_at DESC);
```

## Algorithm Details

### Vector Embeddings

#### Feature Extraction
```typescript
const extractProductFeatures = (product, productType) => {
  const features = [];
  
  switch (productType) {
    case 'cigar':
      features.push(
        mapStrengthToNumber(product.strength),
        product.ring_gauge / 100,
        product.length_inches / 10,
        mapPriceRangeToNumber(product.price_range),
        ...encodeOrigin(product.origin_country),
        ...encodeFlavorNotes(product.flavor_notes)
      );
      break;
    // Similar for beer and wine...
  }
  
  return normalizeFeatureVector(features);
};
```

#### Embedding Generation
```typescript
const createEmbeddingFromFeatures = async (features) => {
  const tensor = tf.tensor2d([features]);
  const normalized = tf.layerNormalization().apply(tensor);
  const dense1 = tf.layers.dense({ units: 256, activation: 'relu' }).apply(normalized);
  const embedding = tf.layers.dense({ units: 384, activation: 'tanh' }).apply(dense1);
  
  return Array.from(await embedding.data());
};
```

### Collaborative Filtering

#### User Similarity Calculation
```sql
-- Find users with similar taste using Pearson correlation
WITH user_ratings AS (
  SELECT product_id, product_type, rating
  FROM user_ratings
  WHERE user_id = $1
),
common_ratings AS (
  SELECT 
    ur.user_id,
    COUNT(*) as common_count,
    CORR(ur1.rating, ur.rating) as correlation
  FROM user_ratings ur
  JOIN user_ratings ur1 ON ur.product_id = ur1.product_id 
    AND ur.product_type = ur1.product_type
  WHERE ur1.user_id = $1 AND ur.user_id != $1
  GROUP BY ur.user_id
  HAVING COUNT(*) >= 3
)
SELECT user_id, correlation as similarity, common_count
FROM common_ratings
WHERE correlation >= 0.3
ORDER BY correlation DESC;
```

#### Item Similarity
```sql
-- Find products with similar user ratings
WITH product_ratings AS (
  SELECT user_id, rating
  FROM user_ratings
  WHERE product_id = $1 AND product_type = $2
),
similar_products AS (
  SELECT 
    ur.product_id,
    ur.product_type,
    CORR(pr.rating, ur.rating) as similarity,
    COUNT(*) as common_users
  FROM product_ratings pr
  JOIN user_ratings ur ON pr.user_id = ur.user_id
  WHERE (ur.product_id != $1 OR ur.product_type != $2)
  GROUP BY ur.product_id, ur.product_type
  HAVING COUNT(*) >= 3
)
SELECT * FROM similar_products
WHERE similarity >= 0.3
ORDER BY similarity DESC;
```

### Personalization Algorithms

#### Behavior Pattern Analysis
```typescript
const analyzeBehaviorPatterns = async (userId, timeWindow) => {
  const patterns = {
    ratingPatterns: await analyzeRatingPatterns(userId, timeWindow),
    timePreferences: await analyzeTimePreferences(userId, timeWindow),
    categoryPreferences: await analyzeCategoryPreferences(userId, timeWindow),
    pricePreferences: await analyzePricePreferences(userId, timeWindow),
    socialInfluence: await analyzeSocialInfluence(userId, timeWindow),
  };
  
  return patterns;
};
```

#### Preference Learning
```typescript
const updateUserPreferences = async (userId, newRating) => {
  // Update flavor preferences
  const flavorPrefs = await extractFlavorPreferences(newRating);
  
  // Update category weights
  const categoryWeights = await updateCategoryWeights(userId, newRating);
  
  // Update price preferences
  const pricePrefs = await updatePricePreferences(userId, newRating);
  
  // Store updated preferences
  await storeUserPreferenceVector({
    userId,
    flavorPreferences: flavorPrefs,
    categoryWeights,
    pricePreferences: pricePrefs,
  });
};
```

## API Endpoints

### Recommendation Endpoints

```typescript
// Get personalized recommendations
GET /api/v1/recommendations
Query: type, limit, diversity, include_reasons

// Get similar products
GET /api/v1/recommendations/similar/:productType/:productId
Query: limit

// Get trending products
GET /api/v1/recommendations/trending
Query: type, limit

// Get cold start recommendations
GET /api/v1/recommendations/cold-start
Query: preferences, limit

// Get collaborative filtering recommendations
GET /api/v1/recommendations/collaborative/hybrid
Query: limit

// Get user taste profile
GET /api/v1/recommendations/profile/taste

// Provide recommendation feedback
GET /api/v1/recommendations/feedback/:recommendationId
Query: rating, action
```

### Response Format

```json
{
  "recommendations": [
    {
      "productId": "uuid",
      "productType": "cigar",
      "score": 0.85,
      "confidence": 0.92,
      "reason": "Based on your love for full-bodied cigars with earthy notes",
      "algorithm": "hybrid",
      "product": {
        "id": "uuid",
        "name": "Cohiba Behike",
        "brand": "Cohiba",
        "averageRating": 4.8,
        "ratingCount": 156
      }
    }
  ],
  "totalCount": 20,
  "algorithms": ["vector", "collaborative", "personalized"],
  "userProfile": {
    "tasteProfile": {...},
    "preferences": {...}
  }
}
```

## Performance Optimization

### Caching Strategy

```typescript
// Redis caching for expensive computations
const getCachedRecommendations = async (userId, cacheKey) => {
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  const recommendations = await generateRecommendations(userId);
  await redis.setex(cacheKey, 300, JSON.stringify(recommendations)); // 5 min cache
  
  return recommendations;
};
```

### Database Optimization

```sql
-- Materialized view for user similarity
CREATE MATERIALIZED VIEW user_similarity_mv AS
SELECT 
  u1.id as user_id,
  u2.id as similar_user_id,
  CORR(r1.rating, r2.rating) as similarity,
  COUNT(*) as common_ratings
FROM users u1
JOIN user_ratings r1 ON u1.id = r1.user_id
JOIN user_ratings r2 ON r1.product_id = r2.product_id AND r1.product_type = r2.product_type
JOIN users u2 ON r2.user_id = u2.id
WHERE u1.id != u2.id
GROUP BY u1.id, u2.id
HAVING COUNT(*) >= 3 AND CORR(r1.rating, r2.rating) >= 0.3;

-- Refresh materialized view periodically
REFRESH MATERIALIZED VIEW CONCURRENTLY user_similarity_mv;
```

### Vector Index Optimization

```sql
-- Optimize vector index for better performance
CREATE INDEX CONCURRENTLY idx_product_embeddings_ivfflat 
ON product_embeddings 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Analyze table for better query planning
ANALYZE product_embeddings;
```

## Testing Strategy

### Unit Tests

```typescript
describe('VectorService', () => {
  it('should generate consistent embeddings', async () => {
    const product = { id: '1', strength: 'medium', ring_gauge: 50 };
    const embedding1 = await vectorService.generateProductEmbedding(product, 'cigar');
    const embedding2 = await vectorService.generateProductEmbedding(product, 'cigar');
    
    expect(embedding1).toEqual(embedding2);
    expect(embedding1).toHaveLength(384);
  });

  it('should find similar products', async () => {
    const similar = await vectorService.findSimilarProducts('product-1', 'cigar', 5);
    
    expect(similar).toHaveLength(5);
    expect(similar[0].similarity).toBeGreaterThan(0.5);
  });
});
```

### Integration Tests

```typescript
describe('Recommendation Integration', () => {
  it('should provide diverse recommendations', async () => {
    const recommendations = await recommendationService.getRecommendations({
      userId: 'user-1',
      limit: 20,
      diversityWeight: 0.5,
    });
    
    const types = new Set(recommendations.recommendations.map(r => r.productType));
    expect(types.size).toBeGreaterThan(1); // Should include multiple product types
  });
});
```

### Performance Tests

```typescript
describe('Recommendation Performance', () => {
  it('should generate recommendations within acceptable time', async () => {
    const startTime = Date.now();
    
    await recommendationService.getRecommendations({
      userId: 'user-1',
      limit: 20,
    });
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
  });
});
```

## Monitoring and Analytics

### Key Metrics

- **Recommendation Accuracy**: Click-through rate, conversion rate
- **Algorithm Performance**: Precision, recall, F1-score
- **User Engagement**: Time spent viewing recommendations
- **Diversity**: Category and price range distribution
- **Novelty**: Percentage of new discoveries

### Monitoring Dashboard

```typescript
const getRecommendationMetrics = async () => {
  return {
    accuracy: {
      clickThroughRate: await calculateCTR(),
      conversionRate: await calculateConversionRate(),
      userSatisfaction: await calculateSatisfactionScore(),
    },
    performance: {
      averageResponseTime: await getAverageResponseTime(),
      cacheHitRate: await getCacheHitRate(),
      errorRate: await getErrorRate(),
    },
    diversity: {
      categoryDistribution: await getCategoryDistribution(),
      priceRangeDistribution: await getPriceRangeDistribution(),
      noveltyScore: await getNoveltyScore(),
    },
  };
};
```

## Future Enhancements

### Advanced ML Features
- **Deep Learning Models**: Neural collaborative filtering
- **Natural Language Processing**: Review text analysis
- **Computer Vision**: Product image similarity
- **Reinforcement Learning**: Dynamic recommendation optimization

### Real-time Features
- **Stream Processing**: Real-time behavior tracking
- **Live Recommendations**: Update recommendations as users browse
- **A/B Testing**: Dynamic algorithm selection
- **Contextual Recommendations**: Location and time-aware suggestions

## Conclusion

The AI-powered recommendations system provides a sophisticated, multi-algorithm approach to product discovery that learns from user behavior and continuously improves. With offline-first capabilities, comprehensive analytics, and scalable architecture, it delivers a premium recommendation experience that drives user engagement and satisfaction.

The system is designed to scale with the community's growth while maintaining high performance and accuracy, making it a key differentiator for the Inked Draw platform.
