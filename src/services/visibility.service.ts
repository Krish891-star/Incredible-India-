/**
 * Visibility Manager Service for Public User Directory System
 * Manages user privacy controls and profile field visibility
 */

import { supabase } from '@/integrations/supabase/client';

// Type definitions for visibility management
export interface VisibilityPreferences {
  id: string;
  user_id: string;
  show_contact_info: boolean;
  show_pricing: boolean;
  show_location: boolean;
  show_reviews: boolean;
  custom_bio?: string;
  featured_images?: string[];
  created_at: string;
  updated_at: string;
}

export interface VisibilityPreferencesInsert {
  id?: string;
  user_id: string;
  show_contact_info?: boolean;
  show_pricing?: boolean;
  show_location?: boolean;
  show_reviews?: boolean;
  custom_bio?: string;
  featured_images?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface VisibilityPreferencesUpdate {
  show_contact_info?: boolean;
  show_pricing?: boolean;
  show_location?: boolean;
  show_reviews?: boolean;
  custom_bio?: string;
  featured_images?: string[];
  updated_at?: string;
}

export interface VerificationStatus {
  isVerified: boolean;
  verificationDate?: Date;
  verificationLevel?: 'basic' | 'enhanced' | 'premium';
}

export interface ProfileFieldVisibility {
  field: string;
  visible: boolean;
}

export interface PublicProfile {
  id: string;
  userId: string;
  passionType: 'tour_guide' | 'hotel_partner';
  displayName: string;
  bio?: string;
  location?: {
    city?: string;
    state?: string;
  };
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  isVerified: boolean;
  isActive: boolean;
  lastActive?: Date;
  createdAt: Date;
}

export interface VisibilityResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

/**
 * Visibility Manager Class
 * Handles user privacy controls and profile field visibility
 */
export class VisibilityManager {

