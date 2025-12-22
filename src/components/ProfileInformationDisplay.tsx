/**
 * Profile Information Display Component
 * Handles contact information display with privacy controls
 * Shows ratings, reviews, and verification status
 * Displays photos, certifications, and portfolio images
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  Star, 
  CheckCircle, 
  Award, 
  Camera, 
  User, 
  Shield,
  Eye,
  EyeOff,
  MessageSquare,
  Calendar,
  Clock,
  Languages,
  Briefcase,
  Building2,
  Wifi,
  Car,
  Coffee
} from 'lucide-react';
import { GuideProfile, HotelProfile } from '@/services/directory.service';

export interface ProfileInformationDisplayProps {
  profile: GuideProfile | HotelProfile;
  showContactInfo?: boolean;
  showPrivacyControls?: boolean;
  isOwner?: boolean;
  onContactToggle?: (show: boolean) => void;
  onViewFullProfile?: () => void;
}

export default function ProfileInformationDisplay({
  profile,
  showContactInfo = true,
  showPrivacyControls = false,
  isOwner = false,
  onContactToggle,
  onViewFullProfile
}: ProfileInformationDisplayProps) {

  const isGuide = profile.passionType === 'tour_guide';
  const guideProfile = isGuide ? profile as GuideProfile : null;
  const hotelProfile = !isGuide ? profile as HotelProfile : null;

  const renderVerificationBadge = () => {
    if (profile.isVerified) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          <Shield className="h-3 w-3 mr-1" />
          Verified {isGuide ? 'Guide' : 'Hotel'}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        {isGuide ? <Briefcase className="h-3 w-3 mr-1" /> : <Building2 className="h-3 w-3 mr-1" />}
        {isGuide ? 'Tour Guide' : 'Hotel Partner'}
      </Badge>
    );
  };

  const renderRatingStars = (rating: number = 0) => {
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

  const renderContactInformation = () => {
    // Don't show contact section if showContactInfo is false
    if (!showContactInfo) return null;
    
    // Don't show contact section if no contactInfo object exists
    if (!profile.contactInfo) return null;

    // Check if there's any actual contact information to display
    const hasAnyContactInfo = profile.contactInfo.phone || profile.contactInfo.email || profile.contactInfo.website;
    if (!hasAnyContactInfo) return null;

    return (
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
            {showPrivacyControls && isOwner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onContactToggle?.(!showContactInfo)}
                className="text-muted-foreground"
              >
                {showContactInfo ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {showContactInfo ? 'Visible' : 'Hidden'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {profile.contactInfo.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Phone:</span>
              <a 
                href={`tel:${profile.contactInfo.phone}`}
                className="text-primary hover:underline"
              >
                {profile.contactInfo.phone}
              </a>
            </div>
          )}
          
          {profile.contactInfo.email && (
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Email:</span>
              <a 
                href={`mailto:${profile.contactInfo.email}`}
                className="text-primary hover:underline"
              >
                {profile.contactInfo.email}
              </a>
            </div>
          )}
          
          {profile.contactInfo.website && (
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Website:</span>
              <a 
                href={profile.contactInfo.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Visit Website
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderRatingsAndReviews = () => {
    const rating = guideProfile?.rating || hotelProfile?.rating || 0;
    const reviewCount = guideProfile?.reviewCount || hotelProfile?.reviewCount || 0;

    return (
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5" />
            Ratings & Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {renderRatingStars(rating)}
              </div>
              <span className="text-2xl font-bold">
                {rating > 0 ? rating.toFixed(1) : 'New'}
              </span>
            </div>
            
            {reviewCount > 0 && (
              <>
                <Separator orientation="vertical" className="h-8" />
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span>
                    {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                  </span>
                </div>
              </>
            )}
          </div>

          {reviewCount === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No reviews yet</p>
              <p className="text-sm">Be the first to leave a review!</p>
            </div>
          )}

          {reviewCount > 0 && (
            <Button variant="outline" className="w-full">
              View All Reviews
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderPhotosAndPortfolio = () => {
    const images = hotelProfile?.images || [];
    const hasImages = images.length > 0;

    return (
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Photos & Portfolio
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasImages ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {images.slice(0, 6).map((image, index) => (
                <div 
                  key={index}
                  className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <img 
                    src={image} 
                    alt={`${profile.displayName} - Image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {images.length > 6 && (
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Camera className="h-6 w-6 mx-auto mb-1" />
                    <span className="text-sm">+{images.length - 6} more</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Camera className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No photos available</p>
              <p className="text-sm">Photos help customers learn more about your services</p>
            </div>
          )}
          
          {hasImages && (
            <Button variant="outline" className="w-full mt-4">
              View All Photos
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderCertifications = () => {
    const certifications = guideProfile?.certifications || [];
    
    if (!isGuide || certifications.length === 0) return null;

    return (
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5" />
            Certifications & Credentials
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {certifications.map((cert, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <Award className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">{cert}</span>
                <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderGuideSpecificInfo = () => {
    if (!isGuide || !guideProfile) return null;

    return (
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Guide Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {guideProfile.experienceYears !== undefined && (
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Experience:</span>
              <span>{guideProfile.experienceYears} {guideProfile.experienceYears === 1 ? 'year' : 'years'}</span>
            </div>
          )}

          {guideProfile.languagesSpoken && guideProfile.languagesSpoken.length > 0 && (
            <div className="flex items-start gap-3">
              <Languages className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <span className="font-medium">Languages:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {guideProfile.languagesSpoken.map((lang, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {guideProfile.specialties && guideProfile.specialties.length > 0 && (
            <div className="flex items-start gap-3">
              <Star className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <span className="font-medium">Specialties:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {guideProfile.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {guideProfile.hourlyRate && (
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Rate:</span>
              <span className="text-lg font-semibold text-primary">₹{guideProfile.hourlyRate}/hour</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderHotelSpecificInfo = () => {
    if (isGuide || !hotelProfile) return null;

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

    return (
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Hotel Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {hotelProfile.hotelType && (
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Type:</span>
              <Badge variant="outline">{hotelProfile.hotelType}</Badge>
            </div>
          )}

          {hotelProfile.priceRange && (hotelProfile.priceRange.min > 0 || hotelProfile.priceRange.max > 0) && (
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Price Range:</span>
              <span className="text-lg font-semibold text-primary">
                ₹{hotelProfile.priceRange.min.toLocaleString()} - ₹{hotelProfile.priceRange.max.toLocaleString()}/night
              </span>
            </div>
          )}

          {hotelProfile.roomTypes && hotelProfile.roomTypes.length > 0 && (
            <div className="flex items-start gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <span className="font-medium">Room Types:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {hotelProfile.roomTypes.map((roomType, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {roomType}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {hotelProfile.amenities && hotelProfile.amenities.length > 0 && (
            <div className="flex items-start gap-3">
              <Star className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <span className="font-medium">Amenities:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {hotelProfile.amenities.map((amenity, index) => (
                    <Badge key={index} variant="secondary" className="text-xs flex items-center gap-1">
                      {renderAmenityIcon(amenity)}
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Main Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                {isGuide ? (
                  <User className="h-8 w-8 text-muted-foreground" />
                ) : (
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{profile.displayName}</h1>
                {profile.location && (
                  <p className="text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-4 w-4" />
                    {profile.location.city && profile.location.state 
                      ? `${profile.location.city}, ${profile.location.state}`
                      : profile.location.city || profile.location.state || 'Location not specified'
                    }
                  </p>
                )}
              </div>
            </div>
            {renderVerificationBadge()}
          </div>

          {profile.bio && (
            <div className="mb-4">
              <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {onViewFullProfile && (
            <Button onClick={onViewFullProfile} className="w-full">
              View Full Profile
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Contact Information */}
      {renderContactInformation()}

      {/* Ratings and Reviews */}
      {renderRatingsAndReviews()}

      {/* Guide-specific Information */}
      {renderGuideSpecificInfo()}

      {/* Hotel-specific Information */}
      {renderHotelSpecificInfo()}

      {/* Certifications (Guide only) */}
      {renderCertifications()}

      {/* Photos and Portfolio */}
      {renderPhotosAndPortfolio()}
    </div>
  );
}