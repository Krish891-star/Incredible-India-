/**
 * Custom React Hooks for Supabase Integration
 * Provides reactive data fetching and mutation hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  UserProfile, 
  State, 
  Attraction, 
  Hotel, 
  TourGuide, 
  HotelBooking, 
  GuideBooking,
  HotelReview,
  GuideReview,
  Itinerary,
  UserFavorite
} from '@/services/database.service';
import { AuthService } from '@/services/auth.service';
import { TourismData } from '@/data/tourism.data';

/**
 * Hook for user authentication state
 */
export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        setLoading(true);
        const response = await AuthService.getCurrentUser();
        
        if (response.success && response.data?.user) {
          setUser(response.data.user as UserProfile);
        } else {
          setUser(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const response = await AuthService.getCurrentUser();
          if (response.success && response.data?.user) {
            setUser(response.data.user as UserProfile);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading, error };
}

/**
 * Hook for fetching states
 */
export function useStates() {
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        setLoading(true);
        const response = await TourismData.getAllStates();
        
        if (response.success && response.data) {
          setStates(response.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch states');
      } finally {
        setLoading(false);
      }
    };

    fetchStates();
  }, []);

  return { states, loading, error, refetch: () => {} };
}

/**
 * Hook for fetching attractions
 */
export function useAttractions(filters?: { stateId?: string }) {
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttractions = async () => {
      try {
        setLoading(true);
        const response = await TourismData.getAllAttractions();
        
        if (response.success && response.data) {
          let filteredAttractions = response.data;
          
          if (filters?.stateId) {
            filteredAttractions = filteredAttractions.filter(
              attraction => attraction.state_id === filters.stateId
            );
          }
          
          setAttractions(filteredAttractions);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch attractions');
      } finally {
        setLoading(false);
      }
    };

    fetchAttractions();
  }, [filters?.stateId]);

  return { attractions, loading, error, refetch: () => {} };
}

/**
 * Hook for fetching hotels
 */
export function useHotels(filters?: { stateId?: string; verifiedOnly?: boolean }) {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true);
        const response = await TourismData.getAllHotels(!filters?.verifiedOnly);
        
        if (response.success && response.data) {
          let filteredHotels = response.data;
          
          if (filters?.stateId) {
            filteredHotels = filteredHotels.filter(
              hotel => hotel.state_id === filters.stateId
            );
          }
          
          setHotels(filteredHotels);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch hotels');
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [filters?.stateId, filters?.verifiedOnly]);

  return { hotels, loading, error, refetch: () => {} };
}

/**
 * Hook for fetching tour guides
 */
export function useTourGuides(filters?: { stateId?: string; verifiedOnly?: boolean }) {
  const [guides, setGuides] = useState<TourGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        setLoading(true);
        const response = await TourismData.getAllTourGuides(!filters?.verifiedOnly);
        
        if (response.success && response.data) {
          let filteredGuides = response.data;
          
          if (filters?.stateId) {
            filteredGuides = filteredGuides.filter(
              guide => guide.state_id === filters.stateId
            );
          }
          
          setGuides(filteredGuides);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tour guides');
      } finally {
        setLoading(false);
      }
    };

    fetchGuides();
  }, [filters?.stateId, filters?.verifiedOnly]);

  return { guides, loading, error, refetch: () => {} };
}

/**
 * Hook for user bookings
 */
