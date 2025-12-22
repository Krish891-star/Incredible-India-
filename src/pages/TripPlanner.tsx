import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Loader2, Sparkles, MapPin, Calendar, Wallet, Heart, 
  Utensils, Camera, Mountain, Building2, Palmtree, Clock,
  IndianRupee, Lightbulb, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const destinations = [
  "Rajasthan", "Kerala", "Goa", "Himachal Pradesh", "Uttarakhand",
  "Tamil Nadu", "Karnataka", "Maharashtra", "Gujarat", "West Bengal",
  "Jammu & Kashmir", "Ladakh", "Sikkim", "Meghalaya", "Andaman & Nicobar"
];

const interests = [
  { id: 'history', label: 'History', icon: Building2 },
  { id: 'nature', label: 'Nature', icon: Mountain },
  { id: 'beaches', label: 'Beaches', icon: Palmtree },
  { id: 'food', label: 'Cuisine', icon: Utensils },
  { id: 'photography', label: 'Photography', icon: Camera },
  { id: 'adventure', label: 'Adventure', icon: Sparkles },
  { id: 'spiritual', label: 'Spiritual', icon: Heart },
];

interface ItineraryDay {
  day: number;
  location: string;
  theme: string;
  activities: Array<{
    time: string;
    activity: string;
    description: string;
    duration: string;
    cost: number;
    tips?: string;
  }>;
  meals: {
    breakfast?: { place: string; dish: string; cost: number };
    lunch?: { place: string; dish: string; cost: number };
    dinner?: { place: string; dish: string; cost: number };
  };
  accommodation?: { name: string; type: string; cost: number };
  transport?: { mode: string; route: string; cost: number };
}

interface Itinerary {
  title: string;
  summary: string;
  totalEstimatedCost: number;
  days: ItineraryDay[];
  packingList?: string[];
  culturalNotes?: string[];
}

