/**
 * Search Engine Service for Public User Directory System
 * Manages search, filtering, and discovery of service providers
 */

import { supabase } from '@/integrations/supabase/client';
import { GuideProfile, HotelProfile } from './directory.service';

// Type definitions for search functionality
export interface SearchQuery {
  text?: string;
  location?: {
    city?: string;
    state?: string;
    radius?: number;
    coordinates?: { lat: number; lng: number };
  };
  filters: SearchFilters;
  sort: SortOption;
  pagination: { page: number; limit: number };
}

export interface SearchFilters {
  // Common filters
  minRating?: number;
  maxDistance?: number;
  isVerified?: boolean;
  
  // Guide-specific filters
  languages?: string[];
  specialties?: string[];
  maxHourlyRate?: number;
  minExperience?: number;
  
  // Hotel-specific filters
  hotelTypes?: string[];
  amenities?: string[];
  priceRange?: { min: number; max: number };
}

export type SortOption = 
  | 'rating' 
  | 'distance' 
  | 'price-low' 
  | 'price-high' 
  | 'newest' 
  | 'experience'
  | 'popularity';

export interface GuideSearchResult extends GuideProfile {
  relevanceScore?: number;
  distance?: number;
}

export interface HotelSearchResult extends HotelProfile {
  relevanceScore?: number;
  distance?: number;
}

export type SearchResult = GuideSearchResult | HotelSearchResult;

export interface SearchResponse<T> {
  data?: T[];
  error?: string;
  success: boolean;
  totalCount?: number;
  page?: number;
  hasMore?: boolean;
}

/**
 * Search Engine Class
 * Handles search, filtering, and sorting of service provider profiles
 */
export class SearchEngine {

  /**
   * Search for tour guides with filtering and sorting
   * @param query - Search query with filters and pagination
   */
  async searchGuides(query: SearchQuery): Promise<SearchResponse<GuideSearchResult>> {
    try {
      // Start with base query for visible listings
      let dbQuery = supabase
        .from('tour_guides')
        .select('*', { count: 'exact' });

      // Apply text search if provided
      if (query.text && query.text.trim() !== '') {
        const searchText = query.text.toLowerCase().trim();
        dbQuery = dbQuery.or(
          `full_name.ilike.%${searchText}%,` +
          `bio.ilike.%${searchText}%,` +
          `company_name.ilike.%${searchText}%,` +
          `specialties.cs.{${searchText}}`
        );
      }

      // Apply location filters
      if (query.location?.city) {
        dbQuery = dbQuery.ilike('city', `%${query.location.city}%`);
      }
      if (query.location?.state) {
        dbQuery = dbQuery.ilike('state', `%${query.location.state}%`);
      }

      // Apply guide-specific filters
      if (query.filters.specialties && query.filters.specialties.length > 0) {
        dbQuery = dbQuery.overlaps('specialties', query.filters.specialties);
      }

      if (query.filters.languages && query.filters.languages.length > 0) {
        dbQuery = dbQuery.overlaps('languages_spoken', query.filters.languages);
      }

      if (query.filters.maxHourlyRate !== undefined) {
        dbQuery = dbQuery.lte('hourly_rate', query.filters.maxHourlyRate);
      }

      if (query.filters.minExperience !== undefined) {
        dbQuery = dbQuery.gte('experience_years', query.filters.minExperience);
      }

      if (query.filters.isVerified !== undefined) {
        dbQuery = dbQuery.eq('verified', query.filters.isVerified);
      }

      // Check if guides have visible directory listings
      const { data: visibleListings } = await supabase
        .from('public_directory_listings')
        .select('user_id')
        .eq('passion_type', 'tour_guide')
        .eq('is_visible', true);

      if (visibleListings && visibleListings.length > 0) {
        const visibleUserIds = visibleListings.map(l => l.user_id);
        dbQuery = dbQuery.in('user_id', visibleUserIds);
      } else {
        // No visible listings, return empty results
        return {
          success: true,
          data: [],
          totalCount: 0,
          page: query.pagination.page,
          hasMore: false
        };
      }

      // Apply sorting
      dbQuery = this.applySortingToQuery(dbQuery, query.sort, 'guide');

      // Apply pagination
      const offset = (query.pagination.page - 1) * query.pagination.limit;
      dbQuery = dbQuery.range(offset, offset + query.pagination.limit - 1);

      // Execute query
      const { data, error, count } = await dbQuery;

      if (error) {
        return { success: false, error: error.message };
      }

      // Transform to GuideSearchResult format with relevance scoring
      const results: GuideSearchResult[] = (data || []).map(guide => {
        const relevanceScore = this.calculateRelevanceScore(guide, query);
        return {
          id: guide.id,
          userId: guide.user_id,
          passionType: 'tour_guide' as const,
          displayName: guide.full_name || guide.company_name || '',
          bio: guide.bio,
          location: {
            city: guide.city,
            state: guide.state
          },
          contactInfo: {
            phone: guide.phone,
            email: guide.email,
            website: guide.website
          },
          isVerified: guide.verified || false,
          isActive: guide.is_active !== false,
          createdAt: new Date(guide.created_at),
          specialties: guide.specialties || [],
          languagesSpoken: guide.languages_spoken || [],
          experienceYears: guide.experience_years || 0,
          hourlyRate: guide.hourly_rate,
          certifications: guide.certifications || [],
          nearbyAttractions: [],
          rating: 0, // TODO: Calculate from reviews
          reviewCount: 0, // TODO: Calculate from reviews
          relevanceScore
        };
      });

      return {
        success: true,
        data: results,
        totalCount: count || 0,
        page: query.pagination.page,
        hasMore: count ? offset + query.pagination.limit < count : false
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to search guides'
      };
    }
  }

