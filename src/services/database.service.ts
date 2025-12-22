/**
 * Simple Database Service for Supabase
 * Clean and focused on essential operations only
 */

import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

// Essential type definitions
export type UserProfile = Database['public']['Tables']['profiles']['Row'];
export type UserPassion = Database['public']['Tables']['user_passions']['Row'];

// Generic response type
export interface DatabaseResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// Utility function to handle database responses
const handleResponse = async <T>(queryBuilder: any): Promise<DatabaseResponse<T>> => {
  try {
    const { data, error } = await queryBuilder;
    if (error) throw error;
    return { data, success: true };
  } catch (error: any) {
    console.error('[Database Service] Error:', error);
    return { error: error.message || 'Database operation failed', success: false };
  }
};

/**
 * USER PROFILE OPERATIONS - SIMPLIFIED
 */
export const userProfileService = {
  // Get user profile by user ID
  async getProfile(userId: string): Promise<DatabaseResponse<UserProfile | null>> {
    return handleResponse<UserProfile | null>(
      supabase.from('profiles').select('*').eq('id', userId).single()
    );
  },

  // Create or update user profile
  async upsertProfile(profileData: Partial<UserProfile> & { id: string }): Promise<DatabaseResponse<UserProfile>> {
    return handleResponse<UserProfile>(
      supabase.from('profiles').upsert(profileData).select().single()
    );
  },

  // Update user profile
  async updateProfile(userId: string, profileData: Partial<UserProfile>): Promise<DatabaseResponse<UserProfile>> {
    return handleResponse<UserProfile>(
      supabase.from('profiles').update(profileData).eq('id', userId).select().single()
    );
  }
};

/**
 * USER PASSION OPERATIONS - SIMPLIFIED
 */
export const userPassionService = {
  // Get all passions for a user
  async getUserPassions(userId: string): Promise<DatabaseResponse<UserPassion[]>> {
    return handleResponse<UserPassion[]>(
      supabase.from('user_passions').select('*').eq('user_id', userId)
    );
  },
  
  // Check if user has a specific passion
  async hasPassion(userId: string, passionType: string): Promise<DatabaseResponse<boolean>> {
    const response = await handleResponse<UserPassion[]>(
      supabase.from('user_passions').select('id').match({ user_id: userId, passion: passionType })
    );
    
    if (!response.success) {
      return { error: response.error, success: false };
    }
    
    return { data: response.data!.length > 0, success: true };
  },
  
  // Add a passion for a user
  async addPassion(userId: string, passionType: string): Promise<DatabaseResponse<UserPassion>> {
    return handleResponse<UserPassion>(
      supabase.from('user_passions').upsert({ user_id: userId, passion: passionType }).select().single()
    );
  },
  
  // Remove a passion for a user
  async removePassion(userId: string, passionType: string): Promise<DatabaseResponse<null>> {
    return handleResponse<null>(
      supabase.from('user_passions').delete().match({ user_id: userId, passion: passionType })
    );
  }
};

// Export simplified service
export default {
  userProfileService,
  userPassionService
};