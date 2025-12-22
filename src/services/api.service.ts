/**
 * API Service for handling form submissions and external API calls
 * This service provides a clean interface for all API operations
 */

import { supabase } from '@/integrations/supabase/client';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * PASSION REGISTRATION API
 */
export const passionRegistrationAPI = {
  /**
   * Submit passion-specific registration form
   * @param userId - User ID
   * @param passionKey - Passion type (tourist, tour_guide, hotel_partner)
   * @param formData - Dynamic form data based on passion
   */
  async submitRegistration(
    userId: string,
    passionKey: string,
    formData: Record<string, any>
  ): Promise<ApiResponse> {
    try {
      console.log('[API] Submitting registration:', { userId, passionKey, formData });

      // Validate required fields based on passion type
      const validationResult = validateRegistrationData(passionKey, formData);
      if (!validationResult.success) {
        return validationResult;
      }

      // Prepare data for submission
      const submissionData = {
        user_id: userId,
        passion_key: passionKey,
        registration_data: formData,
        status: 'pending',
        submitted_at: new Date().toISOString()
      };

      // Submit to passion_registrations table
      const { data, error } = await supabase
        .from('passion_registrations')
        .upsert(submissionData, { onConflict: 'user_id,passion_key' })
        .select()
        .single();

      if (error) {
        console.error('[API] Registration submission error:', error);
        return {
          success: false,
          error: error.message || 'Failed to submit registration'
        };
      }

      // Also update the legacy role-specific table for backward compatibility
      await updateLegacyRoleTable(userId, passionKey, formData);

      console.log('[API] Registration submitted successfully:', data);
      return {
        success: true,
        data,
        message: 'Registration submitted successfully!'
      };
    } catch (error: any) {
      console.error('[API] Registration submission error:', error);
      return {
        success: false,
        error: error.message || 'Failed to submit registration'
      };
    }
  },

  /**
   * Get user's registration status for a passion
   */
  async getRegistrationStatus(userId: string, passionKey: string): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('passion_registrations')
        .select('*')
        .match({ user_id: userId, passion_key: passionKey })
        .single();

      if (error && error.code !== 'PGRST116') {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: data || null
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get registration status'
      };
    }
  }
};

/**
 * CONTENT API
 */
export const contentAPI = {
  /**
   * Get passion-specific content
   */
  async getPassionContent(passionKey: string, contentType?: string): Promise<ApiResponse> {
    try {
      let query = supabase
        .from('passion_content')
        .select('*')
        .eq('passion_key', passionKey)
        .eq('is_active', true);

      if (contentType) {
        query = query.eq('content_type', contentType);
      }

      const { data, error } = await query
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get content'
      };
    }
  }
};

/**
 * ANALYTICS API
 */
export const analyticsAPI = {
  /**
   * Track user activity
   */
  async trackActivity(
    userId: string,
    passionKey: string,
    activityType: string,
    activityData?: Record<string, any>
  ): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('user_activities')
        .insert({
          user_id: userId,
          passion_key: passionKey,
          activity_type: activityType,
          activity_data: activityData || {}
        });

      if (error) {
        console.error('[API] Activity tracking error:', error);
        // Don't fail the main operation if analytics fails
        return { success: true };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('[API] Activity tracking error:', error);
      // Don't fail the main operation if analytics fails
      return { success: true };
    }
  }
};

/**
 * Validate registration data based on passion type
 */
function validateRegistrationData(passionKey: string, formData: Record<string, any>): ApiResponse {
  const requiredFields: Record<string, string[]> = {
    tourist: ['full_name', 'phone', 'travel_preferences'],
    tour_guide: ['full_name', 'phone', 'experience_years', 'hourly_rate', 'specialties'],
    hotel_partner: ['full_name', 'phone', 'company_name', 'hotel_type', 'amenities']
  };

  const required = requiredFields[passionKey] || [];
  const missing = required.filter(field => !formData[field] || 
    (Array.isArray(formData[field]) && formData[field].length === 0)
  );

  if (missing.length > 0) {
    return {
      success: false,
      error: `Missing required fields: ${missing.join(', ')}`
    };
  }

  // Validate specific field types
  if (passionKey === 'tour_guide') {
    if (formData.hourly_rate && (isNaN(Number(formData.hourly_rate)) || Number(formData.hourly_rate) <= 0)) {
      return { success: false, error: 'Invalid hourly rate' };
    }
    if (formData.experience_years && (isNaN(Number(formData.experience_years)) || Number(formData.experience_years) < 0)) {
      return { success: false, error: 'Invalid experience years' };
    }
  }

  return { success: true };
}

/**
 * Update legacy role-specific tables for backward compatibility
 */
async function updateLegacyRoleTable(userId: string, passionKey: string, formData: Record<string, any>) {
  try {
    let tableName = '';
    let legacyData: any = {
      id: userId,
      user_id: userId,
      full_name: formData.full_name || '',
      phone: formData.phone || '',
      bio: formData.bio || '',
      is_active: true,
      updated_at: new Date().toISOString()
    };

    switch (passionKey) {
      case 'tourist':
        tableName = 'tourists';
        legacyData = {
          ...legacyData,
          travel_preferences: formData.travel_preferences || [],
          preferred_language: formData.preferred_language || 'en',
          email_verified: false
        };
        break;

      case 'tour_guide':
        tableName = 'tour_guides';
        legacyData = {
          ...legacyData,
          company_name: formData.company_name || '',
          license_number: formData.license_number || '',
          hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
          experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
          specialties: formData.specialties || [],
          languages_spoken: formData.languages_spoken || ['en'],
          address: formData.address || '',
          city: formData.city || '',
          state: formData.state || '',
          pincode: formData.pincode || '',
          website: formData.website || '',
          verified: false
        };
        break;

      case 'hotel_partner':
        tableName = 'hotel_partners';
        legacyData = {
          ...legacyData,
          company_name: formData.company_name || '',
          license_number: formData.license_number || '',
          hotel_type: formData.hotel_type || '',
          amenities: formData.amenities || [],
          address: formData.address || '',
          city: formData.city || '',
          state: formData.state || '',
          pincode: formData.pincode || '',
          website: formData.website || '',
          is_verified: false
        };
        break;

      default:
        return; // Unknown passion type
    }

    await supabase
      .from(tableName)
      .upsert(legacyData, { onConflict: 'id' });

  } catch (error) {
    console.error('[API] Legacy table update error:', error);
    // Don't fail the main operation if legacy update fails
  }
}

export default {
  passionRegistrationAPI,
  contentAPI,
  analyticsAPI
};