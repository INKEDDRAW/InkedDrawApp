import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  item_type?: 'cigar' | 'wine' | 'beer';
  item_name?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export interface CreatePostDto {
  content: string;
  image_url?: string;
  item_type?: 'cigar' | 'wine' | 'beer';
  item_name?: string;
}

@Injectable()
export class SocialService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async createPost(userId: string, createPostDto: CreatePostDto): Promise<Post> {
    const result = await this.supabaseService.insert('posts', {
      user_id: userId,
      ...createPostDto,
      likes_count: 0,
      comments_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return result[0];
  }

  async getFeed(userId?: string, limit: number = 20, offset: number = 0): Promise<Post[]> {
    const { data, error } = await this.supabaseService
      .query('posts')
      .select(`
        *,
        user:users(id, name, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch feed: ${error.message}`);
    }

    return data || [];
  }

  async getPost(id: string): Promise<Post> {
    const { data, error } = await this.supabaseService
      .query('posts')
      .select(`
        *,
        user:users(id, name, avatar_url)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return data;
  }

  async likePost(postId: string, userId: string): Promise<void> {
    // Check if already liked
    const { data: existingLike } = await this.supabaseService
      .query('post_likes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (existingLike) {
      // Unlike
      await this.supabaseService
        .query('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      // Decrement likes count
      const { data: post } = await this.supabaseService
        .query('posts')
        .select('likes_count')
        .eq('id', postId)
        .single();

      if (post) {
        await this.supabaseService.update('posts', postId, {
          likes_count: Math.max(0, post.likes_count - 1),
        });
      }
    } else {
      // Like
      await this.supabaseService.insert('post_likes', {
        post_id: postId,
        user_id: userId,
        created_at: new Date().toISOString(),
      });

      // Increment likes count
      const { data: post } = await this.supabaseService
        .query('posts')
        .select('likes_count')
        .eq('id', postId)
        .single();

      if (post) {
        await this.supabaseService.update('posts', postId, {
          likes_count: post.likes_count + 1,
        });
      }
    }
  }

  async deletePost(id: string, userId: string): Promise<void> {
    const { error } = await this.supabaseService
      .query('posts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete post: ${error.message}`);
    }
  }

  async getPostLikes(postId: string): Promise<any[]> {
    const { data, error } = await this.supabaseService
      .query('post_likes')
      .select(`
        user_id,
        created_at,
        user:users(id, name, avatar_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get post likes: ${error.message}`);
    }

    return data || [];
  }

  async getUserPosts(userId: string, limit: number = 20, offset: number = 0): Promise<Post[]> {
    const { data, error } = await this.supabaseService
      .query('posts')
      .select(`
        *,
        user:users(id, name, avatar_url)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to get user posts: ${error.message}`);
    }

    return data || [];
  }

  async getUserProfile(userId: string): Promise<any> {
    // Get user basic info
    const { data: user, error: userError } = await this.supabaseService
      .query('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      throw new Error(`Failed to get user profile: ${userError.message}`);
    }

    // Get user stats
    const { data: postsCount } = await this.supabaseService
      .query('posts')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);

    const { data: totalLikes } = await this.supabaseService
      .query('posts')
      .select('likes_count')
      .eq('user_id', userId);

    const totalLikesCount = totalLikes?.reduce((sum, post) => sum + (post.likes_count || 0), 0) || 0;

    return {
      ...user,
      stats: {
        posts_count: postsCount?.length || 0,
        total_likes: totalLikesCount,
      }
    };
  }
}
