/**
 * Guide Profile Card Component
 * Displays guide information with all required fields
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Star, 
  User, 
  Clock, 
  Languages,
  Briefcase,
  Phone,
  Mail,
  Globe,
  Award,
  CheckCircle
} from 'lucide-react';
import { GuideSearchResult } from '@/services/search.service';

interface GuideProfileCardProps {
  guide: GuideSearchResult;
  variant?: 'grid' | 'list';
  showContactInfo?: boolean;
  onViewDetails: (guideId: string) => void;
}

export default function GuideProfileCard({ 
  guide, 
  variant = 'list', 
  showContactInfo = false,
  onViewDetails 
}: GuideProfileCardProps) {
  
  const renderVerificationBadge = () => {
    if (guide.isVerified) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Verified Guide
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Briefcase className="h-3 w-3 mr-1" />
        Guide
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
        {guide.contactInfo.phone && (
          <div className="flex items-center gap-1">
            <Phone className="h-4 w-4" />
            <span>{guide.contactInfo.phone}</span>
          </div>
        )}
        {guide.contactInfo.email && (
          <div className="flex items-center gap-1">
            <Mail className="h-4 w-4" />
            <span>{guide.contactInfo.email}</span>
          </div>
        )}
        {guide.contactInfo.website && (
          <div className="flex items-center gap-1">
            <Globe className="h-4 w-4" />
            <a 
              href={guide.contactInfo.website} 
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

  if (variant === 'grid') {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="aspect-video bg-muted flex items-center justify-center">
          <User className="h-12 w-12 text-muted-foreground" />
        </div>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-lg line-clamp-1">{guide.displayName}</h3>
              <p className="text-muted-foreground text-sm flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {guide.location.city}, {guide.location.state}
              </p>
            </div>
            {renderVerificationBadge()}
          </div>

          {/* Rating and Experience */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              {renderRatingStars(guide.rating)}
              <span className="text-sm font-medium ml-1">
                {guide.rating > 0 ? guide.rating.toFixed(1) : 'New'}
              </span>
            </div>
            {guide.reviewCount > 0 && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">
                  {guide.reviewCount} reviews
                </span>
              </>
            )}
          </div>

          {/* Experience and Languages */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-1 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{guide.experienceYears || 0} years experience</span>
              {guide.hourlyRate && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span>₹{guide.hourlyRate}/hour</span>
                </>
              )}
            </div>
            
            {guide.languagesSpoken && guide.languagesSpoken.length > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <Languages className="h-4 w-4 text-muted-foreground" />
                <span>
                  {guide.languagesSpoken.slice(0, 2).join(', ')}
                  {guide.languagesSpoken.length > 2 && ` +${guide.languagesSpoken.length - 2}`}
                </span>
              </div>
            )}
          </div>

          {/* Specialties */}
          {guide.specialties && guide.specialties.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {guide.specialties.slice(0, 2).map((specialty, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {specialty}
                  </Badge>
                ))}
                {guide.specialties.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{guide.specialties.length - 2}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Certifications */}
          {guide.certifications && guide.certifications.length > 0 && (
            <div className="flex items-center gap-1 text-sm text-green-600 mb-4">
              <Award className="h-4 w-4" />
              <span>Certified Professional</span>
            </div>
          )}

          {/* Contact Info */}
          {renderContactInfo()}

          {/* Action Button */}
          <Button 
            onClick={() => onViewDetails(guide.id)}
            className="w-full mt-4"
            variant="default"
          >
            View Profile
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
          <div className="h-48 w-full bg-muted flex items-center justify-center">
            <User className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        <div className="md:w-2/3">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-xl font-display font-bold">{guide.displayName}</h3>
                <p className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {guide.location.city}, {guide.location.state}
                </p>
              </div>
              {renderVerificationBadge()}
            </div>

            {/* Rating and Reviews */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1">
                {renderRatingStars(guide.rating)}
                <span className="ml-1 font-medium">
                  {guide.rating > 0 ? guide.rating.toFixed(1) : 'New Guide'}
                </span>
              </div>
              {guide.reviewCount > 0 && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    {guide.reviewCount} {guide.reviewCount === 1 ? 'review' : 'reviews'}
                  </span>
                </>
              )}
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                {guide.experienceYears || 0} {guide.experienceYears === 1 ? 'year' : 'years'} experience
              </span>
            </div>

            {/* Bio */}
            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
              {guide.bio || 'Experienced local guide ready to show you the best of the region.'}
            </p>

            {/* Languages and Pricing */}
            <div className="flex flex-wrap gap-4 mb-4 text-sm">
              {guide.languagesSpoken && guide.languagesSpoken.length > 0 && (
                <div className="flex items-center gap-1">
                  <Languages className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {guide.languagesSpoken.slice(0, 3).join(', ')}
                    {guide.languagesSpoken.length > 3 && ` +${guide.languagesSpoken.length - 3}`}
                  </span>
                </div>
              )}
              {guide.hourlyRate && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>₹{guide.hourlyRate}/hour</span>
                </div>
              )}
            </div>

            {/* Specialties */}
            {guide.specialties && guide.specialties.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-1">Specializes in:</p>
                <div className="flex flex-wrap gap-1">
                  {guide.specialties.slice(0, 4).map((specialty, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                  {guide.specialties.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{guide.specialties.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Certifications and Contact */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-4">
                {guide.certifications && guide.certifications.length > 0 && (
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <Award className="h-4 w-4" />
                    <span>Certified Guide</span>
                  </div>
                )}
                {renderContactInfo()}
              </div>
              <Button 
                onClick={() => onViewDetails(guide.id)}
                variant="default"
              >
                View Profile
              </Button>
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
}