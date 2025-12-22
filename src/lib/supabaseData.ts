/**
 * Supabase Data Layer - Replaces Puter functionality
 * 
 * This module provides data operations using Supabase instead of Puter.
 */

import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

// User type from Supabase
// Types
export type UserProfile = Database['public']['Tables']['profiles']['Row'];
export type Hotel = Database['public']['Tables']['hotels']['Row'];
export type TourGuide = Database['public']['Tables']['tour_guides']['Row'];
export type Review = Database['public']['Tables']['hotel_reviews']['Row'] | Database['public']['Tables']['guide_reviews']['Row'];
export type Booking = Database['public']['Tables']['hotel_bookings']['Row'] | Database['public']['Tables']['guide_bookings']['Row'];

/**
 * Generate unique ID
 */
import { v4 as uuidv4 } from 'uuid';

export function generateId(): string {
  return uuidv4();
}

/**
 * USER PROFILE OPERATIONS
 */

/**
 * Get user profile
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[Supabase] Error getting user profile:', error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  try {
    // Validate user authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User authentication required');
    }
    
    // Verify user is authorized to update this profile
    if (session.user.id !== userId) {
      throw new Error('Unauthorized to update this profile');
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, profile: data };
  } catch (error: any) {
    console.error('[Supabase] Error updating user profile:', error);
    return { success: false, error: error.message || 'Failed to update profile' };
  }
}

/**
 * HOTEL OPERATIONS
 */

/**
 * Save hotel
 */
