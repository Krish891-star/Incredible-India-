/**
 * Supabase Configuration
 * Centralized configuration for Supabase services
 */

// Environment variables
const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Check if environment variables are available
const isSupabaseEnvConfigured = SUPABASE_PROJECT_ID && SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY;

export const SUPABASE_CONFIG = {
  // Project settings
  PROJECT_ID: isSupabaseEnvConfigured ? SUPABASE_PROJECT_ID : null,
  PROJECT_URL: isSupabaseEnvConfigured ? SUPABASE_URL : null,
  PUBLIC_KEY: isSupabaseEnvConfigured ? SUPABASE_PUBLISHABLE_KEY : null,
  
  // Storage settings
  STORAGE: {
    BUCKETS: {
      PUBLIC: 'public',
      PRIVATE: 'private',
      UPLOADS: 'uploads',
      IMAGES: 'images',
      DOCUMENTS: 'documents'
    },
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_FILE_TYPES: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain'
    ]
  },
  
  // Auth settings
  AUTH: {
    SESSION_EXPIRY: 3600, // 1 hour
    REFRESH_THRESHOLD: 300, // 5 minutes
    PROVIDERS: {
      GOOGLE: 'google',
      GITHUB: 'github',
      TWITTER: 'twitter'
    }
  },
  
  // Database settings
  DATABASE: {
    SCHEMAS: {
      PUBLIC: 'public',
      AUTH: 'auth',
      STORAGE: 'storage'
    },
    TABLES: {
      PROFILES: 'profiles',
      STATES: 'states',
      ATTRACTIONS: 'attractions',
      HOTELS: 'hotels',
      TOUR_GUIDES: 'tour_guides',
      HOTEL_BOOKINGS: 'hotel_bookings',
      GUIDE_BOOKINGS: 'guide_bookings',
      HOTEL_REVIEWS: 'hotel_reviews',
      GUIDE_REVIEWS: 'guide_reviews',
      ITINERARIES: 'itineraries',
      AI_ITINERARIES: 'ai_itineraries',
      USER_FAVORITES: 'user_favorites',
      SAVED_GUIDES: 'saved_guides',
      CUISINES: 'cuisines',
      FESTIVALS: 'festivals',
      TRADITIONAL_CLOTHING: 'traditional_clothing',
      TRANSPORT_ROUTES: 'transport_routes',
      TRAVEL_HISTORY: 'travel_history'
    }
  }
};

// Storage paths
export const STORAGE_PATHS = {
  PROFILE_PHOTOS: 'profile_photos',
  HOTEL_IMAGES: 'hotel_images',
  ATTRACTION_IMAGES: 'attraction_images',
  GUIDE_PHOTOS: 'guide_photos',
  DOCUMENTS: 'documents',
  TEMP: 'temp'
};

// Role permissions
export const ROLE_PERMISSIONS = {
  ADMIN: [
    'manage_users',
    'manage_content',
    'manage_bookings',
    'manage_reviews',
    'view_analytics',
    'manage_settings'
  ],
  TOUR_GUIDE: [
    'manage_profile',
    'manage_availability',
    'view_bookings',
    'respond_to_reviews'
  ],
  HOTEL_PARTNER: [
    'manage_hotel',
    'manage_rooms',
    'view_bookings',
    'respond_to_reviews'
  ],
  TOURIST: [
    'manage_profile',
    'book_services',
    'write_reviews',
    'create_itineraries'
  ]
};

// Default values
export const DEFAULT_VALUES = {
  USER_ROLE: 'tourist',
  HOTEL_RATING: 0,
  GUIDE_RATING: 0,
  BOOKING_STATUS: 'pending',
  AVAILABILITY_STATUS: 'available'
};

// Validation rules
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50
};

// Error messages
export const ERROR_MESSAGES = {
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    USER_NOT_FOUND: 'User not found',
    EMAIL_IN_USE: 'Email already in use',
    WEAK_PASSWORD: 'Password is too weak',
    INVALID_PHONE: 'Invalid phone number'
  },
  DATABASE: {
    DUPLICATE_ENTRY: 'Entry already exists',
    FOREIGN_KEY_VIOLATION: 'Referenced record not found',
    NOT_NULL_VIOLATION: 'Required field is missing'
  },
  STORAGE: {
    FILE_TOO_LARGE: 'File is too large',
    INVALID_FILE_TYPE: 'Invalid file type',
    UPLOAD_FAILED: 'File upload failed'
  }
};

// Success messages
export const SUCCESS_MESSAGES = {
  AUTH: {
    SIGN_UP_SUCCESS: 'Account created successfully. Please check your email for verification.',
    SIGN_IN_SUCCESS: 'Signed in successfully',
    SIGN_OUT_SUCCESS: 'Signed out successfully',
    PASSWORD_RESET_SENT: 'Password reset email sent'
  },
  PROFILE: {
    UPDATED_SUCCESS: 'Profile updated successfully'
  },
  BOOKING: {
    CREATED_SUCCESS: 'Booking created successfully',
    UPDATED_SUCCESS: 'Booking updated successfully'
  },
  REVIEW: {
    CREATED_SUCCESS: 'Review submitted successfully'
  }
};

export default {
  SUPABASE_CONFIG,
  STORAGE_PATHS,
  ROLE_PERMISSIONS,
  DEFAULT_VALUES,
  VALIDATION_RULES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};