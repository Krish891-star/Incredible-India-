import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  Loader2, Plus, TrendingUp, Calendar, Star, 
  MapPin, Users, DollarSign, BookOpen, Settings,
  UserCircle, Briefcase, Bed, Activity
} from 'lucide-react';

interface PassionDashboardProps {
  passionKey: string;
}

export default function PassionDashboard({ passionKey }: PassionDashboardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasRegistration, setHasRegistration] = useState(false);

  useEffect(() => {
    if (user && passionKey) {
      loadDashboardData();
    }
  }, [user, passionKey]);

  const loadDashboardData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Check registration status by looking at specific tables
      let registrationExists = false;
      
      switch (passionKey) {
        case 'tourist':
          const { data: touristData } = await supabase
            .from('tourists')
            .select('id')
            .eq('id', user.id)
            .single();
          registrationExists = !!touristData;
          break;
        case 'tour_guide':
          const { data: guideData } = await supabase
            .from('tour_guides')
            .select('id')
            .eq('id', user.id)
            .single();
          registrationExists = !!guideData;
          break;
        case 'hotel_partner':
          const { data: hotelData } = await supabase
            .from('hotel_partners')
            .select('id')
            .eq('id', user.id)
            .single();
          registrationExists = !!hotelData;
          break;
      }
      
      setHasRegistration(registrationExists);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistrationClick = () => {
    // Navigate to registration form
    navigate(`/${passionKey.replace('_', '-')}-registration`);
  };

  const getPassionIcon = (passion: string) => {
    switch (passion) {
      case 'tourist': return <UserCircle className="h-6 w-6" />;
      case 'tour_guide': return <Briefcase className="h-6 w-6" />;
      case 'hotel_partner': return <Bed className="h-6 w-6" />;
      default: return <Activity className="h-6 w-6" />;
    }
  };

  const getPassionColor = (passion: string) => {
    switch (passion) {
      case 'tourist': return 'from-orange-500 to-red-500';
      case 'tour_guide': return 'from-green-500 to-emerald-500';
      case 'hotel_partner': return 'from-purple-500 to-violet-500';
      default: return 'from-blue-500 to-indigo-500';
    }
  };

  const getPassionDisplayName = (passion: string) => {
    switch (passion) {
      case 'tourist': return 'Tourist';
      case 'tour_guide': return 'Tour Guide';
      case 'hotel_partner': return 'Hotel Partner';
      default: return 'User';
    }
  };

  const getPassionDescription = (passion: string) => {
    switch (passion) {
      case 'tourist': return 'Explore incredible destinations across India';
      case 'tour_guide': return 'Share your expertise and guide travelers';
      case 'hotel_partner': return 'Manage your hospitality business';
      default: return 'Welcome to your dashboard';
    }
  };

  const getDashboardWidgets = () => {
    const widgetComponents = [];

    // Tourist widgets
    if (passionKey === 'tourist') {
      widgetComponents.push(
        <Card key="destinations" className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Explore Destinations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">States to explore</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 w-full"
              onClick={() => navigate('/states')}
            >
              Browse States
            </Button>
          </CardContent>
        </Card>
      );

      widgetComponents.push(
        <Card key="bookings" className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Active bookings</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 w-full"
              onClick={() => navigate('/trip-planner')}
            >
              Plan Trip
            </Button>
          </CardContent>
        </Card>
      );
    }

    // Tour Guide widgets
    if (passionKey === 'tour_guide') {
      widgetComponents.push(
        <Card key="guide-bookings" className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tour Bookings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">This month</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 w-full"
              onClick={() => navigate('/guides')}
            >
              View Directory
            </Button>
          </CardContent>
        </Card>
      );

      widgetComponents.push(
        <Card key="earnings" className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹0</div>
            <p className="text-xs text-muted-foreground">This month</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 w-full"
              onClick={() => navigate('/profile')}
            >
              View Profile
            </Button>
          </CardContent>
        </Card>
      );
    }

    // Hotel Partner widgets
    if (passionKey === 'hotel_partner') {
      widgetComponents.push(
        <Card key="occupancy" className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">This month</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 w-full"
              onClick={() => navigate('/hotels')}
            >
              View Hotels
            </Button>
          </CardContent>
        </Card>
      );

      widgetComponents.push(
        <Card key="revenue" className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹0</div>
            <p className="text-xs text-muted-foreground">This month</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 w-full"
              onClick={() => navigate('/profile')}
            >
              Manage Property
            </Button>
          </CardContent>
        </Card>
      );
    }

    return widgetComponents;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-full bg-gradient-to-r ${getPassionColor(passionKey)} text-white`}>
            {getPassionIcon(passionKey)}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{getPassionDisplayName(passionKey)} Dashboard</h1>
            <p className="text-muted-foreground">{getPassionDescription(passionKey)}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/settings')}
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Registration Status */}
      {!hasRegistration && (
        <Alert className="border-orange-200 bg-orange-50">
          <Plus className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Complete your {getPassionDisplayName(passionKey).toLowerCase()} registration to unlock all features.</span>
            <Button 
              size="sm" 
              onClick={handleRegistrationClick}
              className={`ml-4 bg-gradient-to-r ${getPassionColor(passionKey)} text-white hover:opacity-90`}
            >
              Complete Registration
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Dashboard Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getDashboardWidgets()}
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/profile')}>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <UserCircle className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-lg">View Profile</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage your account settings and personal information
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/map')}>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-green-500" />
                <CardTitle className="text-lg">Explore Map</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Discover destinations and attractions on the interactive map
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/saved')}>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-lg">Saved Places</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View your bookmarked destinations and favorite places
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}