export async function saveHotel(userId: string, hotelData: Partial<Hotel>) {
  try {
    // Validate user authentication
    if (!userId) {
      throw new Error('User authentication required');
    }
    
    // Get current session to verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || session.user.id !== userId) {
      throw new Error('Invalid user session');
    }
    
    // Ensure required fields have default values if not provided
    const hotelDataWithDefaults = {
      name: '',
      type: '',
      state: '',
      district: '',
      city: '',
      address: '',
      price_per_night_min: 0,
      check_in_time: '12:00:00',
      check_out_time: '12:00:00',
      contact_phone: '',
      rating: 0,
      total_reviews: 0,
      is_verified: false,
      is_active: true,
      ...hotelData,
      added_by: userId
    };
    
    const { error } = await supabase
      .from('hotels')
      .upsert(hotelDataWithDefaults);
    
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('[Supabase] Error saving hotel:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get hotel
 */
export async function getHotel(hotelId: string): Promise<Hotel | null> {
  try {
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .eq('id', hotelId)
      .single();
    
    if (error) throw error;
    return data;
  } catch {
    return null;
  }
}

/**
 * Get all hotels
 */
export async function getAllHotels(forAdmin: boolean = false): Promise<Hotel[]> {
  try {
    let query = supabase
      .from('hotels')
      .select('*');
    
    // If not for admin, only return verified hotels
    if (!forAdmin) {
      query = query.eq('is_verified', true);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Get pending hotels (not yet verified)
 */
export async function getPendingHotels(): Promise<Hotel[]> {
  try {
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .eq('is_verified', false);
    
    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Update hotel verification status
 */
export async function updateHotelStatus(hotelId: string, status: 'approved' | 'rejected'): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('hotels')
      .update({ is_verified: status === 'approved' })
      .eq('id', hotelId);
    
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Search hotels
 */
export async function searchHotels(query: string, filters?: { 
  city?: string; 
  minPrice?: number; 
  maxPrice?: number; 
  rating?: number;
  type?: string;
}): Promise<Hotel[]> {
  try {
    let supabaseQuery = supabase
      .from('hotels')
      .select('*')
      .eq('is_verified', true);
    
    // Text search
    if (query) {
      supabaseQuery = supabaseQuery.ilike('name', `%${query}%`);
    }
    
    // City filter
    if (filters?.city) {
      supabaseQuery = supabaseQuery.ilike('city', `%${filters.city}%`);
    }
    
    // Price range filter
    if (filters?.minPrice !== undefined) {
      supabaseQuery = supabaseQuery.gte('price_per_night_min', filters.minPrice);
    }
    
    if (filters?.maxPrice !== undefined) {
      supabaseQuery = supabaseQuery.lte('price_per_night_max', filters.maxPrice);
    }
    
    // Rating filter
    if (filters?.rating) {
      supabaseQuery = supabaseQuery.gte('rating', filters.rating);
    }
    
    // Type filter
    if (filters?.type) {
      supabaseQuery = supabaseQuery.eq('type', filters.type);
    }
    
    const { data, error } = await supabaseQuery;
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching hotels:', error);
    return [];
  }
}

/**
 * TOUR GUIDE OPERATIONS
 */

/**
 * Save tour guide
 */
export async function saveTourGuide(userId: string, guideData: Partial<TourGuide>) {
  try {
    // Validate user authentication
    if (!userId) {
      throw new Error('User authentication required');
    }
    
    // Get current session to verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || session.user.id !== userId) {
      throw new Error('Invalid user session');
    }
    
    // Ensure required fields have default values if not provided
    const guideDataWithDefaults = {
      user_id: userId,
      full_name: '',
      phone: '',
      email: '',
      state: '',
      district: '',
      city: '',
      years_of_experience: 0,
      availability_status: 'available',
      rating: 0,
      total_reviews: 0,
      total_tours_completed: 0,
      verified: false,
      is_active: true,
      ...guideData
    };
    
    const { error } = await supabase
      .from('tour_guides')
      .upsert(guideDataWithDefaults);
    
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('[Supabase] Error saving tour guide:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all tour guides
 * @param forAdmin - If true, returns all guides (verified and unverified)
 */
export async function getAllTourGuides(forAdmin: boolean = false): Promise<TourGuide[]> {
  try {
    let query = supabase
      .from('tour_guides')
      .select('*');
    
    // If not for admin, only return verified guides
    if (!forAdmin) {
      query = query.eq('verified', true);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Get pending tour guides (not yet verified)
 */
export async function getPendingTourGuides(): Promise<TourGuide[]> {
  try {
    const { data, error } = await supabase
      .from('tour_guides')
      .select('*')
      .eq('verified', false);
    
    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Update tour guide verification status
 */
export async function updateTourGuideVerificationStatus(
  guideId: string, 
  verified: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('tour_guides')
      .update({ verified })
      .eq('id', guideId);
    
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get tour guide
 */
export async function getTourGuide(guideId: string): Promise<TourGuide | null> {
  try {
    const { data, error } = await supabase
      .from('tour_guides')
      .select('*')
      .eq('id', guideId)
      .single();
    
    if (error) throw error;
    return data;
  } catch {
    return null;
  }
}

/**
 * Search tour guides
 */
export async function searchTourGuides(query: string, filters?: { 
  city?: string; 
  language?: string; 
  minRating?: number; 
  maxPrice?: number;
}): Promise<TourGuide[]> {
  try {
    let supabaseQuery = supabase
      .from('tour_guides')
      .select('*')
      .eq('verified', true);
    
    // Text search
    if (query) {
      supabaseQuery = supabaseQuery.or(`full_name.ilike.%${query}%,city.ilike.%${query}%`);
    }
    
    // City filter
    if (filters?.city) {
      supabaseQuery = supabaseQuery.ilike('city', `%${filters.city}%`);
    }
    
    // Rating filter
    if (filters?.minRating !== undefined) {
      supabaseQuery = supabaseQuery.gte('rating', filters.minRating);
    }
    
    // Price filter
    if (filters?.maxPrice !== undefined) {
      supabaseQuery = supabaseQuery.lte('hourly_rate', filters.maxPrice);
    }
    
    const { data, error } = await supabaseQuery;
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching tour guides:', error);
    return [];
  }
}

/**
 * BOOKING OPERATIONS
 */

/**
 * Save booking
 */
export async function saveBooking(bookingId: string, bookingData: Partial<Booking>) {
  try {
    // Validate user authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User authentication required');
    }
    
    // Validate that booking has a user_id
    if (!bookingData.user_id) {
      throw new Error('User ID required for booking');
    }
    
    // Verify user is authorized to create this booking
    if (session.user.id !== bookingData.user_id) {
      throw new Error('Unauthorized to create booking for this user');
    }
    
    // Determine if it's a hotel or guide booking based on presence of hotel_id or guide_id
    const tableName = bookingData.hasOwnProperty('hotel_id') ? 'hotel_bookings' : 'guide_bookings';
    
    // Ensure required fields have default values based on booking type
    let bookingDataWithDefaults;
    if (tableName === 'hotel_bookings') {
      bookingDataWithDefaults = {
        id: bookingId,
        hotel_id: '',
        user_id: bookingData.user_id,
        check_in_date: new Date().toISOString(),
        check_out_date: new Date().toISOString(),
        number_of_guests: 1,
        total_nights: 1,
        guest_name: '',
        guest_phone: '',
        status: 'pending',
        ...bookingData
      };
    } else {
      bookingDataWithDefaults = {
        id: bookingId,
        guide_id: '',
        user_id: bookingData.user_id,
        booking_date: new Date().toISOString(),
        number_of_days: 1,
        number_of_people: 1,
        tourist_name: '',
        tourist_phone: '',
        status: 'pending',
        ...bookingData
      };
    }
    
    const { error } = await supabase
      .from(tableName)
      .upsert(bookingDataWithDefaults);
    
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('[Supabase] Error saving booking:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get booking
 */
export async function getBooking(bookingId: string): Promise<Booking | null> {
  try {
    // Try hotel bookings first
    let { data, error } = await supabase
      .from('hotel_bookings')
      .select('*')
      .eq('id', bookingId)
      .single();
    
    if (data) return data;
    
    // If not found, try guide bookings
    const guideResult = await supabase
      .from('guide_bookings')
      .select('*')
      .eq('id', bookingId)
      .single();
    
    if (guideResult.data) return guideResult.data;
    
    return null;
  } catch {
    return null;
  }
}

/**
 * REIVEW OPERATIONS
 */

/**
 * Save review
 */
export async function saveReview(reviewId: string, reviewData: Partial<Review>) {
  try {
    // Validate user authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User authentication required');
    }
    
    // Validate that review has a user_id
    if (!reviewData.user_id) {
      throw new Error('User ID required for review');
    }
    
    // Verify user is authorized to create this review
    if (session.user.id !== reviewData.user_id) {
      throw new Error('Unauthorized to create review for this user');
    }
    
    // Determine if it's a hotel or guide review based on presence of hotel_id or guide_id
    const tableName = reviewData.hasOwnProperty('hotel_id') ? 'hotel_reviews' : 'guide_reviews';
    
    // Ensure required fields have default values based on review type
    let reviewDataWithDefaults;
    if (tableName === 'hotel_reviews') {
      reviewDataWithDefaults = {
        id: reviewId,
        hotel_id: '',
        user_id: reviewData.user_id,
        rating: 0,
        ...reviewData
      };
    } else {
      reviewDataWithDefaults = {
        id: reviewId,
        guide_id: '',
        user_id: reviewData.user_id,
        rating: 0,
        ...reviewData
      };
    }
    
    const { error } = await supabase
      .from(tableName)
      .upsert(reviewDataWithDefaults);
    
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('[Supabase] Error saving review:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get item reviews
 */
export async function getItemReviews(itemId: string, itemType: 'hotel' | 'guide'): Promise<Review[]> {
  try {
    const tableName = itemType === 'hotel' ? 'hotel_reviews' : 'guide_reviews';
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq(itemType === 'hotel' ? 'hotel_id' : 'guide_id', itemId);
    
    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Calculate average rating
 */
export async function calculateAverageRating(itemId: string, itemType: 'hotel' | 'guide'): Promise<number> {
  try {
    const tableName = itemType === 'hotel' ? 'hotel_reviews' : 'guide_reviews';
    const columnName = itemType === 'hotel' ? 'hotel_id' : 'guide_id';
    
    const { data, error } = await supabase
      .from(tableName)
      .select('rating')
      .eq(columnName, itemId);
    
    if (error) throw error;
    
    if (!data || data.length === 0) return 0;
    
    const totalRating = data.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((totalRating / data.length) * 10) / 10;
  } catch {
    return 0;
  }
}

/**
 * FAVORITE OPERATIONS
 */

/**
 * Get user favorites
 */
export async function getUserFavorites(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('state_id')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    return data?.map(fav => fav.state_id) || [];
  } catch (error) {
    console.error('[Supabase] Error getting user favorites:', error);
    return [];
  }
}

/**
 * Add state to user's favorites
 */
export async function addUserFavorite(userId: string, stateId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('user_favorites')
      .insert({
        user_id: userId,
        state_id: stateId
      });
    
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('[Supabase] Error adding favorite:', error);
    return { success: false, error: error.message || 'Failed to add favorite' };
  }
}

/**
 * Remove state from user's favorites
 */
export async function removeUserFavorite(userId: string, stateId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .match({ user_id: userId, state_id: stateId });
    
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('[Supabase] Error removing favorite:', error);
    return { success: false, error: error.message || 'Failed to remove favorite' };
  }
}

/**
 * FILE UPLOAD OPERATIONS
 */

/**
 * Upload file to Supabase storage
 */
export async function puterUploadFile(
  file: File,
  path?: string
): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    const filePath = path || `uploads/${generateId()}-${file.name}`;
    
    const { error } = await supabase.storage
      .from('public')
      .upload(filePath, file);
    
    if (error) throw error;
    
    // Return the public URL instead of just the path
    const { data } = supabase.storage
      .from('public')
      .getPublicUrl(filePath);
    
    return { success: true, path: data.publicUrl };
  } catch (error: any) {
    console.error('[Supabase] File upload error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload file'
    };
  }
}

export default {
  generateId,
  getUserProfile,
  updateUserProfile,
  saveHotel,
  getHotel,
  getAllHotels,
  getPendingHotels,
  updateHotelStatus,
  searchHotels,
  saveTourGuide,
  getAllTourGuides,
  getPendingTourGuides,
  getTourGuide,
  updateTourGuideVerificationStatus,
  searchTourGuides,
  saveBooking,
  getBooking,
  saveReview,
  getItemReviews,
  calculateAverageRating,
  getUserFavorites,
  addUserFavorite,
  removeUserFavorite,
  puterUploadFile
};