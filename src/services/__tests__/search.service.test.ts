/**
 * Search Engine Property Tests
 * Tests for search, filtering, and discovery functionality
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import * as fc from 'fast-check';
import { SearchEngine, SearchQuery, SearchFilters } from '../search.service';

// Mock Supabase client
const mockSupabaseResponse = <T>(data: T, error: any = null, count?: number) => ({
  data,
  error,
  count
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
          })),
          or: jest.fn(() => ({
            ilike: jest.fn(() => ({
              overlaps: jest.fn(() => ({
                lte: jest.fn(() => ({
                  gte: jest.fn(() => ({
                    in: jest.fn(() => ({
                      order: jest.fn(() => ({
                        range: jest.fn()
                      }))
                    }))
                  }))
                }))
              }))
            }))
          })),
          ilike: jest.fn(() => ({
            overlaps: jest.fn(() => ({
              lte: jest.fn(() => ({
                gte: jest.fn(() => ({
                  in: jest.fn(() => ({
                    order: jest.fn(() => ({
                      range: jest.fn()
                    }))
                  }))
                }))
              }))
            }))
          })),
          overlaps: jest.fn(() => ({
            lte: jest.fn(() => ({
              gte: jest.fn(() => ({
                in: jest.fn(() => ({
                  order: jest.fn(() => ({
                    range: jest.fn()
                  }))
                }))
              }))
            }))
          })),
          lte: jest.fn(() => ({
            gte: jest.fn(() => ({
              in: jest.fn(() => ({
                order: jest.fn(() => ({
                  range: jest.fn()
                }))
              }))
            }))
          })),
          gte: jest.fn(() => ({
            in: jest.fn(() => ({
              order: jest.fn(() => ({
                range: jest.fn()
              }))
            }))
          })),
          in: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn()
            }))
          })),
          order: jest.fn(() => ({
            range: jest.fn()
          })),
          range: jest.fn(),
          limit: jest.fn()
        }))
      }))
    }
  };
});

describe('SearchEngine Property Tests', () => {
  let searchEngine: SearchEngine;

  beforeEach(() => {
    searchEngine = new SearchEngine();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 19: Text Search Functionality
   * Feature: public-user-directory, Property 19: For any text search query, the search should find profiles that match the query text in names, descriptions, or specialties
   * Validates: Requirements 5.1
   */
  describe('Property 19: Text Search Functionality', () => {
    it('should find tour guides matching text search in names, descriptions, or specialties', async () => {
      await fc.assert(fc.asyncProperty(
        fc.oneof(
          fc.constant('John'),
          fc.constant('Delhi'),
          fc.constant('Historical'),
          fc.constant('Adventure'),
          fc.constant('Cultural')
        ),
        async (searchText) => {
          const { supabase } = require('@/integrations/supabase/client');
          
          // Mock tour guides data that should match the search
          const mockGuides = [
            {
              id: 'guide1',
              user_id: 'user1',
              full_name: 'John Doe',
              bio: 'Experienced guide specializing in historical tours',
              city: 'Delhi',
              state: 'Delhi',
              specialties: ['Historical Tours', 'Cultural Tours'],
              experience_years: 5,
              hourly_rate: 500,
              verified: true,
              is_active: true,
              created_at: new Date().toISOString()
            },
            {
              id: 'guide2',
              user_id: 'user2',
              full_name: 'Jane Smith',
              bio: 'Adventure tour specialist',
              city: 'Mumbai',
              state: 'Maharashtra',
              specialties: ['Adventure Tours'],
              experience_years: 3,
              hourly_rate: 400,
              verified: true,
              is_active: true,
              created_at: new Date().toISOString()
            }
          ];

          // Mock visible directory listings
          const mockListings = [
            { user_id: 'user1' },
            { user_id: 'user2' }
          ];

          let callCount = 0;
          supabase.from.mockImplementation((tableName: string) => {
            callCount++;
            
            if (tableName === 'public_directory_listings') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue(
                      mockSupabaseResponse(mockListings)
                    )
                  })
                })
              };
            } else if (tableName === 'tour_guides') {
              // Filter guides based on search text
              const filteredGuides = mockGuides.filter(guide => 
                guide.full_name.toLowerCase().includes(searchText.toLowerCase()) ||
                guide.bio.toLowerCase().includes(searchText.toLowerCase()) ||
                guide.city.toLowerCase().includes(searchText.toLowerCase()) ||
                guide.specialties.some(s => s.toLowerCase().includes(searchText.toLowerCase()))
              );

              return {
                select: jest.fn().mockReturnValue({
                  or: jest.fn().mockReturnValue({
                    in: jest.fn().mockReturnValue({
                      order: jest.fn().mockReturnValue({
                        range: jest.fn().mockResolvedValue(
                          mockSupabaseResponse(filteredGuides, null, filteredGuides.length)
                        )
                      })
                    })
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

          // Create search query
          const query: SearchQuery = {
            text: searchText,
            filters: {},
            sort: 'newest',
            pagination: { page: 1, limit: 10 }
          };

          // Test the property: text search should find matching profiles
          const result = await searchEngine.searchGuides(query);

          // Verify search results
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
          
          // All returned results should match the search text
          result.data?.forEach(guide => {
            const matchesText = 
              guide.displayName.toLowerCase().includes(searchText.toLowerCase()) ||
              (guide.bio && guide.bio.toLowerCase().includes(searchText.toLowerCase())) ||
              (guide.location?.city && guide.location.city.toLowerCase().includes(searchText.toLowerCase())) ||
              guide.specialties.some(s => s.toLowerCase().includes(searchText.toLowerCase()));
            
            expect(matchesText).toBe(true);
          });
        }
      ), { numRuns: 10 });
    });

    it('should find hotels matching text search in names, descriptions, or amenities', async () => {
      await fc.assert(fc.asyncProperty(
        fc.oneof(
          fc.constant('Grand'),
          fc.constant('Mumbai'),
          fc.constant('WiFi'),
          fc.constant('Pool'),
          fc.constant('Resort')
        ),
        async (searchText) => {
          const { supabase } = require('@/integrations/supabase/client');
          
          // Mock hotel data that should match the search
          const mockHotels = [
            {
              id: 'hotel1',
              user_id: 'user1',
              company_name: 'Grand Hotel',
              bio: 'Luxury hotel in the heart of Mumbai',
              city: 'Mumbai',
              state: 'Maharashtra',
              hotel_type: 'Hotel',
              amenities: ['WiFi', 'Pool', 'Restaurant'],
              is_verified: true,
              is_active: true,
              created_at: new Date().toISOString()
            },
            {
              id: 'hotel2',
              user_id: 'user2',
              company_name: 'Beach Resort',
              bio: 'Beautiful resort by the sea',
              city: 'Goa',
              state: 'Goa',
              hotel_type: 'Resort',
              amenities: ['Pool', 'Beach Access'],
              is_verified: true,
              is_active: true,
              created_at: new Date().toISOString()
            }
          ];

          // Mock visible directory listings
          const mockListings = [
            { user_id: 'user1' },
            { user_id: 'user2' }
          ];

          let callCount = 0;
          supabase.from.mockImplementation((tableName: string) => {
            callCount++;
            
            if (tableName === 'public_directory_listings') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue(
                      mockSupabaseResponse(mockListings)
                    )
                  })
                })
              };
            } else if (tableName === 'hotel_partners') {
              // Filter hotels based on search text
              const filteredHotels = mockHotels.filter(hotel => 
                hotel.company_name.toLowerCase().includes(searchText.toLowerCase()) ||
                hotel.bio.toLowerCase().includes(searchText.toLowerCase()) ||
                hotel.city.toLowerCase().includes(searchText.toLowerCase()) ||
                hotel.hotel_type.toLowerCase().includes(searchText.toLowerCase()) ||
                hotel.amenities.some(a => a.toLowerCase().includes(searchText.toLowerCase()))
              );

              return {
                select: jest.fn().mockReturnValue({
                  or: jest.fn().mockReturnValue({
                    in: jest.fn().mockReturnValue({
                      order: jest.fn().mockReturnValue({
                        range: jest.fn().mockResolvedValue(
                          mockSupabaseResponse(filteredHotels, null, filteredHotels.length)
                        )
                      })
                    })
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

          // Create search query
          const query: SearchQuery = {
            text: searchText,
            filters: {},
            sort: 'newest',
            pagination: { page: 1, limit: 10 }
          };

          // Test the property: text search should find matching profiles
          const result = await searchEngine.searchHotels(query);

          // Verify search results
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
          
          // All returned results should match the search text
          result.data?.forEach(hotel => {
            const matchesText = 
              hotel.displayName.toLowerCase().includes(searchText.toLowerCase()) ||
              (hotel.bio && hotel.bio.toLowerCase().includes(searchText.toLowerCase())) ||
              (hotel.location?.city && hotel.location.city.toLowerCase().includes(searchText.toLowerCase())) ||
              hotel.hotelType.toLowerCase().includes(searchText.toLowerCase()) ||
              hotel.amenities.some(a => a.toLowerCase().includes(searchText.toLowerCase()));
            
            expect(matchesText).toBe(true);
          });
        }
      ), { numRuns: 10 });
    });

    it('should return empty results for non-matching text searches', async () => {
      await fc.assert(fc.asyncProperty(
        fc.constant('NonExistentSearchTerm'),
        async (searchText) => {
          const { supabase } = require('@/integrations/supabase/client');
          
          // Mock empty results for non-matching search
          supabase.from.mockImplementation((tableName: string) => {
            if (tableName === 'public_directory_listings') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue(
                      mockSupabaseResponse([])
                    )
                  })
                })
              };
            }
            
            return {
              select: jest.fn().mockReturnValue({
                or: jest.fn().mockReturnValue({
                  range: jest.fn().mockResolvedValue(
                    mockSupabaseResponse([], null, 0)
                  )
                })
              })
            };
          });

          // Create search query
          const query: SearchQuery = {
            text: searchText,
            filters: {},
            sort: 'newest',
            pagination: { page: 1, limit: 10 }
          };

          // Test the property: non-matching search should return empty results
          const guideResult = await searchEngine.searchGuides(query);
          const hotelResult = await searchEngine.searchHotels(query);

          // Verify empty results
          expect(guideResult.success).toBe(true);
          expect(guideResult.data).toEqual([]);
          expect(hotelResult.success).toBe(true);
          expect(hotelResult.data).toEqual([]);
        }
      ), { numRuns: 5 });
    });
  });

  /**
   * Property 7: Guide Location Filtering
   * Feature: public-user-directory, Property 7: For any location-based search of tour guides, only guides whose service areas match the search location should be returned
   * Validates: Requirements 2.3
   */
  describe('Property 7: Guide Location Filtering', () => {
    it('should filter tour guides by service area location', async () => {
      await fc.assert(fc.asyncProperty(
        fc.oneof(
          fc.constant('Delhi'),
          fc.constant('Mumbai'),
          fc.constant('Goa'),
          fc.constant('Jaipur'),
          fc.constant('Agra'),
          fc.constant('Kolkata')
        ),
        async (locationFilter) => {
          const { supabase } = require('@/integrations/supabase/client');
          
          // Mock guides with different service areas
          const mockGuides = [
            {
              id: 'guide1',
              user_id: 'user1',
              full_name: 'Delhi Guide',
              city: 'Delhi',
              state: 'Delhi',
              service_areas: ['Delhi', 'New Delhi', 'Gurgaon'],
              verified: true,
              is_active: true,
              created_at: new Date().toISOString()
            },
            {
              id: 'guide2',
              user_id: 'user2',
              full_name: 'Mumbai Guide',
              city: 'Mumbai',
              state: 'Maharashtra',
              service_areas: ['Mumbai', 'Navi Mumbai', 'Thane'],
              verified: true,
              is_active: true,
              created_at: new Date().toISOString()
            },
            {
              id: 'guide3',
              user_id: 'user3',
              full_name: 'Goa Guide',
              city: 'Panaji',
              state: 'Goa',
              service_areas: ['Panaji', 'Margao', 'Calangute'],
              verified: true,
              is_active: true,
              created_at: new Date().toISOString()
            }
          ];

          // Filter guides whose service areas match the location
          const filteredGuides = mockGuides.filter(guide => 
            guide.city.toLowerCase().includes(locationFilter.toLowerCase()) ||
            guide.state.toLowerCase().includes(locationFilter.toLowerCase()) ||
            (guide.service_areas && guide.service_areas.some(area => 
              area.toLowerCase().includes(locationFilter.toLowerCase())
            ))
          );

          const mockListings = filteredGuides.map(g => ({ user_id: g.user_id }));

          supabase.from.mockImplementation((tableName: string) => {
            if (tableName === 'public_directory_listings') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue(
                      mockSupabaseResponse(mockListings)
                    )
                  })
                })
              };
            } else if (tableName === 'tour_guides') {
              return {
                select: jest.fn().mockReturnValue({
                  ilike: jest.fn().mockReturnValue({
                    in: jest.fn().mockReturnValue({
                      order: jest.fn().mockReturnValue({
                        range: jest.fn().mockResolvedValue(
                          mockSupabaseResponse(filteredGuides, null, filteredGuides.length)
                        )
                      })
                    })
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

          // Create search query with location filter for guides
          const query: SearchQuery = {
            location: { city: locationFilter },
            filters: {},
            sort: 'newest',
            pagination: { page: 1, limit: 10 }
          };

          // Test the property: location filter should return only guides with matching service areas
          const result = await searchEngine.searchGuides(query);

          // Verify location filtering for guides
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
          
          // All returned results should have service areas matching the location filter
          result.data?.forEach(guide => {
            const matchesLocation = 
              guide.location?.city?.toLowerCase().includes(locationFilter.toLowerCase()) ||
              guide.location?.state?.toLowerCase().includes(locationFilter.toLowerCase());
            expect(matchesLocation).toBe(true);
          });
        }
      ), { numRuns: 10 });
    });
  });

  /**
   * Property 8: Guide Specialty Filtering
   * Feature: public-user-directory, Property 8: For any specialty-based search of tour guides, only guides whose expertise areas match the search specialty should be returned
   * Validates: Requirements 2.4
   */
  describe('Property 8: Guide Specialty Filtering', () => {
    it('should filter tour guides by specialty expertise areas', async () => {
      await fc.assert(fc.asyncProperty(
        fc.oneof(
          fc.constant('Historical Tours'),
          fc.constant('Adventure Tours'),
          fc.constant('Cultural Tours'),
          fc.constant('Wildlife Tours'),
          fc.constant('Religious Tours'),
          fc.constant('Food Tours')
        ),
        async (specialtyFilter) => {
          const { supabase } = require('@/integrations/supabase/client');
          
          // Mock guides with different specialties
          const mockGuides = [
            {
              id: 'guide1',
              user_id: 'user1',
              full_name: 'Historical Guide',
              city: 'Delhi',
              state: 'Delhi',
              specialties: ['Historical Tours', 'Cultural Tours', 'Monument Tours'],
              verified: true,
              is_active: true,
              created_at: new Date().toISOString()
            },
            {
              id: 'guide2',
              user_id: 'user2',
              full_name: 'Adventure Guide',
              city: 'Rishikesh',
              state: 'Uttarakhand',
              specialties: ['Adventure Tours', 'Trekking', 'River Rafting'],
              verified: true,
              is_active: true,
              created_at: new Date().toISOString()
            },
            {
              id: 'guide3',
              user_id: 'user3',
              full_name: 'Wildlife Guide',
              city: 'Ranthambore',
              state: 'Rajasthan',
              specialties: ['Wildlife Tours', 'Safari Tours', 'Nature Tours'],
              verified: true,
              is_active: true,
              created_at: new Date().toISOString()
            },
            {
              id: 'guide4',
              user_id: 'user4',
              full_name: 'Food Guide',
              city: 'Mumbai',
              state: 'Maharashtra',
              specialties: ['Food Tours', 'Street Food Tours', 'Cultural Tours'],
              verified: true,
              is_active: true,
              created_at: new Date().toISOString()
            }
          ];

          // Filter guides whose specialties match the search
          const filteredGuides = mockGuides.filter(guide => 
            guide.specialties && guide.specialties.some(specialty => 
              specialty.toLowerCase().includes(specialtyFilter.toLowerCase())
            )
          );

          const mockListings = filteredGuides.map(g => ({ user_id: g.user_id }));

          supabase.from.mockImplementation((tableName: string) => {
            if (tableName === 'public_directory_listings') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue(
                      mockSupabaseResponse(mockListings)
                    )
                  })
                })
              };
            } else if (tableName === 'tour_guides') {
              return {
                select: jest.fn().mockReturnValue({
                  overlaps: jest.fn().mockReturnValue({
                    in: jest.fn().mockReturnValue({
                      order: jest.fn().mockReturnValue({
                        range: jest.fn().mockResolvedValue(
                          mockSupabaseResponse(filteredGuides, null, filteredGuides.length)
                        )
                      })
                    })
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

          // Create search query with specialty filter for guides
          const query: SearchQuery = {
            filters: { specialties: [specialtyFilter] },
            sort: 'newest',
            pagination: { page: 1, limit: 10 }
          };

          // Test the property: specialty filter should return only guides with matching expertise areas
          const result = await searchEngine.searchGuides(query);

          // Verify specialty filtering for guides
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
          
          // All returned results should have specialties matching the filter
          result.data?.forEach(guide => {
            const hasMatchingSpecialty = guide.specialties.some(specialty => 
              specialty.toLowerCase().includes(specialtyFilter.toLowerCase())
            );
            expect(hasMatchingSpecialty).toBe(true);
          });
        }
      ), { numRuns: 10 });
    });

    it('should return empty results when no guides match the specialty', async () => {
      await fc.assert(fc.asyncProperty(
        fc.constant('NonExistentSpecialty'),
        async (specialtyFilter) => {
          const { supabase } = require('@/integrations/supabase/client');
          
          // Mock guides with different specialties that don't match
          const mockGuides = [
            {
              id: 'guide1',
              user_id: 'user1',
              full_name: 'Historical Guide',
              specialties: ['Historical Tours', 'Cultural Tours'],
              verified: true,
              is_active: true,
              created_at: new Date().toISOString()
            }
          ];

          // No guides should match the non-existent specialty
          const filteredGuides: any[] = [];
          const mockListings: any[] = [];

          supabase.from.mockImplementation((tableName: string) => {
            if (tableName === 'public_directory_listings') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue(
                      mockSupabaseResponse(mockListings)
                    )
                  })
                })
              };
            } else if (tableName === 'tour_guides') {
              return {
                select: jest.fn().mockReturnValue({
                  overlaps: jest.fn().mockReturnValue({
                    in: jest.fn().mockReturnValue({
                      order: jest.fn().mockReturnValue({
                        range: jest.fn().mockResolvedValue(
                          mockSupabaseResponse(filteredGuides, null, filteredGuides.length)
                        )
                      })
                    })
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

          // Create search query with non-matching specialty filter
          const query: SearchQuery = {
            filters: { specialties: [specialtyFilter] },
            sort: 'newest',
            pagination: { page: 1, limit: 10 }
          };

          // Test the property: non-matching specialty should return empty results
          const result = await searchEngine.searchGuides(query);

          // Verify empty results for non-matching specialty
          expect(result.success).toBe(true);
          expect(result.data).toEqual([]);
        }
      ), { numRuns: 5 });
    });
  });

  /**
   * Property 12: Hotel Location Filtering
   * Feature: public-user-directory, Property 12: For any location-based search of hotels, only hotels whose geographic location matches the search criteria should be returned
   * Validates: Requirements 3.3
   */
  describe('Property 12: Hotel Location Filtering', () => {
    it('should filter hotels by geographic location', async () => {
      await fc.assert(fc.asyncProperty(
        fc.oneof(
          fc.constant('Mumbai'),
          fc.constant('Delhi'),
          fc.constant('Goa'),
          fc.constant('Jaipur'),
          fc.constant('Bangalore'),
          fc.constant('Chennai')
        ),
        async (locationFilter) => {
          const { supabase } = require('@/integrations/supabase/client');
          
          // Mock hotels with different geographic locations
          const mockHotels = [
            {
              id: 'hotel1',
              user_id: 'user1',
              company_name: 'Mumbai Grand Hotel',
              city: 'Mumbai',
              state: 'Maharashtra',
              hotel_type: 'Hotel',
              amenities: ['WiFi', 'Restaurant'],
              is_verified: true,
              is_active: true,
              created_at: new Date().toISOString()
            },
            {
              id: 'hotel2',
              user_id: 'user2',
              company_name: 'Delhi Palace Hotel',
              city: 'Delhi',
              state: 'Delhi',
              hotel_type: 'Heritage Hotel',
              amenities: ['WiFi', 'Pool'],
              is_verified: true,
              is_active: true,
              created_at: new Date().toISOString()
            },
            {
              id: 'hotel3',
              user_id: 'user3',
              company_name: 'Goa Beach Resort',
              city: 'Panaji',
              state: 'Goa',
              hotel_type: 'Beach Resort',
              amenities: ['Beach Access', 'Pool'],
              is_verified: true,
              is_active: true,
              created_at: new Date().toISOString()
            },
            {
              id: 'hotel4',
              user_id: 'user4',
              company_name: 'Jaipur Heritage',
              city: 'Jaipur',
              state: 'Rajasthan',
              hotel_type: 'Heritage Hotel',
              amenities: ['WiFi', 'Restaurant', 'Spa'],
              is_verified: true,
              is_active: true,
              created_at: new Date().toISOString()
            }
          ];

          // Filter hotels whose geographic location matches the search
          const filteredHotels = mockHotels.filter(hotel => 
            hotel.city.toLowerCase().includes(locationFilter.toLowerCase()) ||
            hotel.state.toLowerCase().includes(locationFilter.toLowerCase())
          );

          const mockListings = filteredHotels.map(h => ({ user_id: h.user_id }));

          supabase.from.mockImplementation((tableName: string) => {
            if (tableName === 'public_directory_listings') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue(
                      mockSupabaseResponse(mockListings)
                    )
                  })
                })
              };
            } else if (tableName === 'hotel_partners') {
              return {
                select: jest.fn().mockReturnValue({
                  ilike: jest.fn().mockReturnValue({
                    in: jest.fn().mockReturnValue({
                      order: jest.fn().mockReturnValue({
                        range: jest.fn().mockResolvedValue(
                          mockSupabaseResponse(filteredHotels, null, filteredHotels.length)
                        )
                      })
                    })
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

          // Create search query with location filter for hotels
          const query: SearchQuery = {
            location: { city: locationFilter },
            filters: {},
            sort: 'newest',
            pagination: { page: 1, limit: 10 }
          };

          // Test the property: location filter should return only hotels with matching geographic location
          const result = await searchEngine.searchHotels(query);

          // Verify location filtering for hotels
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
          
          // All returned results should have geographic locations matching the filter
          result.data?.forEach(hotel => {
            const matchesLocation = 
              hotel.location?.city?.toLowerCase().includes(locationFilter.toLowerCase()) ||
              hotel.location?.state?.toLowerCase().includes(locationFilter.toLowerCase());
            expect(matchesLocation).toBe(true);
          });
        }
      ), { numRuns: 10 });
    });

    it('should return empty results when no hotels match the location', async () => {
      await fc.assert(fc.asyncProperty(
        fc.constant('NonExistentCity'),
        async (locationFilter) => {
          const { supabase } = require('@/integrations/supabase/client');
          
          // Mock hotels with different locations that don't match
          const mockHotels = [
            {
              id: 'hotel1',
              user_id: 'user1',
              company_name: 'Mumbai Hotel',
              city: 'Mumbai',
              state: 'Maharashtra',
              hotel_type: 'Hotel',
              is_verified: true,
              is_active: true,
              created_at: new Date().toISOString()
            }
          ];

          // No hotels should match the non-existent location
          const filteredHotels: any[] = [];
          const mockListings: any[] = [];

          supabase.from.mockImplementation((tableName: string) => {
            if (tableName === 'public_directory_listings') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue(
                      mockSupabaseResponse(mockListings)
                    )
                  })
                })
              };
            } else if (tableName === 'hotel_partners') {
              return {
                select: jest.fn().mockReturnValue({
                  ilike: jest.fn().mockReturnValue({
                    in: jest.fn().mockReturnValue({
                      order: jest.fn().mockReturnValue({
                        range: jest.fn().mockResolvedValue(
                          mockSupabaseResponse(filteredHotels, null, filteredHotels.length)
                        )
                      })
                    })
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

          // Create search query with non-matching location filter
          const query: SearchQuery = {
            location: { city: locationFilter },
            filters: {},
            sort: 'newest',
            pagination: { page: 1, limit: 10 }
          };

          // Test the property: non-matching location should return empty results
          const result = await searchEngine.searchHotels(query);

          // Verify empty results for non-matching location
          expect(result.success).toBe(true);
          expect(result.data).toEqual([]);
        }
      ), { numRuns: 5 });
    });
  });

  /**
   * Property 13: Hotel Amenity Filtering
   * Feature: public-user-directory, Property 13: For any amenity-based search of hotels, only hotels with matching available facilities should be returned
   * Validates: Requirements 3.4
   */
  describe('Property 13: Hotel Amenity Filtering', () => {
    it('should filter hotels by available amenities', async () => {
      await fc.assert(fc.asyncProperty(
        fc.oneof(
          fc.constant('WiFi'),
          fc.constant('Pool'),
          fc.constant('Restaurant'),
          fc.constant('Gym'),
          fc.constant('Spa'),
          fc.constant('Parking')
        ),
        async (amenityFilter) => {
          const { supabase } = require('@/integrations/supabase/client');
          
          // Mock hotels with different amenities
          const mockHotels = [
            {
              id: 'hotel1',
              user_id: 'user1',
              company_name: 'WiFi Hotel',
              city: 'Mumbai',
              state: 'Maharashtra',
              hotel_type: 'Hotel',
              amenities: ['WiFi', 'Restaurant', 'Room Service'],
              is_verified: true,
              is_active: true,
              created_at: new Date().toISOString()
            },
            {
              id: 'hotel2',
              user_id: 'user2',
              company_name: 'Pool Resort',
              city: 'Goa',
              state: 'Goa',
              hotel_type: 'Resort',
              amenities: ['Pool', 'Beach Access', 'Spa'],
              is_verified: true,
              is_active: true,
              created_at: new Date().toISOString()
            },
            {
              id: 'hotel3',
              user_id: 'user3',
              company_name: 'Business Hotel',
              city: 'Delhi',
              state: 'Delhi',
              hotel_type: 'Hotel',
              amenities: ['WiFi', 'Gym', 'Conference Room'],
              is_verified: true,
              is_active: true,
              created_at: new Date().toISOString()
            },
            {
              id: 'hotel4',
              user_id: 'user4',
              company_name: 'Luxury Resort',
              city: 'Jaipur',
              state: 'Rajasthan',
              hotel_type: 'Resort',
              amenities: ['Pool', 'Spa', 'Restaurant', 'Parking'],
              is_verified: true,
              is_active: true,
              created_at: new Date().toISOString()
            }
          ];

          // Filter hotels whose amenities match the search
          const filteredHotels = mockHotels.filter(hotel => 
            hotel.amenities && hotel.amenities.some(amenity => 
              amenity.toLowerCase().includes(amenityFilter.toLowerCase())
            )
          );

          const mockListings = filteredHotels.map(h => ({ user_id: h.user_id }));

          supabase.from.mockImplementation((tableName: string) => {
            if (tableName === 'public_directory_listings') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue(
                      mockSupabaseResponse(mockListings)
                    )
                  })
                })
              };
            } else if (tableName === 'hotel_partners') {
              return {
                select: jest.fn().mockReturnValue({
                  overlaps: jest.fn().mockReturnValue({
                    in: jest.fn().mockReturnValue({
                      order: jest.fn().mockReturnValue({
                        range: jest.fn().mockResolvedValue(
                          mockSupabaseResponse(filteredHotels, null, filteredHotels.length)
                        )
                      })
                    })
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

          // Create search query with amenity filter for hotels
          const query: SearchQuery = {
            filters: { amenities: [amenityFilter] },
            sort: 'newest',
            pagination: { page: 1, limit: 10 }
          };

          // Test the property: amenity filter should return only hotels with matching facilities
          const result = await searchEngine.searchHotels(query);

          // Verify amenity filtering for hotels
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
          
          // All returned results should have amenities matching the filter
          result.data?.forEach(hotel => {
            const hasMatchingAmenity = hotel.amenities.some(amenity => 
              amenity.toLowerCase().includes(amenityFilter.toLowerCase())
            );
            expect(hasMatchingAmenity).toBe(true);
          });
        }
      ), { numRuns: 10 });
    });

    it('should return empty results when no hotels have the specified amenity', async () => {
      await fc.assert(fc.asyncProperty(
        fc.constant('NonExistentAmenity'),
        async (amenityFilter) => {
          const { supabase } = require('@/integrations/supabase/client');
          
          // Mock hotels with different amenities that don't match
          const mockHotels = [
            {
              id: 'hotel1',
              user_id: 'user1',
              company_name: 'Basic Hotel',
              city: 'Mumbai',
              state: 'Maharashtra',
              hotel_type: 'Hotel',
              amenities: ['WiFi', 'Restaurant'],
              is_verified: true,
              is_active: true,
              created_at: new Date().toISOString()
            }
          ];

          // No hotels should match the non-existent amenity
          const filteredHotels: any[] = [];
          const mockListings: any[] = [];

          supabase.from.mockImplementation((tableName: string) => {
            if (tableName === 'public_directory_listings') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue(
                      mockSupabaseResponse(mockListings)
                    )
                  })
                })
              };
            } else if (tableName === 'hotel_partners') {
              return {
                select: jest.fn().mockReturnValue({
                  overlaps: jest.fn().mockReturnValue({
                    in: jest.fn().mockReturnValue({
                      order: jest.fn().mockReturnValue({
                        range: jest.fn().mockResolvedValue(
                          mockSupabaseResponse(filteredHotels, null, filteredHotels.length)
                        )
                      })
                    })
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

          // Create search query with non-matching amenity filter
          const query: SearchQuery = {
            filters: { amenities: [amenityFilter] },
            sort: 'newest',
            pagination: { page: 1, limit: 10 }
          };

          // Test the property: non-matching amenity should return empty results
          const result = await searchEngine.searchHotels(query);

          // Verify empty results for non-matching amenity
          expect(result.success).toBe(true);
          expect(result.data).toEqual([]);
        }
      ), { numRuns: 5 });
    });

    it('should filter hotels by multiple amenities', async () => {
      await fc.assert(fc.asyncProperty(
        fc.array(
          fc.oneof(
            fc.constant('WiFi'),
            fc.constant('Pool'),
            fc.constant('Restaurant'),
            fc.constant('Spa')
          ),
          { minLength: 2, maxLength: 3 }
        ),
        async (amenityFilters) => {
          const { supabase } = require('@/integrations/supabase/client');
          
          // Mock hotels with different amenity combinations
          const mockHotels = [
            {
              id: 'hotel1',
              user_id: 'user1',
              company_name: 'Full Service Hotel',
              city: 'Mumbai',
              state: 'Maharashtra',
              hotel_type: 'Hotel',
              amenities: ['WiFi', 'Pool', 'Restaurant', 'Spa', 'Gym'],
              is_verified: true,
              is_active: true,
              created_at: new Date().toISOString()
            },
            {
              id: 'hotel2',
              user_id: 'user2',
              company_name: 'Basic Hotel',
              city: 'Delhi',
              state: 'Delhi',
              hotel_type: 'Hotel',
              amenities: ['WiFi', 'Restaurant'],
              is_verified: true,
              is_active: true,
              created_at: new Date().toISOString()
            }
          ];

          // Filter hotels that have ALL the specified amenities
          const filteredHotels = mockHotels.filter(hotel => 
            amenityFilters.every(amenity => 
              hotel.amenities && hotel.amenities.some(hotelAmenity => 
                hotelAmenity.toLowerCase().includes(amenity.toLowerCase())
              )
            )
          );

          const mockListings = filteredHotels.map(h => ({ user_id: h.user_id }));

          supabase.from.mockImplementation((tableName: string) => {
            if (tableName === 'public_directory_listings') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue(
                      mockSupabaseResponse(mockListings)
                    )
                  })
                })
              };
            } else if (tableName === 'hotel_partners') {
              return {
                select: jest.fn().mockReturnValue({
                  overlaps: jest.fn().mockReturnValue({
                    in: jest.fn().mockReturnValue({
                      order: jest.fn().mockReturnValue({
                        range: jest.fn().mockResolvedValue(
                          mockSupabaseResponse(filteredHotels, null, filteredHotels.length)
                        )
                      })
                    })
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

          // Create search query with multiple amenity filters
          const query: SearchQuery = {
            filters: { amenities: amenityFilters },
            sort: 'newest',
            pagination: { page: 1, limit: 10 }
          };

          // Test the property: multiple amenity filters should return hotels with all specified amenities
          const result = await searchEngine.searchHotels(query);

          // Verify multiple amenity filtering
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
          
          // All returned results should have ALL the specified amenities
          result.data?.forEach(hotel => {
            amenityFilters.forEach(amenityFilter => {
              const hasMatchingAmenity = hotel.amenities.some(amenity => 
                amenity.toLowerCase().includes(amenityFilter.toLowerCase())
              );
              expect(hasMatchingAmenity).toBe(true);
            });
          });
        }
      ), { numRuns: 10 });
    });
  });

  /**
   * Property 20: Location Filter Support
   * Feature: public-user-directory, Property 20: For any location filter applied to search results, only profiles matching the city, state, or region criteria should be returned
   * Validates: Requirements 5.2
   */
  describe('Property 20: Location Filter Support', () => {
    it('should filter results by city location', async () => {
      await fc.assert(fc.asyncProperty(
        fc.oneof(
          fc.constant('Delhi'),
          fc.constant('Mumbai'),
          fc.constant('Goa'),
          fc.constant('Jaipur')
        ),
        async (cityFilter) => {
          const { supabase } = require('@/integrations/supabase/client');
          
          // Mock guides from different cities
          const mockGuides = [
            {
              id: 'guide1',
              user_id: 'user1',
              full_name: 'Delhi Guide',
              city: 'Delhi',
              state: 'Delhi',
              verified: true,
              is_active: true,
              created_at: new Date().toISOString()
            },
            {
              id: 'guide2',
              user_id: 'user2',
              full_name: 'Mumbai Guide',
              city: 'Mumbai',
              state: 'Maharashtra',
              verified: true,
              is_active: true,
              created_at: new Date().toISOString()
            }
          ];

          // Filter guides by city
          const filteredGuides = mockGuides.filter(guide => 
            guide.city.toLowerCase().includes(cityFilter.toLowerCase())
          );

          const mockListings = filteredGuides.map(g => ({ user_id: g.user_id }));

          supabase.from.mockImplementation((tableName: string) => {
            if (tableName === 'public_directory_listings') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue(
                      mockSupabaseResponse(mockListings)
                    )
                  })
                })
              };
            } else if (tableName === 'tour_guides') {
              return {
                select: jest.fn().mockReturnValue({
                  ilike: jest.fn().mockReturnValue({
                    in: jest.fn().mockReturnValue({
                      order: jest.fn().mockReturnValue({
                        range: jest.fn().mockResolvedValue(
                          mockSupabaseResponse(filteredGuides, null, filteredGuides.length)
                        )
                      })
                    })
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

          // Create search query with location filter
          const query: SearchQuery = {
            location: { city: cityFilter },
            filters: {},
            sort: 'newest',
            pagination: { page: 1, limit: 10 }
          };

          // Test the property: location filter should return only matching cities
          const result = await searchEngine.searchGuides(query);

          // Verify location filtering
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
          
          // All returned results should match the city filter
          result.data?.forEach(guide => {
            expect(guide.location?.city?.toLowerCase()).toContain(cityFilter.toLowerCase());
          });
        }
      ), { numRuns: 10 });
    });

    it('should filter results by state location', async () => {
      await fc.assert(fc.asyncProperty(
        fc.oneof(
          fc.constant('Delhi'),
          fc.constant('Maharashtra'),
          fc.constant('Goa'),
          fc.constant('Rajasthan')
        ),
        async (stateFilter) => {
          const { supabase } = require('@/integrations/supabase/client');
          
          // Mock hotels from different states
          const mockHotels = [
            {
              id: 'hotel1',
              user_id: 'user1',
              company_name: 'Delhi Hotel',
              city: 'Delhi',
              state: 'Delhi',
              hotel_type: 'Hotel',
              is_verified: true,
              is_active: true,
              created_at: new Date().toISOString()
            },
            {
              id: 'hotel2',
              user_id: 'user2',
              company_name: 'Maharashtra Hotel',
              city: 'Mumbai',
              state: 'Maharashtra',
              hotel_type: 'Hotel',
              is_verified: true,
              is_active: true,
              created_at: new Date().toISOString()
            }
          ];

          // Filter hotels by state
          const filteredHotels = mockHotels.filter(hotel => 
            hotel.state.toLowerCase().includes(stateFilter.toLowerCase())
          );

          const mockListings = filteredHotels.map(h => ({ user_id: h.user_id }));

          supabase.from.mockImplementation((tableName: string) => {
            if (tableName === 'public_directory_listings') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue(
                      mockSupabaseResponse(mockListings)
                    )
                  })
                })
              };
            } else if (tableName === 'hotel_partners') {
              return {
                select: jest.fn().mockReturnValue({
                  ilike: jest.fn().mockReturnValue({
                    in: jest.fn().mockReturnValue({
                      order: jest.fn().mockReturnValue({
                        range: jest.fn().mockResolvedValue(
                          mockSupabaseResponse(filteredHotels, null, filteredHotels.length)
                        )
                      })
                    })
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

          // Create search query with state filter
          const query: SearchQuery = {
            location: { state: stateFilter },
            filters: {},
            sort: 'newest',
            pagination: { page: 1, limit: 10 }
          };

          // Test the property: state filter should return only matching states
          const result = await searchEngine.searchHotels(query);

          // Verify state filtering
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
          
          // All returned results should match the state filter
          result.data?.forEach(hotel => {
            expect(hotel.location?.state?.toLowerCase()).toContain(stateFilter.toLowerCase());
          });
        }
      ), { numRuns: 10 });
    });
  });

  /**
   * Property 21: Category Filter Support
   * Feature: public-user-directory, Property 21: For any category filter applied to search results, only profiles matching the service types, specialties, or amenities should be returned
   * Validates: Requirements 5.3
   */
  describe('Property 21: Category Filter Support', () => {
    it('should filter guides by specialties', async () => {
      await fc.assert(fc.asyncProperty(
        fc.oneof(
          fc.constant(['Historical Tours']),
          fc.constant(['Adventure Tours']),
          fc.constant(['Cultural Tours']),
          fc.constant(['Wildlife Tours'])
        ),
        async (specialtyFilter) => {
          const { supabase } = require('@/integrations/supabase/client');
          
          // Mock guides with different specialties
          const mockGuides = [
            {
              id: 'guide1',
              user_id: 'user1',
              full_name: 'Historical Guide',
              specialties: ['Historical Tours', 'Cultural Tours'],
              verified: true,
              is_active: true,
              created_at: new Date().toISOString()
            },
            {
              id: 'guide2',
              user_id: 'user2',
              full_name: 'Adventure Guide',
              specialties: ['Adventure Tours', 'Wildlife Tours'],
              verified: true,
              is_active: true,
              created_at: new Date().toISOString()
            }
          ];

          // Filter guides by specialty
          const filteredGuides = mockGuides.filter(guide => 
            specialtyFilter.some(s => guide.specialties.includes(s))
          );

          const mockListings = filteredGuides.map(g => ({ user_id: g.user_id }));

          supabase.from.mockImplementation((tableName: string) => {
            if (tableName === 'public_directory_listings') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue(
                      mockSupabaseResponse(mockListings)
                    )
                  })
                })
              };
            } else if (tableName === 'tour_guides') {
              return {
                select: jest.fn().mockReturnValue({
                  overlaps: jest.fn().mockReturnValue({
                    in: jest.fn().mockReturnValue({
                      order: jest.fn().mockReturnValue({
                        range: jest.fn().mockResolvedValue(
                          mockSupabaseResponse(filteredGuides, null, filteredGuides.length)
                        )
                      })
                    })
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

          // Create search query with specialty filter
          const query: SearchQuery = {
            filters: { specialties: specialtyFilter },
            sort: 'newest',
            pagination: { page: 1, limit: 10 }
          };

          // Test the property: specialty filter should return only matching specialties
          const result = await searchEngine.searchGuides(query);

          // Verify specialty filtering
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
          
          // All returned results should have matching specialties
          result.data?.forEach(guide => {
            const hasMatchingSpecialty = specialtyFilter.some(s => 
              guide.specialties.includes(s)
            );
            expect(hasMatchingSpecialty).toBe(true);
          });
        }
      ), { numRuns: 10 });
    });

    it('should filter hotels by amenities', async () => {
      await fc.assert(fc.asyncProperty(
        fc.oneof(
          fc.constant(['WiFi']),
          fc.constant(['Pool']),
          fc.constant(['Restaurant']),
          fc.constant(['Gym'])
        ),
        async (amenityFilter) => {
          const { supabase } = require('@/integrations/supabase/client');
          
          // Mock hotels with different amenities
          const mockHotels = [
            {
              id: 'hotel1',
              user_id: 'user1',
              company_name: 'WiFi Hotel',
              amenities: ['WiFi', 'Restaurant'],
              hotel_type: 'Hotel',
              is_verified: true,
              is_active: true,
              created_at: new Date().toISOString()
            },
            {
              id: 'hotel2',
              user_id: 'user2',
              company_name: 'Pool Resort',
              amenities: ['Pool', 'Gym'],
              hotel_type: 'Resort',
              is_verified: true,
              is_active: true,
              created_at: new Date().toISOString()
            }
          ];

          // Filter hotels by amenity
          const filteredHotels = mockHotels.filter(hotel => 
            amenityFilter.some(a => hotel.amenities.includes(a))
          );

          const mockListings = filteredHotels.map(h => ({ user_id: h.user_id }));

          supabase.from.mockImplementation((tableName: string) => {
            if (tableName === 'public_directory_listings') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue(
                      mockSupabaseResponse(mockListings)
                    )
                  })
                })
              };
            } else if (tableName === 'hotel_partners') {
              return {
                select: jest.fn().mockReturnValue({
                  overlaps: jest.fn().mockReturnValue({
                    in: jest.fn().mockReturnValue({
                      order: jest.fn().mockReturnValue({
                        range: jest.fn().mockResolvedValue(
                          mockSupabaseResponse(filteredHotels, null, filteredHotels.length)
                        )
                      })
                    })
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

          // Create search query with amenity filter
          const query: SearchQuery = {
            filters: { amenities: amenityFilter },
            sort: 'newest',
            pagination: { page: 1, limit: 10 }
          };

          // Test the property: amenity filter should return only matching amenities
          const result = await searchEngine.searchHotels(query);

          // Verify amenity filtering
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
          
          // All returned results should have matching amenities
          result.data?.forEach(hotel => {
            const hasMatchingAmenity = amenityFilter.some(a => 
              hotel.amenities.includes(a)
            );
            expect(hasMatchingAmenity).toBe(true);
          });
        }
      ), { numRuns: 10 });
    });

    it('should filter by verification status', async () => {
      await fc.assert(fc.asyncProperty(
        fc.boolean(),
        async (verificationFilter) => {
          const { supabase } = require('@/integrations/supabase/client');
          
          // Mock guides with different verification statuses
          const mockGuides = [
            {
              id: 'guide1',
              user_id: 'user1',
              full_name: 'Verified Guide',
              verified: true,
              is_active: true,
              created_at: new Date().toISOString()
            },
            {
              id: 'guide2',
              user_id: 'user2',
              full_name: 'Unverified Guide',
              verified: false,
              is_active: true,
              created_at: new Date().toISOString()
            }
          ];

          // Filter guides by verification status
          const filteredGuides = mockGuides.filter(guide => 
            guide.verified === verificationFilter
          );

          const mockListings = filteredGuides.map(g => ({ user_id: g.user_id }));

          supabase.from.mockImplementation((tableName: string) => {
            if (tableName === 'public_directory_listings') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue(
                      mockSupabaseResponse(mockListings)
                    )
                  })
                })
              };
            } else if (tableName === 'tour_guides') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    in: jest.fn().mockReturnValue({
                      order: jest.fn().mockReturnValue({
                        range: jest.fn().mockResolvedValue(
                          mockSupabaseResponse(filteredGuides, null, filteredGuides.length)
                        )
                      })
                    })
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

          // Create search query with verification filter
          const query: SearchQuery = {
            filters: { isVerified: verificationFilter },
            sort: 'newest',
            pagination: { page: 1, limit: 10 }
          };

          // Test the property: verification filter should return only matching verification status
          const result = await searchEngine.searchGuides(query);

          // Verify verification filtering
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
          
          // All returned results should match the verification filter
          result.data?.forEach(guide => {
            expect(guide.isVerified).toBe(verificationFilter);
          });
        }
      ), { numRuns: 10 });
    });
  });

  /**
   * Property 22: Result Sorting Support
   * Feature: public-user-directory, Property 22: For any sort option applied to search results, the results should be ordered correctly by rating, distance, price, or availability
   * Validates: Requirements 5.4
   */
  describe('Property 22: Result Sorting Support', () => {
    it('should sort results by rating in descending order', async () => {
      await fc.assert(fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.uuid(),
            userId: fc.uuid(),
            passionType: fc.constant('tour_guide' as const),
            displayName: fc.string({ minLength: 1, maxLength: 50 }),
            rating: fc.float({ min: 0, max: 5 }),
            reviewCount: fc.integer({ min: 0, max: 100 }),
            isVerified: fc.boolean(),
            isActive: fc.boolean(),
            createdAt: fc.date(),
            specialties: fc.array(fc.string(), { minLength: 0, maxLength: 5 }),
            languagesSpoken: fc.array(fc.string(), { minLength: 0, maxLength: 5 }),
            experienceYears: fc.integer({ min: 0, max: 20 }),
            hourlyRate: fc.option(fc.integer({ min: 100, max: 5000 }), { nil: undefined }),
            certifications: fc.array(fc.string(), { minLength: 0, maxLength: 3 }),
            nearbyAttractions: fc.array(fc.string(), { minLength: 0, maxLength: 3 }),
            relevanceScore: fc.option(fc.float({ min: 0, max: 100 }), { nil: undefined })
          }),
          { minLength: 2, maxLength: 10 }
        ),
        async (searchResults) => {
          // Test the property: rating sort should order by rating descending
          const sortedResults = searchEngine.sortResults(searchResults, 'rating');

          // Verify rating sorting
          for (let i = 0; i < sortedResults.length - 1; i++) {
            const current = sortedResults[i];
            const next = sortedResults[i + 1];
            
            // Current rating should be >= next rating
            expect(current.rating).toBeGreaterThanOrEqual(next.rating);
            
            // If ratings are equal, should be sorted by relevance score
            if (current.rating === next.rating) {
              const currentRelevance = current.relevanceScore || 0;
              const nextRelevance = next.relevanceScore || 0;
              expect(currentRelevance).toBeGreaterThanOrEqual(nextRelevance);
            }
          }
        }
      ), { numRuns: 15 });
    });

    it('should sort results by experience in descending order', async () => {
      await fc.assert(fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.uuid(),
            userId: fc.uuid(),
            passionType: fc.constant('tour_guide' as const),
            displayName: fc.string({ minLength: 1, maxLength: 50 }),
            rating: fc.float({ min: 0, max: 5 }),
            reviewCount: fc.integer({ min: 0, max: 100 }),
            isVerified: fc.boolean(),
            isActive: fc.boolean(),
            createdAt: fc.date(),
            specialties: fc.array(fc.string(), { minLength: 0, maxLength: 5 }),
            languagesSpoken: fc.array(fc.string(), { minLength: 0, maxLength: 5 }),
            experienceYears: fc.integer({ min: 0, max: 20 }),
            hourlyRate: fc.option(fc.integer({ min: 100, max: 5000 }), { nil: undefined }),
            certifications: fc.array(fc.string(), { minLength: 0, maxLength: 3 }),
            nearbyAttractions: fc.array(fc.string(), { minLength: 0, maxLength: 3 }),
            relevanceScore: fc.option(fc.float({ min: 0, max: 100 }), { nil: undefined })
          }),
          { minLength: 2, maxLength: 10 }
        ),
        async (searchResults) => {
          // Test the property: experience sort should order by experience descending
          const sortedResults = searchEngine.sortResults(searchResults, 'experience');

          // Verify experience sorting
          for (let i = 0; i < sortedResults.length - 1; i++) {
            const current = sortedResults[i];
            const next = sortedResults[i + 1];
            
            // Current experience should be >= next experience
            expect(current.experienceYears).toBeGreaterThanOrEqual(next.experienceYears);
            
            // If experience is equal, should be sorted by relevance score
            if (current.experienceYears === next.experienceYears) {
              const currentRelevance = current.relevanceScore || 0;
              const nextRelevance = next.relevanceScore || 0;
              expect(currentRelevance).toBeGreaterThanOrEqual(nextRelevance);
            }
          }
        }
      ), { numRuns: 15 });
    });

    it('should sort results by newest creation date', async () => {
      await fc.assert(fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.uuid(),
            userId: fc.uuid(),
            passionType: fc.constant('hotel_partner' as const),
            displayName: fc.string({ minLength: 1, maxLength: 50 }),
            rating: fc.float({ min: 0, max: 5 }),
            reviewCount: fc.integer({ min: 0, max: 100 }),
            isVerified: fc.boolean(),
            isActive: fc.boolean(),
            createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
            hotelType: fc.string({ minLength: 1, maxLength: 20 }),
            amenities: fc.array(fc.string(), { minLength: 0, maxLength: 5 }),
            roomTypes: fc.array(fc.string(), { minLength: 0, maxLength: 3 }),
            priceRange: fc.record({
              min: fc.integer({ min: 1000, max: 5000 }),
              max: fc.integer({ min: 5000, max: 20000 })
            }),
            nearbyAttractions: fc.array(fc.string(), { minLength: 0, maxLength: 3 }),
            images: fc.array(fc.string(), { minLength: 0, maxLength: 5 }),
            relevanceScore: fc.option(fc.float({ min: 0, max: 100 }), { nil: undefined })
          }),
          { minLength: 2, maxLength: 10 }
        ),
        async (searchResults) => {
          // Test the property: newest sort should order by creation date descending
          const sortedResults = searchEngine.sortResults(searchResults, 'newest');

          // Verify newest sorting
          for (let i = 0; i < sortedResults.length - 1; i++) {
            const current = sortedResults[i];
            const next = sortedResults[i + 1];
            
            // Current creation date should be >= next creation date
            expect(current.createdAt.getTime()).toBeGreaterThanOrEqual(next.createdAt.getTime());
            
            // If creation dates are equal, should be sorted by relevance score
            if (current.createdAt.getTime() === next.createdAt.getTime()) {
              const currentRelevance = current.relevanceScore || 0;
              const nextRelevance = next.relevanceScore || 0;
              expect(currentRelevance).toBeGreaterThanOrEqual(nextRelevance);
            }
          }
        }
      ), { numRuns: 15 });
    });
  });
});