# Vision & Location Services Guide

## Overview

This guide covers the comprehensive Google Vision API integration and location-based smoke shop discovery system implemented in Inked Draw. This feature enables users to identify cigars from photos and find nearby retailers that carry the identified products.

## Architecture

### Vision & Location Stack
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Google Vision   │    │ Product         │    │ Smoke Shop      │
│ API Service     │────│ Recognition     │────│ Service         │
│ (Image Analysis)│    │ (Cigar ID)      │    │ (Location)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐    ┌─────────────────┐
         │              │ Location        │    │ Frontend        │
         └──────────────│ Service         │────│ Components      │
                        │ (Geolocation)   │    │ (Camera/UI)     │
                        └─────────────────┘    └─────────────────┘
```

## Core Components

### 1. Vision Service
**Google Vision API integration for comprehensive image analysis**

**Key Features:**
- **Label Detection**: Identify objects, concepts, and activities in images
- **Text Extraction (OCR)**: Extract all text content from images
- **Logo Detection**: Identify brand logos and trademarks
- **Object Detection**: Locate and identify specific objects with bounding boxes
- **Color Analysis**: Analyze dominant colors for wrapper type identification
- **Safe Search**: Content safety verification

**Vision Analysis Result:**
```typescript
interface VisionAnalysisResult {
  labels: Array<{
    description: string;
    score: number;
    confidence: number;
  }>;
  text: string;
  objects: Array<{
    name: string;
    score: number;
    boundingBox: BoundingBox;
  }>;
  logos: Array<{
    description: string;
    score: number;
    boundingBox: BoundingBox;
  }>;
  colors: Array<{
    color: { red: number; green: number; blue: number };
    score: number;
    pixelFraction: number;
  }>;
  safeSearch: SafeSearchAnnotation;
}
```

**API Integration:**
```typescript
// Analyze image with Google Vision API
const analysis = await visionService.analyzeImage(imageUrl);

// Extract text using OCR
const extractedText = await visionService.extractText(imageUrl);

// Detect logos
const logos = await visionService.detectLogos(imageUrl);
```

### 2. Product Recognition Service
**Intelligent cigar identification using AI analysis**

**Recognition Process:**
1. **Image Analysis**: Process image with Google Vision API
2. **Brand Identification**: Match logos and text to known cigar brands
3. **Model Detection**: Identify specific cigar lines and models
4. **Size Recognition**: Determine cigar size from text and dimensions
5. **Wrapper Analysis**: Analyze colors to determine wrapper type
6. **Database Matching**: Find matching products in cigar catalog

**Supported Brands:**
- **Cuban Brands**: Cohiba, Montecristo, Romeo y Julieta, Partagas, H. Upmann
- **Dominican Brands**: Arturo Fuente, Davidoff, Ashton, La Flor Dominicana
- **Nicaraguan Brands**: Padron, My Father, Oliva, Drew Estate
- **Honduran Brands**: Rocky Patel, CAO, Punch, Hoyo de Monterrey

**Recognition Confidence Factors:**
- **Brand Match**: 40% weight (logo detection + text matching)
- **Model Match**: 30% weight (text pattern recognition)
- **Size Match**: 20% weight (dimension analysis + text)
- **Visual Quality**: 10% weight (image clarity + analysis confidence)

**Cigar Recognition Result:**
```typescript
interface CigarRecognitionResult {
  brand?: string;           // e.g., "Cohiba"
  model?: string;           // e.g., "Behike 52"
  size?: string;            // e.g., "Robusto"
  wrapper?: string;         // e.g., "Maduro"
  confidence: number;       // 0.0 to 1.0
  extractedText: string[];  // All text found in image
  detectedLabels: string[]; // Visual labels from Vision API
  matchedProducts: Array<{  // Database matches
    id: string;
    name: string;
    brand: string;
    confidence: number;
    similarity: number;
  }>;
}
```

### 3. Smoke Shop Service
**Location-based retailer discovery and inventory management**

**Shop Search Features:**
- **Proximity Search**: Find shops within specified radius
- **Product Availability**: Filter by specific product inventory
- **Brand Filtering**: Find shops carrying specific brands
- **Rating-Based Sorting**: Sort by customer ratings and reviews
- **Inventory Tracking**: Real-time stock information

**Search Options:**
```typescript
interface SmokeShopSearchOptions {
  latitude: number;
  longitude: number;
  radius: number;              // Search radius in miles
  productId?: string;          // Specific product filter
  productType?: 'cigar' | 'beer' | 'wine';
  brand?: string;              // Brand filter
  limit?: number;              // Max results
  sortBy?: 'distance' | 'rating' | 'availability';
}
```

**Shop Information:**
```typescript
interface SmokeShop {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates: { latitude: number; longitude: number };
  contact: {
    phone?: string;
    website?: string;
    email?: string;
  };
  hours: { [day: string]: string };
  specialties: string[];       // e.g., ['cigars', 'humidors']
  brands: string[];            // Brands carried
  rating: number;              // Average customer rating
  reviewCount: number;         // Number of reviews
  distance?: number;           // Distance from search point
  hasProduct?: boolean;        // Has searched product
  productAvailability?: {
    inStock: boolean;
    price?: number;
    lastUpdated: Date;
  };
}
```

### 4. Location Service
**Geolocation utilities and distance calculations**

**Location Features:**
- **Distance Calculation**: Haversine formula for accurate distances
- **Geocoding**: Convert addresses to coordinates
- **Reverse Geocoding**: Convert coordinates to addresses
- **Bounding Box**: Calculate search areas
- **Coordinate Validation**: Ensure valid geographic coordinates

**Distance Calculation:**
```typescript
// Calculate distance between two points
const distance = locationService.calculateDistance(
  { latitude: 40.7128, longitude: -74.0060 }, // New York
  { latitude: 34.0522, longitude: -118.2437 }, // Los Angeles
  'miles'
); // Returns: 2445.55 miles
```

**Geocoding:**
```typescript
// Convert address to coordinates
const coordinates = await locationService.geocodeAddress(
  "123 Main St, New York, NY 10001"
);
// Returns: { latitude: 40.7505, longitude: -73.9934 }

