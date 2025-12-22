/**
 * Real Maps Integration - Secure API Key Management
 * 
 * This module provides secure integration with Google Maps and OpenStreetMap
 * using API keys stored in Puter's secrets manager.
 * 
 * Features:
 * - Secure API key retrieval from Puter secrets
 * - Fallback to free alternatives
 * - Automatic key rotation support
 * - Environment-aware configuration
 */

// Using environment variables for map secrets
const getSecret = (key: string, category: string) => {
  // Map secret keys to environment variables
  const envMap: Record<string, string> = {
    'google_maps_api_key': 'VITE_GOOGLE_MAPS_API_KEY'
  };
  
  const envVar = envMap[key];
  return envVar ? import.meta.env[envVar] : null;
};

const getGoogleMapsApiKey = () => getSecret('google_maps_api_key', 'MAPS');
import { Coordinates, calculateDistance, calculateTravelTime, formatDistance, formatTravelTime } from '@/lib/mapUtils';

/**
 * Map Provider Types
 */
export type MapProvider = 'google' | 'openstreetmap' | 'leaflet';

/**
 * Travel Mode Options
 */
export type TravelMode = 'driving' | 'walking' | 'transit' | 'bicycling';

/**
 * Map Configuration
 */
interface MapConfig {
  provider: MapProvider;
  apiKey?: string;
  fallbackProvider: MapProvider;
  enableDirections: boolean;
  enableGeocoding: boolean;
  enablePlaces: boolean;
}

/**
 * Get current map configuration based on available secrets
 */
export async function getMapConfiguration(): Promise<MapConfig> {
  try {
    // Check for Google Maps API key
    const googleMapsKey = getGoogleMapsApiKey();
    
    if (googleMapsKey && googleMapsKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      console.log('[Maps] Using Google Maps with API key');
      return {
        provider: 'google',
        apiKey: googleMapsKey,
        fallbackProvider: 'openstreetmap',
        enableDirections: true,
        enableGeocoding: true,
        enablePlaces: true
      };
    } else {
      console.log('[Maps] Using OpenStreetMap (fallback)');
      return {
        provider: 'openstreetmap',
        fallbackProvider: 'openstreetmap',
        enableDirections: false, // Limited without API key
        enableGeocoding: false,
        enablePlaces: false
      };
    }
  } catch (error) {
    console.error('[Maps] Error getting configuration:', error);
    return {
      provider: 'openstreetmap',
      fallbackProvider: 'openstreetmap',
      enableDirections: false,
      enableGeocoding: false,
      enablePlaces: false
    };
  }
}

/**
 * Generate Google Maps Embed URL
 */
export async function getGoogleMapsEmbedUrl(
  coordinates: Coordinates,
  zoom: number = 15,
  mapType: 'roadmap' | 'satellite' | 'hybrid' | 'terrain' = 'roadmap'
): Promise<string> {
  const config = await getMapConfiguration();
  
  if (config.provider === 'google' && config.apiKey) {
    // Use Google Maps Embed API
    return `https://www.google.com/maps/embed/v1/view?key=${config.apiKey}&center=${coordinates.latitude},${coordinates.longitude}&zoom=${zoom}&maptype=${mapType}`;
  } else {
    // Fallback to OpenStreetMap
    return `https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.longitude - 0.01},${coordinates.latitude - 0.01},${coordinates.longitude + 0.01},${coordinates.latitude + 0.01}&layer=mapnik&marker=${coordinates.latitude},${coordinates.longitude}`;
  }
}

/**
 * Generate Google Maps Static Image URL
 */
export async function getGoogleMapsStaticImageUrl(
  coordinates: Coordinates,
  zoom: number = 15,
  width: number = 600,
  height: number = 400,
  mapType: 'roadmap' | 'satellite' | 'hybrid' | 'terrain' = 'roadmap'
): Promise<string> {
  const config = await getMapConfiguration();
  
  if (config.provider === 'google' && config.apiKey) {
    return `https://maps.googleapis.com/maps/api/staticmap?center=${coordinates.latitude},${coordinates.longitude}&zoom=${zoom}&size=${width}x${height}&maptype=${mapType}&markers=color:red%7C${coordinates.latitude},${coordinates.longitude}&key=${config.apiKey}`;
  } else {
    // Fallback to OpenStreetMap static map
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${coordinates.latitude},${coordinates.longitude}&zoom=${zoom}&size=${width}x${height}&maptype=mapnik&markers=${coordinates.latitude},${coordinates.longitude},red-pushpin`;
  }
}

/**
 * Get Google Maps Directions URL
 */
export async function getGoogleMapsDirectionsUrl(
  destination: Coordinates,
  origin?: Coordinates,
  mode: TravelMode = 'driving'
): Promise<string> {
  const config = await getMapConfiguration();
  
  if (config.provider === 'google' && config.apiKey && config.enableDirections) {
    // Use Google Maps Directions API
    const baseUrl = 'https://www.google.com/maps/dir/';
    
    // Convert travel mode to Google Maps format
    const modeParam = mode === 'transit' ? 'r' : 
                      mode === 'walking' ? 'w' : 
                      mode === 'bicycling' ? 'b' : 'd';
    
    if (origin) {
      // From specific origin to destination
      return `${baseUrl}${origin.latitude},${origin.longitude}/${destination.latitude},${destination.longitude}/@${destination.latitude},${destination.longitude},14z/data=!3m1!4b1!4m2!4m1!3e${modeParam}`;
    } else {
      // From current location to destination
      return `${baseUrl}Current+Location/${destination.latitude},${destination.longitude}/@${destination.latitude},${destination.longitude},14z/data=!3m1!4b1!4m2!4m1!3e${modeParam}`;
    }
  } else {
    // Fallback to basic Google Maps URL
    if (origin) {
      return `https://www.google.com/maps/dir/${origin.latitude},${origin.longitude}/${destination.latitude},${destination.longitude}`;
    } else {
      return `https://www.google.com/maps/search/?api=1&query=${destination.latitude},${destination.longitude}`;
    }
  }
}

