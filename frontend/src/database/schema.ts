/**
 * WatermelonDB Schema
 * Defines the local database structure for offline-first functionality
 */

import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    // Users and Authentication
    tableSchema({
      name: 'users',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'email', type: 'string', isIndexed: true },
        { name: 'username', type: 'string', isIndexed: true },
        { name: 'display_name', type: 'string' },
        { name: 'avatar_url', type: 'string', isOptional: true },
        { name: 'bio', type: 'string', isOptional: true },
        { name: 'location', type: 'string', isOptional: true },
        { name: 'is_age_verified', type: 'boolean' },
        { name: 'preferences', type: 'string' }, // JSON string
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'last_synced_at', type: 'number', isOptional: true },
        { name: 'sync_status', type: 'string' }, // 'synced', 'pending', 'conflict'
      ],
    }),

    // Cigars Catalog
    tableSchema({
      name: 'cigars',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string', isIndexed: true },
        { name: 'brand', type: 'string', isIndexed: true },
        { name: 'origin', type: 'string', isIndexed: true },
        { name: 'wrapper', type: 'string' },
        { name: 'binder', type: 'string' },
        { name: 'filler', type: 'string' },
        { name: 'strength', type: 'string' }, // 'mild', 'medium', 'full'
        { name: 'size', type: 'string' },
        { name: 'ring_gauge', type: 'number' },
        { name: 'length', type: 'number' },
        { name: 'price', type: 'number', isOptional: true },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'image_url', type: 'string', isOptional: true },
        { name: 'average_rating', type: 'number' },
        { name: 'rating_count', type: 'number' },
        { name: 'category', type: 'string', isIndexed: true },
        { name: 'tags', type: 'string' }, // JSON array
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'last_synced_at', type: 'number', isOptional: true },
        { name: 'sync_status', type: 'string' },
      ],
    }),

    // Beers Catalog
    tableSchema({
      name: 'beers',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string', isIndexed: true },
        { name: 'brewery', type: 'string', isIndexed: true },
        { name: 'style', type: 'string', isIndexed: true },
        { name: 'abv', type: 'number' },
        { name: 'ibu', type: 'number', isOptional: true },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'image_url', type: 'string', isOptional: true },
        { name: 'average_rating', type: 'number' },
        { name: 'rating_count', type: 'number' },
        { name: 'price', type: 'number', isOptional: true },
        { name: 'availability', type: 'string' },
        { name: 'origin', type: 'string' },
        { name: 'category', type: 'string', isIndexed: true },
        { name: 'tags', type: 'string' }, // JSON array
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'last_synced_at', type: 'number', isOptional: true },
        { name: 'sync_status', type: 'string' },
      ],
    }),

    // Wines Catalog
    tableSchema({
      name: 'wines',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string', isIndexed: true },
        { name: 'winery', type: 'string', isIndexed: true },
        { name: 'varietal', type: 'string', isIndexed: true },
        { name: 'vintage', type: 'number', isIndexed: true },
        { name: 'region', type: 'string', isIndexed: true },
        { name: 'country', type: 'string', isIndexed: true },
        { name: 'type', type: 'string' }, // 'red', 'white', 'rosé', 'sparkling', 'dessert'
        { name: 'alcohol_content', type: 'number' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'image_url', type: 'string', isOptional: true },
        { name: 'average_rating', type: 'number' },
        { name: 'rating_count', type: 'number' },
        { name: 'price', type: 'number', isOptional: true },
        { name: 'category', type: 'string', isIndexed: true },
        { name: 'tags', type: 'string' }, // JSON array
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'last_synced_at', type: 'number', isOptional: true },
        { name: 'sync_status', type: 'string' },
      ],
    }),

    // User Ratings and Reviews
    tableSchema({
      name: 'ratings',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'product_id', type: 'string', isIndexed: true },
        { name: 'product_type', type: 'string', isIndexed: true }, // 'cigar', 'beer', 'wine'
        { name: 'rating', type: 'number' },
        { name: 'review', type: 'string', isOptional: true },
        { name: 'flavor_notes', type: 'string', isOptional: true }, // JSON array
        { name: 'photos', type: 'string', isOptional: true }, // JSON array of URLs
        { name: 'location', type: 'string', isOptional: true },
        { name: 'occasion', type: 'string', isOptional: true },
        { name: 'pairing', type: 'string', isOptional: true },
        { name: 'is_private', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'last_synced_at', type: 'number', isOptional: true },
        { name: 'sync_status', type: 'string' },
      ],
    }),

    // User Collections (Personal inventory)
    tableSchema({
      name: 'collections',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'product_id', type: 'string', isIndexed: true },
        { name: 'product_type', type: 'string', isIndexed: true },
        { name: 'quantity', type: 'number' },
        { name: 'purchase_date', type: 'number', isOptional: true },
        { name: 'purchase_price', type: 'number', isOptional: true },
        { name: 'storage_location', type: 'string', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'is_wishlist', type: 'boolean' },
        { name: 'is_favorite', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'last_synced_at', type: 'number', isOptional: true },
        { name: 'sync_status', type: 'string' },
      ],
    }),

    // Social Posts
    tableSchema({
      name: 'posts',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'content', type: 'string' },
        { name: 'images', type: 'string', isOptional: true }, // JSON array
        { name: 'product_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'product_type', type: 'string', isOptional: true },
        { name: 'location', type: 'string', isOptional: true },
        { name: 'tags', type: 'string', isOptional: true }, // JSON array
        { name: 'like_count', type: 'number' },
        { name: 'comment_count', type: 'number' },
        { name: 'share_count', type: 'number' },
        { name: 'is_liked_by_user', type: 'boolean' },
        { name: 'visibility', type: 'string' }, // 'public', 'friends', 'private'
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'last_synced_at', type: 'number', isOptional: true },
        { name: 'sync_status', type: 'string' },
      ],
    }),

    // Comments on Posts
    tableSchema({
      name: 'comments',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'post_id', type: 'string', isIndexed: true },
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'content', type: 'string' },
        { name: 'parent_comment_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'like_count', type: 'number' },
        { name: 'is_liked_by_user', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'last_synced_at', type: 'number', isOptional: true },
        { name: 'sync_status', type: 'string' },
      ],
    }),

    // User Follows/Following
    tableSchema({
      name: 'follows',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'follower_id', type: 'string', isIndexed: true },
        { name: 'following_id', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'last_synced_at', type: 'number', isOptional: true },
        { name: 'sync_status', type: 'string' },
      ],
    }),

    // Sync Queue for offline changes
    tableSchema({
      name: 'sync_queue',
      columns: [
        { name: 'table_name', type: 'string', isIndexed: true },
        { name: 'record_id', type: 'string', isIndexed: true },
        { name: 'action', type: 'string' }, // 'create', 'update', 'delete'
        { name: 'data', type: 'string' }, // JSON string of changes
        { name: 'priority', type: 'number' }, // Higher number = higher priority
        { name: 'retry_count', type: 'number' },
        { name: 'last_attempt', type: 'number', isOptional: true },
        { name: 'error_message', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),

    // App Settings and Cache
    tableSchema({
      name: 'app_settings',
      columns: [
        { name: 'key', type: 'string', isIndexed: true },
        { name: 'value', type: 'string' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
