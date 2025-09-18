import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  Collection,
  CollectionItem,
  CreateCollectionDto,
  UpdateCollectionDto,
  CreateCollectionItemDto,
  UpdateCollectionItemDto,
  CollectionFilters,
  CollectionItemFilters,
  CollectionStats,
} from '../types/database.types';

@Injectable()
export class CollectionsService {
  private readonly logger = new Logger(CollectionsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  // =============================================
  // COLLECTIONS CRUD
  // =============================================

  async createCollection(userId: string, createDto: CreateCollectionDto): Promise<Collection> {
    try {
      const { data, error } = await this.supabaseService
        .query('collections')
        .insert({
          user_id: userId,
          ...createDto,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create collection: ${error.message}`);
      }

      return data;
    } catch (error) {
      this.logger.error('Error creating collection:', error);
      throw error;
    }
  }

  async findAllCollections(
    userId: string,
    filters: CollectionFilters = {}
  ): Promise<Collection[]> {
    try {
      let query = this.supabaseService
        .query('collections')
        .select('*');

      // Apply filters
      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.is_public !== undefined) {
        query = query.eq('is_public', filters.is_public);
      }

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      } else {
        // Default: show user's own collections + public collections
        query = query.or(`user_id.eq.${userId},is_public.eq.true`);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch collections: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      this.logger.error('Error fetching collections:', error);
      throw error;
    }
  }

  async findCollectionById(id: string, userId: string): Promise<Collection> {
    try {
      const { data, error } = await this.supabaseService
        .query('collections')
        .select('*')
        .eq('id', id)
        .or(`user_id.eq.${userId},is_public.eq.true`)
        .single();

      if (error || !data) {
        throw new NotFoundException(`Collection with ID ${id} not found`);
      }

      return data;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error fetching collection:', error);
      throw new Error('Failed to fetch collection');
    }
  }

  async updateCollection(
    id: string,
    userId: string,
    updateDto: UpdateCollectionDto
  ): Promise<Collection> {
    try {
      // First verify ownership
      await this.verifyCollectionOwnership(id, userId);

      const { data, error } = await this.supabaseService
        .query('collections')
        .update(updateDto)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error || !data) {
        throw new NotFoundException(`Collection with ID ${id} not found`);
      }

      return data;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error updating collection:', error);
      throw new Error('Failed to update collection');
    }
  }

  async deleteCollection(id: string, userId: string): Promise<void> {
    try {
      // First verify ownership
      await this.verifyCollectionOwnership(id, userId);

      const { error } = await this.supabaseService
        .query('collections')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to delete collection: ${error.message}`);
      }
    } catch (error) {
      this.logger.error('Error deleting collection:', error);
      throw error;
    }
  }

  // =============================================
  // COLLECTION ITEMS CRUD
  // =============================================

  async createCollectionItem(
    userId: string,
    createDto: CreateCollectionItemDto
  ): Promise<CollectionItem> {
    try {
      // Verify collection ownership or public access
      await this.findCollectionById(createDto.collection_id, userId);

      const { data, error } = await this.supabaseService
        .query('collection_items')
        .insert({
          user_id: userId,
          ...createDto,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create collection item: ${error.message}`);
      }

      return data;
    } catch (error) {
      this.logger.error('Error creating collection item:', error);
      throw error;
    }
  }

  async findCollectionItems(
    collectionId: string,
    userId: string,
    filters: CollectionItemFilters = {}
  ): Promise<CollectionItem[]> {
    try {
      // Verify collection access
      await this.findCollectionById(collectionId, userId);

      let query = this.supabaseService
        .query('collection_items')
        .select('*')
        .eq('collection_id', collectionId);

      // Apply filters
      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.is_favorite !== undefined) {
        query = query.eq('is_favorite', filters.is_favorite);
      }

      if (filters.is_wishlist !== undefined) {
        query = query.eq('is_wishlist', filters.is_wishlist);
      }

      if (filters.rating) {
        query = query.eq('rating', filters.rating);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch collection items: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      this.logger.error('Error fetching collection items:', error);
      throw error;
    }
  }

  async findCollectionItemById(
    id: string,
    userId: string
  ): Promise<CollectionItem> {
    try {
      const { data, error } = await this.supabaseService
        .query('collection_items')
        .select(`
          *,
          collection:collections(*)
        `)
        .eq('id', id)
        .single();

      if (error || !data) {
        throw new NotFoundException(`Collection item with ID ${id} not found`);
      }

      // Verify access to the collection
      const collection = data.collection as Collection;
      if (collection.user_id !== userId && !collection.is_public) {
        throw new ForbiddenException('Access denied to this collection item');
      }

      return data;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error('Error fetching collection item:', error);
      throw new Error('Failed to fetch collection item');
    }
  }

  async updateCollectionItem(
    id: string,
    userId: string,
    updateDto: UpdateCollectionItemDto
  ): Promise<CollectionItem> {
    try {
      // Verify ownership
      const item = await this.findCollectionItemById(id, userId);
      if (item.user_id !== userId) {
        throw new ForbiddenException('You can only update your own collection items');
      }

      const { data, error } = await this.supabaseService
        .query('collection_items')
        .update(updateDto)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error || !data) {
        throw new NotFoundException(`Collection item with ID ${id} not found`);
      }

      return data;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error('Error updating collection item:', error);
      throw new Error('Failed to update collection item');
    }
  }

  async deleteCollectionItem(id: string, userId: string): Promise<void> {
    try {
      // Verify ownership
      const item = await this.findCollectionItemById(id, userId);
      if (item.user_id !== userId) {
        throw new ForbiddenException('You can only delete your own collection items');
      }

      const { error } = await this.supabaseService
        .query('collection_items')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to delete collection item: ${error.message}`);
      }
    } catch (error) {
      this.logger.error('Error deleting collection item:', error);
      throw error;
    }
  }

  // =============================================
  // STATISTICS AND UTILITIES
  // =============================================

  async getCollectionStats(collectionId: string, userId: string): Promise<CollectionStats> {
    try {
      // Verify collection access
      await this.findCollectionById(collectionId, userId);

      const items = await this.findCollectionItems(collectionId, userId);

      const stats: CollectionStats = {
        total_items: items.length,
        items_by_type: {
          cigar: items.filter(item => item.type === 'cigar').length,
          wine: items.filter(item => item.type === 'wine').length,
          beer: items.filter(item => item.type === 'beer').length,
        },
        total_value: items.reduce((sum, item) => sum + (item.price || 0), 0),
        avg_rating: items.length > 0
          ? items.reduce((sum, item) => sum + (item.rating || 0), 0) / items.length
          : 0,
        recent_additions: items.filter(item => {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return new Date(item.created_at) > thirtyDaysAgo;
        }).length,
      };

      return stats;
    } catch (error) {
      this.logger.error('Error getting collection stats:', error);
      throw error;
    }
  }

  // =============================================
  // HELPER METHODS
  // =============================================

  private async verifyCollectionOwnership(collectionId: string, userId: string): Promise<void> {
    const { data, error } = await this.supabaseService
      .query('collections')
      .select('user_id')
      .eq('id', collectionId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Collection with ID ${collectionId} not found`);
    }
  }
}
