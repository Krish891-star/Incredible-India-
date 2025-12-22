/**
 * FilterPanel Component
 * Collapsible filter panel with all filter options, state management, and mobile-responsive interface
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp,
  MapPin,
  Star,
  DollarSign,
  Languages,
  Building,
  Wifi
} from 'lucide-react';
import { SearchFilters, SortOption } from '@/services/search.service';

export interface FilterPanelProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  directoryType: 'guides' | 'hotels';
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function FilterPanel({
  filters,
  onFilterChange,
  onClearFilters,
  sortOption,
  onSortChange,
  directoryType,
  isOpen = false,
  onToggle
}: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  // Common data
  const commonLanguages = [
    'Hindi', 'English', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 
    'Urdu', 'Gujarati', 'Malayalam', 'Kannada', 'Odia', 'Punjabi'
  ];

  const commonHotelTypes = [
    'Hotel', 'Resort', 'Homestay', 'Lodge', 'Villa', 'Guesthouse', 
    'Boutique Hotel', 'Heritage Hotel', 'Beach Resort', 'Hill Station Resort'
  ];

  const commonAmenities = [
    'WiFi', 'Parking', 'Restaurant', 'Room Service', 'Swimming Pool', 
    'Gym', 'Spa', 'Conference Room', 'Airport Shuttle', 'Pet Friendly',
    'Air Conditioning', 'Laundry Service'
  ];

  const guideSpecialties = [
    'Historical Tours', 'Cultural Tours', 'Adventure Tours', 'Wildlife Tours',
    'Religious Tours', 'Food Tours', 'Photography Tours', 'Trekking',
    'City Tours', 'Monument Tours', 'Nature Tours', 'Heritage Walks'
  ];

  // Handle filter updates
  const updateFilter = (key: keyof SearchFilters, value: any) => {
    const updatedFilters = { ...localFilters, [key]: value };
    setLocalFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  // Handle array filter updates (for specialties, languages, etc.)
  const updateArrayFilter = (key: keyof SearchFilters, value: string, isAdd: boolean) => {
    const currentArray = (localFilters[key] as string[]) || [];
    let updatedArray: string[];
    
    if (isAdd && !currentArray.includes(value)) {
      updatedArray = [...currentArray, value];
    } else if (!isAdd) {
      updatedArray = currentArray.filter(item => item !== value);
    } else {
      return; // No change needed
    }
    
    updateFilter(key, updatedArray.length > 0 ? updatedArray : undefined);
  };

  // Clear all filters
  const handleClearAll = () => {
    setLocalFilters({});
    onClearFilters();
  };

  // Check if any filters are active
  const hasActiveFilters = Object.values(localFilters).some(value => 
    value !== undefined && value !== null && 
    (Array.isArray(value) ? value.length > 0 : true)
  );

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    Object.entries(localFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value) && value.length > 0) {
          count += value.length;
        } else if (!Array.isArray(value)) {
          count += 1;
        }
      }
    });
    return count;
  };

  return (
    <Card className="w-full">
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between p-4 h-auto"
            onClick={onToggle}
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  {getActiveFilterCount()}
                </Badge>
              )}
            </div>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="p-4 pt-0">
            {/* Sort Options */}
            <div className="mb-6">
              <label className="text-sm font-medium mb-2 block">Sort By</label>
              <Select value={sortOption} onValueChange={(value) => onSortChange(value as SortOption)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  {directoryType === 'guides' && (
                    <SelectItem value="experience">Most Experienced</SelectItem>
                  )}
                  <SelectItem value="popularity">Most Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Common Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {/* Location Filter */}
              <div>
                <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  City
                </label>
                <Input
                  placeholder="Enter city name"
                  value={localFilters.location?.city || ''}
                  onChange={(e) => updateFilter('location', { 
                    ...localFilters.location, 
                    city: e.target.value || undefined 
                  })}
                />
              </div>

              {/* Rating Filter */}
              <div>
                <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Minimum Rating
                </label>
                <Select 
                  value={localFilters.minRating?.toString() || ''} 
                  onValueChange={(value) => updateFilter('minRating', value ? parseFloat(value) : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4.5">4.5+ Stars</SelectItem>
                    <SelectItem value="4">4+ Stars</SelectItem>
                    <SelectItem value="3.5">3.5+ Stars</SelectItem>
                    <SelectItem value="3">3+ Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Verified Filter */}
              <div>
                <label className="text-sm font-medium mb-1 block">Verification Status</label>
                <Select 
                  value={localFilters.isVerified?.toString() || ''} 
                  onValueChange={(value) => updateFilter('isVerified', value === 'true' ? true : value === 'false' ? false : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Verified Only</SelectItem>
                    <SelectItem value="false">Unverified Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Guide-Specific Filters */}
            {directoryType === 'guides' && (
              <div className="space-y-4 mb-6">
                <h3 className="text-sm font-medium">Guide Filters</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Languages */}
                  <div>
                    <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                      <Languages className="h-3 w-3" />
                      Languages
                    </label>
                    <Select onValueChange={(value) => updateArrayFilter('languages', value, true)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select languages" />
                      </SelectTrigger>
                      <SelectContent>
                        {commonLanguages.map(lang => (
                          <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {localFilters.languages && localFilters.languages.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {localFilters.languages.map(lang => (
                          <Badge key={lang} variant="secondary" className="text-xs">
                            {lang}
                            <button 
                              onClick={() => updateArrayFilter('languages', lang, false)}
                              className="ml-1"
                            >
                              <X className="h-2 w-2" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Specialties */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Specialties</label>
                    <Select onValueChange={(value) => updateArrayFilter('specialties', value, true)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select specialties" />
                      </SelectTrigger>
                      <SelectContent>
                        {guideSpecialties.map(specialty => (
                          <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {localFilters.specialties && localFilters.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {localFilters.specialties.map(specialty => (
                          <Badge key={specialty} variant="secondary" className="text-xs">
                            {specialty}
                            <button 
                              onClick={() => updateArrayFilter('specialties', specialty, false)}
                              className="ml-1"
                            >
                              <X className="h-2 w-2" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Max Hourly Rate */}
                  <div>
                    <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Max Hourly Rate (₹)
                    </label>
                    <Input
                      type="number"
                      placeholder="Enter max rate"
                      value={localFilters.maxHourlyRate || ''}
                      onChange={(e) => updateFilter('maxHourlyRate', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>

                  {/* Min Experience */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Min Experience (years)</label>
                    <Input
                      type="number"
                      placeholder="Enter min years"
                      value={localFilters.minExperience || ''}
                      onChange={(e) => updateFilter('minExperience', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Hotel-Specific Filters */}
            {directoryType === 'hotels' && (
              <div className="space-y-4 mb-6">
                <h3 className="text-sm font-medium">Hotel Filters</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Hotel Types */}
                  <div>
                    <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      Hotel Type
                    </label>
                    <Select onValueChange={(value) => updateArrayFilter('hotelTypes', value, true)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select hotel types" />
                      </SelectTrigger>
                      <SelectContent>
                        {commonHotelTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {localFilters.hotelTypes && localFilters.hotelTypes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {localFilters.hotelTypes.map(type => (
                          <Badge key={type} variant="secondary" className="text-xs">
                            {type}
                            <button 
                              onClick={() => updateArrayFilter('hotelTypes', type, false)}
                              className="ml-1"
                            >
                              <X className="h-2 w-2" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Amenities */}
                  <div>
                    <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                      <Wifi className="h-3 w-3" />
                      Amenities
                    </label>
                    <Select onValueChange={(value) => updateArrayFilter('amenities', value, true)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select amenities" />
                      </SelectTrigger>
                      <SelectContent>
                        {commonAmenities.map(amenity => (
                          <SelectItem key={amenity} value={amenity}>{amenity}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {localFilters.amenities && localFilters.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {localFilters.amenities.map(amenity => (
                          <Badge key={amenity} variant="secondary" className="text-xs">
                            {amenity}
                            <button 
                              onClick={() => updateArrayFilter('amenities', amenity, false)}
                              className="ml-1"
                            >
                              <X className="h-2 w-2" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Price Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Min Price (₹/night)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={localFilters.priceRange?.min || ''}
                      onChange={(e) => updateFilter('priceRange', {
                        ...localFilters.priceRange,
                        min: e.target.value ? parseFloat(e.target.value) : 0
                      })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Max Price (₹/night)</label>
                    <Input
                      type="number"
                      placeholder="10000"
                      value={localFilters.priceRange?.max || ''}
                      onChange={(e) => updateFilter('priceRange', {
                        ...localFilters.priceRange,
                        max: e.target.value ? parseFloat(e.target.value) : 999999
                      })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <div className="flex justify-end">
                <Button variant="ghost" onClick={handleClearAll} className="text-sm">
                  <X className="h-3 w-3 mr-1" />
                  Clear All Filters
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}