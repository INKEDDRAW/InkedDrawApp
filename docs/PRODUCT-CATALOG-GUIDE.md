# Product Catalog & Reviews Implementation Guide

## Overview

The Inked Draw product catalog and review system provides a comprehensive, offline-first platform for discovering, rating, and reviewing cigars, beers, and wines. Built on our existing offline-first architecture, this system enables users to explore products, write detailed reviews, and discover new favorites even when offline.

## Architecture

### Frontend Architecture

```
frontend/src/
├── screens/catalog/
│   ├── ProductCatalogScreen.tsx      # Main catalog with search & filters
│   └── ProductDetailScreen.tsx       # Detailed product view with reviews
├── components/catalog/
│   ├── ProductCard.tsx               # Product display card
│   ├── ReviewCard.tsx                # Individual review display
│   ├── RatingModal.tsx               # Review creation modal
│   ├── ProductSpecs.tsx              # Product specifications
│   ├── CategoryTabs.tsx              # Product category navigation
│   ├── FlavorNotesSelector.tsx       # Interactive flavor selection
│   ├── SimilarProducts.tsx           # Product recommendations
│   ├── SortModal.tsx                 # Sort options modal
│   └── FlavorTags.tsx                # Flavor note display tags
├── components/ui/
│   ├── StarRating.tsx                # Interactive star rating
│   ├── SearchBar.tsx                 # Search input component
│   └── FilterChips.tsx               # Filter selection chips
└── hooks/
    └── useOfflineMutation.ts         # Catalog mutation hooks
```

### Backend Architecture

```
backend/src/catalog/
├── catalog.module.ts                 # NestJS module configuration
├── products.service.ts               # Product catalog business logic
├── reviews.service.ts                # Reviews business logic
├── search.service.ts                 # Advanced search functionality
├── products.controller.ts            # Products API endpoints
└── reviews.controller.ts             # Reviews API endpoints
```

## Key Features

### 1. **Advanced Product Catalog**
- **Multi-Category Support**: Cigars, beers, and wines with type-specific attributes
- **Smart Search**: Full-text search with PostgreSQL's built-in search capabilities
- **Advanced Filtering**: Price range, ratings, flavor notes, and product characteristics
- **Intelligent Sorting**: By name, rating, price, or newest additions

### 2. **Comprehensive Review System**
- **Detailed Ratings**: Overall rating plus category-specific ratings (construction, flavor, etc.)
- **Rich Reviews**: Text reviews with flavor notes, images, and detailed scoring
- **Social Interactions**: Like reviews, follow reviewers, discover expert opinions
- **Offline Capability**: Write reviews offline with automatic sync

### 3. **Product Discovery**
- **Similar Products**: AI-powered recommendations based on characteristics
- **Trending Products**: Popular items based on community engagement
- **Expert Curation**: Featured products and expert recommendations
- **Personal Collections**: Save favorites and track personal inventory

### 4. **Flavor Profile System**
- **Interactive Selection**: Category-based flavor note selection
- **Visual Representation**: Color-coded flavor tags for easy recognition
- **Smart Matching**: Find products based on preferred flavor profiles
- **Community Insights**: See what flavors others detect in products

## Implementation Details

### Product Catalog Screen

```typescript
const ProductCatalogScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'cigars' | 'beers' | 'wines'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'price' | 'newest'>('rating');
  const [priceRange, setPriceRange] = useState<'all' | 'budget' | 'mid' | 'premium' | 'luxury'>('all');

  // Fetch products with advanced filtering
  const { data: products, loading, refresh } = useOfflineQuery('products', {
    where: buildAdvancedFilters(selectedCategory, priceRange, searchQuery),
    sortBy: getSortField(sortBy),
    sortOrder: getSortOrder(sortBy),
    limit: 50,
  });

  return (
    <SafeAreaView>
      <FlatList
        data={products}
        renderItem={({ item }) => <ProductCard product={item} />}
        ListHeaderComponent={
          <View>
            <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
            <CategoryTabs selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
            <FilterChips selectedPriceRange={priceRange} onPriceRangeChange={setPriceRange} />
          </View>
        }
        numColumns={2}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
      />
    </SafeAreaView>
  );
};
```

