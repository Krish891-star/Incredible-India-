import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Layers, ZoomIn, ZoomOut, Compass, Info, X, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMapConfiguration } from '@/lib/realMaps';

// India states data with coordinates
const indiaStates = [
  { name: 'Rajasthan', lat: 27.0238, lng: 74.2179, capital: 'Jaipur', description: 'Land of Kings' },
  { name: 'Kerala', lat: 10.8505, lng: 76.2711, capital: 'Thiruvananthapuram', description: "God's Own Country" },
  { name: 'Himachal Pradesh', lat: 31.1048, lng: 77.1734, capital: 'Shimla', description: 'Abode of Snow' },
  { name: 'Goa', lat: 15.2993, lng: 74.1240, capital: 'Panaji', description: 'Pearl of the Orient' },
  { name: 'Karnataka', lat: 15.3173, lng: 75.7139, capital: 'Bengaluru', description: 'One State, Many Worlds' },
  { name: 'Tamil Nadu', lat: 11.1271, lng: 78.6569, capital: 'Chennai', description: 'Land of Temples' },
  { name: 'Maharashtra', lat: 19.7515, lng: 75.7139, capital: 'Mumbai', description: 'Gateway of India' },
  { name: 'Gujarat', lat: 22.2587, lng: 71.1924, capital: 'Gandhinagar', description: 'Land of Legends' },
  { name: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462, capital: 'Lucknow', description: 'Heart of India' },
  { name: 'West Bengal', lat: 22.9868, lng: 87.8550, capital: 'Kolkata', description: 'Land of Culture' },
  { name: 'Punjab', lat: 31.1471, lng: 75.3412, capital: 'Chandigarh', description: 'Land of Five Rivers' },
  { name: 'Madhya Pradesh', lat: 22.9734, lng: 78.6569, capital: 'Bhopal', description: 'Heart of Incredible India' },
];

export default function MapView() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<typeof indiaStates[0] | null>(null);
  const [mapConfig, setMapConfig] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    // Load map configuration
    const loadMapConfig = async () => {
      try {
        const config = await getMapConfiguration();
        setMapConfig(config);
      } catch (error) {
        console.error('Error loading map configuration:', error);
      } finally {
        setLoadingConfig(false);
      }
    };

    loadMapConfig();
  }, []);

  const filteredStates = indiaStates.filter(state =>
    state.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    state.capital.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 h-screen flex">
        {/* Sidebar */}
        <div className="w-80 bg-card border-r border-border flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search states, cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* States List */}
          <div className="flex-1 overflow-auto">
            <div className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {searchQuery ? `${filteredStates.length} Results` : 'All States'}
              </h3>
              <div className="space-y-2">
                {filteredStates.map((state) => (
                  <button
                    key={state.name}
                    onClick={() => setSelectedState(state)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg transition-all duration-200',
                      'hover:bg-secondary',
                      selectedState?.name === state.name && 'bg-primary/10 border border-primary/20'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-primary mt-1" />
                      <div>
                        <p className="font-medium text-foreground">{state.name}</p>
                        <p className="text-sm text-muted-foreground">{state.capital}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative">
          {/* Map Configuration Status */}
          {!loadingConfig && mapConfig && (
            <div className="absolute top-4 left-4 z-10">
              <Badge variant={mapConfig.provider === 'google' ? 'default' : 'secondary'}>
                <Map className="h-3 w-3 mr-1" />
                {mapConfig.provider === 'google' ? 'Google Maps Active' : 'OpenStreetMap'}
              </Badge>
            </div>
          )}

          {/* Map Placeholder with India visualization */}
          <div className="h-full bg-gradient-to-br from-secondary via-muted to-secondary relative overflow-hidden">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/India_topographic_map.svg/800px-India_topographic_map.svg.png"
              alt="India Map"
              className="absolute inset-0 w-full h-full object-contain opacity-30 p-12"
            />

            {/* Interactive State Markers */}
            <div className="absolute inset-0 p-12">
              {indiaStates.map((state, index) => {
                // Simplified positioning based on approximate lat/lng
                const top = ((35 - state.lat) / 30) * 100;
                const left = ((state.lng - 68) / 30) * 100;
                
                return (
                  <button
                    key={state.name}
                    onClick={() => setSelectedState(state)}
                    className={cn(
                      'absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300',
                      'hover:scale-125 z-10',
                      selectedState?.name === state.name && 'scale-125'
                    )}
                    style={{ top: `${top}%`, left: `${left}%` }}
                  >
                    <div className={cn(
                      'w-4 h-4 rounded-full shadow-lg',
                      selectedState?.name === state.name 
                        ? 'bg-primary ring-4 ring-primary/30' 
                        : 'bg-accent hover:bg-primary'
                    )} />
                  </button>
                );
              })}
            </div>

            {/* Selected State Info */}
            {selectedState && (
              <Card className="absolute bottom-6 left-6 w-80 shadow-xl animate-slide-in-right">
                <CardContent className="p-4">
                  <button
                    onClick={() => setSelectedState(null)}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-lg saffron-gradient flex items-center justify-center text-primary-foreground">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold text-foreground">
                        {selectedState.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{selectedState.capital}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3 mb-4">
                    {selectedState.description}
                  </p>
                  <Button
                    variant="saffron"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate(`/states/${selectedState.name.toLowerCase()}`)}
                  >
                    Explore {selectedState.name}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Map Controls */}
            <div className="absolute top-6 right-6 flex flex-col gap-2">
              <Button variant="secondary" size="icon" className="shadow-lg">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="icon" className="shadow-lg">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="icon" className="shadow-lg">
                <Compass className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="icon" className="shadow-lg">
                <Layers className="h-4 w-4" />
              </Button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-6 right-6">
              <Card className="shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Legend</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-accent" />
                      <span className="text-muted-foreground">State Capital</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span className="text-muted-foreground">Selected</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}