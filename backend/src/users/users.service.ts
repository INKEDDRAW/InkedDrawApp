import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserDto {
  id?: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const userData = {
      ...createUserDto,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // If id is provided, include it in the insert
    if (createUserDto.id) {
      userData.id = createUserDto.id;
    }

    const result = await this.supabaseService.insert('users', userData);

    return result[0];
  }

  async findAll(): Promise<User[]> {
    // Use admin client to bypass RLS for user lookups
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('users')
      .select('*');

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return data || [];
  }

  async findOne(id: string): Promise<User> {
    // Use admin client to bypass RLS for user lookups
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return data;
  }

  async findByEmail(email: string): Promise<User | null> {
    // Use admin client to bypass RLS for user lookups
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  async update(id: string, updateUserDto: Partial<CreateUserDto>): Promise<User> {
    const result = await this.supabaseService.update('users', id, {
      ...updateUserDto,
      updated_at: new Date().toISOString(),
    });

    return result[0];
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabaseService
      .query('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }
}
