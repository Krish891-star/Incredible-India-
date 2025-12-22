import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { getAllTourGuides, searchTourGuides, TourGuide } from '@/lib/supabaseData';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, MapPin, Star, Languages, Clock, Filter, X, User, Briefcase } from 'lucide-react';
import LocationMap from '@/components/LocationMap';

export default function GuideDirectory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [guides, setGuides] = useState<TourGuide[]>([]);
  const [filteredGuides, setFilteredGuides] = useState<TourGuide[]>([]);
  const [sortedGuides, setSortedGuides] = useState<TourGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    city: '',
    language: '',
    minRating: '',
    maxPrice: ''
  });
  const [sortOption, setSortOption] = useState('rating');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchGuides();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filters]);

  useEffect(() => {
    sortGuides();
  }, [filteredGuides, sortOption]);

  const fetchGuides = async () => {
    try {
      const guideData = await getAllTourGuides();
      setGuides(guideData);
      setFilteredGuides(guideData);
    } catch (error) {
      console.error('Error fetching guides:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    // Use server-side search instead of client-side filtering
    try {
      const results = await searchTourGuides(searchQuery, {
        city: filters.city || undefined,
        language: filters.language || undefined,
        minRating: filters.minRating ? parseFloat(filters.minRating) : undefined,
        maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined
      });
      setFilteredGuides(results);
    } catch (error) {
      console.error('Error applying filters:', error);
      setFilteredGuides(guides);
    }
  };

  const sortGuides = () => {
    const sorted = [...filteredGuides];
    
    switch (sortOption) {
      case 'price-low':
        sorted.sort((a, b) => (a.hourly_rate || 0) - (b.hourly_rate || 0));
        break;
      case 'price-high':
        sorted.sort((a, b) => (b.hourly_rate || 0) - (a.hourly_rate || 0));
        break;
      case 'rating':
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'experience':
        sorted.sort((a, b) => (b.years_of_experience || 0) - (a.years_of_experience || 0));
        break;
      default:
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    
    setSortedGuides(sorted);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      city: '',
      language: '',
      minRating: '',
      maxPrice: ''
    });
    setSearchQuery('');
  };

  const commonLanguages = [
    'Hindi', 'English', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 
    'Urdu', 'Gujarati', 'Malayalam', 'Kannada', 'Odia', 'Punjabi'
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
          <h1 className="text-4xl font-display font-bold mb-2">Find Your Perfect Tour Guide</h1>
          <p className="text-muted-foreground">Connect with experienced local guides across India</p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search guides, cities, monuments..."
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium mb-1 block">City</label>
                  <Input
                    placeholder="Enter city"
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Language</label>
                  <Select value={filters.language} onValueChange={(value) => handleFilterChange('language', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any language" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonLanguages.map(lang => (
                        <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <div>
                  <label className="text-sm font-medium mb-1 block">Max Price (₹/hr)</label>
                  <Input
                    type="number"
                    placeholder="Enter max hourly rate"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  />
                </div>
              </div>
            )}

            {(searchQuery || filters.city || filters.language || filters.minRating || filters.maxPrice) && (
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
                {filters.language && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Language: {filters.language}
                    <button onClick={() => handleFilterChange('language', '')}>
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
                {filters.maxPrice && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Max: ₹{filters.maxPrice}/hr
                    <button onClick={() => handleFilterChange('maxPrice', '')}>
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
                  Guide Locations
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

          {/* Guide Listings */}
          <div className="md:w-3/5 lg:w-2/3">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-display font-bold">
                {sortedGuides.length} {sortedGuides.length === 1 ? 'Guide' : 'Guides'} Available
              </h2>
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="experience">Most Experienced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {sortedGuides.length === 0 ? (
              <Card className="text-center py-12">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">No verified guides found</h3>
                <p className="text-muted-foreground mb-4">There are currently no verified guides in the system. New guide registrations are pending admin approval.</p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {sortedGuides.map((guide) => (
                  <Card key={guide.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/3">
                        {guide.profile_photo ? (
                          <img
                            src={guide.profile_photo}
                            alt={guide.full_name}
                            className="h-48 w-full object-cover"
                          />
                        ) : (
                          <div className="h-48 w-full bg-muted flex items-center justify-center">
                            <User className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="md:w-2/3">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-xl font-display font-bold">{guide.full_name}</h3>
                              <p className="text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {guide.city}, {guide.state}
                              </p>
                            </div>
                            <Badge variant="secondary">
                              <Briefcase className="h-3 w-3 mr-1" />
                              Verified Guide
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="ml-1 font-medium">{guide.rating?.toFixed(1) || 'N/A'}</span>
                            </div>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">
                              {guide.years_of_experience || 0} {guide.years_of_experience === 1 ? 'year' : 'years'} experience
                            </span>
                          </div>

                          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                            {guide.short_bio || 'No bio available'}
                          </p>

                          <div className="flex flex-wrap gap-2 mb-4">
                            <div className="flex items-center gap-1">
                              <Languages className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {guide.languages_spoken?.slice(0, 2).join(', ') || 'Not specified'}
                                {guide.languages_spoken && guide.languages_spoken.length > 2 && ` +${guide.languages_spoken.length - 2}`}
                              </span>
                            </div>
                            <span className="text-muted-foreground">•</span>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                ₹{guide.hourly_rate || 'N/A'}/hour
                              </span>
                            </div>
                          </div>

                          {guide.nearby_monuments && guide.nearby_monuments.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm font-medium mb-1">Specializes in:</p>
                              <div className="flex flex-wrap gap-1">
                                {guide.nearby_monuments.slice(0, 3).map((monument, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {monument}
                                  </Badge>
                                ))}
                                {guide.nearby_monuments.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{guide.nearby_monuments.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                              {guide.certifications && guide.certifications.length > 0 && (
                                <p className="text-sm text-green-600">
                                  ✓ Certified Guide
                                </p>
                              )}
                            </div>
                            <Button 
                              onClick={() => navigate(`/guides/${guide.id}`)}
                              variant="saffron"
                            >
                              View Profile
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