// Convert coordinates to address
const location = await locationService.reverseGeocode(
  { latitude: 40.7505, longitude: -73.9934 }
);
// Returns: LocationInfo with address details
```

## API Endpoints

### Vision Recognition
```bash
# Recognize cigar from image and find nearby shops
POST /api/vision/recognize-cigar
Body: {
  "imageUrl": "https://example.com/cigar.jpg",
  "userLatitude": 40.7128,
  "userLongitude": -74.0060,
  "searchRadius": 25
}

# Analyze image using Google Vision API
POST /api/vision/analyze-image
Body: { "imageUrl": "https://example.com/image.jpg" }

# Extract text from image using OCR
POST /api/vision/extract-text
Body: { "imageUrl": "https://example.com/image.jpg" }

# Detect logos in image
POST /api/vision/detect-logos
Body: { "imageUrl": "https://example.com/image.jpg" }

# Get Vision API status
GET /api/vision/status
```

### Location & Smoke Shops
```bash
# Find nearby smoke shops
POST /api/location/nearby-shops
Body: {
  "latitude": 40.7128,
  "longitude": -74.0060,
  "radius": 25,
  "brand": "Cohiba",
  "sortBy": "distance"
}

# Find shops with specific product
GET /api/location/shops-with-product/{productId}?productType=cigar&latitude=40.7128&longitude=-74.0060&radius=25

# Find shops with specific brand
GET /api/location/shops-with-brand?brand=Cohiba&latitude=40.7128&longitude=-74.0060&radius=25

# Get popular shops in area
GET /api/location/popular-shops?latitude=40.7128&longitude=-74.0060&radius=50&limit=10

# Get shop details and inventory
GET /api/location/shops/{shopId}
GET /api/location/shops/{shopId}/inventory?productType=cigar

# Geocode address to coordinates
POST /api/location/geocode
Body: { "address": "123 Main St, New York, NY" }

# Calculate distance between points
GET /api/location/distance?lat1=40.7128&lon1=-74.0060&lat2=34.0522&lon2=-118.2437&unit=miles
```

## Frontend Integration

### Cigar Recognition Component
```typescript
import { CigarRecognition } from '../components/vision/CigarRecognition';