export default function TripPlanner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('5');
  const [budget, setBudget] = useState('moderate');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['history', 'food']);
  const [travelStyle, setTravelStyle] = useState('cultural');
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [activeDay, setActiveDay] = useState(1);

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id) 
        : [...prev, id]
    );
  };

  const generateItinerary = async () => {
    if (!destination) {
      toast.error('Please select a destination');
      return;
    }

    if (!user) {
      toast.error('Please sign in to generate itineraries');
      navigate('/auth');
      return;
    }

    setLoading(true);
    setItinerary(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-itinerary', {
        body: {
          destination,
          duration: parseInt(duration),
          budget,
          interests: selectedInterests,
          travelStyle
        }
      });

      if (error) throw error;

      if (data.itinerary) {
        setItinerary(data.itinerary);
        toast.success('Your personalized itinerary is ready!');
      }
    } catch (error: any) {
      console.error('Error generating itinerary:', error);
      if (error.message?.includes('429')) {
        toast.error('Too many requests. Please try again in a moment.');
      } else if (error.message?.includes('402')) {
        toast.error('AI credits exhausted. Please contact support.');
      } else {
        toast.error('Failed to generate itinerary. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/10 via-accent/5 to-background overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200')] bg-cover bg-center opacity-5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4" variant="outline">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered Travel Planning
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Create Your Perfect <span className="text-gradient">Indian Adventure</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Let our AI craft a personalized itinerary based on your interests, budget, and travel style
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Planning Form */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-0 shadow-card sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Plan Your Trip
                </CardTitle>
                <CardDescription>Tell us about your dream vacation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Destination</Label>
                  <Select value={destination} onValueChange={setDestination}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a state or region" />
                    </SelectTrigger>
                    <SelectContent>
                      {destinations.map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Duration
                    </Label>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[3, 5, 7, 10, 14].map(d => (
                          <SelectItem key={d} value={d.toString()}>{d} days</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      Budget
                    </Label>
                    <Select value={budget} onValueChange={setBudget}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="budget">Budget</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="luxury">Luxury</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Interests</Label>
                  <div className="flex flex-wrap gap-2">
                    {interests.map(({ id, label, icon: Icon }) => (
                      <Badge
                        key={id}
                        variant={selectedInterests.includes(id) ? 'default' : 'outline'}
                        className={cn(
                          "cursor-pointer transition-all",
                          selectedInterests.includes(id) && "bg-primary"
                        )}
                        onClick={() => toggleInterest(id)}
                      >
                        <Icon className="h-3 w-3 mr-1" />
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Travel Style</Label>
                  <Select value={travelStyle} onValueChange={setTravelStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cultural">Cultural Exploration</SelectItem>
                      <SelectItem value="adventure">Adventure & Outdoor</SelectItem>
                      <SelectItem value="relaxation">Relaxation & Wellness</SelectItem>
                      <SelectItem value="photography">Photography Tour</SelectItem>
                      <SelectItem value="family">Family Friendly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={generateItinerary} 
                  className="w-full" 
                  variant="saffron"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating your itinerary...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Itinerary
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Itinerary Display */}
          <div className="lg:col-span-2">
            {loading && (
              <Card className="border-0 shadow-card">
                <CardContent className="py-16 text-center">
                  <div className="animate-pulse space-y-4">
                    <Sparkles className="h-12 w-12 mx-auto text-primary animate-spin" />
                    <h3 className="font-display text-xl">Creating your perfect itinerary...</h3>
                    <p className="text-muted-foreground">Our AI is crafting a personalized plan just for you</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {!loading && !itinerary && (
              <Card className="border-0 shadow-card">
                <CardContent className="py-16 text-center">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="font-display text-xl mb-2">Ready to plan your adventure?</h3>
                  <p className="text-muted-foreground">Fill in your preferences and let our AI create the perfect itinerary</p>
                </CardContent>
              </Card>
            )}

            {itinerary && (
              <div className="space-y-6">
                {/* Itinerary Header */}
                <Card className="border-0 shadow-card overflow-hidden">
                  <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-accent/10 p-6">
                    <Badge variant="secondary" className="mb-3">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI Generated
                    </Badge>
                    <h2 className="font-display text-2xl font-bold mb-2">{itinerary.title}</h2>
                    <p className="text-muted-foreground">{itinerary.summary}</p>
                    <div className="flex items-center gap-4 mt-4">
                      <Badge variant="outline" className="text-lg py-2 px-4">
                        <IndianRupee className="h-4 w-4 mr-1" />
                        {formatCurrency(itinerary.totalEstimatedCost)}
                      </Badge>
                      <Badge variant="outline" className="text-lg py-2 px-4">
                        <Calendar className="h-4 w-4 mr-1" />
                        {itinerary.days.length} Days
                      </Badge>
                    </div>
                  </div>
                </Card>

                {/* Day Selector */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {itinerary.days.map((day) => (
                    <Button
                      key={day.day}
                      variant={activeDay === day.day ? 'default' : 'outline'}
                      onClick={() => setActiveDay(day.day)}
                      className="whitespace-nowrap"
                    >
                      Day {day.day}
                    </Button>
                  ))}
                </div>

                {/* Active Day Details */}
                {itinerary.days.filter(d => d.day === activeDay).map((day) => (
                  <Card key={day.day} className="border-0 shadow-card">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            Day {day.day}: {day.location}
                          </CardTitle>
                          <CardDescription>{day.theme}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Activities */}
                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Activities
                        </h4>
                        <div className="space-y-3">
                          {day.activities.map((activity, idx) => (
                            <div key={idx} className="flex gap-4 p-4 bg-muted/50 rounded-lg">
                              <Badge variant="outline" className="shrink-0">{activity.time}</Badge>
                              <div className="flex-1">
                                <h5 className="font-medium">{activity.activity}</h5>
                                <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                                <div className="flex items-center gap-4 mt-2 text-sm">
                                  <span className="text-muted-foreground">⏱ {activity.duration}</span>
                                  {activity.cost > 0 && (
                                    <span className="text-primary">{formatCurrency(activity.cost)}</span>
                                  )}
                                </div>
                                {activity.tips && (
                                  <div className="mt-2 p-2 bg-primary/10 rounded text-sm flex items-start gap-2">
                                    <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                    <span>{activity.tips}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Meals */}
                      {day.meals && (
                        <div className="space-y-4">
                          <h4 className="font-semibold flex items-center gap-2">
                            <Utensils className="h-4 w-4" />
                            Dining
                          </h4>
                          <div className="grid md:grid-cols-3 gap-3">
                            {Object.entries(day.meals).map(([meal, details]) => details && (
                              <div key={meal} className="p-3 bg-muted/50 rounded-lg">
                                <span className="text-xs uppercase text-muted-foreground">{meal}</span>
                                <p className="font-medium">{details.place}</p>
                                <p className="text-sm text-muted-foreground">{details.dish}</p>
                                <p className="text-sm text-primary">{formatCurrency(details.cost)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Transport & Accommodation */}
                      <div className="grid md:grid-cols-2 gap-4">
                        {day.transport && (
                          <div className="p-4 border rounded-lg">
                            <h5 className="font-medium mb-2">Transport</h5>
                            <p className="text-sm">{day.transport.mode}: {day.transport.route}</p>
                            <p className="text-primary">{formatCurrency(day.transport.cost)}</p>
                          </div>
                        )}
                        {day.accommodation && (
                          <div className="p-4 border rounded-lg">
                            <h5 className="font-medium mb-2">Stay</h5>
                            <p className="text-sm">{day.accommodation.name}</p>
                            <p className="text-xs text-muted-foreground">{day.accommodation.type}</p>
                            <p className="text-primary">{formatCurrency(day.accommodation.cost)}/night</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Cultural Notes & Packing */}
                {(itinerary.culturalNotes?.length || itinerary.packingList?.length) && (
                  <div className="grid md:grid-cols-2 gap-6">
                    {itinerary.culturalNotes?.length && (
                      <Card className="border-0 shadow-card">
                        <CardHeader>
                          <CardTitle className="text-lg">Cultural Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {itinerary.culturalNotes.map((note, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                {note}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                    {itinerary.packingList?.length && (
                      <Card className="border-0 shadow-card">
                        <CardHeader>
                          <CardTitle className="text-lg">Packing List</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {itinerary.packingList.map((item, idx) => (
                              <Badge key={idx} variant="secondary">{item}</Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
