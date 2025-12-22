/**
 * Registration Service
 * Handles user registration for different roles with Supabase integration
 */

import { supabase } from '@/integrations/supabase/client';

// Type definitions
export type UserRole = 'tourist' | 'tour_guide' | 'hotel_partner';
export type RegistrationStatus = 'pending' | 'completed' | 'approved' | 'rejected';

export interface RegistrationData {
  // Common fields
  id: string;
  full_name: string;
  phone: string;
  bio?: string;
  email: string;
  
  // Tourist specific fields
  travel_preferences?: string[];
  preferred_language?: string;
  
  // Tour guide specific fields
  company_name?: string;
  license_number?: string;
  hourly_rate?: number;
  experience_years?: number;
  specialties?: string[];
  languages_spoken?: string[];
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  website?: string;
  verified?: boolean;
  
  // Hotel partner specific fields
  hotel_type?: string;
  amenities?: string[];
  is_verified?: boolean;
}

export interface RoleRegistrationStatus {
  role: UserRole;
  status: RegistrationStatus;
  created_at: string;
  updated_at?: string;
}

/**
 * Registration Service
 */
export class RegistrationService {
  /**
   * Register user for a specific role
   * @param userId - The user's ID
   * @param role - The role to register for
   * @param registrationData - The registration data
   * @returns Success status and message
   */
  static async registerForRole(
    userId: string,
    role: UserRole,
    registrationData: RegistrationData
  ): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      // Validate user authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'User authentication required' };
      }

      // Verify user is authorized
      if (session.user.id !== userId) {
        return { success: false, error: 'Unauthorized to register for this user' };
      }

      // Prepare data based on role
      let tableName = '';
      let dataToInsert: any = {
        id: userId,
        full_name: registrationData.full_name,
        phone: registrationData.phone,
        bio: registrationData.bio || null,
        updated_at: new Date().toISOString(),
        is_active: true
      };

      switch (role) {
        case 'tourist':
          tableName = 'tourists';
          dataToInsert.travel_preferences = registrationData.travel_preferences || null;
          dataToInsert.preferred_language = registrationData.preferred_language || 'en';
          break;

        case 'tour_guide':
          tableName = 'tour_guides';
          dataToInsert.company_name = registrationData.company_name || null;
          dataToInsert.license_number = registrationData.license_number || null;
          dataToInsert.hourly_rate = registrationData.hourly_rate || null;
          dataToInsert.experience_years = registrationData.experience_years || null;
          dataToInsert.specialties = registrationData.specialties || null;
          dataToInsert.languages_spoken = registrationData.languages_spoken || ['en'];
          dataToInsert.address = registrationData.address || null;
          dataToInsert.city = registrationData.city || null;
          dataToInsert.district = registrationData.city || null; // Using city as district for now
          dataToInsert.state = registrationData.state || null;
          dataToInsert.state_id = null; // Will be set by admin
          dataToInsert.pincode = registrationData.pincode || null;
          dataToInsert.website = registrationData.website || null;
          dataToInsert.verified = false; // Requires admin approval
          break;

        case 'hotel_partner':
          tableName = 'hotel_partners';
          dataToInsert.company_name = registrationData.company_name;
          dataToInsert.license_number = registrationData.license_number || null;
          dataToInsert.hotel_type = registrationData.hotel_type;
          dataToInsert.amenities = registrationData.amenities || null;
          dataToInsert.address = registrationData.address;
          dataToInsert.city = registrationData.city;
          dataToInsert.district = registrationData.city; // Using city as district for now
          dataToInsert.state = registrationData.state;
          dataToInsert.state_id = null; // Will be set by admin
          dataToInsert.pincode = registrationData.pincode;
          dataToInsert.website = registrationData.website || null;
          dataToInsert.is_verified = false; // Requires admin approval
          dataToInsert.email = registrationData.email;
          break;

        default:
          return { success: false, error: 'Invalid role specified' };
      }

      // Check if user already has this passion to avoid duplicates
      const { data: existingPassion } = await supabase
        .from('user_passions')
        .select('id')
        .match({ user_id: userId, passion: role })
        .single();

      // Only add passion if user doesn't already have it
      if (!existingPassion) {
        const { error: passionError } = await supabase
          .from('user_passions')
          .insert({
            user_id: userId,
            passion: role
          });

        if (passionError) {
          console.warn('Could not add user passion to Supabase:', passionError);
        } else {
          console.log(`Added ${role} passion for user ${userId}`);
        }
      } else {
        console.log(`User ${userId} already has ${role} passion, skipping duplicate`);
      }

      // Insert data into appropriate table
      const { error } = await supabase
        .from(tableName)
        .upsert(dataToInsert, { onConflict: 'id' });

      if (error) {
        console.warn('Could not save to Supabase:', error);
        return {
          success: false,
          error: 'Failed to save registration data'
        };
      }

      // Update user profile role to match the registration
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ user_role: role })
        .eq('id', userId);

      if (profileError) {
        console.warn('Could not update user profile role:', profileError);
        // Don't fail the registration if profile update fails
      } else {
        console.log(`Updated user ${userId} profile role to ${role}`);
      }

      return {
        success: true,
        message: 'Registration submitted successfully!'
      };
    } catch (error: any) {
      console.error('[Registration Service] Registration error:', error);
      return {
        success: false,
        error: error.message || 'Failed to submit registration'
      };
    }
  }

  /**
   * Get registration status for a specific role
   * @param userId - The user's ID
   * @param role - The role to check
   * @returns Registration status
   */
  static async getRegistrationStatus(userId: string, role: UserRole): Promise<RoleRegistrationStatus> {
    try {
      // Check Supabase for registration status
      const { data: passionData, error: passionError } = await supabase
        .from('user_passions')
        .select('created_at')
        .match({ user_id: userId, passion: role })
        .single();

      // If user doesn't have the passion, they haven't registered
      if (passionError || !passionData) {
        return {
          role,
          status: 'pending',
          created_at: new Date().toISOString()
        };
      }

      // If user has the passion, check if they have a profile
      let tableName = '';
      switch (role) {
        case 'tourist':
          tableName = 'tourists';
          break;
        case 'tour_guide':
          tableName = 'tour_guides';
          break;
        case 'hotel_partner':
          tableName = 'hotel_partners';
          break;
      }

      const { data, error } = await supabase
        .from(tableName)
        .select('id, updated_at')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return {
        role,
        status: data ? 'completed' : 'pending',
        created_at: passionData.created_at,
        updated_at: data?.updated_at || undefined
      };
    } catch (error: any) {
      console.error('[Registration Service] Error checking registration status:', error);
      return {
        role,
        status: 'pending',
        created_at: new Date().toISOString()
      };
    }
  }

  /**
   * Get all registration statuses for a user
   * @param userId - The user's ID
   * @returns Array of registration statuses for all roles
   */
  static async getAllRegistrationStatuses(userId: string): Promise<RoleRegistrationStatus[]> {
    try {
      const roles: UserRole[] = ['tourist', 'tour_guide', 'hotel_partner'];
      const statuses: RoleRegistrationStatus[] = [];

      for (const role of roles) {
        const status = await this.getRegistrationStatus(userId, role);
        statuses.push(status);
      }

      return statuses;
    } catch (error: any) {
      console.error('[Registration Service] Error getting all registration statuses:', error);
      return [
        { role: 'tourist', status: 'pending', created_at: new Date().toISOString() },
        { role: 'tour_guide', status: 'pending', created_at: new Date().toISOString() },
        { role: 'hotel_partner', status: 'pending', created_at: new Date().toISOString() }
      ];
    }
  }

  /**
   * Get user registration data
   * @param userId - The user's ID
   * @param role - The role to get data for
   * @returns Registration data or null if not found
   */
  static async getRegistrationDataFromBackup(userId: string, role: UserRole): Promise<RegistrationData | null> {
    // This would typically retrieve from Supabase
    // For now, we'll return null
    return null;
  }
}

export default RegistrationService;