### Product Detail Screen

```typescript
const ProductDetailScreen = ({ productId, productType }) => {
  const { data: product } = useOfflineQuery(`${productType}s`, {
    where: [['id', productId]],
    limit: 1,
  });

  const { data: reviews } = useOfflineQuery('ratings', {
    where: [['product_id', productId], ['product_type', productType]],
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const addToCollection = useAddToCollection();
  const createRating = useCreateRating();

  return (
    <ScrollView>
      <ProductImage product={product} />
      <ProductHeader product={product} productType={productType} />
      <ProductSpecs product={product} productType={productType} />
      
      <ActionButtons>
        <Button title="Add to Collection" onPress={() => addToCollection.mutate({ productId, productType })} />
        <Button title="Write Review" onPress={() => setShowRatingModal(true)} />
      </ActionButtons>

      <ReviewsList>
        {reviews.map(review => <ReviewCard key={review.id} review={review} />)}
      </ReviewsList>

      <SimilarProducts currentProduct={product} productType={productType} />
    </ScrollView>
  );
};
```

### Advanced Rating System

```typescript
const RatingModal = ({ product, productType, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [flavorNotes, setFlavorNotes] = useState<string[]>([]);
  const [specificRatings, setSpecificRatings] = useState<Record<string, number>>({});

  const getSpecificCategories = () => {
    switch (productType) {
      case 'cigar':
        return ['construction', 'burn', 'draw', 'flavor'];
      case 'beer':
        return ['appearance', 'aroma', 'taste', 'mouthfeel'];
      case 'wine':
        return ['appearance', 'aroma', 'taste', 'finish'];
    }
  };

  return (
    <Modal>
      <StarRating rating={rating} onRatingChange={setRating} interactive />
      
      {getSpecificCategories().map(category => (
        <SpecificRating
          key={category}
          category={category}
          rating={specificRatings[category] || 0}
          onRatingChange={(value) => setSpecificRatings(prev => ({ ...prev, [category]: value }))}
        />
      ))}

      <TextInput value={review} onChangeText={setReview} placeholder="Share your experience..." />
      
      <FlavorNotesSelector
        productType={productType}
        selectedNotes={flavorNotes}
        onNotesChange={setFlavorNotes}
      />

      <Button title="Post Review" onPress={() => onSubmit({ rating, review, flavorNotes, specificRatings })} />
    </Modal>
  );
};
```

## Offline-First Implementation

### Local Data Management

```typescript
// Product data synchronization
const syncProducts = async () => {
  const pendingRatings = await collections.ratings
    .query()
    .where('sync_status', 'pending')
    .fetch();

  for (const rating of pendingRatings) {
    try {
      await syncRatingToServer(rating);
      await rating.update(r => { r.syncStatus = 'synced'; });
    } catch (error) {
      await rating.update(r => { r.syncStatus = 'error'; });
    }
  }
};
```

### Optimistic Updates

```typescript
const useCreateRating = () => {
  return useOfflineMutation(
    async (variables) => {
      // Create rating locally first
      const rating = await database.write(async () => {
        return await collections.ratings.create(record => {
          record.productId = variables.productId;
          record.productType = variables.productType;
          record.rating = variables.rating;
          record.review = variables.review;
          record.flavorNotes = JSON.stringify(variables.flavorNotes);
          record.syncStatus = 'pending';
        });
      });

      // Update product average rating
      await updateProductRating(variables.productId, variables.productType);
      
      return rating;
    },
    {
      syncPriority: 8, // High priority for user-generated content
      optimisticUpdate: true,
    }
  );
};
```