  /**
   * Search for hotels with filtering and sorting
   * @param query - Search query with filters and pagination
   */
  async searchHotels(query: SearchQuery): Promise<SearchResponse<HotelSearchResult>> {
    try {
      // Start with base query for visible listings
      let dbQuery = supabase
        .from('hotel_partners')
        .select('*', { count: 'exact' });

      // Apply text search if provided
      if (query.text && query.text.trim() !== '') {
        const searchText = query.text.toLowerCase().trim();
        dbQuery = dbQuery.or(
          `company_name.ilike.%${searchText}%,` +
          `bio.ilike.%${searchText}%,` +
          `hotel_type.ilike.%${searchText}%,` +
          `amenities.cs.{${searchText}}`
        );
      }

      // Apply location filters
      if (query.location?.city) {
        dbQuery = dbQuery.ilike('city', `%${query.location.city}%`);
      }
      if (query.location?.state) {
        dbQuery = dbQuery.ilike('state', `%${query.location.state}%`);
      }

      // Apply hotel-specific filters
      if (query.filters.hotelTypes && query.filters.hotelTypes.length > 0) {
        dbQuery = dbQuery.in('hotel_type', query.filters.hotelTypes);
      }

      if (query.filters.amenities && query.filters.amenities.length > 0) {
        dbQuery = dbQuery.overlaps('amenities', query.filters.amenities);
      }

      if (query.filters.isVerified !== undefined) {
        dbQuery = dbQuery.eq('is_verified', query.filters.isVerified);
      }

      // Check if hotels have visible directory listings
      const { data: visibleListings } = await supabase
        .from('public_directory_listings')
        .select('user_id')
        .eq('passion_type', 'hotel_partner')
        .eq('is_visible', true);

      if (visibleListings && visibleListings.length > 0) {
        const visibleUserIds = visibleListings.map(l => l.user_id);
        dbQuery = dbQuery.in('user_id', visibleUserIds);
      } else {
        // No visible listings, return empty results
        return {
          success: true,
          data: [],
          totalCount: 0,
          page: query.pagination.page,
          hasMore: false
        };
      }

      // Apply sorting
      dbQuery = this.applySortingToQuery(dbQuery, query.sort, 'hotel');

      // Apply pagination
      const offset = (query.pagination.page - 1) * query.pagination.limit;
      dbQuery = dbQuery.range(offset, offset + query.pagination.limit - 1);

      // Execute query
      const { data, error, count } = await dbQuery;

      if (error) {
        return { success: false, error: error.message };
      }

      // Transform to HotelSearchResult format with relevance scoring
      const results: HotelSearchResult[] = (data || []).map(hotel => {
        const relevanceScore = this.calculateRelevanceScore(hotel, query);
        return {
          id: hotel.id,
          userId: hotel.user_id,
          passionType: 'hotel_partner' as const,
          displayName: hotel.company_name || '',
          bio: hotel.bio,
          location: {
            city: hotel.city,
            state: hotel.state
          },
          contactInfo: {
            phone: hotel.phone,
            email: hotel.email,
            website: hotel.website
          },
          isVerified: hotel.is_verified || false,
          isActive: hotel.is_active !== false,
          createdAt: new Date(hotel.created_at),
          hotelType: hotel.hotel_type || '',
          amenities: hotel.amenities || [],
          roomTypes: [],
          priceRange: { min: 0, max: 0 }, // TODO: Add price range to schema
          nearbyAttractions: [],
          images: [],
          rating: 0, // TODO: Calculate from reviews
          reviewCount: 0, // TODO: Calculate from reviews
          relevanceScore
        };
      });

      return {
        success: true,
        data: results,
        totalCount: count || 0,
        page: query.pagination.page,
        hasMore: count ? offset + query.pagination.limit < count : false
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to search hotels'
      };
    }
  }

