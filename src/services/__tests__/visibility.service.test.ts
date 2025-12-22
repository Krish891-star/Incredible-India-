/**
 * Visibility Manager Property Tests
 * Tests for user privacy controls and profile field visibility
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import * as fc from 'fast-check';
import { VisibilityManager } from '../visibility.service';

// Mock Supabase client
const mockSupabaseResponse = <T>(data: T, error: any = null) => ({
  data,
  error
});

jest.mock('@/integrations/supabase/client', () => {
  return {
    supabase: {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(),
            limit: jest.fn(() => ({
              single: jest.fn()
            }))
          }))
        })),
        insert: jest.fn(),
        upsert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn()
          }))
        })),
        delete: jest.fn(() => ({
          eq: jest.fn()
        }))
      }))
    }
  };
});

describe('VisibilityManager Property Tests', () => {
  let visibilityManager: VisibilityManager;

  beforeEach(() => {
    visibilityManager = new VisibilityManager();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 15: Visibility Control Options
   * Feature: public-user-directory, Property 15: For any service provider, they should be able to set their profile visibility to either public or private
   * Validates: Requirements 4.1
   */
  describe('Property 15: Visibility Control Options', () => {
    it('should allow service providers to set profile visibility to public or private', async () => {
      await fc.assert(fc.asyncProperty(
        fc.uuid(),
        fc.boolean(),
        async (userId, isVisible) => {
          const { supabase } = require('@/integrations/supabase/client');
          
          // Mock successful visibility update
          supabase.from.mockReturnValue({
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue(
                mockSupabaseResponse(null)
              )
            })
          });

          // Test the property: service providers should be able to set visibility
          const result = await visibilityManager.setProfileVisibility(userId, isVisible);

          // Verify the visibility was set successfully
          expect(result.success).toBe(true);
          expect(result.data).toBe(isVisible);

          // Verify the correct database call was made
          expect(supabase.from).toHaveBeenCalledWith('public_directory_listings');
        }
      ), { numRuns: 20 });
    });

    it('should allow service providers to update their visibility preferences', async () => {
      await fc.assert(fc.asyncProperty(
        fc.uuid(),
        fc.record({
          show_contact_info: fc.boolean(),
          show_pricing: fc.boolean(),
          show_location: fc.boolean(),
          show_reviews: fc.boolean(),
          custom_bio: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
          featured_images: fc.option(fc.array(fc.webUrl(), { minLength: 0, maxLength: 5 }), { nil: undefined })
        }),
        async (userId, preferences) => {
          const { supabase } = require('@/integrations/supabase/client');
          
          // Mock successful preferences update
          const mockPreferences = {
            id: fc.sample(fc.uuid(), 1)[0],
            user_id: userId,
            ...preferences,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          supabase.from.mockReturnValue({
            upsert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue(
                  mockSupabaseResponse(mockPreferences)
                )
              })
            })
          });

          // Test the property: service providers should be able to update preferences
          const result = await visibilityManager.updateUserPreferences(userId, preferences);

          // Verify the preferences were updated successfully
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
          expect(result.data?.user_id).toBe(userId);
          expect(result.data?.show_contact_info).toBe(preferences.show_contact_info);
          expect(result.data?.show_pricing).toBe(preferences.show_pricing);
          expect(result.data?.show_location).toBe(preferences.show_location);
          expect(result.data?.show_reviews).toBe(preferences.show_reviews);

          // Verify the correct database call was made
          expect(supabase.from).toHaveBeenCalledWith('user_visibility_preferences');
        }
      ), { numRuns: 20 });
    });

    it('should provide default preferences when none exist', async () => {
      await fc.assert(fc.asyncProperty(
        fc.uuid(),
        async (userId) => {
          const { supabase } = require('@/integrations/supabase/client');
          
          // Mock no existing preferences (PGRST116 is Supabase's "no rows" error code)
          supabase.from.mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue(
                  mockSupabaseResponse(null, { code: 'PGRST116', message: 'No rows found' })
                )
              })
            })
          });

          // Test the property: should provide default preferences when none exist
          const result = await visibilityManager.getUserPreferences(userId);

          // Verify default preferences are returned
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
          expect(result.data?.user_id).toBe(userId);
          expect(result.data?.show_contact_info).toBe(true);
          expect(result.data?.show_pricing).toBe(true);
          expect(result.data?.show_location).toBe(true);
          expect(result.data?.show_reviews).toBe(true);
        }
      ), { numRuns: 10 });
    });
  });

  /**
   * Property 16: Private Profile Exclusion
   * Feature: public-user-directory, Property 16: For any service provider who sets their profile to private, their profile should not appear in any public listings
   * Validates: Requirements 4.2
   */
  describe('Property 16: Private Profile Exclusion', () => {
    it('should exclude private profiles from public listings', async () => {
      await fc.assert(fc.asyncProperty(
        fc.uuid(),
        async (userId) => {
          const { supabase } = require('@/integrations/supabase/client');
          
          // Mock profile visibility check returning false (private)
          supabase.from.mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue(
                mockSupabaseResponse([{ is_visible: false }])
              )
            })
          });

          // Test the property: private profiles should not be visible
          const result = await visibilityManager.isProfileVisible(userId);

          // Verify the profile is not visible
          expect(result.success).toBe(true);
          expect(result.data).toBe(false);
        }
      ), { numRuns: 10 });
    });

    it('should include public profiles in public listings', async () => {
      await fc.assert(fc.asyncProperty(
        fc.uuid(),
        async (userId) => {
          const { supabase } = require('@/integrations/supabase/client');
          
          // Mock profile visibility check returning true (public)
          supabase.from.mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue(
                mockSupabaseResponse([{ is_visible: true }])
              )
            })
          });

          // Test the property: public profiles should be visible
          const result = await visibilityManager.isProfileVisible(userId);

          // Verify the profile is visible
          expect(result.success).toBe(true);
          expect(result.data).toBe(true);
        }
      ), { numRuns: 10 });
    });

    it('should handle profiles with no directory listings as not visible', async () => {
      await fc.assert(fc.asyncProperty(
        fc.uuid(),
        async (userId) => {
          const { supabase } = require('@/integrations/supabase/client');
          
          // Mock no directory listings found
          supabase.from.mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue(
                mockSupabaseResponse([])
              )
            })
          });

          // Test the property: profiles with no listings should not be visible
          const result = await visibilityManager.isProfileVisible(userId);

          // Verify the profile is not visible
          expect(result.success).toBe(true);
          expect(result.data).toBe(false);
        }
      ), { numRuns: 10 });
    });
  });

  /**
   * Property 17: Granular Field Visibility Control
   * Feature: public-user-directory, Property 17: For any service provider, they should be able to control which specific profile information fields are publicly displayed
   * Validates: Requirements 4.4
   */
  describe('Property 17: Granular Field Visibility Control', () => {
    it('should allow control over individual profile field visibility', async () => {
      await fc.assert(fc.asyncProperty(
        fc.uuid(),
        fc.record({
          contact_info: fc.boolean(),
          pricing: fc.boolean(),
          location: fc.boolean(),
          reviews: fc.boolean()
        }),
        async (userId, fieldVisibilityMap) => {
          // Convert the map to array format with unique fields
          const fieldVisibilitySettings = Object.entries(fieldVisibilityMap).map(([field, visible]) => ({
            field,
            visible
          }));
          const { supabase } = require('@/integrations/supabase/client');
          
          // Mock successful field visibility update
          const mockPreferences = {
            id: fc.sample(fc.uuid(), 1)[0],
            user_id: userId,
            show_contact_info: true,
            show_pricing: true,
            show_location: true,
            show_reviews: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          // Apply the field visibility settings to mock preferences
          fieldVisibilitySettings.forEach(setting => {
            switch (setting.field) {
              case 'contact_info':
                mockPreferences.show_contact_info = setting.visible;
                break;
              case 'pricing':
                mockPreferences.show_pricing = setting.visible;
                break;
              case 'location':
                mockPreferences.show_location = setting.visible;
                break;
              case 'reviews':
                mockPreferences.show_reviews = setting.visible;
                break;
            }
          });

          supabase.from.mockReturnValue({
            upsert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue(
                  mockSupabaseResponse(mockPreferences)
                )
              })
            })
          });

          // Test the property: should be able to control individual field visibility
          const result = await visibilityManager.setProfileFields(userId, fieldVisibilitySettings);

          // Verify the field visibility was set successfully
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
          expect(result.data?.user_id).toBe(userId);

          // Verify each field visibility setting was applied
          fieldVisibilitySettings.forEach(setting => {
            switch (setting.field) {
              case 'contact_info':
                expect(result.data?.show_contact_info).toBe(setting.visible);
                break;
              case 'pricing':
                expect(result.data?.show_pricing).toBe(setting.visible);
                break;
              case 'location':
                expect(result.data?.show_location).toBe(setting.visible);
                break;
              case 'reviews':
                expect(result.data?.show_reviews).toBe(setting.visible);
                break;
            }
          });
        }
      ), { numRuns: 20 });
    });

    it('should apply field visibility controls when generating public profiles', async () => {
      await fc.assert(fc.asyncProperty(
        fc.uuid(),
        fc.record({
          show_contact_info: fc.boolean(),
          show_pricing: fc.boolean(),
          show_location: fc.boolean(),
          show_reviews: fc.boolean()
        }),
        fc.oneof(fc.constant('tour_guide'), fc.constant('hotel_partner')),
        async (userId, visibilityPrefs, passionType) => {
          const { supabase } = require('@/integrations/supabase/client');
          
          // Mock user preferences
          const mockPreferences = {
            id: fc.sample(fc.uuid(), 1)[0],
            user_id: userId,
            ...visibilityPrefs,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          // Mock profile data based on passion type
          const mockProfileData = passionType === 'tour_guide' ? {
            id: fc.sample(fc.uuid(), 1)[0],
            user_id: userId,
            full_name: 'John Doe',
            phone: '+1234567890',
            email: 'john@example.com',
            city: 'Delhi',
            state: 'Delhi',
            verified: true,
            is_active: true,
            created_at: new Date().toISOString()
          } : {
            id: fc.sample(fc.uuid(), 1)[0],
            user_id: userId,
            company_name: 'Grand Hotel',
            phone: '+1234567890',
            email: 'hotel@example.com',
            city: 'Mumbai',
            state: 'Maharashtra',
            is_verified: true,
            is_active: true,
            created_at: new Date().toISOString()
          };

          // Mock directory listing to determine passion type
          const mockListing = {
            passion_type: passionType
          };

          let callCount = 0;
          supabase.from.mockImplementation((tableName: string) => {
            callCount++;
            
            if (tableName === 'user_visibility_preferences') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue(
                      mockSupabaseResponse(mockPreferences)
                    )
                  })
                })
              };
            } else if (tableName === 'public_directory_listings') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    limit: jest.fn().mockReturnValue({
                      single: jest.fn().mockResolvedValue(
                        mockSupabaseResponse(mockListing)
                      )
                    })
                  })
                })
              };
            } else if (tableName === passionType === 'tour_guide' ? 'tour_guides' : 'hotel_partners') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue(
                      mockSupabaseResponse(mockProfileData)
                    )
                  })
                })
              };
            }
            
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn()
                })
              })
            };
          });

          // Test the property: field visibility should be applied to public profiles
          const result = await visibilityManager.getPublicProfile(userId);

          // Verify the public profile respects visibility settings
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();

          if (visibilityPrefs.show_contact_info) {
            expect(result.data?.contactInfo).toBeDefined();
            expect(result.data?.contactInfo?.phone).toBeDefined();
            expect(result.data?.contactInfo?.email).toBeDefined();
          } else {
            expect(result.data?.contactInfo).toBeUndefined();
          }

          if (visibilityPrefs.show_location) {
            expect(result.data?.location).toBeDefined();
            expect(result.data?.location?.city).toBeDefined();
            expect(result.data?.location?.state).toBeDefined();
          } else {
            expect(result.data?.location).toBeUndefined();
          }
        }
      ), { numRuns: 15 });
    });
  });
});