const MyScreen = () => {
  const [showRecognition, setShowRecognition] = useState(false);
  
  const handleRecognitionComplete = (result: CigarRecognitionResult) => {
    console.log('Recognized:', result.recognition.brand, result.recognition.model);
    console.log('Nearby shops:', result.nearbyShops.length);
    setShowRecognition(false);
  };

  return (
    <View>
      <Button 
        title="Identify Cigar" 
        onPress={() => setShowRecognition(true)} 
      />
      
      {showRecognition && (
        <CigarRecognition
          onRecognitionComplete={handleRecognitionComplete}
          onClose={() => setShowRecognition(false)}
        />
      )}
    </View>
  );
};
```

### Recognition Hook Usage
```typescript
import { useCigarRecognition } from '../hooks/useCigarRecognition';

const CigarScreen = () => {
  const {
    recognizeCigar,
    findNearbyShops,
    getShopsWithProduct,
    isRecognizingCigar,
    lastResult,
  } = useCigarRecognition();

  const handleImageCapture = async (imageUri: string) => {
    try {
      const result = await recognizeCigar({
        imageUrl: imageUri,
        userLatitude: 40.7128,
        userLongitude: -74.0060,
        searchRadius: 25,
      });
      
      // Handle recognition result
      console.log('Brand:', result.recognition.brand);
      console.log('Shops found:', result.nearbyShops.length);
    } catch (error) {
      console.error('Recognition failed:', error);
    }
  };

  return (
    <View>
      {isRecognizingCigar && <LoadingSpinner />}
      {lastResult && (
        <RecognitionResults result={lastResult} />
      )}
    </View>
  );
};
```

## Database Schema

### Smoke Shops Table
```sql
CREATE TABLE public.smoke_shops (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    country TEXT DEFAULT 'United States' NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    phone TEXT,
    website TEXT,
    email TEXT,
    hours JSONB,
    specialties TEXT[] DEFAULT '{}',
    brands TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Spatial index for efficient location queries
CREATE INDEX idx_smoke_shops_location ON public.smoke_shops 
USING GIST (ST_Point(longitude, latitude));
```

### Shop Inventory Table
```sql
CREATE TABLE public.shop_inventory (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID REFERENCES public.smoke_shops(id) ON DELETE CASCADE NOT NULL,
    product_id UUID NOT NULL,
    product_type TEXT CHECK (product_type IN ('cigar', 'beer', 'wine')) NOT NULL,
    brand TEXT NOT NULL,
    name TEXT NOT NULL,
    in_stock BOOLEAN DEFAULT TRUE NOT NULL,
    price DECIMAL(10, 2),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE (shop_id, product_id, product_type)
);
```

### Vision Analysis Results Table
```sql
CREATE TABLE public.vision_analysis_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    analysis_type TEXT CHECK (analysis_type IN ('cigar_recognition', 'general_analysis')) NOT NULL,
    labels JSONB,
    extracted_text TEXT[],
    detected_objects JSONB,
    detected_logos JSONB,
    recognized_brand TEXT,
    recognized_model TEXT,
    recognition_confidence DECIMAL(3, 2),
    matched_products JSONB,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

## Configuration

### Environment Variables
```bash
# Google Vision API
GOOGLE_VISION_ENABLED=true
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_VISION_CREDENTIALS={"type":"service_account",...}

# Location Services
GOOGLE_MAPS_API_KEY=your-maps-api-key
DEFAULT_SEARCH_RADIUS=25
MAX_SEARCH_RADIUS=100

# Feature Flags
ENABLE_CIGAR_RECOGNITION=true
ENABLE_SHOP_DISCOVERY=true
ENABLE_INVENTORY_TRACKING=true
```

### Google Cloud Setup
1. **Enable APIs**: Vision API, Maps Geocoding API
2. **Create Service Account**: Download credentials JSON
3. **Set Permissions**: Vision API User, Maps API User
4. **Configure Billing**: Enable billing for API usage

## Performance Optimization

### Caching Strategy
```typescript
// Cache recognition results to avoid duplicate API calls
const cacheKey = `vision:${imageHash}`;
const cachedResult = await cacheService.get(cacheKey);

if (cachedResult) {
  return cachedResult;
}

const result = await visionService.analyzeImage(imageUrl);
await cacheService.set(cacheKey, result, 3600); // 1 hour cache
```

### Image Optimization
- **Resize Images**: Optimize for Vision API (max 20MB, recommended < 4MB)
- **Format Conversion**: Convert to JPEG for better compression
- **Quality Settings**: Balance quality vs. file size (80% quality recommended)

### Location Indexing
- **Spatial Indexes**: PostGIS GIST indexes for efficient proximity queries
- **Bounding Box Queries**: Pre-filter by geographic bounds before distance calculation
- **Result Caching**: Cache popular location searches

## Error Handling

### Vision API Errors
```typescript
try {
  const result = await visionService.analyzeImage(imageUrl);
} catch (error) {
  if (error.code === 'INVALID_IMAGE_URI') {
    throw new Error('Invalid image URL provided');
  } else if (error.code === 'QUOTA_EXCEEDED') {
    throw new Error('Vision API quota exceeded');
  } else {
    throw new Error('Image analysis failed');
  }
}
```

### Location Service Errors
```typescript
try {
  const shops = await smokeShopService.findNearbyShops(options);
} catch (error) {
  if (error.message.includes('Invalid coordinates')) {
    throw new Error('Please provide valid location coordinates');
  } else if (error.message.includes('No shops found')) {
    throw new Error('No smoke shops found in this area');
  } else {
    throw new Error('Location search failed');
  }
}
```

## Testing

### Unit Tests
```typescript
describe('ProductRecognitionService', () => {
  it('should recognize Cohiba brand from image', async () => {
    const result = await productRecognitionService.recognizeCigar(mockImageUrl);
    
    expect(result.brand).toBe('cohiba');
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.matchedProducts).toHaveLength(2);
  });

  it('should handle unrecognizable images gracefully', async () => {
    const result = await productRecognitionService.recognizeCigar(blurryImageUrl);
    
    expect(result.confidence).toBeLessThan(0.5);
    expect(result.brand).toBeUndefined();
  });
});
```

### Integration Tests
```typescript
describe('Vision + Location Integration', () => {
  it('should recognize cigar and find nearby shops', async () => {
    const result = await visionController.recognizeCigar({
      imageUrl: cohibaImageUrl,
      userLatitude: 40.7128,
      userLongitude: -74.0060,
      searchRadius: 25,
    });
    
    expect(result.recognition.brand).toBe('cohiba');
    expect(result.nearbyShops.length).toBeGreaterThan(0);
    expect(result.nearbyShops[0].distance).toBeLessThan(25);
  });
});
```

## Analytics & Monitoring

### Recognition Metrics
- **Success Rate**: Percentage of successful recognitions
- **Confidence Distribution**: Distribution of recognition confidence scores
- **Brand Recognition**: Most commonly recognized brands
- **Processing Time**: Average API response times

### Location Metrics
- **Search Patterns**: Most searched locations and radii
- **Shop Discovery**: Most discovered shops and brands
- **User Engagement**: Recognition-to-shop-visit conversion rates

### Performance Monitoring
```typescript
// Track recognition performance
await analyticsService.trackEvent('cigar_recognition', {
  brand: result.brand,
  confidence: result.confidence,
  processingTime: processingTimeMs,
  shopsFound: result.nearbyShops.length,
});

// Track location searches
await analyticsService.trackEvent('shop_search', {
  searchRadius: options.radius,
  resultsCount: shops.length,
  searchType: options.brand ? 'brand' : 'proximity',
});
```

## Best Practices

### Image Quality Guidelines
- **Lighting**: Ensure good, even lighting
- **Focus**: Keep cigar band and text in sharp focus
- **Framing**: Fill frame with cigar, include band if visible
- **Angle**: Straight-on view of band and wrapper
- **Background**: Use contrasting background for better detection

### Location Privacy
- **User Consent**: Always request location permission
- **Precision Control**: Use appropriate location accuracy
- **Data Retention**: Limit storage of precise location data
- **Anonymization**: Aggregate location data for analytics

### API Usage Optimization
- **Batch Processing**: Group multiple operations when possible
- **Result Caching**: Cache recognition results to reduce API calls
- **Error Handling**: Implement exponential backoff for retries
- **Cost Monitoring**: Track API usage and costs

This comprehensive vision and location system transforms Inked Draw into a powerful tool for cigar enthusiasts, enabling instant product identification and local retailer discovery through advanced AI and location services.