  /**
   * Apply filters to search results (client-side filtering)
   * @param results - Search results to filter
   * @param filters - Filters to apply
   */
  applyFilters(results: SearchResult[], filters: SearchFilters): SearchResult[] {
    let filtered = [...results];

    // Apply common filters
    if (filters.minRating !== undefined) {
      filtered = filtered.filter(r => r.rating >= filters.minRating!);
    }

    if (filters.maxDistance !== undefined && filters.maxDistance > 0) {
      filtered = filtered.filter(r => !r.distance || r.distance <= filters.maxDistance!);
    }

    if (filters.isVerified !== undefined) {
      filtered = filtered.filter(r => r.isVerified === filters.isVerified);
    }

    // Apply guide-specific filters
    if ('specialties' in results[0]) {
      if (filters.specialties && filters.specialties.length > 0) {
        filtered = filtered.filter(r => {
          const guide = r as GuideSearchResult;
          return filters.specialties!.some(s => guide.specialties?.includes(s));
        });
      }

      if (filters.languages && filters.languages.length > 0) {
        filtered = filtered.filter(r => {
          const guide = r as GuideSearchResult;
          return filters.languages!.some(l => guide.languagesSpoken?.includes(l));
        });
      }

      if (filters.maxHourlyRate !== undefined) {
        filtered = filtered.filter(r => {
          const guide = r as GuideSearchResult;
          return !guide.hourlyRate || guide.hourlyRate <= filters.maxHourlyRate!;
        });
      }

      if (filters.minExperience !== undefined) {
        filtered = filtered.filter(r => {
          const guide = r as GuideSearchResult;
          return guide.experienceYears >= filters.minExperience!;
        });
      }
    }

    // Apply hotel-specific filters
    if ('hotelType' in results[0]) {
      if (filters.hotelTypes && filters.hotelTypes.length > 0) {
        filtered = filtered.filter(r => {
          const hotel = r as HotelSearchResult;
          return filters.hotelTypes!.includes(hotel.hotelType);
        });
      }

      if (filters.amenities && filters.amenities.length > 0) {
        filtered = filtered.filter(r => {
          const hotel = r as HotelSearchResult;
          return filters.amenities!.some(a => hotel.amenities?.includes(a));
        });
      }

      if (filters.priceRange) {
        filtered = filtered.filter(r => {
          const hotel = r as HotelSearchResult;
          return hotel.priceRange.min >= filters.priceRange!.min &&
                 hotel.priceRange.max <= filters.priceRange!.max;
        });
      }
    }

    return filtered;
  }