  /**
   * Get user visibility preferences
   * @param userId - User ID
   */
  async getUserPreferences(userId: string): Promise<VisibilityResponse<VisibilityPreferences>> {
    try {
      const { data, error } = await (supabase as any)
        .from('user_visibility_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If no preferences exist, return default preferences
        if (error.code === 'PGRST116') {
          const defaultPrefs: VisibilityPreferences = {
            id: '',
            user_id: userId,
            show_contact_info: true,
            show_pricing: true,
            show_location: true,
            show_reviews: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          return { success: true, data: defaultPrefs };
        }
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to get user preferences' };
    }
  }

  /**
   * Update user visibility preferences
   * @param userId - User ID
   * @param prefs - Visibility preferences to update
   */
  async updateUserPreferences(
    userId: string, 
    prefs: Partial<VisibilityPreferencesUpdate>
  ): Promise<VisibilityResponse<VisibilityPreferences>> {
    try {
      const updateData = {
        ...prefs,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await (supabase as any)
        .from('user_visibility_preferences')
        .upsert({
          user_id: userId,
          ...updateData
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to update user preferences' };
    }
  }

  /**
   * Check verification status for a user
   * @param userId - User ID
   */
  async checkVerificationStatus(userId: string): Promise<VisibilityResponse<VerificationStatus>> {
    try {
      // Check both tour_guides and hotel_partners tables for verification status
      const [guideResult, hotelResult] = await Promise.all([
        supabase
          .from('tour_guides')
          .select('verified, created_at')
          .eq('user_id', userId)
          .single(),
        supabase
          .from('hotel_partners')
          .select('is_verified, created_at')
          .eq('user_id', userId)
          .single()
      ]);

      let verificationStatus: VerificationStatus = {
        isVerified: false
      };

      // Check tour guide verification
      if (guideResult.data && !guideResult.error) {
        verificationStatus = {
          isVerified: guideResult.data.verified || false,
          verificationDate: guideResult.data.verified ? new Date(guideResult.data.created_at) : undefined,
          verificationLevel: 'basic'
        };
      }

      // Check hotel partner verification (overrides guide if both exist)
      if (hotelResult.data && !hotelResult.error) {
        verificationStatus = {
          isVerified: hotelResult.data.is_verified || false,
          verificationDate: hotelResult.data.is_verified ? new Date(hotelResult.data.created_at) : undefined,
          verificationLevel: 'basic'
        };
      }

      return { success: true, data: verificationStatus };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to check verification status' };
    }
  }

  /**
   * Update verification status for a user
   * @param userId - User ID
   * @param status - New verification status
   */
  async updateVerificationStatus(
    userId: string, 
    status: VerificationStatus
  ): Promise<VisibilityResponse<VerificationStatus>> {
    try {
      // Determine which table to update based on user's passion type
      const passionType = await this.getUserPassionType(userId);
      
      if (!passionType.success || !passionType.data) {
        return { success: false, error: 'Could not determine user passion type' };
      }

      if (passionType.data === 'tour_guide') {
        const { error } = await supabase
          .from('tour_guides')
          .update({ verified: status.isVerified })
          .eq('user_id', userId);

        if (error) {
          return { success: false, error: error.message };
        }
      } else if (passionType.data === 'hotel_partner') {
        const { error } = await supabase
          .from('hotel_partners')
          .update({ is_verified: status.isVerified })
          .eq('user_id', userId);

        if (error) {
          return { success: false, error: error.message };
        }
      }

      return { success: true, data: status };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to update verification status' };
    }
  }

  /**
   * Set profile field visibility
   * @param userId - User ID
   * @param fields - Array of field visibility settings
   */
  async setProfileFields(
    userId: string, 
    fields: ProfileFieldVisibility[]
  ): Promise<VisibilityResponse<VisibilityPreferences>> {
    try {
      // Convert field visibility array to preference object
      const preferences: Partial<VisibilityPreferencesUpdate> = {};

      fields.forEach(field => {
        switch (field.field) {
          case 'contact_info':
            preferences.show_contact_info = field.visible;
            break;
          case 'pricing':
            preferences.show_pricing = field.visible;
            break;
          case 'location':
            preferences.show_location = field.visible;
            break;
          case 'reviews':
            preferences.show_reviews = field.visible;
            break;
        }
      });

      return await this.updateUserPreferences(userId, preferences);
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to set profile fields' };
    }
  }

  /**
   * Get public profile with visibility controls applied
   * @param userId - User ID
   */
  async getPublicProfile(userId: string): Promise<VisibilityResponse<PublicProfile | null>> {
    try {
      // Get user preferences
      const prefsResult = await this.getUserPreferences(userId);
      if (!prefsResult.success) {
        return { success: false, error: prefsResult.error };
      }

      const prefs = prefsResult.data!;

      // Get user passion type
      const passionTypeResult = await this.getUserPassionType(userId);
      if (!passionTypeResult.success || !passionTypeResult.data) {
        return { success: false, error: 'Could not determine user passion type' };
      }

      const passionType = passionTypeResult.data;

      // Get profile data based on passion type
      let profileData: any = null;

      if (passionType === 'tour_guide') {
        const { data, error } = await supabase
          .from('tour_guides')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error) {
          return { success: false, error: error.message };
        }
        profileData = data;
      } else if (passionType === 'hotel_partner') {
        const { data, error } = await supabase
          .from('hotel_partners')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error) {
          return { success: false, error: error.message };
        }
        profileData = data;
      }

      if (!profileData) {
        return { success: true, data: null };
      }

      // Build public profile with visibility controls applied
      const publicProfile: PublicProfile = {
        id: profileData.id,
        userId: profileData.user_id,
        passionType: passionType,
        displayName: profileData.full_name || profileData.company_name,
        bio: prefs.custom_bio || profileData.bio,
        location: prefs.show_location ? {
          city: profileData.city,
          state: profileData.state
        } : undefined,
        contactInfo: prefs.show_contact_info ? {
          phone: profileData.phone,
          email: profileData.email,
          website: profileData.website
        } : undefined,
        isVerified: passionType === 'tour_guide' ? 
          (profileData.verified || false) : 
          (profileData.is_verified || false),
        isActive: profileData.is_active || true,
        lastActive: profileData.last_active ? new Date(profileData.last_active) : undefined,
        createdAt: new Date(profileData.created_at)
      };

      return { success: true, data: publicProfile };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to get public profile' };
    }
  }

  /**
   * Check if user profile should be visible in public directories
   * @param userId - User ID
   */
  async isProfileVisible(userId: string): Promise<VisibilityResponse<boolean>> {
    try {
      // Check if user has a directory listing and if it's visible
      const { data, error } = await (supabase as any)
        .from('public_directory_listings')
        .select('is_visible')
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      // If no listings exist, profile is not visible
      if (!data || data.length === 0) {
        return { success: true, data: false };
      }

      // Profile is visible if any listing is visible
      const isVisible = data.some((listing: any) => listing.is_visible);
      return { success: true, data: isVisible };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to check profile visibility' };
    }
  }

  /**
   * Set profile visibility in public directories
   * @param userId - User ID
   * @param isVisible - Whether profile should be visible
   */
  async setProfileVisibility(
    userId: string, 
    isVisible: boolean
  ): Promise<VisibilityResponse<boolean>> {
    try {
      const { error } = await (supabase as any)
        .from('public_directory_listings')
        .update({ 
          is_visible: isVisible,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: isVisible };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to set profile visibility' };
    }
  }

  /**
   * Handle account deactivation - remove from public directories
   * @param userId - User ID
   */
  async handleAccountDeactivation(userId: string): Promise<VisibilityResponse<boolean>> {
    try {
      // Set profile visibility to false
      const visibilityResult = await this.setProfileVisibility(userId, false);
      if (!visibilityResult.success) {
        return visibilityResult;
      }

      // Update user status in passion tables
      const passionTypeResult = await this.getUserPassionType(userId);
      if (passionTypeResult.success && passionTypeResult.data) {
        const passionType = passionTypeResult.data;

        if (passionType === 'tour_guide') {
          await supabase
            .from('tour_guides')
            .update({ is_active: false })
            .eq('user_id', userId);
        } else if (passionType === 'hotel_partner') {
          await supabase
            .from('hotel_partners')
            .update({ is_active: false })
            .eq('user_id', userId);
        }
      }

      return { success: true, data: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to handle account deactivation' };
    }
  }

  /**
   * Private helper method to determine user's passion type
   * @param userId - User ID
   */
  private async getUserPassionType(userId: string): Promise<VisibilityResponse<'tour_guide' | 'hotel_partner' | null>> {
    try {
      // Check directory listings first
      const { data: listings, error: listingsError } = await (supabase as any)
        .from('public_directory_listings')
        .select('passion_type')
        .eq('user_id', userId)
        .limit(1);

      if (!listingsError && listings && listings.length > 0) {
        return { success: true, data: listings[0].passion_type };
      }

      // Check tour_guides table
      const { data: guideData, error: guideError } = await supabase
        .from('tour_guides')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!guideError && guideData) {
        return { success: true, data: 'tour_guide' };
      }

      // Check hotel_partners table
      const { data: hotelData, error: hotelError } = await supabase
        .from('hotel_partners')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!hotelError && hotelData) {
        return { success: true, data: 'hotel_partner' };
      }

      return { success: true, data: null };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to determine passion type' };
    }
  }
}

// Export singleton instance
export const visibilityManager = new VisibilityManager();

// Export default
export default visibilityManager;