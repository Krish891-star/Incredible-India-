/**
 * Tourism Data Access Layer
 * Provides simplified access to all tourism-related data entities
 */

import { 
  stateService, 
  attractionService, 
  hotelService, 
  tourGuideService, 
  bookingService, 
  reviewService, 
  itineraryService, 
  favoriteService, 
  savedGuideService,
  DatabaseResponse
} from '@/services/database.service';
import { State, Attraction, Hotel, TourGuide, HotelBooking, GuideBooking, HotelReview, GuideReview, Itinerary, AiItinerary, UserFavorite, SavedGuide } from '@/services/database.service';

/**
 * Tourism Data Access Layer
 * Simplified interface for accessing all tourism-related data
 */
export class TourismData {
  /**
   * STATE DATA ACCESS
   */
  
  // Get all states
  static async getAllStates(): Promise<DatabaseResponse<State[]>> {
    return stateService.getAllStates();
  }

  // Get state by ID
  static async getStateById(stateId: string): Promise<DatabaseResponse<State | null>> {
    return stateService.getStateById(stateId);
  }

  // Search states
  static async searchStates(query: string): Promise<DatabaseResponse<State[]>> {
    return stateService.searchStates(query);
  }

  /**
   * ATTRACTION DATA ACCESS
   */

  // Get all attractions
  static async getAllAttractions(): Promise<DatabaseResponse<Attraction[]>> {
    return attractionService.getAllAttractions();
  }

  // Get attractions by state
  static async getAttractionsByState(stateId: string): Promise<DatabaseResponse<Attraction[]>> {
    return attractionService.getAttractionsByState(stateId);
  }

  // Get attraction by ID
  static async getAttractionById(attractionId: string): Promise<DatabaseResponse<Attraction | null>> {
    return attractionService.getAttractionById(attractionId);
  }

  // Search attractions
  static async searchAttractions(query: string, filters?: { stateId?: string }): Promise<DatabaseResponse<Attraction[]>> {
    return attractionService.searchAttractions(query, filters);
  }

  /**
   * HOTEL DATA ACCESS
   */

  // Get all hotels
  static async getAllHotels(includeUnverified: boolean = false): Promise<DatabaseResponse<Hotel[]>> {
    return hotelService.getAllHotels(includeUnverified);
  }

  // Get hotel by ID
  static async getHotelById(hotelId: string): Promise<DatabaseResponse<Hotel | null>> {
    return hotelService.getHotelById(hotelId);
  }

  // Get hotels by state
  static async getHotelsByState(stateId: string, includeUnverified: boolean = false): Promise<DatabaseResponse<Hotel[]>> {
    return hotelService.getHotelsByState(stateId, includeUnverified);
  }

  // Search hotels
  static async searchHotels(query: string, filters?: { 
    stateId?: string; 
    city?: string; 
    minPrice?: number; 
    maxPrice?: number; 
    type?: string;
    rating?: number;
  }): Promise<DatabaseResponse<Hotel[]>> {
    return hotelService.searchHotels(query, filters);
  }

  // Create or update hotel
  static async saveHotel(hotelData: Partial<Hotel>): Promise<DatabaseResponse<Hotel>> {
    return hotelService.upsertHotel(hotelData);
  }

  // Update hotel verification status
  static async updateHotelVerification(hotelId: string, isVerified: boolean): Promise<DatabaseResponse<null>> {
    return hotelService.updateHotelVerification(hotelId, isVerified);
  }

  /**
   * TOUR GUIDE DATA ACCESS
   */

  // Get all tour guides
  static async getAllTourGuides(includeUnverified: boolean = false): Promise<DatabaseResponse<TourGuide[]>> {
    return tourGuideService.getAllTourGuides(includeUnverified);
  }

  // Get tour guide by ID
  static async getTourGuideById(guideId: string): Promise<DatabaseResponse<TourGuide | null>> {
    return tourGuideService.getTourGuideById(guideId);
  }

  // Get tour guides by state
  static async getTourGuidesByState(stateId: string, includeUnverified: boolean = false): Promise<DatabaseResponse<TourGuide[]>> {
    return tourGuideService.getTourGuidesByState(stateId, includeUnverified);
  }

  // Search tour guides
  static async searchTourGuides(query: string, filters?: { 
    stateId?: string; 
    city?: string; 
    language?: string;
    minRating?: number;
    maxPrice?: number;
  }): Promise<DatabaseResponse<TourGuide[]>> {
    return tourGuideService.searchTourGuides(query, filters);
  }

  // Create or update tour guide
  static async saveTourGuide(guideData: Partial<TourGuide>): Promise<DatabaseResponse<TourGuide>> {
    return tourGuideService.upsertTourGuide(guideData);
  }

  // Update tour guide verification status
  static async updateTourGuideVerification(guideId: string, verified: boolean): Promise<DatabaseResponse<null>> {
    return tourGuideService.updateTourGuideVerification(guideId, verified);
  }

  /**
   * BOOKING DATA ACCESS
   */

  // Get hotel booking by ID
  static async getHotelBookingById(bookingId: string): Promise<DatabaseResponse<HotelBooking | null>> {
    return bookingService.getHotelBookingById(bookingId);
  }