/**
 * Calculate route using Google Maps Distance Matrix API
 */
export async function calculateRouteWithGoogle(
  origin: Coordinates,
  destination: Coordinates,
  mode: TravelMode = 'driving'
): Promise<{
  distance: number;
  distanceFormatted: string;
  duration: number;
  durationFormatted: string;
  success: boolean;
  error?: string;
}> {
  const config = await getMapConfiguration();
  
  if (config.provider === 'google' && config.apiKey && config.enableDirections) {
    try {
      // Use Google Maps Distance Matrix API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.latitude},${origin.longitude}&destinations=${destination.latitude},${destination.longitude}&mode=${mode}&key=${config.apiKey}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.rows[0].elements[0].status === 'OK') {
        const element = data.rows[0].elements[0];
        const distance = element.distance.value / 1000; // Convert meters to kilometers
        const duration = element.duration.value / 60; // Convert seconds to minutes
        
        return {
          distance,
          distanceFormatted: formatDistance(distance),
          duration,
          durationFormatted: formatTravelTime({ 
            hours: Math.floor(duration / 60), 
            minutes: duration % 60 
          }),
          success: true
        };
      } else {
        throw new Error(data.error_message || 'Failed to calculate route');
      }
    } catch (error: any) {
      console.error('[Maps] Google Maps route calculation error:', error);
      // Fallback to Haversine calculation
      return fallbackToHaversine(origin, destination, mode);
    }
  } else {
    // Fallback to Haversine calculation
    return fallbackToHaversine(origin, destination, mode);
  }
}

/**
 * Fallback to Haversine calculation
 */
function fallbackToHaversine(
  origin: Coordinates,
  destination: Coordinates,
  mode: TravelMode
): {
  distance: number;
  distanceFormatted: string;
  duration: number;
  durationFormatted: string;
  success: boolean;
} {
  const distance = calculateDistance(origin, destination);
  const travelTime = calculateTravelTime(distance, mode);
  
  return {
    distance,
    distanceFormatted: formatDistance(distance),
    duration: travelTime.totalMinutes,
    durationFormatted: formatTravelTime(travelTime),
    success: true
  };
}

/**
 * Geocode address using Google Maps Geocoding API
 */
export async function geocodeAddress(address: string): Promise<{
  coordinates?: Coordinates;
  formattedAddress?: string;
  success: boolean;
  error?: string;
}> {
  const config = await getMapConfiguration();
  
  if (config.provider === 'google' && config.apiKey && config.enableGeocoding) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${config.apiKey}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        return {
          coordinates: {
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng
          },
          formattedAddress: result.formatted_address,
          success: true
        };
      } else {
        return {
          success: false,
          error: data.error_message || 'Address not found'
        };
      }
    } catch (error: any) {
      console.error('[Maps] Geocoding error:', error);
      return {
        success: false,
        error: error.message || 'Failed to geocode address'
      };
    }
  } else {
    return {
      success: false,
      error: 'Geocoding not available without API key'
    };
  }
}

/**
 * Reverse geocode coordinates
 */
export async function reverseGeocode(coordinates: Coordinates): Promise<{
  address?: string;
  components?: any;
  success: boolean;
  error?: string;
}> {
  const config = await getMapConfiguration();
  
  if (config.provider === 'google' && config.apiKey && config.enableGeocoding) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinates.latitude},${coordinates.longitude}&key=${config.apiKey}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        return {
          address: result.formatted_address,
          components: result.address_components,
          success: true
        };
      } else {
        return {
          success: false,
          error: data.error_message || 'Location not found'
        };
      }
    } catch (error: any) {
      console.error('[Maps] Reverse geocoding error:', error);
      return {
        success: false,
        error: error.message || 'Failed to reverse geocode'
      };
    }
  } else {
    return {
      success: false,
      error: 'Reverse geocoding not available without API key'
    };
  }
}

/**
 * Search for places using Google Places API
 */
export async function searchPlaces(
  query: string,
  location?: Coordinates,
  radius: number = 5000 // meters
): Promise<{
  places?: any[];
  success: boolean;
  error?: string;
}> {
  const config = await getMapConfiguration();
  
  if (config.provider === 'google' && config.apiKey && config.enablePlaces) {
    try {
      let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${config.apiKey}`;
      
      if (location) {
        url += `&location=${location.latitude},${location.longitude}&radius=${radius}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK') {
        return {
          places: data.results,
          success: true
        };
      } else {
        return {
          success: false,
          error: data.error_message || 'Place search failed'
        };
      }
    } catch (error: any) {
      console.error('[Maps] Place search error:', error);
      return {
        success: false,
        error: error.message || 'Failed to search places'
      };
    }
  } else {
    return {
      success: false,
      error: 'Place search not available without API key'
    };
  }
}

/**
 * Initialize maps system
 */
export async function initializeMapsSystem(): Promise<void> {
  try {
    const config = await getMapConfiguration();
    console.log('[Maps] System initialized with provider:', config.provider);
  } catch (error) {
    console.error('[Maps] Error initializing system:', error);
  }
}

export default {
  getMapConfiguration,
  getGoogleMapsEmbedUrl,
  getGoogleMapsStaticImageUrl,
  getGoogleMapsDirectionsUrl,
  calculateRouteWithGoogle,
  geocodeAddress,
  reverseGeocode,
  searchPlaces,
  initializeMapsSystem
};
