/**
 * Directory Service Property Tests
 * Tests for automatic directory listing functionality
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import * as fc from 'fast-check';
import { DirectoryService } from '../directory.service';

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
            single: jest.fn()
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
        })),
        order: jest.fn(() => ({
          order: jest.fn()
        }))
      }))
    }
  };
});

describe('DirectoryService Property Tests', () => {
  let directoryService: DirectoryService;

  beforeEach(() => {
    directoryService = new DirectoryService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 1: Automatic Guide Directory Listing
   * Feature: public-user-directory, Property 1: For any user who completes Tour Guide registration, their profile should automatically appear in the public Tour Guide directory
   * Validates: Requirements 1.1
   */
  describe('Property 1: Automatic Guide Directory Listing', () => {
    it('should automatically create directory listing for completed tour guide registrations', async () => {
      await fc.assert(fc.asyncProperty(
        fc.uuid(),
        fc.record({
          full_name: fc.oneof(
            fc.constant('John Doe'),
            fc.constant('Jane Smith'),
            fc.constant('Mike Johnson'),
            fc.constant('Sarah Wilson'),
            fc.constant('David Brown')
          ),
          phone: fc.oneof(
            fc.constant('+1234567890'),
            fc.constant('9876543210'),
            fc.constant('+91-9876543210'),
            fc.constant('(555) 123-4567')
          ),
          experience_years: fc.integer({ min: 1, max: 20 }),
          hourly_rate: fc.integer({ min: 100, max: 5000 }),
          specialties: fc.oneof(
            fc.constant(['Historical Tours']),
            fc.constant(['Adventure Tours']),
            fc.constant(['Cultural Tours']),
            fc.constant(['Wildlife Tours']),
            fc.constant(['Historical Tours', 'Cultural Tours'])
          ),
          address: fc.oneof(
            fc.constant('123 Main Street, Delhi'),
            fc.constant('456 Park Avenue, Mumbai'),
            fc.constant('789 Beach Road, Goa'),
            fc.constant('321 Hill Station, Shimla')
          )
        }),
        async (userId, guideData) => {
          const { supabase } = require('@/integrations/supabase/client');
          
          // Mock directory listing creation first (this will be called second)
          const mockListing = {
            id: fc.sample(fc.uuid(), 1)[0],
            user_id: userId,
            passion_type: 'tour_guide',
            is_visible: true,
            is_featured: false,
            listing_priority: 0,
            search_keywords: [],
            created_at: new Date().toISOString(),
            last_updated: new Date().toISOString()
          };

          // Set up mock to handle both calls in sequence
          let callCount = 0;
          supabase.from.mockImplementation((tableName: string) => {
            callCount++;
            
            if (tableName === 'tour_guides') {
              // First call - checking registration completeness
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue(
                      mockSupabaseResponse(guideData)
                    )
                  })
                })
              };
            } else if (tableName === 'public_directory_listings') {
              // Second call - creating the listing
              return {
                upsert: jest.fn().mockReturnValue({
                  select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue(
                      mockSupabaseResponse(mockListing)
                    )
                  })
                })
              };
            }
            
            // Default mock
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn()
                })
              }),
              upsert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn()
                })
              })
            };
          });

          // Test the property: completed registration should create listing
          const result = await directoryService.createPublicListing(userId, 'tour_guide');

          // Verify the listing was created successfully
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
          expect(result.data?.user_id).toBe(userId);
          expect(result.data?.passion_type).toBe('tour_guide');
          expect(result.data?.is_visible).toBe(true);
        }
      ), { numRuns: 10 });
    });

    it('should not create directory listing for incomplete tour guide registrations', async () => {
      await fc.assert(fc.asyncProperty(
        fc.uuid(),
        fc.record({
          full_name: fc.oneof(fc.constant(''), fc.constant(null), fc.constant(undefined), fc.constant('   ')),
          phone: fc.string({ minLength: 10, maxLength: 15 }),
          experience_years: fc.integer({ min: 0, max: 50 }),
          hourly_rate: fc.float({ min: 10, max: 10000 }),
          specialties: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
          address: fc.string({ minLength: 1, maxLength: 200 })
        }),
        async (userId, incompleteGuideData) => {
          // Mock incomplete tour guide data retrieval
          const { supabase } = require('@/integrations/supabase/client');
          supabase.from.mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue(
                  mockSupabaseResponse(incompleteGuideData)
                )
              })
            })
          });

          // Test the property: incomplete registration should not create listing
          const result = await directoryService.createPublicListing(userId, 'tour_guide');

          // Verify the listing was not created
          expect(result.success).toBe(false);
          expect(result.error).toContain('registration is not complete');
        }
      ), { numRuns: 10 });
    });
  });

  /**
   * Property 2: Automatic Hotel Directory Listing
   * Feature: public-user-directory, Property 2: For any user who completes Hotel Partner registration, their profile should automatically appear in the public Hotel Partner directory
   * Validates: Requirements 1.2
   */
  describe('Property 2: Automatic Hotel Directory Listing', () => {
    it('should automatically create directory listing for completed hotel partner registrations', async () => {
      await fc.assert(fc.asyncProperty(
        fc.uuid(),
        fc.record({
          company_name: fc.oneof(
            fc.constant('Grand Hotel'),
            fc.constant('Luxury Resort'),
            fc.constant('Budget Inn'),
            fc.constant('Heritage Palace'),
            fc.constant('Beach Resort')
          ),
          hotel_type: fc.oneof(
            fc.constant('Hotel'),
            fc.constant('Resort'),
            fc.constant('Motel'),
            fc.constant('Guesthouse'),
            fc.constant('Hostel')
          ),
          address: fc.oneof(
            fc.constant('123 Hotel Street, Delhi'),
            fc.constant('456 Resort Avenue, Mumbai'),
            fc.constant('789 Beach Road, Goa'),
            fc.constant('321 Hill Station, Shimla')
          ),
          amenities: fc.oneof(
            fc.constant(['WiFi']),
            fc.constant(['Pool']),
            fc.constant(['Gym']),
            fc.constant(['Restaurant']),
            fc.constant(['WiFi', 'Pool']),
            fc.constant(['Gym', 'Restaurant'])
          )
        }),
        async (userId, hotelData) => {
          const { supabase } = require('@/integrations/supabase/client');
          
          // Mock directory listing creation first (this will be called second)
          const mockListing = {
            id: fc.sample(fc.uuid(), 1)[0],
            user_id: userId,
            passion_type: 'hotel_partner',
            is_visible: true,
            is_featured: false,
            listing_priority: 0,
            search_keywords: [],
            created_at: new Date().toISOString(),
            last_updated: new Date().toISOString()
          };

          // Set up mock to handle both calls in sequence
          let callCount = 0;
          supabase.from.mockImplementation((tableName: string) => {
            callCount++;
            
            if (tableName === 'hotel_partners') {
              // First call - checking registration completeness
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue(
                      mockSupabaseResponse(hotelData)
                    )
                  })
                })
              };
            } else if (tableName === 'public_directory_listings') {
              // Second call - creating the listing
              return {
                upsert: jest.fn().mockReturnValue({
                  select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue(
                      mockSupabaseResponse(mockListing)
                    )
                  })
                })
              };
            }
            
            // Default mock
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn()
                })
              }),
              upsert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn()
                })
              })
            };
          });

          // Test the property: completed registration should create listing
          const result = await directoryService.createPublicListing(userId, 'hotel_partner');

          // Verify the listing was created successfully
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
          expect(result.data?.user_id).toBe(userId);
          expect(result.data?.passion_type).toBe('hotel_partner');
          expect(result.data?.is_visible).toBe(true);
        }
      ), { numRuns: 10 });
    });

    it('should not create directory listing for incomplete hotel partner registrations', async () => {
      await fc.assert(fc.asyncProperty(
        fc.uuid(),
        fc.record({
          company_name: fc.oneof(fc.constant(''), fc.constant(null), fc.constant(undefined), fc.constant('   ')),
          hotel_type: fc.string({ minLength: 1, maxLength: 50 }),
          address: fc.string({ minLength: 1, maxLength: 200 }),
          amenities: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 })
        }),
        async (userId, incompleteHotelData) => {
          // Mock incomplete hotel partner data retrieval
          const { supabase } = require('@/integrations/supabase/client');
          supabase.from.mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue(
                  mockSupabaseResponse(incompleteHotelData)
                )
              })
            })
          });

          // Test the property: incomplete registration should not create listing
          const result = await directoryService.createPublicListing(userId, 'hotel_partner');

          // Verify the listing was not created
          expect(result.success).toBe(false);
          expect(result.error).toContain('registration is not complete');
        }
      ), { numRuns: 10 });
    });
  });

  /**
   * Property 3: Tourist Exclusion from Public Directories
   * Feature: public-user-directory, Property 3: For any user who registers as a Tourist, their profile should not appear in any public directory
   * Validates: Requirements 1.3
   */
  describe('Property 3: Tourist Exclusion from Public Directories', () => {
    it('should reject directory listing creation for tourist users', async () => {
      await fc.assert(fc.asyncProperty(
        fc.uuid(),
        async (userId) => {
          // Mock that no registration data exists for tourists
          const { supabase } = require('@/integrations/supabase/client');
          supabase.from.mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue(
                  mockSupabaseResponse(null, { message: 'No rows found' })
                )
              })
            })
          });

          // Test the property: tourist users should not be able to create directory listings
          const tourGuideResult = await directoryService.createPublicListing(userId, 'tour_guide');
          const hotelPartnerResult = await directoryService.createPublicListing(userId, 'hotel_partner');

          // Both should fail since tourists don't have the required registration data
          expect(tourGuideResult.success).toBe(false);
          expect(hotelPartnerResult.success).toBe(false);
        }
      ), { numRuns: 10 });
    });
  });
});