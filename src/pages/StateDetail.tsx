import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  MapPin, Calendar, Heart, Share2, Star, Clock, 
  Landmark, Mountain, Utensils, Ticket, ChevronRight,
  Camera, Play, Leaf, Sparkles, PartyPopper, Music,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import LocationMap from '@/components/LocationMap';
import { IndianState } from '@/data/indianStates';
import { addUserFavorite, removeUserFavorite, getUserFavorites } from '@/lib/supabaseData';

interface Attraction {
  id: string;
  name: string;
  description: string | null;
  type: string;
  city: string | null;
  image_url: string | null;
  rating: number | null;
  entry_fee: number | null;
  timings: string | null;
}

interface WikipediaData {
  title: string;
  extract: string;
  url: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
}
interface Cuisine {
  id: string;
  name: string;
  description: string | null;
  type: string | null;
  is_vegetarian: boolean | null;
  ingredients: string[] | null;
  image_url: string | null;
}

interface Festival {
  id: string;
  name: string;
  description: string | null;
  month: string | null;
  duration: string | null;
  significance: string | null;
  celebrations: string[] | null;
  image_url: string | null;
}

// Mock data for attractions, cuisines, and festivals
const mockAttractions: Record<string, Attraction[]> = {
  'rajasthan': [
    {
      id: '1',
      name: 'Amber Fort',
      description: 'Magnificent fort-palace overlooking Maota Lake with stunning architecture and elephant rides.',
      type: 'fort',
      city: 'Jaipur',
      image_url: 'https://images.unsplash.com/photo-1599499462271-8bc72a0d1a6f?w=800',
      rating: 4.7,
      entry_fee: 50,
      timings: '9:30 AM - 5:30 PM'
    },
    {
      id: '2',
      name: 'Hawa Mahal',
      description: 'Iconic palace with pink honeycomb facade and 953 windows, known as the Palace of Winds.',
      type: 'palace',
      city: 'Jaipur',
      image_url: 'https://images.unsplash.com/photo-1587474260584-17fc3a54f51a?w=800',
      rating: 4.5,
      entry_fee: 200,
      timings: '9:00 AM - 4:30 PM'
    }
  ],
  'kerala': [
    {
      id: '3',
      name: 'Backwater Houseboat',
      description: 'Traditional Kettuvallam houseboat cruise through the scenic Alleppey backwaters.',
      type: 'nature',
      city: 'Alleppey',
      image_url: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=800',
      rating: 4.8,
      entry_fee: 3000,
      timings: 'Full day tours available'
    }
  ]
};

// Mock data for cuisines
const mockCuisines: Record<string, Cuisine[]> = {
  'rajasthan': [
    {
      id: '1',
      name: 'Dal Baati Churma',
      description: 'Traditional Rajasthani dish with lentils, baked wheat balls, and sweet crumbled wheat.',
      type: 'main course',
      is_vegetarian: true,
      ingredients: ['Urad dal', 'Wheat flour', 'Ghee', 'Sugar', 'Cardamom'],
      image_url: 'https://images.unsplash.com/photo-1603105092890-f6fc0fdb17a8?w=800'
    }
  ],
  'kerala': [
    {
      id: '2',
      name: 'Appam with Stew',
      description: 'Soft fluffy pancakes made from fermented rice batter served with coconut milk stew.',
      type: 'breakfast',
      is_vegetarian: true,
      ingredients: ['Rice', 'Coconut milk', 'Vegetables', 'Spices'],
      image_url: 'https://images.unsplash.com/photo-1603105092890-f6fc0fdb17a8?w=800'
    }
  ]
};

// Mock data for festivals
const mockFestivals: Record<string, Festival[]> = {
  'rajasthan': [
    {
      id: '1',
      name: 'Pushkar Camel Fair',
      description: 'World\'s largest camel fair with cultural performances, competitions, and trading.',
      month: 'November',
      duration: '5 days',
      significance: 'Celebrates livestock trading and Hindu pilgrimage',
      celebrations: ['Camel races', 'Cultural shows', 'Trading'],
      image_url: 'https://images.unsplash.com/photo-1545239351-ef35f43d01b4?w=800'
    }
  ],
  'kerala': [
    {
      id: '2',
      name: 'Onam',
      description: 'Harvest festival celebrating King Mahabali with elaborate feasts, boat races, and floral decorations.',
      month: 'August/September',
      duration: '10 days',
      significance: 'Celebrates the homecoming of mythical King Mahabali',
      celebrations: ['Pookalam', 'Onasadya', 'Vallamkali', 'Pulikali'],
      image_url: 'https://images.unsplash.com/photo-1599695784006-1dc9a86c0d3f?w=800'
    }
  ]
};

