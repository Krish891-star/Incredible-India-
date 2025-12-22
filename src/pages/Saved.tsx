import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/lib/auth';
import { getUserProfile, removeUserFavorite } from '@/lib/supabaseData';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Heart, MapPin, Calendar, Trash2, Loader2 } from 'lucide-react';
import { indianStates } from '@/data/indianStates';

interface SavedState {
  id: string;
  name: string;
  capital: string;
  description: string;
  image_url: string;
  best_time_to_visit: string;
}

export default function Saved() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [savedItems, setSavedItems] = useState<SavedState[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchSavedItems();
    }
  }, [user]);

  const fetchSavedItems = async () => {
    if (!user) return;

    try {
      // Get user profile to retrieve favorite states
      const profile = await getUserProfile(user.id);
      
      if (profile && profile.favorite_states && profile.favorite_states.length > 0) {
        // Map favorite state IDs to actual state data
        const favoriteStates = profile.favorite_states
          .map(stateId => {
            const state = indianStates.find(state => state.id === stateId);
            if (state) {
              return {
                id: state.id,
                name: state.name,
                capital: state.capital,
                description: `Explore the rich culture, heritage, and attractions of ${state.name}.`,
                image_url: `https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&random=${state.id}`,
                best_time_to_visit: 'Throughout the year'
              };
            }
            return null;
          })
          .filter(Boolean) as SavedState[];
        
        setSavedItems(favoriteStates);
      } else {
        setSavedItems([]);
      }
    } catch (error) {
      console.error('Error fetching saved items:', error);
      toast.error('Failed to load saved places');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (stateId: string) => {
    setDeleting(stateId);
    try {
      if (user) {
        // Remove from user's favorites in Puter KV store
        const result = await removeUserFavorite(user.id, stateId);
        if (result.success) {
          // Update local state
          setSavedItems(prev => prev.filter(item => item.id !== stateId));
          toast.success('Removed from saved places');
        } else {
          throw new Error(result.error || 'Failed to remove favorite');
        }
      }
    } catch (error: any) {
      console.error('Error removing item:', error);
      toast.error(error.message || 'Failed to remove item');
    } finally {
      setDeleting(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <Helmet>
        <title>My Saved Places | Incredible India</title>
        <meta name="description" content="View your saved destinations, states, and attractions from across India." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        {/* Hero */}
        <section className="relative pt-32 pb-16 bg-gradient-to-br from-primary via-primary/90 to-accent">
          <div className="container mx-auto px-4 text-center">
            <Heart className="h-12 w-12 text-primary-foreground mx-auto mb-4" />
            <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
              My Saved Places
            </h1>
            <p className="text-xl text-primary-foreground/90">
              Your favorite destinations and attractions
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : savedItems.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {savedItems.map((state) => (
                  <Card key={state.id} className="group overflow-hidden border-0 shadow-card hover:shadow-xl transition-all card-hover">
                    <Link to={`/states/${state.name.toLowerCase().replace(/\s+/g, '-')}`}>
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
                    </Link>
                    <CardContent className="p-6">
                      <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                        Explore the rich culture, heritage, and attractions of {state.name}.
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
                          <Calendar className="h-3 w-3" />
                          Best time to visit
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(state.id)}
                          disabled={deleting === state.id}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          {deleting === state.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="max-w-md mx-auto border-0 shadow-card p-12 text-center">
                <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                <h2 className="font-display text-2xl font-bold mb-4">No saved places yet</h2>
                <p className="text-muted-foreground mb-8">
                  Start exploring India and save your favorite destinations!
                </p>
                <Button variant="saffron" onClick={() => navigate('/states')}>
                  Explore States
                </Button>
              </Card>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}