  /**
   * Sort search results with enhanced ranking
   * @param results - Search results to sort
   * @param sortOption - Sort option to apply
   */
  sortResults(results: SearchResult[], sortOption: SortOption): SearchResult[] {
    const sorted = [...results];

    switch (sortOption) {
      case 'rating':
        return sorted.sort((a, b) => {
          // Primary sort by rating, secondary by relevance
          const ratingDiff = b.rating - a.rating;
          if (ratingDiff !== 0) return ratingDiff;
          return (b.relevanceScore || 0) - (a.relevanceScore || 0);
        });
      
      case 'distance':
        return sorted.sort((a, b) => {
          const distA = a.distance || Infinity;
          const distB = b.distance || Infinity;
          const distDiff = distA - distB;
          if (distDiff !== 0) return distDiff;
          return (b.relevanceScore || 0) - (a.relevanceScore || 0);
        });
      
      case 'price-low':
        return sorted.sort((a, b) => {
          const priceA = 'hourlyRate' in a ? (a.hourlyRate || Infinity) : 
                        ('priceRange' in a ? a.priceRange.min : Infinity);
          const priceB = 'hourlyRate' in b ? (b.hourlyRate || Infinity) : 
                        ('priceRange' in b ? b.priceRange.min : Infinity);
          const priceDiff = priceA - priceB;
          if (priceDiff !== 0) return priceDiff;
          return (b.relevanceScore || 0) - (a.relevanceScore || 0);
        });
      
      case 'price-high':
        return sorted.sort((a, b) => {
          const priceA = 'hourlyRate' in a ? (a.hourlyRate || 0) : 
                        ('priceRange' in a ? a.priceRange.max : 0);
          const priceB = 'hourlyRate' in b ? (b.hourlyRate || 0) : 
                        ('priceRange' in b ? b.priceRange.max : 0);
          const priceDiff = priceB - priceA;
          if (priceDiff !== 0) return priceDiff;
          return (b.relevanceScore || 0) - (a.relevanceScore || 0);
        });
      
      case 'newest':
        return sorted.sort((a, b) => {
          const timeDiff = b.createdAt.getTime() - a.createdAt.getTime();
          if (timeDiff !== 0) return timeDiff;
          return (b.relevanceScore || 0) - (a.relevanceScore || 0);
        });
      
      case 'experience':
        return sorted.sort((a, b) => {
          const expA = 'experienceYears' in a ? a.experienceYears : 0;
          const expB = 'experienceYears' in b ? b.experienceYears : 0;
          const expDiff = expB - expA;
          if (expDiff !== 0) return expDiff;
          return (b.relevanceScore || 0) - (a.relevanceScore || 0);
        });
      
      case 'popularity':
        return sorted.sort((a, b) => {
          const popDiff = b.reviewCount - a.reviewCount;
          if (popDiff !== 0) return popDiff;
          return (b.relevanceScore || 0) - (a.relevanceScore || 0);
        });
      
      default:
        // Default sort by relevance score
        return sorted.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    }
  }

  /**
   * Get search suggestions based on partial query
   * @param partialQuery - Partial search text
   */
  async getSuggestions(partialQuery: string): Promise<SearchResponse<string>> {
    try {
      if (!partialQuery || partialQuery.trim().length < 2) {
        return { success: true, data: [] };
      }

      const searchText = partialQuery.toLowerCase().trim();
      const suggestions = new Set<string>();

      // Get suggestions from tour guides
      const { data: guides } = await supabase
        .from('tour_guides')
        .select('full_name, company_name, city, state, specialties')
        .or(
          `full_name.ilike.%${searchText}%,` +
          `company_name.ilike.%${searchText}%,` +
          `city.ilike.%${searchText}%,` +
          `state.ilike.%${searchText}%`
        )
        .limit(10);

      if (guides) {
        guides.forEach(guide => {
          if (guide.full_name?.toLowerCase().includes(searchText)) {
            suggestions.add(guide.full_name);
          }
          if (guide.company_name?.toLowerCase().includes(searchText)) {
            suggestions.add(guide.company_name);
          }
          if (guide.city?.toLowerCase().includes(searchText)) {
            suggestions.add(guide.city);
          }
          if (guide.state?.toLowerCase().includes(searchText)) {
            suggestions.add(guide.state);
          }
          guide.specialties?.forEach((s: string) => {
            if (s.toLowerCase().includes(searchText)) {
              suggestions.add(s);
            }
          });
        });
      }

      // Get suggestions from hotels
      const { data: hotels } = await supabase
        .from('hotel_partners')
        .select('company_name, city, state, hotel_type, amenities')
        .or(
          `company_name.ilike.%${searchText}%,` +
          `city.ilike.%${searchText}%,` +
          `state.ilike.%${searchText}%,` +
          `hotel_type.ilike.%${searchText}%`
        )
        .limit(10);

      if (hotels) {
        hotels.forEach(hotel => {
          if (hotel.company_name?.toLowerCase().includes(searchText)) {
            suggestions.add(hotel.company_name);
          }
          if (hotel.city?.toLowerCase().includes(searchText)) {
            suggestions.add(hotel.city);
          }
          if (hotel.state?.toLowerCase().includes(searchText)) {
            suggestions.add(hotel.state);
          }
          if (hotel.hotel_type?.toLowerCase().includes(searchText)) {
            suggestions.add(hotel.hotel_type);
          }
          hotel.amenities?.forEach((a: string) => {
            if (a.toLowerCase().includes(searchText)) {
              suggestions.add(a);
            }
          });
        });
      }

      return {
        success: true,
        data: Array.from(suggestions).slice(0, 10)
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get suggestions'
      };
    }
  }

