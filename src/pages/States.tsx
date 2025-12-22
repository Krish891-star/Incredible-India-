import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, MapPin, Calendar, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import indianStates from '@/data/indianStates';

interface State {
  id: string;
  name: string;
  capital: string;
  type: 'state' | 'union_territory';
  attractions: string[];
  cuisines: string[];
  festivals: string[];
}

const regions = ['All', 'North', 'South', 'East', 'West', 'Central', 'Northeast', 'Island'];

export default function States() {
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [showOnlyUT, setShowOnlyUT] = useState(false);

  useEffect(() => {
    // Simulate loading delay
    setTimeout(() => {
      setStates(indianStates);
      setLoading(false);
    }, 500);
  }, []);

  const filteredStates = states.filter(state => {
    const matchesSearch = state.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      state.capital.toLowerCase().includes(searchQuery.toLowerCase());
    // For simplicity, we're not filtering by region in this implementation
    const matchesCategory = !showOnlyUT || state.type === 'union_territory';
    return matchesSearch && matchesCategory;
  });

  const statesCount = states.filter(s => s.type === 'state').length;
  const utCount = states.filter(s => s.type === 'union_territory').length;

  return (
    <>
      <Helmet>
        <title>Explore All States of India | Incredible India</title>
        <meta name="description" content="Discover all 28 states and 8 union territories of India. Explore culture, heritage, cuisine, and attractions of each region." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        {/* Hero */}
        <section className="relative pt-32 pb-20 bg-gradient-to-br from-primary via-primary/90 to-accent overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200')] bg-cover bg-center opacity-20" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
                Explore All States of India
              </h1>
              <p className="text-xl text-primary-foreground/90 mb-8">
                28 States, 8 Union Territories - Each with its own unique culture, cuisine, and charm
              </p>
              <div className="relative max-w-lg mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search states by name or capital..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-lg bg-background/95 backdrop-blur-sm border-0 shadow-xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="py-8 border-b">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-wrap gap-2">
                {regions.map(region => (
                  <Badge
                    key={region}
                    variant={selectedRegion === region ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/80"
                    onClick={() => setSelectedRegion(region)}
                  >
                    {region}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <Badge variant="secondary">{statesCount} States</Badge>
                <Badge 
                  variant={showOnlyUT ? 'default' : 'outline'} 
                  className="cursor-pointer"
                  onClick={() => setShowOnlyUT(!showOnlyUT)}
                >
                  {utCount} Union Territories
                </Badge>
              </div>
            </div>
          </div>
        </section>

        {/* States Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <p className="text-muted-foreground">
                {loading ? 'Loading...' : `Showing ${filteredStates.length} destinations`}
              </p>
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-4" />
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredStates.map((state) => (
                  <Link
                    key={state.id}
                    to={`/states/${state.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Card className="group overflow-hidden border-0 shadow-card hover:shadow-xl transition-all duration-300 card-hover">
                      <div className="relative h-48 overflow-hidden rounded-t-lg">
                        <img
                          src={`https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&random=${state.id}`}
                          alt={state.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                        <div className="absolute bottom-4 left-4">
                          <h3 className="font-display text-2xl font-bold text-white mb-1">
                            {state.name}
                          </h3>
                          <p className="text-white/80 flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {state.capital}
                          </p>
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                          Explore the rich culture, heritage, and attractions of {state.name}.
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span>{state.attractions.length} attractions • {state.cuisines.length} cuisines</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {state.attractions.slice(0, 2).map((attraction, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs px-2 py-1">
                              {attraction.split(' ').slice(0, 2).join(' ')}
                            </Badge>
                          ))}
                          <Badge variant="outline" className="text-xs px-2 py-1">
                            +{state.attractions.length - 2} more
                          </Badge>
                        </div>
                        <div className="flex items-center justify-end mt-4 text-primary font-medium">
                          <span className="text-sm">Explore</span>
                          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {!loading && filteredStates.length === 0 && (
              <div className="text-center py-20">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">No states found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search query
                </p>
              </div>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}