export function useUserBookings(userId: string | null) {
  const [hotelBookings, setHotelBookings] = useState<HotelBooking[]>([]);
  const [guideBookings, setGuideBookings] = useState<GuideBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch hotel bookings
        const hotelResponse = await TourismData.getUserHotelBookings(userId);
        if (hotelResponse.success && hotelResponse.data) {
          setHotelBookings(hotelResponse.data);
        }
        
        // Fetch guide bookings
        const guideResponse = await TourismData.getUserGuideBookings(userId);
        if (guideResponse.success && guideResponse.data) {
          setGuideBookings(guideResponse.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [userId]);

  return { hotelBookings, guideBookings, loading, error, refetch: () => {} };
}

/**
 * Hook for user favorites
 */
export function useUserFavorites(userId: string | null) {
  const [favorites, setFavorites] = useState<UserFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await TourismData.getUserFavorites(userId);
        
        if (response.success && response.data) {
          setFavorites(response.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch favorites');
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [userId]);

  const toggleFavorite = useCallback(async (stateId: string) => {
    if (!userId) return false;

    try {
      // Check if already favorited
      const checkResponse = await TourismData.isStateFavorited(userId, stateId);
      
      if (checkResponse.success && checkResponse.data) {
        // Remove from favorites
        await TourismData.removeFromFavorites(userId, stateId);
        setFavorites(prev => prev.filter(fav => fav.state_id !== stateId));
      } else {
        // Add to favorites
        const response = await TourismData.addToFavorites({
          user_id: userId,
          state_id: stateId
        });
        
        if (response.success && response.data) {
          setFavorites(prev => [...prev, response.data!]);
        }
      }
      
      return true;
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      return false;
    }
  }, [userId]);

  return { favorites, loading, error, toggleFavorite, refetch: () => {} };
}

/**
 * Hook for item reviews
 */
export function useItemReviews(itemId: string, itemType: 'hotel' | 'guide') {
  const [reviews, setReviews] = useState<HotelReview[] | GuideReview[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        
        if (itemType === 'hotel') {
          const response = await TourismData.getHotelReviews(itemId);
          const avgResponse = await TourismData.getHotelAverageRating(itemId);
          
          if (response.success && response.data) {
            setReviews(response.data);
          }
          
          if (avgResponse.success && avgResponse.data !== undefined) {
            setAverageRating(avgResponse.data);
          }
        } else {
          const response = await TourismData.getGuideReviews(itemId);
          const avgResponse = await TourismData.getGuideAverageRating(itemId);
          
          if (response.success && response.data) {
            setReviews(response.data);
          }
          
          if (avgResponse.success && avgResponse.data !== undefined) {
            setAverageRating(avgResponse.data);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [itemId, itemType]);

  const addReview = useCallback(async (reviewData: any) => {
    try {
      let response;
      
      if (itemType === 'hotel') {
        response = await TourismData.saveHotelReview(reviewData);
      } else {
        response = await TourismData.saveGuideReview(reviewData);
      }
      
      if (response.success && response.data) {
        setReviews(prev => [response.data as any, ...prev]);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Failed to add review:', err);
      return false;
    }
  }, [itemId, itemType]);

  return { reviews, averageRating, loading, error, addReview, refetch: () => {} };
}

/**
 * Hook for user itineraries
 */
export function useUserItineraries(userId: string | null) {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItineraries = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await TourismData.getUserItineraries(userId);
        
        if (response.success && response.data) {
          setItineraries(response.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch itineraries');
      } finally {
        setLoading(false);
      }
    };

    fetchItineraries();
  }, [userId]);

  const saveItinerary = useCallback(async (itineraryData: Partial<Itinerary>) => {
    try {
      const response = await TourismData.saveItinerary(itineraryData);
      
      if (response.success && response.data) {
        setItineraries(prev => {
          const existingIndex = prev.findIndex(it => it.id === response.data!.id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = response.data!;
            return updated;
          }
          return [response.data!, ...prev];
        });
        return response.data;
      }
      
      return null;
    } catch (err) {
      console.error('Failed to save itinerary:', err);
      return null;
    }
  }, []);

  return { itineraries, loading, error, saveItinerary, refetch: () => {} };
}

export default {
  useAuth,
  useStates,
  useAttractions,
  useHotels,
  useTourGuides,
  useUserBookings,
  useUserFavorites,
  useItemReviews,
  useUserItineraries
};