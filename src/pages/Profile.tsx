import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  MapPin, 
  Calendar, 
  Phone, 
  Mail, 
  Globe, 
  Award, 
  Star, 
  Edit3, 
  CheckCircle, 
  Clock, 
  XCircle,
  Bed,
  Users,
  Languages,
  Wallet,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoleStatus {
  role: 'tourist' | 'tour_guide' | 'hotel_partner';
  status: 'pending' | 'completed' | 'approved' | 'rejected';
  title: string;
  icon: React.ReactNode;
  color: string;
}

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [roleStatuses, setRoleStatuses] = useState<RoleStatus[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfileData();
      loadRoleStatuses();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load user profile data
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      setProfileData(profile);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoleStatuses = async () => {
    if (!user) return;
    
    try {
      // Get user passions directly from user_passions table
      const { data: passions, error: passionError } = await supabase
        .from('user_passions')
        .select('passion')
        .eq('user_id', user.id);
      
      if (passionError) {
        console.error('Error loading passions:', passionError);
        return;
      }
      
      // Check registrations for each role
      const roles = ['tourist', 'tour_guide', 'hotel_partner'];
      const roleStatusesData: RoleStatus[] = [];
      
      for (const role of roles) {
        let status = 'pending';
        let hasPassion = false;
        
        // Check if user has this passion
        if (passions) {
          hasPassion = passions.some(p => p.passion === role);
        }
        
        // Check if user has completed registration for this role
        if (hasPassion) {
          let registration = null;
          
          switch (role) {
            case 'tourist':
              const { data: touristReg } = await supabase
                .from('tourists')
                .select('id')
                .eq('id', user.id)
                .single();
              registration = touristReg;
              break;
            case 'tour_guide':
              const { data: guideReg } = await supabase
                .from('tour_guides')
                .select('id')
                .eq('id', user.id)
                .single();
              registration = guideReg;
              break;
            case 'hotel_partner':
              const { data: hotelReg } = await supabase
                .from('hotel_partners')
                .select('id')
                .eq('id', user.id)
                .single();
              registration = hotelReg;
              break;
          }
          
          if (registration) {
            status = 'completed';
          }
        }
        
        // Only add roles that user has passion for OR completed registration
        if (hasPassion || status === 'completed') {
          let roleData: RoleStatus;
          
          switch (role) {
            case 'tourist':
              roleData = {
                role: 'tourist',
                status: status as any,
                title: 'Tourist Profile',
                icon: <MapPin className="h-4 w-4" />,
                color: 'bg-blue-500'
              };
              break;
            case 'tour_guide':
              roleData = {
                role: 'tour_guide',
                status: status as any,
                title: 'Tour Guide Profile',
                icon: <Users className="h-4 w-4" />,
                color: 'bg-green-500'
              };
              break;
            case 'hotel_partner':
              roleData = {
                role: 'hotel_partner',
                status: status as any,
                title: 'Hotel Partner Profile',
                icon: <Bed className="h-4 w-4" />,
                color: 'bg-purple-500'
              };
              break;
            default:
              continue;
          }
          
          roleStatusesData.push(roleData);
        }
      }
      
      setRoleStatuses(roleStatusesData);
    } catch (error) {
      console.error('Error loading role statuses:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your account settings and profile information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4">
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-24 h-24 mx-auto flex items-center justify-center">
                    <User className="h-12 w-12 text-gray-400" />
                  </div>
                </div>
                <CardTitle className="text-xl">{profileData?.full_name || 'User'}</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
                <Badge className="mt-2">
                  {profileData?.user_role === 'tour_guide' ? 'Tour Guide' : 
                   profileData?.user_role === 'hotel_partner' ? 'Hotel Partner' : 'Tourist'}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {user?.email}
                  </div>
                  {profileData?.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      {profileData.phone}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    Member since {new Date(profileData?.created_at || '').toLocaleDateString()}
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/settings')}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

            {/* Role Status Cards */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Registration Status</CardTitle>
                <CardDescription>Track your registration progress for different roles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {roleStatuses.length > 0 
                  ? roleStatuses.map((role) => (
                    <div 
                      key={role.role} 
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => {
                        if (role.role === 'tourist') {
                          navigate('/tourist-registration');
                        } else if (role.role === 'tour_guide') {
                          navigate('/tour-guide-registration');
                        } else if (role.role === 'hotel_partner') {
                          navigate('/hotel-partner-registration');
                        }
                      }}
                    >
                      <div className="flex items-center">
                        <div className={`p-2 rounded-md ${role.color} text-white mr-3`}>
                          {role.icon}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{role.title}</p>
                          <Badge className={getStatusColor(role.status)}>
                            {getStatusText(role.status)}
                          </Badge>
                        </div>
                      </div>
                      {getStatusIcon(role.status)}
                    </div>
                  ))
                  : (
                    <div className="text-center py-4 text-gray-500">
                      <p>You haven't registered for any roles yet.</p>
                      <Button 
                        className="mt-2"
                        onClick={() => navigate('/tourist-registration')}
                      >
                        Register as Tourist
                      </Button>
                    </div>
                  )
                }
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Overview</CardTitle>
                    <CardDescription>Your account information and preferences</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-lg mb-3">Personal Information</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Full Name</span>
                            <span>{profileData?.full_name || 'Not set'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Email</span>
                            <span>{user?.email}</span>
                          </div>
                          {profileData?.phone && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Phone</span>
                              <span>{profileData.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-lg mb-3">Preferences</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Language</span>
                            <span>English</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Notifications</span>
                            <span>Enabled</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="activity" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your recent actions and bookings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <Globe className="h-12 w-12 mx-auto mb-3" />
                      <p>No recent activity found</p>
                      <p className="text-sm mt-1">Your recent bookings and interactions will appear here</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="settings" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>Manage your account preferences and security</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button 
                        variant="outline" 
                        className="w-full justify-between"
                        onClick={() => navigate('/settings')}
                      >
                        <span>Account Settings</span>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-between"
                        onClick={() => navigate('/saved')}
                      >
                        <span>Saved Places</span>
                        <MapPin className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;