import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, MapPin, Calendar, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface State {
  id: string;
  name: string;
  capital: string | null;
  description: string | null;
  image_url: string | null;
  best_time_to_visit: string | null;
}

const stateColors: Record<string, string> = {
  'Rajasthan': 'from-amber-500 to-orange-600',
  'Kerala': 'from-emerald-500 to-green-600',
  'Himachal Pradesh': 'from-sky-500 to-blue-600',
  'Goa': 'from-cyan-500 to-teal-600',
  'Karnataka': 'from-purple-500 to-violet-600',
  'Tamil Nadu': 'from-rose-500 to-pink-600',
  'Maharashtra': 'from-orange-500 to-red-600',
  'Uttar Pradesh': 'from-yellow-500 to-amber-600',
  'Delhi': 'from-red-500 to-orange-600',
  'West Bengal': 'from-green-500 to-emerald-600',
  'Punjab': 'from-blue-500 to-indigo-600',
  'Gujarat': 'from-amber-500 to-yellow-600',
};

export default function FeaturedStates() {
  const navigate = useNavigate();
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    fetchFeaturedStates();
  }, []);

  const fetchFeaturedStates = async () => {
    try {
      const { data, error } = await supabase
        .from('states')
        .select('id, name, capital, description, image_url, best_time_to_visit')
        .in('name', ['Rajasthan', 'Kerala', 'Himachal Pradesh', 'Goa'])
        .limit(4);

      if (error) throw error;
      setStates(data || []);
    } catch (error) {
      console.error('Error fetching states:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStateColor = (name: string) => {
    return stateColors[name] || 'from-primary to-accent';
  };

  if (loading) {
    return (
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Skeleton className="h-6 w-32 mx-auto mb-4" />
            <Skeleton className="h-12 w-3/4 mx-auto mb-4" />
            <Skeleton className="h-6 w-2/3 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary">
            Featured Destinations
          </Badge>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Explore India's Most <span className="text-gradient">Beloved States</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From royal heritage to pristine nature, discover the diverse beauty that makes India truly incredible.
          </p>
        </div>

        {/* States Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {states.map((state, index) => (
            <Card
              key={state.id}
              className={cn(
                'group relative overflow-hidden border-0 cursor-pointer transition-all duration-500 card-hover',
                'hover:shadow-xl hover:-translate-y-2'
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
              onMouseEnter={() => setHoveredId(state.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => navigate(`/states/${state.name.toLowerCase().replace(/\s+/g, '-')}`)}
            >
              {/* Image */}
              <div className="relative h-80 overflow-hidden rounded-t-lg">
                <img
                  src={state.image_url || 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800'}
                  alt={state.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className={cn(
                  'absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/40 to-transparent',
                  'transition-opacity duration-300'
                )} />
                
                {/* Overlay Gradient */}
                <div className={cn(
                  'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-30 transition-opacity duration-300',
                  getStateColor(state.name)
                )} />

                {/* Favorite Button */}
                <button
                  className="absolute top-4 right-4 h-10 w-10 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center text-primary-foreground hover:bg-background/40 transition-all duration-300 hover:scale-110"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/auth');
                  }}
                >
                  <Heart className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <CardContent className="absolute bottom-0 left-0 right-0 p-6 text-primary-foreground">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm text-primary-foreground/80">{state.capital}</span>
                </div>
                <h3 className="font-display text-2xl font-bold mb-2">{state.name}</h3>
                <p className={cn(
                  'text-sm text-primary-foreground/80 mb-4 line-clamp-2 transition-all duration-300',
                  hoveredId === state.id ? 'line-clamp-none' : ''
                )}>
                  {state.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-primary-foreground/70">
                    <Calendar className="h-4 w-4" />
                    <span>{state.best_time_to_visit || 'Year round'}</span>
                  </div>
                  <ArrowRight className={cn(
                    'h-5 w-5 transition-transform duration-300',
                    hoveredId === state.id ? 'translate-x-1' : ''
                  )} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button
            variant="saffron"
            size="lg"
            onClick={() => navigate('/states')}
            className="group"
          >
            View All 28 States
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </section>
  );
}