## Backend API Implementation

### Products Service

```typescript
@Injectable()
export class ProductsService {
  async getProducts(filters: ProductFilters, limit: number, offset: number) {
    const queries = [];
    
    // Build queries for each product type
    if (!filters.category || filters.category === 'cigars') {
      queries.push(this.buildCigarQuery(filters));
    }
    
    if (!filters.category || filters.category === 'beers') {
      queries.push(this.buildBeerQuery(filters));
    }
    
    if (!filters.category || filters.category === 'wines') {
      queries.push(this.buildWineQuery(filters));
    }

    // Union all queries and apply sorting/pagination
    const unionQuery = queries.join(' UNION ALL ');
    const finalQuery = `
      SELECT * FROM (${unionQuery}) AS products
      ORDER BY ${this.getSortField(filters.sortBy)} ${filters.sortOrder}
      LIMIT $1 OFFSET $2
    `;

    return await this.databaseService.query(finalQuery, [limit, offset]);
  }

  async searchProducts(searchQuery: string, filters: ProductFilters) {
    // Full-text search across all product types
    const query = `
      SELECT *, ts_rank(search_vector, plainto_tsquery($1)) as rank
      FROM (
        SELECT *, to_tsvector('english', name || ' ' || brand || ' ' || description) as search_vector FROM cigars
        UNION ALL
        SELECT *, to_tsvector('english', name || ' ' || brewery || ' ' || description) as search_vector FROM beers
        UNION ALL
        SELECT *, to_tsvector('english', name || ' ' || winery || ' ' || description) as search_vector FROM wines
      ) AS all_products
      WHERE search_vector @@ plainto_tsquery($1)
      ORDER BY rank DESC, average_rating DESC
    `;

    return await this.databaseService.query(query, [searchQuery]);
  }
}
```

### Reviews Service

```typescript
@Injectable()
export class ReviewsService {
  async createReview(userId: string, reviewData: CreateReviewDto) {
    const review = await this.databaseService.insert('user_ratings', {
      user_id: userId,
      product_id: reviewData.productId,
      product_type: reviewData.productType,
      rating: reviewData.rating,
      review_text: reviewData.review,
      flavor_notes: reviewData.flavorNotes,
      specific_ratings: reviewData.specificRatings,
    });

    // Update product average rating
    await this.updateProductAverageRating(reviewData.productId, reviewData.productType);
    
    return review;
  }

  private async updateProductAverageRating(productId: string, productType: string) {
    const tableName = `${productType}s`;
    const ratingTable = `user_${productType}s`;
    
    await this.databaseService.query(`
      UPDATE ${tableName} 
      SET average_rating = (
        SELECT AVG(rating) FROM ${ratingTable} WHERE ${productType}_id = $1
      ),
      rating_count = (
        SELECT COUNT(*) FROM ${ratingTable} WHERE ${productType}_id = $1
      )
      WHERE id = $1
    `, [productId]);
  }
}
```

## Advanced Features

### AI-Powered Recommendations

```typescript
const getPersonalizedRecommendations = async (userId: string) => {
  // Analyze user's rating history
  const userRatings = await getUserRatings(userId);
  const preferredFlavors = extractFlavorPreferences(userRatings);
  const preferredStrengths = extractStrengthPreferences(userRatings);

  // Find similar products using vector similarity
  const recommendations = await database.query(`
    SELECT p.*, 
           similarity(p.flavor_vector, $1) as flavor_similarity,
           similarity(p.characteristics_vector, $2) as char_similarity
    FROM products p
    WHERE p.id NOT IN (SELECT product_id FROM user_ratings WHERE user_id = $3)
    ORDER BY (flavor_similarity + char_similarity) / 2 DESC
    LIMIT 20
  `, [preferredFlavors, preferredStrengths, userId]);

  return recommendations;
};
```

### Social Discovery

