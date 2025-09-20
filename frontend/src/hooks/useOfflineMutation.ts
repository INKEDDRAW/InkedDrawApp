/**
 * Offline Mutation Hook
 * React hook for performing mutations with offline-first capabilities
 */

import { useState, useCallback } from 'react';
import { database, collections } from '../database';
import { SyncManager } from '../database/sync/SyncManager';
import { useOffline, useOptimisticUpdate } from '../contexts/OfflineContext';

export interface OfflineMutationOptions<TData, TVariables> {
  // Optimistic update function
  optimisticUpdate?: (variables: TVariables) => Promise<TData>;
  
  // Rollback function (if optimistic update fails)
  rollback?: (data: TData, error: Error) => Promise<void>;
  
  // Success callback
  onSuccess?: (data: TData, variables: TVariables) => void;
  
  // Error callback
  onError?: (error: Error, variables: TVariables) => void;
  
  // Sync priority (1-10, higher = more important)
  syncPriority?: number;
  
  // Whether to show loading state during optimistic updates
  showLoadingOnOptimistic?: boolean;
}

export interface OfflineMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  loading: boolean;
  error: Error | null;
  data: TData | null;
  reset: () => void;
}

export function useOfflineMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: OfflineMutationOptions<TData, TVariables> = {}
): OfflineMutationResult<TData, TVariables> {
  const {
    optimisticUpdate,
    rollback,
    onSuccess,
    onError,
    syncPriority = 5,
    showLoadingOnOptimistic = false,
  } = options;

  const { isOnline } = useOffline();
  const { performOptimisticUpdate } = useOptimisticUpdate();
  const syncManager = SyncManager.getInstance();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | null>(null);

  const mutate = useCallback(async (variables: TVariables): Promise<TData> => {
    setError(null);
    
    if (showLoadingOnOptimistic || !optimisticUpdate) {
      setLoading(true);
    }

    try {
      let result: TData;

      if (optimisticUpdate) {
        // Perform optimistic update
        result = await performOptimisticUpdate(
          () => optimisticUpdate(variables),
          () => mutationFn(variables),
          rollback ? (error) => rollback(result, error) : undefined
        );
      } else {
        // Regular mutation
        if (isOnline) {
          result = await mutationFn(variables);
        } else {
          throw new Error('This action requires an internet connection');
        }
      }

      setData(result);
      onSuccess?.(result, variables);
      return result;

    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error, variables);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [mutationFn, optimisticUpdate, performOptimisticUpdate, rollback, onSuccess, onError, isOnline, showLoadingOnOptimistic]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    mutate,
    loading,
    error,
    data,
    reset,
  };
}

// Specialized mutation hooks for common operations

export function useCreateRating() {
  return useOfflineMutation(
    async (variables: {
      productId: string;
      productType: 'cigar' | 'beer' | 'wine';
      rating: number;
      review?: string;
      flavorNotes?: any;
      photos?: any[];
      location?: string;
      occasion?: string;
      pairing?: string;
      isPrivate?: boolean;
    }) => {
      return database.write(async () => {
        const rating = await collections.ratings.create(record => {
          record.serverId = `temp_${Date.now()}_${Math.random()}`;
          record.userId = 'current_user'; // Will be replaced with actual user ID
          record.productId = variables.productId;
          record.productType = variables.productType;
          record.rating = variables.rating;
          record.review = variables.review;
          record.flavorNotesRaw = variables.flavorNotes ? JSON.stringify(variables.flavorNotes) : undefined;
          record.photosRaw = variables.photos ? JSON.stringify(variables.photos) : undefined;
          record.location = variables.location;
          record.occasion = variables.occasion;
          record.pairing = variables.pairing;
          record.isPrivate = variables.isPrivate ?? false;
          record.syncStatus = 'pending';
        });
        return rating;
      });
    },
    {
      syncPriority: 8,
      optimisticUpdate: async (variables) => {
        // Optimistically create the rating locally
        return database.write(async () => {
          return collections.ratings.create(record => {
            record.serverId = `temp_${Date.now()}_${Math.random()}`;
            record.userId = 'current_user';
            record.productId = variables.productId;
            record.productType = variables.productType;
            record.rating = variables.rating;
            record.review = variables.review;
            record.syncStatus = 'pending';
          });
        });
      },
    }
  );
}

export function useAddToCollection() {
  return useOfflineMutation(
    async (variables: {
      productId: string;
      productType: 'cigar' | 'beer' | 'wine';
      quantity?: number;
      purchasePrice?: number;
      purchaseDate?: Date;
      storageLocation?: string;
      notes?: string;
      isWishlist?: boolean;
      isFavorite?: boolean;
    }) => {
      return database.write(async () => {
        const collection = await collections.collections.create(record => {
          record.serverId = `temp_${Date.now()}_${Math.random()}`;
          record.userId = 'current_user';
          record.productId = variables.productId;
          record.productType = variables.productType;
          record.quantity = variables.quantity ?? 1;
          record.purchasePrice = variables.purchasePrice;
          record.purchaseDate = variables.purchaseDate;
          record.storageLocation = variables.storageLocation;
          record.notes = variables.notes;
          record.isWishlist = variables.isWishlist ?? false;
          record.isFavorite = variables.isFavorite ?? false;
          record.syncStatus = 'pending';
        });
        return collection;
      });
    },
    {
      syncPriority: 6,
      optimisticUpdate: async (variables) => {
        return database.write(async () => {
          return collections.collections.create(record => {
            record.serverId = `temp_${Date.now()}_${Math.random()}`;
            record.userId = 'current_user';
            record.productId = variables.productId;
            record.productType = variables.productType;
            record.quantity = variables.quantity ?? 1;
            record.isWishlist = variables.isWishlist ?? false;
            record.isFavorite = variables.isFavorite ?? false;
            record.syncStatus = 'pending';
          });
        });
      },
    }
  );
}

export function useCreatePost() {
  return useOfflineMutation(
    async (variables: {
      content: string;
      images?: any[];
      productId?: string;
      productType?: 'cigar' | 'beer' | 'wine';
      location?: string;
      tags?: string[];
      visibility?: 'public' | 'friends' | 'private';
    }) => {
      return database.write(async () => {
        const post = await collections.posts.create(record => {
          record.serverId = `temp_${Date.now()}_${Math.random()}`;
          record.userId = 'current_user';
          record.content = variables.content;
          record.imagesRaw = variables.images ? JSON.stringify(variables.images) : undefined;
          record.productId = variables.productId;
          record.productType = variables.productType;
          record.location = variables.location;
          record.tagsRaw = variables.tags ? JSON.stringify(variables.tags) : undefined;
          record.visibility = variables.visibility ?? 'public';
          record.likeCount = 0;
          record.commentCount = 0;
          record.shareCount = 0;
          record.isLikedByUser = false;
          record.syncStatus = 'pending';
        });
        return post;
      });
    },
    {
      syncPriority: 7,
      optimisticUpdate: async (variables) => {
        return database.write(async () => {
          return collections.posts.create(record => {
            record.serverId = `temp_${Date.now()}_${Math.random()}`;
            record.userId = 'current_user';
            record.content = variables.content;
            record.visibility = variables.visibility ?? 'public';
            record.likeCount = 0;
            record.commentCount = 0;
            record.shareCount = 0;
            record.isLikedByUser = false;
            record.syncStatus = 'pending';
          });
        });
      },
    }
  );
}

export function useLikePost() {
  return useOfflineMutation(
    async (variables: { postId: string; isLiked: boolean }) => {
      return database.write(async () => {
        const post = await collections.posts.find(variables.postId);
        await post.update(record => {
          record.isLikedByUser = variables.isLiked;
          record.likeCount += variables.isLiked ? 1 : -1;
          record.syncStatus = 'pending';
        });
        return post;
      });
    },
    {
      syncPriority: 3,
      showLoadingOnOptimistic: false,
      optimisticUpdate: async (variables) => {
        return database.write(async () => {
          const post = await collections.posts.find(variables.postId);
          await post.update(record => {
            record.isLikedByUser = variables.isLiked;
            record.likeCount += variables.isLiked ? 1 : -1;
            record.syncStatus = 'pending';
          });
          return post;
        });
      },
    }
  );
}

export function useCreateComment() {
  return useOfflineMutation(
    async (variables: {
      postId: string;
      content: string;
      parentCommentId?: string;
    }) => {
      return database.write(async () => {
        const comment = await collections.comments.create(record => {
          record.serverId = `temp_${Date.now()}_${Math.random()}`;
          record.postId = variables.postId;
          record.userId = 'current_user';
          record.content = variables.content;
          record.parentCommentId = variables.parentCommentId;
          record.likeCount = 0;
          record.isLikedByUser = false;
          record.syncStatus = 'pending';
        });

        // Update post comment count
        const post = await collections.posts.find(variables.postId);
        await post.update(p => {
          p.commentCount += 1;
          p.syncStatus = 'pending';
        });

        return comment;
      });
    },
    {
      syncPriority: 7,
      optimisticUpdate: async (variables) => {
        return database.write(async () => {
          const comment = await collections.comments.create(record => {
            record.serverId = `temp_${Date.now()}_${Math.random()}`;
            record.postId = variables.postId;
            record.userId = 'current_user';
            record.content = variables.content;
            record.parentCommentId = variables.parentCommentId;
            record.likeCount = 0;
            record.isLikedByUser = false;
            record.syncStatus = 'pending';
          });

          // Update post comment count
          const post = await collections.posts.find(variables.postId);
          await post.update(p => {
            p.commentCount += 1;
            p.syncStatus = 'pending';
          });

          return comment;
        });
      },
    }
  );
}

export function useLikeComment() {
  return useOfflineMutation(
    async (variables: { commentId: string; isLiked: boolean }) => {
      return database.write(async () => {
        const comment = await collections.comments.find(variables.commentId);
        await comment.update(record => {
          record.isLikedByUser = variables.isLiked;
          record.likeCount += variables.isLiked ? 1 : -1;
          record.syncStatus = 'pending';
        });
        return comment;
      });
    },
    {
      syncPriority: 2,
      showLoadingOnOptimistic: false,
      optimisticUpdate: async (variables) => {
        return database.write(async () => {
          const comment = await collections.comments.find(variables.commentId);
          await comment.update(record => {
            record.isLikedByUser = variables.isLiked;
            record.likeCount += variables.isLiked ? 1 : -1;
            record.syncStatus = 'pending';
          });
          return comment;
        });
      },
    }
  );
}

export function useFollowUser() {
  return useOfflineMutation(
    async (variables: { userId: string }) => {
      return database.write(async () => {
        const follow = await collections.follows.create(record => {
          record.serverId = `temp_${Date.now()}_${Math.random()}`;
          record.followerId = 'current_user';
          record.followingId = variables.userId;
          record.syncStatus = 'pending';
        });
        return follow;
      });
    },
    {
      syncPriority: 6,
      optimisticUpdate: async (variables) => {
        return database.write(async () => {
          return collections.follows.create(record => {
            record.serverId = `temp_${Date.now()}_${Math.random()}`;
            record.followerId = 'current_user';
            record.followingId = variables.userId;
            record.syncStatus = 'pending';
          });
        });
      },
    }
  );
}

export function useUnfollowUser() {
  return useOfflineMutation(
    async (variables: { userId: string }) => {
      return database.write(async () => {
        const follows = await collections.follows
          .query()
          .where('follower_id', 'current_user')
          .where('following_id', variables.userId)
          .fetch();

        for (const follow of follows) {
          await follow.destroyPermanently();
        }

        return { success: true };
      });
    },
    {
      syncPriority: 6,
      optimisticUpdate: async (variables) => {
        return database.write(async () => {
          const follows = await collections.follows
            .query()
            .where('follower_id', 'current_user')
            .where('following_id', variables.userId)
            .fetch();

          for (const follow of follows) {
            await follow.destroyPermanently();
          }

          return { success: true };
        });
      },
    }
  );
}

export function useAddToCollection() {
  return useOfflineMutation(
    async (variables: {
      productId: string;
      productType: 'cigar' | 'beer' | 'wine';
      status: string;
      notes?: string;
    }) => {
      return database.write(async () => {
        const collection = await collections.collections.create(record => {
          record.serverId = `temp_${Date.now()}_${Math.random()}`;
          record.userId = 'current_user';
          record.productId = variables.productId;
          record.productType = variables.productType;
          record.status = variables.status;
          record.notes = variables.notes || '';
          record.syncStatus = 'pending';
        });
        return collection;
      });
    },
    {
      syncPriority: 5,
      optimisticUpdate: async (variables) => {
        return database.write(async () => {
          return collections.collections.create(record => {
            record.serverId = `temp_${Date.now()}_${Math.random()}`;
            record.userId = 'current_user';
            record.productId = variables.productId;
            record.productType = variables.productType;
            record.status = variables.status;
            record.notes = variables.notes || '';
            record.syncStatus = 'pending';
          });
        });
      },
    }
  );
}

export function useLikeReview() {
  return useOfflineMutation(
    async (variables: { reviewId: string; isLiked: boolean }) => {
      return database.write(async () => {
        const rating = await collections.ratings.find(variables.reviewId);
        await rating.update(record => {
          record.isLikedByUser = variables.isLiked;
          record.likeCount += variables.isLiked ? 1 : -1;
          record.syncStatus = 'pending';
        });
        return rating;
      });
    },
    {
      syncPriority: 2,
      showLoadingOnOptimistic: false,
      optimisticUpdate: async (variables) => {
        return database.write(async () => {
          const rating = await collections.ratings.find(variables.reviewId);
          await rating.update(record => {
            record.isLikedByUser = variables.isLiked;
            record.likeCount += variables.isLiked ? 1 : -1;
            record.syncStatus = 'pending';
          });
          return rating;
        });
      },
    }
  );
}
