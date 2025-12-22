import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Loader2, MapPin, Train, Plane, Bus, Car, Bike, 
  Navigation, Clock, IndianRupee, AlertCircle, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface State {
  id: string;
  name: string;
  capital: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface RouteResult {
  distance: number;
  duration: number;
  minPrice: number;
  maxPrice: number;
  mode: string;
  isEstimate: boolean;
  source: string;
}

const transportModes = [
  { id: 'train', label: 'Train', icon: Train, color: 'text-blue-600' },
  { id: 'flight', label: 'Flight', icon: Plane, color: 'text-sky-500' },
  { id: 'bus', label: 'Bus', icon: Bus, color: 'text-green-600' },
  { id: 'car', label: 'Car', icon: Car, color: 'text-orange-500' },
  { id: 'bike', label: 'Bike', icon: Bike, color: 'text-purple-500' },
  { id: 'taxi', label: 'Taxi', icon: Navigation, color: 'text-yellow-600' },
];

export default function RoutePlanner() {
  const [states, setStates] = useState<State[]>([]);
  const [fromState, setFromState] = useState<string>('');
  const [toState, setToState] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<string>('train');
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<RouteResult[]>([]);

  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    try {
      const { data, error } = await supabase
        .from('states')
        .select('id, name, capital, latitude, longitude')
        .order('name');

      if (error) throw error;
      setStates(data || []);
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  };

  const calculateRoute = async () => {
    if (!fromState || !toState) {
      toast.error('Please select both origin and destination');
      return;
    }

    if (fromState === toState) {
      toast.error('Origin and destination cannot be the same');
      return;
    }

    setLoading(true);
    setRoutes([]);

    const fromStateData = states.find(s => s.id === fromState);
    const toStateData = states.find(s => s.id === toState);

    if (!fromStateData || !toStateData) {
      toast.error('Invalid state selection');
      setLoading(false);
      return;
    }

    try {
      // Fetch routes for all transport modes
      const routePromises = transportModes.map(async (mode) => {
        const response = await supabase.functions.invoke('estimate-route', {
          body: {
            fromCity: fromStateData.capital || fromStateData.name,
            toCity: toStateData.capital || toStateData.name,
            fromCoords: fromStateData.latitude && fromStateData.longitude 
              ? { lat: fromStateData.latitude, lng: fromStateData.longitude } 
              : null,
            toCoords: toStateData.latitude && toStateData.longitude
              ? { lat: toStateData.latitude, lng: toStateData.longitude }
              : null,
            mode: mode.id
          }
        });

        if (response.error) throw response.error;
        return response.data as RouteResult;
      });

      const results = await Promise.all(routePromises);
      setRoutes(results.filter(r => r.duration > 0));
      toast.success('Routes calculated!');
    } catch (error: any) {
      console.error('Error calculating route:', error);
      toast.error('Failed to calculate routes');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} min`;
    }
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getModeIcon = (modeId: string) => {
    const mode = transportModes.find(m => m.id === modeId);
    return mode ? mode.icon : Car;
  };

  const getModeColor = (modeId: string) => {
    const mode = transportModes.find(m => m.id === modeId);
    return mode ? mode.color : 'text-foreground';
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-16 bg-gradient-to-br from-accent/10 via-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4" variant="outline">
              <Navigation className="h-3 w-3 mr-1" />
              Multi-Modal Route Planner
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Plan Your <span className="text-gradient">Journey</span> Across India
            </h1>
            <p className="text-lg text-muted-foreground">
              Compare travel options by train, flight, bus, car, and more with estimated prices and durations
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Route Selection */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-card sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Select Route
                </CardTitle>
                <CardDescription>Choose your origin and destination</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>From</Label>
                  <Select value={fromState} onValueChange={setFromState}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select origin state" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map(state => (
                        <SelectItem key={state.id} value={state.id}>
                          {state.name} {state.capital && `(${state.capital})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-center">
                  <div className="h-8 w-8 rounded-full border-2 border-dashed border-muted flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>To</Label>
                  <Select value={toState} onValueChange={setToState}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination state" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map(state => (
                        <SelectItem key={state.id} value={state.id}>
                          {state.name} {state.capital && `(${state.capital})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={calculateRoute}
                  className="w-full"
                  variant="saffron"
                  size="lg"
                  disabled={loading || !fromState || !toState}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Navigation className="h-4 w-4 mr-2" />
                      Find Routes
                    </>
                  )}
                </Button>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Prices and durations are AI-estimated and may vary. Always verify with official sources before booking.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Route Results */}
          <div className="lg:col-span-2">
            {loading && (
              <Card className="border-0 shadow-card">
                <CardContent className="py-16 text-center">
                  <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin mb-4" />
                  <h3 className="font-display text-xl">Finding the best routes...</h3>
                  <p className="text-muted-foreground">Analyzing transport options</p>
                </CardContent>
              </Card>
            )}

            {!loading && routes.length === 0 && (
              <Card className="border-0 shadow-card">
                <CardContent className="py-16 text-center">
                  <Navigation className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="font-display text-xl mb-2">Ready to plan your journey?</h3>
                  <p className="text-muted-foreground">Select your origin and destination to see available routes</p>
                </CardContent>
              </Card>
            )}

            {routes.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl font-bold">
                    Available Routes
                  </h2>
                  <Badge variant="secondary">
                    ~{Math.round(routes[0]?.distance || 0)} km
                  </Badge>
                </div>

                {routes.map((route, idx) => {
                  const ModeIcon = getModeIcon(route.mode);
                  const modeColor = getModeColor(route.mode);
                  const mode = transportModes.find(m => m.id === route.mode);

                  return (
                    <Card 
                      key={route.mode}
                      className={cn(
                        "border-0 shadow-card transition-all hover:shadow-lg cursor-pointer",
                        selectedMode === route.mode && "ring-2 ring-primary"
                      )}
                      onClick={() => setSelectedMode(route.mode)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center gap-6">
                          {/* Mode Icon */}
                          <div className={cn(
                            "h-14 w-14 rounded-full flex items-center justify-center bg-muted",
                            modeColor
                          )}>
                            <ModeIcon className="h-7 w-7" />
                          </div>

                          {/* Route Details */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">{mode?.label}</h3>
                              {route.isEstimate && (
                                <Badge variant="outline" className="text-xs">
                                  Estimated
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {states.find(s => s.id === fromState)?.capital} → {states.find(s => s.id === toState)?.capital}
                            </p>
                          </div>

                          {/* Duration */}
                          <div className="text-center px-4 border-l border-r">
                            <div className="flex items-center gap-1 text-lg font-semibold">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {formatDuration(route.duration)}
                            </div>
                            <p className="text-xs text-muted-foreground">Duration</p>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-lg font-semibold text-primary">
                              <IndianRupee className="h-4 w-4" />
                              {formatCurrency(route.minPrice).replace('₹', '')} - {formatCurrency(route.maxPrice).replace('₹', '')}
                            </div>
                            <p className="text-xs text-muted-foreground">Est. fare</p>
                          </div>
                        </div>

                        {selectedMode === route.mode && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="grid md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Distance:</span>
                                <span className="ml-2 font-medium">{Math.round(route.distance)} km</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Data source:</span>
                                <span className="ml-2 font-medium capitalize">{route.source.replace('_', ' ')}</span>
                              </div>
                              <div>
                                <Button size="sm" variant="outline" className="w-full">
                                  Book Now →
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

                <Card className="border border-dashed bg-muted/30">
                  <CardContent className="p-4">
                    <p className="text-sm text-center text-muted-foreground">
                      💡 Prices shown are estimates based on typical fares. Actual prices may vary based on class, 
                      availability, and booking time. Consider booking trains via IRCTC and flights via airline websites 
                      for best prices.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