  // Get guide booking by ID
  static async getGuideBookingById(bookingId: string): Promise<DatabaseResponse<GuideBooking | null>> {
    return bookingService.getGuideBookingById(bookingId);
  }

  // Get user's hotel bookings
  static async getUserHotelBookings(userId: string): Promise<DatabaseResponse<HotelBooking[]>> {
    return bookingService.getUserHotelBookings(userId);
  }

  // Get user's guide bookings
  static async getUserGuideBookings(userId: string): Promise<DatabaseResponse<GuideBooking[]>> {
    return bookingService.getUserGuideBookings(userId);
  }

  // Create or update hotel booking
  static async saveHotelBooking(bookingData: Partial<HotelBooking>): Promise<DatabaseResponse<HotelBooking>> {
    return bookingService.upsertHotelBooking(bookingData);
  }

  // Create or update guide booking
  static async saveGuideBooking(bookingData: Partial<GuideBooking>): Promise<DatabaseResponse<GuideBooking>> {
    return bookingService.upsertGuideBooking(bookingData);
  }

  // Update booking status
  static async updateBookingStatus(bookingId: string, status: string, isHotelBooking: boolean): Promise<DatabaseResponse<null>> {
    return bookingService.updateBookingStatus(bookingId, status, isHotelBooking);
  }

  /**
   * REVIEW DATA ACCESS
   */

  // Get hotel reviews by hotel ID
  static async getHotelReviews(hotelId: string): Promise<DatabaseResponse<HotelReview[]>> {
    return reviewService.getHotelReviews(hotelId);
  }

  // Get guide reviews by guide ID
  static async getGuideReviews(guideId: string): Promise<DatabaseResponse<GuideReview[]>> {
    return reviewService.getGuideReviews(guideId);
  }

  // Create or update hotel review
  static async saveHotelReview(reviewData: Partial<HotelReview>): Promise<DatabaseResponse<HotelReview>> {
    return reviewService.upsertHotelReview(reviewData);
  }

  // Create or update guide review
  static async saveGuideReview(reviewData: Partial<GuideReview>): Promise<DatabaseResponse<GuideReview>> {
    return reviewService.upsertGuideReview(reviewData);
  }

  // Get average rating for hotel
  static async getHotelAverageRating(hotelId: string): Promise<DatabaseResponse<number>> {
    return reviewService.getHotelAverageRating(hotelId);
  }

  // Get average rating for guide
  static async getGuideAverageRating(guideId: string): Promise<DatabaseResponse<number>> {
    return reviewService.getGuideAverageRating(guideId);
  }

  /**
   * ITINERARY DATA ACCESS
   */

  // Get user itineraries
  static async getUserItineraries(userId: string): Promise<DatabaseResponse<Itinerary[]>> {
    return itineraryService.getUserItineraries(userId);
  }

  // Get AI-generated itineraries
  static async getUserAiItineraries(userId: string): Promise<DatabaseResponse<AiItinerary[]>> {
    return itineraryService.getUserAiItineraries(userId);
  }

  // Get itinerary by ID
  static async getItineraryById(itineraryId: string): Promise<DatabaseResponse<Itinerary | null>> {
    return itineraryService.getItineraryById(itineraryId);
  }

  // Create or update itinerary
  static async saveItinerary(itineraryData: Partial<Itinerary>): Promise<DatabaseResponse<Itinerary>> {
    return itineraryService.upsertItinerary(itineraryData);
  }

  // Create or update AI itinerary
  static async saveAiItinerary(itineraryData: Partial<AiItinerary>): Promise<DatabaseResponse<AiItinerary>> {
    return itineraryService.upsertAiItinerary(itineraryData);
  }

  /**
   * FAVORITE DATA ACCESS
   */

  // Get user favorites
  static async getUserFavorites(userId: string): Promise<DatabaseResponse<UserFavorite[]>> {
    return favoriteService.getUserFavorites(userId);
  }

  // Add to favorites
  static async addToFavorites(favoriteData: Partial<UserFavorite>): Promise<DatabaseResponse<UserFavorite>> {
    return favoriteService.addToFavorites(favoriteData);
  }

  // Remove from favorites
  static async removeFromFavorites(userId: string, stateId: string): Promise<DatabaseResponse<null>> {
    return favoriteService.removeFromFavorites(userId, stateId);
  }

  // Check if state is favorited
  static async isStateFavorited(userId: string, stateId: string): Promise<DatabaseResponse<boolean>> {
    return favoriteService.isStateFavorited(userId, stateId);
  }

  /**
   * SAVED GUIDES DATA ACCESS
   */

  // Get user saved guides
  static async getUserSavedGuides(userId: string): Promise<DatabaseResponse<SavedGuide[]>> {
    return savedGuideService.getUserSavedGuides(userId);
  }

  // Save guide
  static async saveGuide(savedGuideData: Partial<SavedGuide>): Promise<DatabaseResponse<SavedGuide>> {
    return savedGuideService.saveGuide(savedGuideData);
  }

  // Unsave guide
  static async unsaveGuide(userId: string, guideId: string): Promise<DatabaseResponse<null>> {
    return savedGuideService.unsaveGuide(userId, guideId);
  }
}

export default TourismData;