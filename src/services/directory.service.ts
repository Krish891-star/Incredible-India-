/**
 * Directory Service for Public User Directory System
 * Manages public listings for Tour Guides and Hotel Partners
 */

import { supabase } from '@/integrations/supabase/client';

// Manual type definitions for new tables (until types are regenerated)
export interface DirectoryListing {
  id: string;
  user_id: string;
  passion_type: 'tour_guide' | 'hotel_partner';
  is_visible: boolean;
  is_featured: boolean;
  listing_priority: number;
  search_keywords: string[];
  last_updated: string;
  created_at: string;
}

export interface DirectoryListingInsert {
  id?: string;
  user_id: string;
  passion_type: 'tour_guide' | 'hotel_partner';
  is_visible?: boolean;
  is_featured?: boolean;
  listing_priority?: number;
  search_keywords?: string[];
  last_updated?: string;
  created_at?: string;
}

export interface DirectoryListingUpdate {
  is_visible?: boolean;
  is_featured?: boolean;
  listing_priority?: number;
  search_keywords?: string[];
  last_updated?: string;
}

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

export interface DirectoryResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
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

export interface GuideProfile extends PublicProfile {
  specialties?: string[];
  languagesSpoken?: string[];
  experienceYears?: number;
  hourlyRate?: number;
  companyName?: string;
  certifications?: string[];
  nearbyAttractions?: string[];
  rating?: number;
  reviewCount?: number;
}

export interface HotelProfile extends PublicProfile {
  hotelType?: string;
  amenities?: string[];
  companyName?: string;
  roomTypes?: string[];
  priceRange?: { min: number; max: number };
  nearbyAttractions?: string[];
  images?: string[];
  rating?: number;
  reviewCount?: number;
}

// Utility function to handle database responses
const handleResponse = async <T>(queryBuilder: any): Promise<DirectoryResponse<T>> => {
  try {
    const { data, error } = await queryBuilder;
    if (error) throw error;
    return { data, success: true };
  } catch (error: any) {
    console.error('[Directory Service] Error:', error);
    return { error: error.message || 'Directory operation failed', success: false };
  }
};

/**
 * Directory Service Class
 * Manages public directory listings and visibility controls
 */
export class DirectoryService {
  
  /**
   * Create a public listing for a user
   * @param userId - User ID
   * @param passionType - Type of passion (tour_guide or hotel_partner)
   * @param searchKeywords - Optional search keywords
   */
  async createPublicListing(
    userId: string, 
    passionType: 'tour_guide' | 'hotel_partner',
    searchKeywords?: string[]
  ): Promise<DirectoryResponse<DirectoryListing>> {
    
    // First check if user has completed registration for this passion type
    const registrationComplete = await this.checkRegistrationComplete(userId, passionType);
    if (!registrationComplete.success || !registrationComplete.data) {
      return {
        success: false,
        error: 'User registration is not complete for this passion type'
      };
    }

    try {
      const listingData = {
        user_id: userId,
        passion_type: passionType,
        is_visible: true,
        is_featured: false,
        listing_priority: 0,
        search_keywords: searchKeywords || []
      };

      // Use supabase client with table name as string to bypass type checking
      const { data, error } = await (supabase as any)
        .from('public_directory_listings')
        .upsert(listingData, { onConflict: 'user_id,passion_type' })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to create listing' };
    }
  }