```typescript
const getSocialRecommendations = async (userId: string) => {
  // Find products highly rated by users with similar taste
  const query = `
    WITH similar_users AS (
      SELECT ur2.user_id,
             corr(ur1.rating, ur2.rating) as taste_similarity
      FROM user_ratings ur1
      JOIN user_ratings ur2 ON ur1.product_id = ur2.product_id
      WHERE ur1.user_id = $1 AND ur2.user_id != $1
      GROUP BY ur2.user_id
      HAVING COUNT(*) >= 3 AND corr(ur1.rating, ur2.rating) > 0.5
      ORDER BY taste_similarity DESC
      LIMIT 10
    )
    SELECT p.*, AVG(ur.rating) as avg_rating_by_similar_users
    FROM products p
    JOIN user_ratings ur ON p.id = ur.product_id
    JOIN similar_users su ON ur.user_id = su.user_id
    WHERE p.id NOT IN (SELECT product_id FROM user_ratings WHERE user_id = $1)
    GROUP BY p.id
    ORDER BY avg_rating_by_similar_users DESC
    LIMIT 15
  `;

  return await database.query(query, [userId]);
};
```

## Performance Optimizations

### Database Indexing

```sql
-- Product search optimization
CREATE INDEX idx_products_search ON cigars USING gin(to_tsvector('english', name || ' ' || brand || ' ' || description));
CREATE INDEX idx_beers_search ON beers USING gin(to_tsvector('english', name || ' ' || brewery || ' ' || description));
CREATE INDEX idx_wines_search ON wines USING gin(to_tsvector('english', name || ' ' || winery || ' ' || description));

-- Rating aggregation optimization
CREATE INDEX idx_ratings_product ON user_ratings(product_id, product_type);
CREATE INDEX idx_ratings_user ON user_ratings(user_id);
CREATE INDEX idx_ratings_created ON user_ratings(created_at DESC);
```

### Caching Strategy

```typescript
// Redis caching for frequently accessed data
const getCachedProducts = async (cacheKey: string) => {
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const products = await fetchProductsFromDatabase();
  await redis.setex(cacheKey, 300, JSON.stringify(products)); // 5 minute cache
  
  return products;
};
```

## Testing Strategy

### Component Testing

```typescript
describe('ProductCatalogScreen', () => {
  it('should filter products by category', async () => {
    const { getByText, getAllByTestId } = render(<ProductCatalogScreen />);
    
    fireEvent.press(getByText('Cigars'));
    
    await waitFor(() => {
      const productCards = getAllByTestId('product-card');
      expect(productCards).toHaveLength(10);
    });
  });

  it('should search products by name', async () => {
    const { getByPlaceholderText, getAllByTestId } = render(<ProductCatalogScreen />);
    
    fireEvent.changeText(getByPlaceholderText('Search products...'), 'Cohiba');
    
    await waitFor(() => {
      const productCards = getAllByTestId('product-card');
      expect(productCards.length).toBeGreaterThan(0);
    });
  });
});
```

### Integration Testing

```typescript
describe('Product Reviews Integration', () => {
  it('should create review and update product rating', async () => {
    const productId = 'test-cigar-1';
    const reviewData = {
      rating: 5,
      review: 'Excellent cigar with complex flavors',
      flavorNotes: ['chocolate', 'cedar', 'pepper'],
    };

    await createReview(productId, 'cigar', reviewData);
    
    const updatedProduct = await getProduct(productId, 'cigar');
    expect(updatedProduct.averageRating).toBeGreaterThan(0);
    expect(updatedProduct.ratingCount).toBe(1);
  });
});
```

## Conclusion

The product catalog and review system provides a comprehensive, offline-first platform for product discovery and community engagement. With advanced search capabilities, detailed review systems, and AI-powered recommendations, users can discover new favorites and share their expertise with the Inked Draw community.

The system is designed to scale with the community's growth while maintaining the premium, sophisticated experience that defines the Inked Draw brand.
