import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import PassionDashboard from '@/components/PassionDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, AlertCircle, Home, UserCircle, Briefcase, Bed } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isLoadingPassion, setIsLoadingPassion] = useState(true);
  const [primaryPassion, setPrimaryPassion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRoleSelection, setShowRoleSelection] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (user) {
      loadUserPassion();
    }
  }, [user, loading, navigate]);

  const loadUserPassion = async () => {
    if (!user) return;

    setIsLoadingPassion(true);
    setError(null);

    try {
      // First, get user profile to check their user_role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error loading user profile:', profileError);
      }

      // Check if user has any passions
      const { data: passions, error: passionError } = await supabase
        .from('user_passions')
        .select('passion')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }); // Get oldest first (original signup passion)

      if (passionError) {
        console.error('Error loading user passions:', passionError);
        setError('Failed to load your profile. Please try again.');
        return;
      }

      // Determine primary passion with priority:
      // 1. Use user_role from profile (most reliable)
      // 2. Use first passion from user_passions (original signup)
      // 3. Show role selection if neither exists
      let primaryPassionToUse = null;

      if (profile && profile.user_role) {
        // Use user_role from profile as primary source of truth
        primaryPassionToUse = profile.user_role;
        console.log('Using user_role from profile:', primaryPassionToUse);
      } else if (passions && passions.length > 0) {
        // Fallback to first passion (oldest = original signup)
        primaryPassionToUse = passions[0].passion;
        console.log('Using first passion from user_passions:', primaryPassionToUse);
      }

      if (primaryPassionToUse) {
        setPrimaryPassion(primaryPassionToUse);
      } else {
        // No passions found, show role selection
        console.log('No passions found for user, showing role selection');
        setShowRoleSelection(true);
      }
    } catch (err: any) {
      console.error('Error loading user passion:', err);
      setError('Failed to load dashboard. Please try again.');
      toast.error('Failed to load dashboard');
    } finally {
      setIsLoadingPassion(false);
    }
  };

  const handleRoleSelection = async (role: string) => {
    if (!user) return;

    try {
      // Add the passion to user_passions table
      const { error: passionError } = await supabase
        .from('user_passions')
        .insert({ user_id: user.id, passion: role });

      if (passionError) {
        console.error('Error adding passion:', passionError);
        toast.error('Failed to set your role. Please try again.');
        return;
      }

      // Update user profile with the role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ user_role: role })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        // Don't show error as passion was added successfully
      }

      setPrimaryPassion(role);
      setShowRoleSelection(false);
      toast.success('Your role has been set successfully!');
    } catch (err: any) {
      console.error('Error setting role:', err);
      toast.error('Failed to set your role. Please try again.');
    }
  };

  if (loading || isLoadingPassion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading your personalized dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center space-y-4">
              <AlertCircle className="h-16 w-16 text-orange-500 mx-auto" />
              <h2 className="text-2xl font-bold">Dashboard Unavailable</h2>
              <p className="text-muted-foreground">{error}</p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => navigate('/')}>
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
                <Button variant="outline" onClick={loadUserPassion}>
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showRoleSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 py-12">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Role</h2>
                <p className="text-gray-600">Select how you want to use the platform</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-32 flex flex-col items-center justify-center gap-3 text-left hover:bg-orange-50"
                  onClick={() => handleRoleSelection('tourist')}
                >
                  <UserCircle className="h-8 w-8 text-orange-500" />
                  <div>
                    <div className="font-semibold">Tourist</div>
                    <div className="text-sm text-muted-foreground">Explore incredible destinations</div>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-32 flex flex-col items-center justify-center gap-3 text-left hover:bg-green-50"
                  onClick={() => handleRoleSelection('tour_guide')}
                >
                  <Briefcase className="h-8 w-8 text-green-500" />
                  <div>
                    <div className="font-semibold">Tour Guide</div>
                    <div className="text-sm text-muted-foreground">Share your expertise</div>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-32 flex flex-col items-center justify-center gap-3 text-left hover:bg-purple-50"
                  onClick={() => handleRoleSelection('hotel_partner')}
                >
                  <Bed className="h-8 w-8 text-purple-500" />
                  <div>
                    <div className="font-semibold">Hotel Partner</div>
                    <div className="text-sm text-muted-foreground">Manage your property</div>
                  </div>
                </Button>
              </div>
              
              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Complete Your Setup:</strong> Choose your role to access your personalized dashboard and features.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!primaryPassion) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center space-y-4">
              <AlertCircle className="h-16 w-16 text-orange-500 mx-auto" />
              <h2 className="text-2xl font-bold">Setup Required</h2>
              <p className="text-muted-foreground">
                Please complete your profile setup to access your dashboard.
              </p>
              <Button onClick={() => setShowRoleSelection(true)}>
                Choose Your Role
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <PassionDashboard passionKey={primaryPassion} />
      </div>
    </div>
  );
}