  /**
   * Update an existing public listing
   * @param userId - User ID
   * @param updates - Partial listing updates
   */
  async updatePublicListing(
    userId: string, 
    updates: DirectoryListingUpdate
  ): Promise<DirectoryResponse<DirectoryListing>> {
    
    try {
      const { data, error } = await (supabase as any)
        .from('public_directory_listings')
        .update({
          ...updates,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to update listing' };
    }
  }

  /**
   * Remove a public listing for a user
   * @param userId - User ID
   * @param passionType - Optional passion type filter
   */
  async removePublicListing(
    userId: string, 
    passionType?: 'tour_guide' | 'hotel_partner'
  ): Promise<DirectoryResponse<null>> {
    
    try {
      let query = (supabase as any)
        .from('public_directory_listings')
        .delete()
        .eq('user_id', userId);

      if (passionType) {
        query = query.eq('passion_type', passionType);
      }

      const { error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: null };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to remove listing' };
    }
  }

  /**
   * Set visibility for a user's listing
   * @param userId - User ID
   * @param isVisible - Visibility status
   * @param passionType - Optional passion type filter
   */
  async setVisibility(
    userId: string, 
    isVisible: boolean,
    passionType?: 'tour_guide' | 'hotel_partner'
  ): Promise<DirectoryResponse<DirectoryListing[]>> {
    
    try {
      let query = (supabase as any)
        .from('public_directory_listings')
        .update({ 
          is_visible: isVisible,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (passionType) {
        query = query.eq('passion_type', passionType);
      }

      const { data, error } = await query.select();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to set visibility' };
    }
  }

  /**
   * Get visibility status for a user
   * @param userId - User ID
   */
  async getVisibilityStatus(userId: string): Promise<DirectoryResponse<DirectoryListing[]>> {
    try {
      const { data, error } = await (supabase as any)
        .from('public_directory_listings')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to get visibility status' };
    }
  }

  /**
   * Get all public listings with optional filtering
   * @param passionType - Optional passion type filter
   * @param isVisible - Optional visibility filter
   */
  async getPublicListings(
    passionType?: 'tour_guide' | 'hotel_partner',
    isVisible: boolean = true
  ): Promise<DirectoryResponse<DirectoryListing[]>> {
    
    try {
      let query = (supabase as any)
        .from('public_directory_listings')
        .select('*')
        .eq('is_visible', isVisible);

      if (passionType) {
        query = query.eq('passion_type', passionType);
      }

      const { data, error } = await query
        .order('listing_priority', { ascending: false })
        .order('last_updated', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to get listings' };
    }
  }

  /**
   * Check if user has completed registration for a passion type
   * @param userId - User ID
   * @param passionType - Passion type to check
   */
  private async checkRegistrationComplete(
    userId: string, 
    passionType: 'tour_guide' | 'hotel_partner'
  ): Promise<DirectoryResponse<boolean>> {
    
    try {
      if (passionType === 'tour_guide') {
        const { data, error } = await supabase
          .from('tour_guides')
          .select('full_name, phone, experience_years, hourly_rate, specialties, address')
          .eq('id', userId)
          .single();

        if (error) {
          return { success: false, error: error.message };
        }

        // Check if all required fields are present
        const isComplete = data && 
          data.full_name && data.full_name.trim() !== '' &&
          data.phone && data.phone.trim() !== '' &&
          data.experience_years !== null &&
          data.hourly_rate !== null &&
          data.specialties && data.specialties.length > 0 &&
          data.address && data.address.trim() !== '';

        return { success: true, data: !!isComplete };

      } else if (passionType === 'hotel_partner') {
        const { data, error } = await supabase
          .from('hotel_partners')
          .select('company_name, hotel_type, address, amenities')
          .eq('id', userId)
          .single();

        if (error) {
          return { success: false, error: error.message };
        }

        // Check if all required fields are present
        const isComplete = data &&
          data.company_name && data.company_name.trim() !== '' &&
          data.hotel_type && data.hotel_type.trim() !== '' &&
          data.address && data.address.trim() !== '' &&
          data.amenities && data.amenities.length > 0;

        return { success: true, data: !!isComplete };
      }

      return { success: false, error: 'Invalid passion type' };

    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to check registration status' };
    }
  }

  /**
   * Sync all listings - refresh directory listings based on current registration data
   */
  async syncAllListings(): Promise<DirectoryResponse<{ synced: number; errors: string[] }>> {
    try {
      const errors: string[] = [];
      let synced = 0;

      // Sync tour guides
      const { data: tourGuides, error: guidesError } = await supabase
        .from('tour_guides')
        .select('id, full_name, phone, experience_years, hourly_rate, specialties, address, city, state');

      if (guidesError) {
        errors.push(`Tour guides sync error: ${guidesError.message}`);
      } else if (tourGuides) {
        for (const guide of tourGuides) {
          const registrationComplete = await this.checkRegistrationComplete(guide.id, 'tour_guide');
          if (registrationComplete.success && registrationComplete.data) {
            const keywords = [guide.full_name, guide.city, guide.state, ...(guide.specialties || [])].filter(Boolean);
            await this.createPublicListing(guide.id, 'tour_guide', keywords);
            synced++;
          }
        }
      }

      // Sync hotel partners
      const { data: hotelPartners, error: hotelsError } = await supabase
        .from('hotel_partners')
        .select('id, company_name, hotel_type, address, city, state, amenities');

      if (hotelsError) {
        errors.push(`Hotel partners sync error: ${hotelsError.message}`);
      } else if (hotelPartners) {
        for (const hotel of hotelPartners) {
          const registrationComplete = await this.checkRegistrationComplete(hotel.id, 'hotel_partner');
          if (registrationComplete.success && registrationComplete.data) {
            const keywords = [hotel.company_name, hotel.city, hotel.state, hotel.hotel_type, ...(hotel.amenities || [])].filter(Boolean);
            await this.createPublicListing(hotel.id, 'hotel_partner', keywords);
            synced++;
          }
        }
      }

      return {
        success: true,
        data: { synced, errors }
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to sync listings'
      };
    }
  }

  /**
   * Refresh listing cache - update search keywords and metadata
   */
  async refreshListingCache(): Promise<DirectoryResponse<{ updated: number }>> {
    try {
      // This would typically update search keywords and other cached data
      // For now, we'll just update the last_updated timestamp for all visible listings
      const { data, error } = await (supabase as any)
        .from('public_directory_listings')
        .update({ last_updated: new Date().toISOString() })
        .eq('is_visible', true)
        .select('id');

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: { updated: data?.length || 0 }
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to refresh cache'
      };
    }
  }
}

// Export singleton instance
export const directoryService = new DirectoryService();

// Export default
export default directoryService;