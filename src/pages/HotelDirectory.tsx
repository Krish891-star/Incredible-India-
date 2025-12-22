/**
 * Hotel Directory Page Component
 * Displays public directory of hotel partners with search and filtering
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MapPin, 
  Star, 
  Filter, 
  Search, 
  Building, 
  X,
  Wifi,
  Car,
  Coffee,
  Utensils
} from 'lucide-react';
import { searchEngine, SearchQuery, SearchFilters, SortOption, HotelSearchResult } from '@/services/search.service';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LocationMap from '@/components/LocationMap';
import HotelProfileCard from '@/components/HotelProfileCard';

interface HotelDirectoryPageProps {
  initialFilters?: SearchFilters;
  showMap?: boolean;
}

export default function HotelDirectoryPage({ 
  initialFilters = {}, 
  showMap = true 
}: HotelDirectoryPageProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState<HotelSearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('rating');
  const [filters, setFilters] = useState({
    city: '',
    hotelType: '',
    amenity: '',
    minPrice: '',
    maxPrice: '',
    minRating: ''
  });

  useEffect(() => {
    fetchHotels();
  }, [searchQuery, filters, sortOption]);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const query: SearchQuery = {
        text: searchQuery || undefined,
        location: {
          city: filters.city || undefined,
        },
        filters: {
          hotelTypes: filters.hotelType ? [filters.hotelType] : undefined,
          amenities: filters.amenity ? [filters.amenity] : undefined,
          priceRange: (filters.minPrice || filters.maxPrice) ? {
            min: filters.minPrice ? parseFloat(filters.minPrice) : 0,
            max: filters.maxPrice ? parseFloat(filters.maxPrice) : 999999
          } : undefined,
          minRating: filters.minRating ? parseFloat(filters.minRating) : undefined,
        },
        sort: sortOption,
        pagination: { page: 1, limit: 50 }
      };

      const response = await searchEngine.searchHotels(query);
      
      if (response.success && response.data) {
        setHotels(response.data);
      } else {
        console.error('Error fetching hotels:', response.error);
        toast.error('Failed to load hotels');
        setHotels([]);
      }
    } catch (error) {
      console.error('Error fetching hotels:', error);
      toast.error('Failed to load hotels');
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      city: '',
      hotelType: '',
      amenity: '',
      minPrice: '',
      maxPrice: '',
      minRating: ''
    });
    setSearchQuery('');
  };

  const handleViewDetails = (hotelId: string) => {
    navigate(`/hotels/${hotelId}`);
  };

  const commonHotelTypes = [
    'Hotel', 'Resort', 'Homestay', 'Lodge', 'Villa', 'Guesthouse', 
    'Boutique Hotel', 'Heritage Hotel', 'Beach Resort', 'Hill Station Resort'
  ];

  const commonAmenities = [
    'WiFi', 'Parking', 'Restaurant', 'Room Service', 'Swimming Pool', 
    'Gym', 'Spa', 'Conference Room', 'Airport Shuttle', 'Pet Friendly',
    'Air Conditioning', 'Laundry Service'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="md:w-1/4">
              <Skeleton className="h-12 w-full mb-4" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="md:w-3/4">
              <div className="grid grid-cols-1 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Card key={i} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <Skeleton className="h-48 md:w-1/3" />
                      <CardContent className="p-4 md:w-2/3">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-8 w-24" />
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold mb-2">Find Your Perfect Stay</h1>
          <p className="text-muted-foreground">Discover amazing hotels, resorts, and accommodations across India</p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search hotels, cities, amenities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mt-4 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium mb-1 block">City</label>
                  <Input
                    placeholder="Enter city"
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Hotel Type</label>
                  <Select value={filters.hotelType} onValueChange={(value) => handleFilterChange('hotelType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any type" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonHotelTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Amenities</label>
                  <Select value={filters.amenity} onValueChange={(value) => handleFilterChange('amenity', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any amenity" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonAmenities.map(amenity => (
                        <SelectItem key={amenity} value={amenity}>{amenity}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Min Price (₹/night)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Max Price (₹/night)</label>
                  <Input
                    type="number"
                    placeholder="10000"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Minimum Rating</label>
                  <Select value={filters.minRating} onValueChange={(value) => handleFilterChange('minRating', value)}>
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
              </div>
            )}

            {(searchQuery || filters.city || filters.hotelType || filters.amenity || filters.minPrice || filters.maxPrice || filters.minRating) && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                <span className="text-sm font-medium">Active Filters:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Search: {searchQuery}
                    <button onClick={() => setSearchQuery('')}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.city && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    City: {filters.city}
                    <button onClick={() => handleFilterChange('city', '')}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.hotelType && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Type: {filters.hotelType}
                    <button onClick={() => handleFilterChange('hotelType', '')}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.amenity && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Amenity: {filters.amenity}
                    <button onClick={() => handleFilterChange('amenity', '')}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.minPrice && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Min: ₹{filters.minPrice}
                    <button onClick={() => handleFilterChange('minPrice', '')}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.maxPrice && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Max: ₹{filters.maxPrice}
                    <button onClick={() => handleFilterChange('maxPrice', '')}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.minRating && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Rating: {filters.minRating}+
                    <button onClick={() => handleFilterChange('minRating', '')}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Map View */}
          {showMap && (
            <div className="md:w-2/5 lg:w-1/3">
              <Card className="overflow-hidden sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Hotel Locations
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-96">
                    <LocationMap
                      coordinates={{
                        latitude: 20.5937,
                        longitude: 78.9629
                      }}
                      locationName="India"
                      height="100%"
                      zoom={5}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Hotel Listings */}
          <div className={showMap ? "md:w-3/5 lg:w-2/3" : "w-full"}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-display font-bold">
                {hotels.length} {hotels.length === 1 ? 'Hotel' : 'Hotels'} Available
              </h2>
              <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hotels.length === 0 ? (
              <Card className="text-center py-12">
                <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">No verified hotels found</h3>
                <p className="text-muted-foreground mb-4">
                  There are currently no verified hotels matching your criteria. Try adjusting your filters.
                </p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {hotels.map((hotel) => (
                  <HotelProfileCard 
                    key={hotel.id} 
                    hotel={hotel} 
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}