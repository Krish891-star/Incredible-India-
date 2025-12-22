import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  UserCircle, Briefcase, Bed, MapPin, Loader2 
} from 'lucide-react';
import { toast } from 'sonner';

interface Passion {
  passion_type: 'tourist' | 'tour_guide' | 'hotel_partner';
}

interface PassionSelectorProps {
  userId: string;
}

export default function PassionSelector({ userId }: PassionSelectorProps) {
  const navigate = useNavigate();
  const [passions, setPassions] = useState<Passion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    fetchUserPassions();
  }, [userId]);

  const fetchUserPassions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_passions')
        .select('passion_type')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      if (data) {
        setPassions(data as Passion[]);
      }
    } catch (error) {
      console.error('Error fetching passions:', error);
      toast.error('Failed to load your passions');
    } finally {
      setLoading(false);
    }
  };

  const handlePassionSelect = async (passion: Passion['passion']) => {
    setSelecting(true);
    
    try {
      // Update user's current passion in metadata
      const { error } = await supabase.auth.updateUser({
        data: { current_passion: passion }
      });
      
      if (error) throw error;
      
      // Redirect based on selected passion
      switch (passion) {
        case 'tour_guide':
          // Check if tour guide has completed registration
          const { data: guideProfile } = await supabase
            .from('tour_guides')
            .select('id')
            .eq('id', userId)
            .single();

          if (guideProfile) {
            toast.success('Welcome back, Tour Guide!');
            navigate('/profile');
          } else {
            toast.success('Please complete your tour guide registration.');
            navigate('/tour-guide-registration');
          }
          break;
          
        case 'hotel_partner':
          // Check if hotel partner has completed registration
          const { data: hotelProfile } = await supabase
            .from('hotel_partners')
            .select('id')
            .eq('id', userId)
            .single();

          if (hotelProfile) {
            toast.success('Welcome back, Hotel Partner!');
            navigate('/profile');
          } else {
            toast.success('Please complete your hotel partner registration.');
            navigate('/hotel-partner-registration');
          }
          break;
          
        default:
          // Check if tourist has completed registration
          const { data: touristProfile } = await supabase
            .from('tourists')
            .select('id')
            .eq('id', userId)
            .single();

          if (touristProfile) {
            toast.success('Welcome back!');
            navigate('/');
          } else {
            toast.success('Please complete your tourist registration.');
            navigate('/tourist-registration');
          }
          break;
      }
    } catch (error) {
      console.error('Error selecting passion:', error);
      toast.error('Failed to switch passion');
    } finally {
      setSelecting(false);
    }
  };

  const getPassionIcon = (passion: Passion['passion']) => {
    switch (passion) {
      case 'tour_guide': return <Briefcase className="h-6 w-6" />;
      case 'hotel_partner': return <Bed className="h-6 w-6" />;
      default: return <UserCircle className="h-6 w-6" />;
    }
  };

  const getPassionLabel = (passion: Passion['passion']) => {
    switch (passion) {
      case 'tour_guide': return 'Tour Guide';
      case 'hotel_partner': return 'Hotel Partner';
      default: return 'Tourist';
    }
  };

  const getPassionDescription = (passion: Passion['passion']) => {
    switch (passion) {
      case 'tour_guide': return 'Share your expertise and guide travelers';
      case 'hotel_partner': return 'List your property and manage bookings';
      default: return 'Explore India and book experiences';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center mb-4">
            <MapPin className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Choose Your Passion</h1>
          <p className="mt-2 text-gray-600">
            You have multiple passions. Select one to continue.
          </p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Your Passions
            </CardTitle>
            <CardDescription className="text-center">
              Select a passion to continue
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {passions.map((passion) => (
                <Button
                  key={passion.passion_type}
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  onClick={() => handlePassionSelect(passion.passion_type)}
                  disabled={selecting}
                >
                  {getPassionIcon(passion.passion_type)}
                  <span className="font-medium">{getPassionLabel(passion.passion_type)}</span>
                  <span className="text-xs text-muted-foreground">
                    {getPassionDescription(passion.passion_type)}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}