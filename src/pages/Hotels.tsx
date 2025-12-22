import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { getAllHotels, searchHotels, Hotel } from '@/lib/supabaseData';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, MapPin, Star, Bed, Filter, X } from 'lucide-react';
import LocationMap from '@/components/LocationMap';

export default function Hotels() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [filteredHotels, setFilteredHotels] = useState<Hotel[]>([]);
  const [sortedHotels, setSortedHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    city: '',
    minPrice: '',
    maxPrice: '',
    rating: '',
    type: ''
  });
  const [sortOption, setSortOption] = useState('rating');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchHotels();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filters]);

  useEffect(() => {
    sortHotels();
  }, [filteredHotels, sortOption]);

  const fetchHotels = async () => {
    try {
      const hotelData = await getAllHotels();
      setHotels(hotelData);
      setFilteredHotels(hotelData);
    } catch (error) {
      console.error('Error fetching hotels:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    // Use server-side search instead of client-side filtering
    try {
      const results = await searchHotels(searchQuery, {
        city: filters.city || undefined,
        minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
        rating: filters.rating ? parseFloat(filters.rating) : undefined,
        type: filters.type || undefined
      });
      setFilteredHotels(results);
    } catch (error) {
      console.error('Error applying filters:', error);
      setFilteredHotels(hotels);
    }
  };

  const sortHotels = () => {
    const sorted = [...filteredHotels];
    
    switch (sortOption) {
      case 'price-low':
        sorted.sort((a, b) => a.price_per_night_min - b.price_per_night_min);
        break;
      case 'price-high':
        sorted.sort((a, b) => b.price_per_night_min - a.price_per_night_min);
        break;
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      default:
        sorted.sort((a, b) => b.rating - a.rating);
    }
    
    setSortedHotels(sorted);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      city: '',
      minPrice: '',
      maxPrice: '',
      rating: '',
      type: ''
    });
    setSearchQuery('');
  };

  const getHotelTypeLabel = (type: string) => {
    switch (type) {
      case 'hotel': return 'Hotel';
      case 'resort': return 'Resort';
      case 'homestay': return 'Homestay';
      case 'lodge': return 'Lodge';
      case 'villa': return 'Villa';
      case 'guesthouse': return 'Guest House';
      default: return type;
    }
  };

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-8 w-24" />
                    </CardContent>
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
          <p className="text-muted-foreground">Discover amazing hotels, resorts, and homestays across India</p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search hotels, cities, or locations..."
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium mb-1 block">City</label>
                  <Input
                    placeholder="Enter city"
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Min Price (₹)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Max Price (₹)</label>
                  <Input
                    type="number"
                    placeholder="10000"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Minimum Rating</label>
                  <Select value={filters.rating} onValueChange={(value) => handleFilterChange('rating', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4+ Stars</SelectItem>
                      <SelectItem value="3">3+ Stars</SelectItem>
                      <SelectItem value="2">2+ Stars</SelectItem>
                      <SelectItem value="1">1+ Stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Type</label>
                  <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hotel">Hotel</SelectItem>
                      <SelectItem value="resort">Resort</SelectItem>
                      <SelectItem value="homestay">Homestay</SelectItem>
                      <SelectItem value="lodge">Lodge</SelectItem>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="guesthouse">Guest House</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {(searchQuery || filters.city || filters.minPrice || filters.maxPrice || filters.rating || filters.type) && (
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
                {filters.rating && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Rating: {filters.rating}+
                    <button onClick={() => handleFilterChange('rating', '')}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.type && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Type: {getHotelTypeLabel(filters.type)}
                    <button onClick={() => handleFilterChange('type', '')}>
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
          <div className="md:w-2/5 lg:w-1/3">
            <Card className="overflow-hidden sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Map View
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

          {/* Hotel Listings */}
          <div className="md:w-3/5 lg:w-2/3">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-display font-bold">
                {sortedHotels.length} {sortedHotels.length === 1 ? 'Property' : 'Properties'} Found
              </h2>
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {sortedHotels.length === 0 ? (
              <Card className="text-center py-12">
                <Bed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">No verified hotels found</h3>
                <p className="text-muted-foreground mb-4">There are currently no verified hotels in the system. New hotel registrations are pending admin approval.</p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {sortedHotels.map((hotel) => (
                  <Card key={hotel.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-2/5">
                        {hotel.images && hotel.images.length > 0 ? (
                          <img
                            src={hotel.images[0]}
                            alt={hotel.name}
                            className="h-48 w-full object-cover"
                          />
                        ) : (
                          <div className="h-48 w-full bg-muted flex items-center justify-center">
                            <Bed className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="md:w-3/5">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-xl font-display font-bold">{hotel.name}</h3>
                              <p className="text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {hotel.city}, {hotel.state}
                              </p>
                            </div>
                            <Badge variant="secondary">
                              {getHotelTypeLabel(hotel.type)}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="ml-1 font-medium">{hotel.rating.toFixed(1)}</span>
                            </div>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">{hotel.total_reviews} reviews</span>
                          </div>

                          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                            {hotel.description}
                          </p>

                          {/* Nearby Attractions */}
                          {hotel.nearby_monuments && hotel.nearby_monuments.length > 0 && (
                            <div className="mb-4">
                              <div className="flex items-center gap-2 mb-2">
                                <MapPin className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">Nearby Attractions:</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {hotel.nearby_monuments.slice(0, 3).map((attraction, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {attraction}
                                  </Badge>
                                ))}
                                {hotel.nearby_monuments.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{hotel.nearby_monuments.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 mb-4">
                            {hotel.amenities.slice(0, 3).map((amenity, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {amenity}
                              </Badge>
                            ))}
                            {hotel.amenities.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{hotel.amenities.length - 3} more
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <p className="text-2xl font-bold">₹{hotel.price_per_night_min}<span className="text-base font-normal text-muted-foreground">/night</span></p>
                              <p className="text-sm text-muted-foreground">+ taxes & fees</p>
                            </div>
                            <Button 
                              onClick={() => navigate(`/hotels/${hotel.id}`)}
                              variant="saffron"
                            >
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </div>
                    </div>
                  </Card>
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