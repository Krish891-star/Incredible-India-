import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Search, MapPin, Maximize2 } from 'lucide-react';

export default function MapSection() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <section className="py-24 bg-gradient-to-b from-secondary/30 to-background relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="order-2 lg:order-1">
            <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary">
              Interactive Experience
            </Badge>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
              Explore India with <span className="text-gradient">360° Maps</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Navigate through India like never before. Our interactive map lets you explore every state, 
              discover hidden gems, and plan your perfect route with immersive 360-degree views.
            </p>

            {/* Search */}
            <div className="relative mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for states, cities, or landmarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg bg-card border-border/50"
              />
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap gap-3 mb-8">
              {['Taj Mahal', 'Jaipur', 'Kerala Backwaters', 'Varanasi'].map((place) => (
                <Badge
                  key={place}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors py-2 px-4"
                  onClick={() => setSearchQuery(place)}
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  {place}
                </Badge>
              ))}
            </div>

            <Button
              variant="saffron"
              size="xl"
              onClick={() => navigate('/map')}
              className="group"
            >
              <Maximize2 className="h-5 w-5" />
              Open Full Map
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {/* Right - Map Preview */}
          <div className="order-1 lg:order-2">
            <Card className="overflow-hidden border-0 shadow-xl">
              <CardContent className="p-0 relative">
                {/* Map Preview Image */}
                <div className="relative h-[500px] bg-gradient-to-br from-secondary to-muted overflow-hidden rounded-lg">
                  <img
                    src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200"
                    alt="Map of India"
                    className="w-full h-full object-cover opacity-30"
                  />
                  
                  {/* Overlay with India Map Outline */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      {/* Pulsing markers */}
                      <div className="absolute top-10 left-20 w-4 h-4 bg-primary rounded-full animate-pulse shadow-glow" />
                      <div className="absolute top-32 right-16 w-4 h-4 bg-accent rounded-full animate-pulse shadow-glow" style={{ animationDelay: '0.5s' }} />
                      <div className="absolute bottom-20 left-32 w-4 h-4 bg-gold rounded-full animate-pulse shadow-glow" style={{ animationDelay: '1s' }} />
                      <div className="absolute bottom-10 right-24 w-4 h-4 bg-terracotta rounded-full animate-pulse shadow-glow" style={{ animationDelay: '1.5s' }} />

                      {/* Central Message */}
                      <div className="text-center p-8 bg-card/90 backdrop-blur-sm rounded-2xl shadow-card">
                        <MapPin className="h-12 w-12 mx-auto mb-4 text-primary" />
                        <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                          Interactive Map
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          Click to explore all 28 states
                        </p>
                        <Button variant="outline" size="sm" onClick={() => navigate('/map')}>
                          Enter Map View
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