  /**
   * Get popular search terms
   */
  async getPopularSearches(): Promise<SearchResponse<string>> {
    try {
      // For now, return common search terms
      // In production, this would be based on actual search analytics
      const popularSearches = [
        'Delhi',
        'Mumbai',
        'Goa',
        'Jaipur',
        'Historical Tours',
        'Adventure Tours',
        'Beach Resort',
        'Heritage Hotel',
        'Wildlife Tours',
        'Cultural Tours'
      ];

      return {
        success: true,
        data: popularSearches
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get popular searches'
      };
    }
  }

  /**
   * Calculate relevance score for search results
   * @param profile - Profile data from database
   * @param query - Search query
   */
  private calculateRelevanceScore(profile: any, query: SearchQuery): number {
    let score = 0;

    // Base score for verified profiles
    if (profile.verified || profile.is_verified) {
      score += 10;
    }

    // Text match scoring
    if (query.text && query.text.trim() !== '') {
      const searchText = query.text.toLowerCase();
      
      // Exact name match gets highest score
      if (profile.full_name?.toLowerCase().includes(searchText) || 
          profile.company_name?.toLowerCase().includes(searchText)) {
        score += 20;
      }

      // Bio match gets medium score
      if (profile.bio?.toLowerCase().includes(searchText)) {
        score += 10;
      }

      // Specialty/amenity match gets good score
      const searchableArrays = [
        ...(profile.specialties || []),
        ...(profile.amenities || []),
        ...(profile.languages_spoken || [])
      ];
      
      if (searchableArrays.some(item => 
        item.toLowerCase().includes(searchText))) {
        score += 15;
      }
    }

    // Location match scoring
    if (query.location?.city && 
        profile.city?.toLowerCase().includes(query.location.city.toLowerCase())) {
      score += 15;
    }

    if (query.location?.state && 
        profile.state?.toLowerCase().includes(query.location.state.toLowerCase())) {
      score += 10;
    }

    // Experience bonus for guides
    if (profile.experience_years) {
      score += Math.min(profile.experience_years, 10); // Cap at 10 points
    }

    // Recency bonus (newer profiles get slight boost)
    const daysSinceCreation = (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation < 30) {
      score += 5;
    } else if (daysSinceCreation < 90) {
      score += 2;
    }

    return score;
  }

  /**
   * Private helper to apply sorting to database query
   * @param query - Supabase query builder
   * @param sortOption - Sort option to apply
   * @param type - Type of profile (guide or hotel)
   */
  private applySortingToQuery(query: any, sortOption: SortOption, type: 'guide' | 'hotel'): any {
    switch (sortOption) {
      case 'rating':
        // TODO: Add rating column or calculate from reviews
        return query.order('created_at', { ascending: false });
      
      case 'newest':
        return query.order('created_at', { ascending: false });
      
      case 'experience':
        if (type === 'guide') {
          return query.order('experience_years', { ascending: false });
        }
        return query.order('created_at', { ascending: false });
      
      case 'price-low':
        if (type === 'guide') {
          return query.order('hourly_rate', { ascending: true, nullsFirst: false });
        }
        return query.order('created_at', { ascending: false });
      
      case 'price-high':
        if (type === 'guide') {
          return query.order('hourly_rate', { ascending: false, nullsFirst: false });
        }
        return query.order('created_at', { ascending: false });
      
      case 'popularity':
        // TODO: Add popularity metric or review count
        return query.order('created_at', { ascending: false });
      
      default:
        return query.order('created_at', { ascending: false });
    }
  }
}

// Export singleton instance
export const searchEngine = new SearchEngine();

// Export default
export default searchEngine;
