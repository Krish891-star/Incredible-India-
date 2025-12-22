/**
 * Map & Navigation Utilities - API-Free Implementation
 * 
 * This module provides cost-free map and navigation features without paid APIs:
 * - Haversine formula for distance calculation
 * - Travel time estimation based on mode of transport
 * - OpenStreetMap integration
 * - Google Maps navigation links
 * 
 * No external API keys required!
 */

/**
 * Coordinates interface
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Travel mode options
 */
export type TravelMode = 'driving' | 'walking' | 'transit' | 'bicycling';

/**
 * Average speeds for different travel modes (km/h)
 */
const AVERAGE_SPEEDS: Record<TravelMode, number> = {
  driving: 50,      // Average city driving speed
  walking: 5,       // Average walking speed
  transit: 35,      // Average public transport speed
  bicycling: 15     // Average cycling speed
};

/**
 * Haversine Formula - Calculates distance between two coordinates
 * 
 * This is a well-established mathematical formula that calculates the
 * great-circle distance between two points on a sphere given their
 * longitudes and latitudes.
 * 
 * @param from Starting coordinates
 * @param to Destination coordinates
 * @returns Distance in kilometers
 */
export function calculateDistance(from: Coordinates, to: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  
  // Convert degrees to radians
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLon = toRadians(to.longitude - from.longitude);
  
  // Haversine formula
  const a = 
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculates estimated travel time based on distance and mode
 * 
 * @param distanceKm Distance in kilometers
 * @param mode Travel mode
 * @returns Object with hours and minutes
 */
export function calculateTravelTime(
  distanceKm: number, 
  mode: TravelMode = 'driving'
): { hours: number; minutes: number; totalMinutes: number } {
  const speed = AVERAGE_SPEEDS[mode];
  const hours = distanceKm / speed;
  const totalMinutes = Math.round(hours * 60);
  
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
    totalMinutes
  };
}

/**
 * Formats distance for display
 * 
 * @param distanceKm Distance in kilometers
 * @returns Formatted string (e.g., "5.2 km" or "850 m")
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Formats travel time for display
 * 
 * @param time Travel time object
 * @returns Formatted string (e.g., "2 hours 30 mins" or "45 mins")
 */
export function formatTravelTime(time: { hours: number; minutes: number }): string {
  if (time.hours === 0) {
    return `${time.minutes} min${time.minutes !== 1 ? 's' : ''}`;
  }
  
  if (time.minutes === 0) {
    return `${time.hours} hour${time.hours !== 1 ? 's' : ''}`;
  }
  
  return `${time.hours} hour${time.hours !== 1 ? 's' : ''} ${time.minutes} min${time.minutes !== 1 ? 's' : ''}`;
}

/**
 * Generates Google Maps navigation URL
 * Opens Google Maps with prefilled coordinates for turn-by-turn navigation
 * 
 * @param destination Destination coordinates
 * @param origin Optional origin coordinates (uses current location if not provided)
 * @param mode Travel mode
 * @returns Google Maps URL
 */
export function getGoogleMapsNavigationUrl(
  destination: Coordinates,
  origin?: Coordinates,
  mode: TravelMode = 'driving'
): string {
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
}

/**
 * Generates OpenStreetMap embed URL for iframe
 * 
 * @param coordinates Location coordinates
 * @param zoom Zoom level (1-20, default 15)
 * @returns OSM embed URL
 */
export function getOpenStreetMapEmbedUrl(
  coordinates: Coordinates,
  zoom: number = 15
): string {
  // Using OpenStreetMap with Leaflet
  return `https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.longitude - 0.01},${coordinates.latitude - 0.01},${coordinates.longitude + 0.01},${coordinates.latitude + 0.01}&layer=mapnik&marker=${coordinates.latitude},${coordinates.longitude}`;
}

/**
 * Generates a static map URL from OpenStreetMap
 * 
 * @param coordinates Location coordinates
 * @param zoom Zoom level
 * @param width Image width
 * @param height Image height
 * @returns Static map image URL
 */
export function getStaticMapUrl(
  coordinates: Coordinates,
  zoom: number = 15,
  width: number = 600,
  height: number = 400
): string {
  // Using StaticMap service (free alternative)
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${coordinates.latitude},${coordinates.longitude}&zoom=${zoom}&size=${width}x${height}&maptype=mapnik&markers=${coordinates.latitude},${coordinates.longitude},red-pushpin`;
}

/**
 * Opens Google Maps in new tab for navigation
 * 
 * @param destination Destination coordinates
 * @param origin Optional origin coordinates
 * @param mode Travel mode
 */
export function navigateToGoogleMaps(
  destination: Coordinates,
  origin?: Coordinates,
  mode: TravelMode = 'driving'
): void {
  const url = getGoogleMapsNavigationUrl(destination, origin, mode);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Gets user's current location using browser Geolocation API (free)
 * 
 * @returns Promise with current coordinates
 */
export function getCurrentLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Calculates distance from user's current location to destination
 * 
 * @param destination Destination coordinates
 * @returns Promise with distance and travel time
 */
export async function getDistanceFromCurrentLocation(
  destination: Coordinates,
  mode: TravelMode = 'driving'
): Promise<{
  distance: number;
  distanceFormatted: string;
  travelTime: { hours: number; minutes: number; totalMinutes: number };
  travelTimeFormatted: string;
}> {
  try {
    const origin = await getCurrentLocation();
    const distance = calculateDistance(origin, destination);
    const travelTime = calculateTravelTime(distance, mode);
    
    return {
      distance,
      distanceFormatted: formatDistance(distance),
      travelTime,
      travelTimeFormatted: formatTravelTime(travelTime)
    };
  } catch (error) {
    throw new Error('Could not get current location');
  }
}

/**
 * Helper function to convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Helper function to convert radians to degrees
 */
export function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Validates coordinates
 */
export function isValidCoordinates(coords: Coordinates): boolean {
  return (
    coords.latitude >= -90 &&
    coords.latitude <= 90 &&
    coords.longitude >= -180 &&
    coords.longitude <= 180
  );
}

/**
 * PRODUCTION INTEGRATION NOTES:
 * 
 * This implementation is completely free and production-ready!
 * 
 * For enhanced features with paid APIs:
 * 
 * 1. Google Maps Directions API:
 *    - Real-time traffic data
 *    - Multiple route options
 *    - Accurate travel times
 *    - Alternative routes
 * 
 * 2. Mapbox Directions API:
 *    - Beautiful custom maps
 *    - Offline navigation
 *    - Custom styling
 * 
 * 3. OpenRouteService (Free tier available):
 *    - Routing and directions
 *    - Isochrones
 *    - Matrix calculations
 * 
 * The current implementation provides excellent functionality
 * for most use cases without any costs!
 */