export default function StateDetail() {
  const { stateName } = useParams<{ stateName: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, setState] = useState<IndianState | null>(null);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [wikipediaData, setWikipediaData] = useState<WikipediaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  useEffect(() => {
    if (stateName) {
      fetchStateData();
    }
  }, [stateName]);

  useEffect(() => {
    if (user && state) {
      checkIfFavorite();
    }
  }, [user, state]);

  const fetchWikipediaData = async (stateName: string) => {
    try {
      // Format state name for Wikipedia API
      // Handle special cases for union territories and states
      let wikipediaQuery = stateName;
      
      // Special handling for certain states/territories
      const wikipediaNameMap: Record<string, string> = {
        'Andaman and Nicobar Islands': 'Andaman and Nicobar Islands',
        'Dadra and Nagar Haveli and Daman and Diu': 'Dadra and Nagar Haveli and Daman and Diu',
        'Jammu and Kashmir': 'Jammu and Kashmir',
        'Delhi': 'National Capital Territory of Delhi',
        'Puducherry': 'Puducherry',
        'Ladakh': 'Ladakh'
      };
      
      if (wikipediaNameMap[stateName]) {
        wikipediaQuery = wikipediaNameMap[stateName];
      }
      
      const response = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikipediaQuery)}`
      );
      
      if (!response.ok) {
        // Try with just the first part for union territories
        const parts = stateName.split(' and ');
        if (parts.length > 1) {
          wikipediaQuery = parts[0];
          const fallbackResponse = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikipediaQuery)}`
          );
          
          if (!fallbackResponse.ok) {
            throw new Error('Wikipedia data not found');
          }
          
          const data = await fallbackResponse.json();
          return {
            title: data.title,
            extract: data.extract,
            url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(wikipediaQuery)}`,
            thumbnail: data.thumbnail
          };
        }
        
        throw new Error('Wikipedia data not found');
      }
      
      const data = await response.json();
      return {
        title: data.title,
        extract: data.extract,
        url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(wikipediaQuery)}`,
        thumbnail: data.thumbnail
      };
    } catch (error) {
      console.error('Error fetching Wikipedia data:', error);
      return null;
    }
  };

  const fetchStateData = async () => {
    try {      // Convert URL slug to state name (handle multiple hyphens and special cases)
      const formattedName = stateName?.replace(/-/g, ' ') || '';
      
      // Import the indianStates data
      const { indianStates } = await import('@/data/indianStates');
      
      // Try multiple matching strategies
      let foundState = indianStates.find(s => 
        s.name.toLowerCase() === formattedName.toLowerCase()
      );
      
      // If not found, try partial matching for union territories
      if (!foundState) {
        foundState = indianStates.find(s => 
          s.name.toLowerCase().includes(formattedName.toLowerCase())
        );
      }
      
      // If still not found, try matching by ID
      if (!foundState) {
        foundState = indianStates.find(s => 
          s.id.toLowerCase() === stateName?.toLowerCase()
        );
      }
      
      if (!foundState) {
        navigate('/states');
        return;
      }

      setState(foundState);

      // Fetch Wikipedia data
      const wikiData = await fetchWikipediaData(foundState.name);
      setWikipediaData(wikiData);

      // Use the attractions, cuisines and festivals from the Indian states data
      const attractionsData: Attraction[] = foundState.attractions.map((attraction, index) => ({
        id: `${foundState.id}-${index}`,
        name: attraction,
        description: `Experience the beauty and history of ${attraction} in ${foundState.name}.`,
        type: 'monument',
        city: foundState.capital,
        image_url: `https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&random=${foundState.id}-${index}`,
        rating: 4.5 + (index % 5) * 0.1,
        entry_fee: 50 + (index * 25),
        timings: '9:00 AM - 6:00 PM'
      }));
      
      const cuisinesData: Cuisine[] = foundState.cuisines.map((cuisine, index) => ({
        id: `${foundState.id}-cuisine-${index}`,
        name: cuisine,
        description: `Savor the authentic taste of ${cuisine} from ${foundState.name}.`,
        type: 'local delicacy',
        is_vegetarian: index % 3 === 0,
        ingredients: [`Ingredient ${(index % 5) + 1}`, `Ingredient ${(index % 3) + 2}`, `Special spice ${index + 1}`],
        image_url: `https://images.unsplash.com/photo-1603105092890-f6fc0fdb17a8?w=800&random=${foundState.id}-${index}`
      }));
      
      const festivalsData: Festival[] = foundState.festivals.map((festival, index) => ({
        id: `${foundState.id}-festival-${index}`,
        name: festival,
        description: `Celebrate the vibrant ${festival} festival in ${foundState.name}.`,
        month: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][index % 12],
        duration: `${(index % 5) + 1} days`,
        significance: `Cultural celebration of ${foundState.name}'s heritage`,
        celebrations: [`Activity ${(index % 3) + 1}`, `Tradition ${(index % 4) + 1}`, `Ritual ${(index % 2) + 1}`],
        image_url: `https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&random=${foundState.id}-${index}`
      }));
      
      setAttractions(attractionsData);
      setCuisines(cuisinesData);
      setFestivals(festivalsData);

      // Simulate loading delay
      setTimeout(() => {
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('Error fetching state:', error);
      toast.error('Failed to load state details');
      setLoading(false);
    }
  };

  const checkIfFavorite = async () => {
    if (!user || !state) return;
    
    try {
      const favorites = await getUserFavorites(user.id);
      setIsFavorite(favorites.includes(state.id));
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('Please sign in to save favorites');
      navigate('/auth');
      return;
    }

    if (!state) return;

    try {
      if (isFavorite) {
        // Remove from favorites
        const result = await removeUserFavorite(user.id, state.id);
        if (result.success) {
          setIsFavorite(false);
          toast.success('Removed from favorites');
        } else {
          throw new Error(result.error || 'Failed to remove favorite');
        }
      } else {
        // Add to favorites
        const result = await addUserFavorite(user.id, state.id);
        if (result.success) {
          setIsFavorite(true);
          toast.success('Added to favorites!');
        } else {
          throw new Error(result.error || 'Failed to add favorite');
        }
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast.error(error.message || 'Something went wrong');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `${state?.name} - Incredible India`,
        text: `Explore ${state?.name}, India - Culture, Heritage, Cuisine and Attractions`,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const getAttractionIcon = (type: string) => {
    switch (type) {
      case 'monument':
      case 'fort':
      case 'palace':
        return Landmark;
      case 'temple':
        return Landmark;
      case 'beach':
      case 'wildlife':
      case 'park':
        return Leaf;
      case 'mountain':
      case 'hill':
        return Mountain;
      default:
        return Camera;
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background pt-20">
          <Skeleton className="w-full h-96" />
          <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-12 w-64 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-0 shadow-card">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!state) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4 text-center p-8">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">State Not Found</h2>
            <p className="text-muted-foreground mb-6">
              We couldn't find the state you're looking for.
            </p>
            <Button onClick={() => navigate('/states')} variant="saffron">
              Browse All States
            </Button>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{state.name} - Incredible India Tourism</title>
        <meta name="description" content={`Explore ${state.name}, India - Culture, Heritage, Cuisine and Attractions`} />
      </Helmet>
      
      <Navbar />
      
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative">
          <div className="relative h-96 md:h-[500px] overflow-hidden">
            <img
              src={`https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&random=${state.id}`}
              alt={state.name}
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          </div>
          
          <div className="container mx-auto px-4 absolute bottom-6 left-0 right-0">
            <Card className="max-w-4xl mx-auto border-0 shadow-xl backdrop-blur-sm bg-background/90 glass-card">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                      {state.name}
                    </h1>
                    <p className="text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Capital: {state.capital}
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={toggleFavorite}
                      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                      className="hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <Heart className={cn("h-4 w-4", isFavorite && "fill-current text-red-500")} />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={handleShare} 
                      aria-label="Share"
                      className="hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="secondary" className="px-3 py-1">Capital: {state.capital}</Badge>
                  <Badge variant="secondary" className="px-3 py-1">{state.type === 'state' ? 'State' : 'Union Territory'}</Badge>
                  <Badge variant="secondary" className="px-3 py-1">{state.attractions.length} Attractions</Badge>
                  <Badge variant="secondary" className="px-3 py-1">{state.cuisines.length} Cuisines</Badge>
                  <Badge variant="secondary" className="px-3 py-1">{state.festivals.length} Festivals</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            {/* Map Section */}
            <div className="mb-12">
              <Card className="border-0 shadow-card overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Location of {state.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LocationMap
                    coordinates={{
                      latitude: 20.5937, // Default to center of India
                      longitude: 78.9629
                    }}
                    locationName={state.name}
                    height="400px"
                    zoom={6}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            <Card className="border-0 shadow-card mb-12">
              <CardContent className="p-8">
                <div className="prose max-w-none">
                  {wikipediaData ? (
                    <div className="space-y-6">
                      <div className="prose prose-lg max-w-none">
                        {wikipediaData.thumbnail && (
                          <div className="float-right ml-6 mb-6">
                            <div className="overflow-hidden rounded-xl shadow-xl border-4 border-white">
                              <img 
                                src={wikipediaData.thumbnail.source} 
                                alt={wikipediaData.title}
                                className="w-64 h-auto object-cover"
                              />
                            </div>
                            <p className="text-xs text-center text-muted-foreground mt-2">
                              Image from Wikipedia
                            </p>
                          </div>
                        )}
                        
                        {wikipediaData.extract && (
                          <div className="leading-relaxed text-gray-700">
                            {wikipediaData.extract.split('. ').map((sentence, index, array) => (
                              <p key={index} className="mb-4 text-base">
                                {sentence}{index !== array.length - 1 ? '.' : ''}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-6 border border-primary/20">
                        <h3 className="font-display text-xl font-bold mb-3 flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          Did You Know?
                        </h3>
                        <p className="text-muted-foreground">
                          This information is sourced from Wikipedia, the world's largest free encyclopedia. 
                          Wikipedia content is constantly updated by contributors worldwide, ensuring you get 
                          the most current and accurate information about {state.name}.
                        </p>
                        <Button 
                          variant="outline" 
                          className="mt-4 group"
                          asChild
                        >
                          <a 
                            href={wikipediaData.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            Explore Full Article on Wikipedia
                            <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        {state.name} is one of India's diverse {state.type === 'state' ? 'states' : 'union territories'}, known for its rich cultural heritage, 
                        historical landmarks, and unique traditions. Explore the beauty and diversity of {state.name} 
                        through its attractions, local cuisine, and vibrant festivals.
                      </p>
                      
                      <div className="grid md:grid-cols-2 gap-6 mt-8">
                        <Card className="border-0 shadow-card hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <h3 className="font-display text-lg font-bold mb-2 flex items-center gap-2">
                              <Landmark className="h-5 w-5 text-primary" />
                              Cultural Heritage
                            </h3>
                            <p className="text-muted-foreground text-sm">
                              Discover the rich history and cultural significance of {state.name}'s landmarks and traditions.
                            </p>
                          </CardContent>
                        </Card>
                        
                        <Card className="border-0 shadow-card hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <h3 className="font-display text-lg font-bold mb-2 flex items-center gap-2">
                              <Utensils className="h-5 w-5 text-primary" />
                              Local Cuisine
                            </h3>
                            <p className="text-muted-foreground text-sm">
                              Taste the authentic flavors and traditional recipes that make {state.name}'s cuisine special.
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}                  
                  <div className="grid md:grid-cols-2 gap-8 mt-8">
                    <div>
                      <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
                        <Landmark className="h-5 w-5 text-primary" />
                        Top Attractions
                      </h3>
                      <div className="space-y-2">
                        {state.attractions.slice(0, 5).map((attraction, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Landmark className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{attraction}</span>
                          </div>
                        ))}
                        {state.attractions.length > 5 && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">+{state.attractions.length - 5} more attractions</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
                        <Utensils className="h-5 w-5 text-primary" />
                        Popular Cuisines
                      </h3>
                      <div className="space-y-2">
                        {state.cuisines.slice(0, 5).map((cuisine, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Utensils className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{cuisine}</span>
                          </div>
                        ))}
                        {state.cuisines.length > 5 && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">+{state.cuisines.length - 5} more dishes</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Tabs */}
            <Tabs defaultValue="attractions" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="attractions">Top Attractions</TabsTrigger>
                <TabsTrigger value="cuisine">Local Cuisine</TabsTrigger>
                <TabsTrigger value="festivals">Festivals</TabsTrigger>
              </TabsList>

              {/* Attractions Tab */}
              <TabsContent value="attractions" className="space-y-8">
                <Card className="border-0 shadow-card p-8">
                  <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-3">
                    <Camera className="h-8 w-8 text-primary" />
                    Must-Visit Places in {state.name}
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    Discover the most iconic landmarks, historical sites, and natural wonders that define {state.name}'s unique character.
                  </p>
                </Card>

                {attractions.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-8">
                    {attractions.map((attraction) => {
                      const IconComponent = getAttractionIcon(attraction.type);
                      return (
                        <Card key={attraction.id} className="group overflow-hidden border-0 shadow-card hover:shadow-xl transition-all card-hover">
                          <div className="flex flex-col md:flex-row">
                            <div className="relative w-full md:w-48 h-48 md:h-auto overflow-hidden flex-shrink-0">
                              <img
                                src={attraction.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'}
                                alt={attraction.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                              {attraction.rating && (
                                <div className="absolute top-4 left-4 bg-primary text-primary-foreground rounded-lg px-2 py-1 flex items-center gap-1 shadow-sm">
                                  <Star className="h-3 w-3 fill-current" />
                                  <span className="text-xs font-bold">{attraction.rating}</span>
                                </div>
                              )}
                            </div>
                            <CardContent className="p-6 flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-display text-xl font-bold flex items-center gap-2">
                                  <IconComponent className="h-5 w-5 text-primary" />
                                  {attraction.name}
                                </h3>
                              </div>
                              
                              {attraction.city && (
                                <p className="text-sm text-primary font-medium mb-3 flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {attraction.city}
                                </p>
                              )}
                              
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                {attraction.description}
                              </p>
                              
                              <div className="flex flex-wrap gap-3 text-sm">
                                {attraction.entry_fee !== null && (
                                  <div className="flex items-center gap-1 text-muted-foreground bg-secondary px-2 py-1 rounded">
                                    <Ticket className="h-4 w-4" />
                                    ₹{attraction.entry_fee}
                                  </div>
                                )}
                                
                                {attraction.timings && (
                                  <div className="flex items-center gap-1 text-muted-foreground bg-secondary px-2 py-1 rounded">
                                    <Clock className="h-4 w-4" />
                                    {attraction.timings}
                                  </div>
                                )}
                              </div>
                              
                              <Button variant="link" className="p-0 mt-4 h-auto group-hover:text-primary transition-colors" asChild>
                                <Link to={`/attractions/${attraction.id}`}>
                                  View Details <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                                </Link>
                              </Button>
                            </CardContent>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="border-0 shadow-card p-12 text-center">
                    <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-medium mb-2">Popular Attractions in {state.name}</h3>
                    <p className="text-muted-foreground mb-6">
                      {state.name} is known for these popular attractions:
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {state.attractions.slice(0, 8).map((attraction, index) => (
                        <Badge key={index} variant="secondary">
                          {attraction}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}
              </TabsContent>

              {/* Local Cuisine Tab */}
              <TabsContent value="cuisine" className="space-y-8">
                <Card className="border-0 shadow-card p-8">
                  <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-3">
                    <Utensils className="h-8 w-8 text-accent" />
                    Local Delicacies of {state.name}
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    Savor the authentic flavors and traditional recipes that make {state.name}'s cuisine truly special.
                  </p>
                </Card>

                {cuisines.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cuisines.map((cuisine) => (
                      <Card key={cuisine.id} className="border-0 shadow-card overflow-hidden group card-hover">
                        <div className="relative">
                          <img
                            src={cuisine.image_url || 'https://images.unsplash.com/photo-1603105092890-f6fc0fdb17a8?w=800'}
                            alt={cuisine.name}
                            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          {cuisine.is_vegetarian && (
                            <Badge className="absolute top-4 right-4 bg-green-500 text-white">
                              Vegetarian
                            </Badge>
                          )}
                        </div>
                        <CardContent className="p-6">
                          <h3 className="font-display text-xl font-bold mb-2">{cuisine.name}</h3>
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                            {cuisine.description}
                          </p>
                          
                          {cuisine.ingredients && (
                            <div>
                              <p className="text-xs font-medium text-foreground/70 mb-2">Ingredients:</p>
                              <div className="flex flex-wrap gap-2">
                                {cuisine.ingredients.slice(0, 4).map((ingredient, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs px-2 py-1">
                                    {ingredient}
                                  </Badge>
                                ))}
                                {cuisine.ingredients.length > 4 && (
                                  <Badge variant="secondary" className="text-xs px-2 py-1">
                                    +{cuisine.ingredients.length - 4} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-0 shadow-card p-12 text-center">
                    <Utensils className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-medium mb-2">Popular Dishes from {state.name}</h3>
                    <p className="text-muted-foreground mb-6">
                      {state.name} is famous for these delicious dishes:
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {state.cuisines.slice(0, 10).map((cuisine, index) => (
                        <Badge key={index} variant="secondary">
                          {cuisine}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}
              </TabsContent>

              {/* Festival Calendar Tab */}
              <TabsContent value="festivals" className="space-y-8">
                <Card className="border-0 shadow-card p-8">
                  <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-3">
                    <PartyPopper className="h-8 w-8 text-accent" />
                    Festival Calendar - {state.name}
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    Experience the vibrant celebrations and traditional festivals that make {state.name} culturally rich. Plan your visit around these colorful events.
                  </p>
                </Card>

                {festivals.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-8">
                    {festivals.map((festival) => (
                      <Card key={festival.id} className="group overflow-hidden border-0 shadow-card hover:shadow-xl transition-all card-hover">
                        <div className="flex flex-col md:flex-row">
                          <div className="relative w-full md:w-48 h-48 md:h-auto overflow-hidden flex-shrink-0">
                            <img
                              src={festival.image_url || 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800'}
                              alt={festival.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            {festival.month && (
                              <div className="absolute top-4 left-4 bg-primary text-primary-foreground rounded-lg px-3 py-2 text-center shadow-sm">
                                <Calendar className="h-4 w-4 mx-auto mb-1" />
                                <span className="text-xs font-bold">{festival.month}</span>
                              </div>
                            )}
                          </div>
                          <CardContent className="p-6 flex-1">
                            <h3 className="font-display text-xl font-bold mb-2 flex items-center gap-2">
                              <Sparkles className="h-5 w-5 text-gold" />
                              {festival.name}
                            </h3>
                            {festival.duration && (
                              <p className="text-sm text-primary font-medium mb-3 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Duration: {festival.duration}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                              {festival.description}
                            </p>
                            {festival.significance && (
                              <div className="bg-secondary/50 rounded-lg p-3 mb-4">
                                <p className="text-xs font-medium text-foreground/70 mb-1">Significance:</p>
                                <p className="text-sm text-muted-foreground line-clamp-2">{festival.significance}</p>
                              </div>
                            )}
                            {festival.celebrations && festival.celebrations.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-foreground/70 flex items-center gap-1">
                                  <Music className="h-3 w-3" />
                                  Celebrations:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {festival.celebrations.slice(0, 3).map((celebration, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs px-2 py-1">
                                      {celebration}
                                    </Badge>
                                  ))}
                                  {festival.celebrations.length > 3 && (
                                    <Badge variant="outline" className="text-xs px-2 py-1">
                                      +{festival.celebrations.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-0 shadow-card p-12 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-medium mb-2">Major Festivals of {state.name}</h3>
                    <p className="text-muted-foreground mb-6">
                      {state.name} celebrates these important festivals throughout the year:
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {state.festivals.slice(0, 10).map((festival, index) => (
                        <Badge key={index} variant="secondary">
                          {festival}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}