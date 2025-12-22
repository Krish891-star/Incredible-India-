/**
 * Hotel Profile Card Component
 * Displays hotel information with all required fields
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Star, 
  Building2, 
  Wifi,
  Car,
  Coffee,
  Phone,
  Mail,
  Globe,
  CheckCircle,
  Camera,
  Bed,
  IndianRupee,
  Calendar
} from 'lucide-react';
import { HotelSearchResult } from '@/services/search.service';

interface HotelProfileCardProps {
  hotel: HotelSearchResult;
  variant?: 'grid' | 'list';
  showContactInfo?: boolean;
  onViewDetails: (hotelId: string) => void;
}

export default function HotelProfileCard({ 
  hotel, 
  variant = 'list', 
  showContactInfo = false,
  onViewDetails 
}: HotelProfileCardProps) {
  
  const renderVerificationBadge = () => {
    if (hotel.isVerified) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Verified Hotel
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Building2 className="h-3 w-3 mr-1" />
        Hotel Partner
      </Badge>
    );
  };

  const renderRatingStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <Star key="half" className="h-4 w-4 fill-yellow-400/50 text-yellow-400" />
      );
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
      );
    }
    
    return stars;
  };

  const renderContactInfo = () => {
    if (!showContactInfo) return null;

    return (
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        {hotel.contactInfo.phone && (
          <div className="flex items-center gap-1">
            <Phone className="h-4 w-4" />
            <span>{hotel.contactInfo.phone}</span>
          </div>
        )}
        {hotel.contactInfo.email && (
          <div className="flex items-center gap-1">
            <Mail className="h-4 w-4" />
            <span>{hotel.contactInfo.email}</span>
          </div>
        )}
        {hotel.contactInfo.website && (
          <div className="flex items-center gap-1">
            <Globe className="h-4 w-4" />
            <a 
              href={hotel.contactInfo.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary"
            >
              Website
            </a>
          </div>
        )}
      </div>
    );
  };

  const renderAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase();
    if (amenityLower.includes('wifi') || amenityLower.includes('internet')) {
      return <Wifi className="h-3 w-3" />;
    }
    if (amenityLower.includes('parking') || amenityLower.includes('car')) {
      return <Car className="h-3 w-3" />;
    }
    if (amenityLower.includes('restaurant') || amenityLower.includes('dining') || amenityLower.includes('food')) {
      return <Coffee className="h-3 w-3" />;
    }
    return <CheckCircle className="h-3 w-3" />;
  };

  const renderPriceRange = () => {
    if (hotel.priceRange && (hotel.priceRange.min > 0 || hotel.priceRange.max > 0)) {
      return (
        <div className="flex items-center gap-1 text-sm">
          <IndianRupee className="h-4 w-4 text-muted-foreground" />
          <span>
            ₹{hotel.priceRange.min.toLocaleString()} - ₹{hotel.priceRange.max.toLocaleString()}/night
          </span>
        </div>
      );
    }
    return null;
  };

  const renderRoomTypes = () => {
    if (hotel.roomTypes && hotel.roomTypes.length > 0) {
      return (
        <div className="flex items-center gap-1 text-sm">
          <Bed className="h-4 w-4 text-muted-foreground" />
          <span>
            {hotel.roomTypes.slice(0, 2).join(', ')}
            {hotel.roomTypes.length > 2 && ` +${hotel.roomTypes.length - 2}`}
          </span>
        </div>
      );
    }
    return null;
  };

  if (variant === 'grid') {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="aspect-video bg-muted flex items-center justify-center relative">
          {hotel.images && hotel.images.length > 0 ? (
            <img 
              src={hotel.images[0]} 
              alt={hotel.displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <Building2 className="h-12 w-12 text-muted-foreground" />
          )}
          {hotel.images && hotel.images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
              <Camera className="h-3 w-3" />
              {hotel.images.length}
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-lg line-clamp-1">{hotel.displayName}</h3>
              <p className="text-muted-foreground text-sm flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {hotel.location.city}, {hotel.location.state}
              </p>
            </div>
            {renderVerificationBadge()}
          </div>

          {/* Hotel Type */}
          {hotel.hotelType && (
            <div className="mb-2">
              <Badge variant="outline" className="text-xs">
                {hotel.hotelType}
              </Badge>
            </div>
          )}

          {/* Rating and Reviews */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              {renderRatingStars(hotel.rating)}
              <span className="text-sm font-medium ml-1">
                {hotel.rating > 0 ? hotel.rating.toFixed(1) : 'New'}
              </span>
            </div>
            {hotel.reviewCount > 0 && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">
                  {hotel.reviewCount} reviews
                </span>
              </>
            )}
          </div>

          {/* Price Range and Room Types */}
          <div className="space-y-2 mb-4">
            {renderPriceRange()}
            {renderRoomTypes()}
          </div>

          {/* Amenities */}
          {hotel.amenities && hotel.amenities.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {hotel.amenities.slice(0, 3).map((amenity, index) => (
                  <Badge key={index} variant="outline" className="text-xs flex items-center gap-1">
                    {renderAmenityIcon(amenity)}
                    {amenity}
                  </Badge>
                ))}
                {hotel.amenities.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{hotel.amenities.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Contact Info */}
          {renderContactInfo()}

          {/* Action Button */}
          <Button 
            onClick={() => onViewDetails(hotel.id)}
            className="w-full mt-4"
            variant="default"
          >
            View Details
          </Button>
        </CardContent>
      </Card>
    );
  }

  // List variant (default)
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/3">
          <div className="h-48 w-full bg-muted flex items-center justify-center relative">
            {hotel.images && hotel.images.length > 0 ? (
              <img 
                src={hotel.images[0]} 
                alt={hotel.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="h-12 w-12 text-muted-foreground" />
            )}
            {hotel.images && hotel.images.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                <Camera className="h-3 w-3" />
                {hotel.images.length}
              </div>
            )}
          </div>
        </div>
        <div className="md:w-2/3">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-xl font-display font-bold">{hotel.displayName}</h3>
                <p className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {hotel.location.city}, {hotel.location.state}
                </p>
                {hotel.hotelType && (
                  <Badge variant="outline" className="text-xs mt-1">
                    {hotel.hotelType}
                  </Badge>
                )}
              </div>
              {renderVerificationBadge()}
            </div>

            {/* Rating and Reviews */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1">
                {renderRatingStars(hotel.rating)}
                <span className="ml-1 font-medium">
                  {hotel.rating > 0 ? hotel.rating.toFixed(1) : 'New Hotel'}
                </span>
              </div>
              {hotel.reviewCount > 0 && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    {hotel.reviewCount} {hotel.reviewCount === 1 ? 'review' : 'reviews'}
                  </span>
                </>
              )}
            </div>

            {/* Bio */}
            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
              {hotel.bio || 'Experience comfort and hospitality at this well-appointed accommodation.'}
            </p>

            {/* Price Range and Room Information */}
            <div className="flex flex-wrap gap-4 mb-4 text-sm">
              {renderPriceRange()}
              {renderRoomTypes()}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Available for booking</span>
              </div>
            </div>

            {/* Amenities */}
            {hotel.amenities && hotel.amenities.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-1">Amenities:</p>
                <div className="flex flex-wrap gap-1">
                  {hotel.amenities.slice(0, 6).map((amenity, index) => (
                    <Badge key={index} variant="outline" className="text-xs flex items-center gap-1">
                      {renderAmenityIcon(amenity)}
                      {amenity}
                    </Badge>
                  ))}
                  {hotel.amenities.length > 6 && (
                    <Badge variant="outline" className="text-xs">
                      +{hotel.amenities.length - 6} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Contact and Action */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-4">
                {renderContactInfo()}
              </div>
              <Button 
                onClick={() => onViewDetails(hotel.id)}
                variant="default"
              >
                View Details & Book
              </Button>
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
}