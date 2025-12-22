/**
 * LocationMap Component - Real Maps Integration
 * 
 * Features:
 * - Secure API key management via Puter secrets
 * - Google Maps with real API keys
 * - OpenStreetMap fallback
 * - Navigate to Google Maps button
 * - Distance and travel time calculation
 * - Current location support
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Navigation, 
  MapPin, 
  Clock, 
  Route, 
  Loader2,
  ExternalLink,
  AlertCircle 
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Coordinates,
  getCurrentLocation,
  TravelMode,
  calculateDistance,
  calculateTravelTime,
  formatDistance,
  formatTravelTime
} from '@/lib/mapUtils';
import {
  getGoogleMapsEmbedUrl,
  getGoogleMapsDirectionsUrl,
  calculateRouteWithGoogle
} from '@/lib/realMaps';

interface LocationMapProps {
  coordinates: Coordinates;
  locationName: string;
  showNavigate?: boolean;
  showDistance?: boolean;
  height?: string;
  zoom?: number;
}

export default function LocationMap({
  coordinates,
  locationName,
  showNavigate = true,
  showDistance = true,
  height = '400px',
  zoom = 15
}: LocationMapProps) {
  const [mapUrl, setMapUrl] = useState<string>('');
  const [loadingMap, setLoadingMap] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [travelTime, setTravelTime] = useState<number | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<TravelMode>('driving');

  useEffect(() => {
    loadMap();
  }, [coordinates, zoom]);

  useEffect(() => {
    if (showDistance) {
      loadCurrentLocation();
    }
  }, [showDistance]);

  useEffect(() => {
    if (currentLocation && coordinates) {
      calculateRoute();
    }
  }, [currentLocation, coordinates, selectedMode]);

  const loadMap = async () => {
    setLoadingMap(true);
    try {
      const url = await getGoogleMapsEmbedUrl(coordinates, zoom);
      setMapUrl(url);
    } catch (error) {
      console.error('Error loading map:', error);
      // Fallback to OpenStreetMap
      const fallbackUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.longitude - 0.01},${coordinates.latitude - 0.01},${coordinates.longitude + 0.01},${coordinates.latitude + 0.01}&layer=mapnik&marker=${coordinates.latitude},${coordinates.longitude}`;
      setMapUrl(fallbackUrl);
    } finally {
      setLoadingMap(false);
    }
  };

  const loadCurrentLocation = async () => {
    setLoadingLocation(true);
    setLocationError(null);
    
    try {
      const location = await getCurrentLocation();
      setCurrentLocation(location);
    } catch (error: any) {
      setLocationError(error.message || 'Could not get your location');
      console.error('Location error:', error);
    } finally {
      setLoadingLocation(false);
    }
  };

  const calculateRoute = async () => {
    if (!currentLocation) return;

    try {
      const result = await calculateRouteWithGoogle(currentLocation, coordinates, selectedMode);
      
      if (result.success) {
        setDistance(result.distance);
        setTravelTime(result.duration);
      }
    } catch (error) {
      // Fallback to Haversine calculation
      const dist = calculateDistance(currentLocation, coordinates);
      const timeInfo = calculateTravelTime(dist, selectedMode);
      setDistance(dist);
      setTravelTime(timeInfo.totalMinutes);
    }
  };

  const handleNavigate = async () => {
    try {
      const url = await getGoogleMapsDirectionsUrl(coordinates, currentLocation || undefined, selectedMode);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      // Fallback to basic Google Maps URL
      const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${coordinates.latitude},${coordinates.longitude}`;
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card className="overflow-hidden">
      {/* Map Embed */}
      <div className="relative" style={{ height }}>
        {loadingMap ? (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <iframe
            src={mapUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            title={`Map of ${locationName}`}
            className="w-full h-full"
          />
        )}
        
        {/* Free Map Badge */}
        <div className="absolute top-2 left-2 z-10">
          <Badge variant="secondary" className="bg-white/90 backdrop-blur">
            <MapPin className="h-3 w-3 mr-1" />
            Real Maps (API Secured)
          </Badge>
        </div>
      </div>

      {/* Map Controls */}
      <div className="p-4 space-y-3 bg-muted/30">
        {/* Distance & Time Info */}
        {showDistance && (
          <div className="space-y-2">
            {loadingLocation ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Getting your location...</span>
              </div>
            ) : locationError ? (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {locationError}
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={loadCurrentLocation}
                    className="h-auto p-0 ml-2"
                  >
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            ) : distance !== null && travelTime !== null ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <Route className="h-4 w-4 text-primary" />
                  <div>
                    <div className="font-semibold">{formatDistance(distance)}</div>
                    <div className="text-xs text-muted-foreground">Distance</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-primary" />
                  <div>
                    <div className="font-semibold">
                      {typeof travelTime === 'number' 
                        ? `${Math.floor(travelTime / 60)}h ${travelTime % 60}m`
                        : travelTime}
                    </div>
                    <div className="text-xs text-muted-foreground">Est. Time</div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Travel Mode Selector */}
            {distance !== null && (
              <div className="flex gap-1">
                {(['driving', 'walking', 'transit', 'bicycling'] as TravelMode[]).map((mode) => (
                  <Button
                    key={mode}
                    variant={selectedMode === mode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedMode(mode)}
                    className="flex-1 text-xs capitalize"
                  >
                    {mode === 'driving' && '🚗'}
                    {mode === 'walking' && '🚶'}
                    {mode === 'transit' && '🚌'}
                    {mode === 'bicycling' && '🚴'}
                    <span className="ml-1 hidden sm:inline">{mode}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Navigate Button */}
        {showNavigate && (
          <Button 
            onClick={handleNavigate}
            variant="saffron"
            size="lg"
            className="w-full"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Navigate with Google Maps
            <ExternalLink className="h-3 w-3 ml-2" />
          </Button>
        )}

        {/* Info Note */}
        <p className="text-xs text-center text-muted-foreground">
          ✓ Secure API Keys • ✓ Real-time Navigation • ✓ Fallback Support
        </p>
      </div>
    </Card>
  );
}
