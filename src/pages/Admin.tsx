import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { 
  getAllHotels, 
  getHotel, 
  getTourGuide,
  getPendingHotels,
  updateHotelStatus,
  getPendingTourGuides,
  updateTourGuideVerificationStatus
} from '@/lib/supabaseData';
import { userProfileService } from '@/services/database.service';
import type { Hotel, TourGuide } from '@/lib/supabaseData';
import { emailService } from '@/lib/emailService';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Loader2, Shield, MapPin, Mountain, Users, BarChart3, 
  Plus, Edit2, Trash2, Eye, Search, Check, X, Bed, UserCheck, Clock
} from 'lucide-react';

interface State {
  id: string;
  name: string;
  capital: string | null;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

interface Attraction {
  id: string;
  name: string;
  type: string;
  state_id: string | null;
  city: string | null;
  rating: number | null;
  created_at: string;
}

interface Hotel {
  id: string;
  name: string;
  location: {
    city: string;
    state: string;
  };
  contact: {
    email: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

type User = import('@/lib/supabaseData').UserProfile;

interface Guide {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  createdAt: string;
  verified: boolean;
}

export default function Admin() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [states, setStates] = useState<State[]>([]);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [users, setUsers] = useState<User[]>([]); // Add users state
  const [guides, setGuides] = useState<Guide[]>([]); // Add guides state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    hotelStatus: 'all' as 'all' | 'pending' | 'approved' | 'rejected'
  });

  // Stats
  const [stats, setStats] = useState({
    totalStates: 0,
    totalAttractions: 0,
    totalUsers: 0,
    pendingHotels: 0,
    approvedHotels: 0
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (user) {
      checkAdminRole();
    }
  }, [user, authLoading, navigate]);

  const checkAdminRole = () => {
    if (!user) return;

    try {
      // Check if user is the super admin
      const superAdminEmail = (import.meta.env && import.meta.env.VITE_SUPER_ADMIN_EMAIL) ? import.meta.env.VITE_SUPER_ADMIN_EMAIL : 'krish141213@gmail.com';
      const isAdminUser = user.role === 'admin' && user.email === superAdminEmail;
      setIsAdmin(isAdminUser);
      
      if (isAdminUser) {
        fetchData();
      }
    } catch (error) {
      console.error('Error checking admin role:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Mock states data
      const mockStates: State[] = [
        {
          id: '1',
          name: 'Delhi',
          capital: 'New Delhi',
          description: 'The capital of India',
          image_url: null,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Maharashtra',
          capital: 'Mumbai',
          description: 'Financial capital of India',
          image_url: null,
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Rajasthan',
          capital: 'Jaipur',
          description: 'Land of kings and forts',
          image_url: null,
          created_at: new Date().toISOString()
        },
        {
          id: '4',
          name: 'Uttar Pradesh',
          capital: 'Lucknow',
          description: 'Heart of India with rich culture',
          image_url: null,
          created_at: new Date().toISOString()
        },
        {
          id: '5',
          name: 'Karnataka',
          capital: 'Bengaluru',
          description: 'Tech hub of India',
          image_url: null,
          created_at: new Date().toISOString()
        },
        {
          id: '6',
          name: 'Tamil Nadu',
          capital: 'Chennai',
          description: 'Land of temples and traditions',
          image_url: null,
          created_at: new Date().toISOString()
        },
        {
          id: '7',
          name: 'West Bengal',
          capital: 'Kolkata',
          description: 'Cultural capital of India',
          image_url: null,
          created_at: new Date().toISOString()
        },
        {
          id: '8',
          name: 'Gujarat',
          capital: 'Gandhinagar',
          description: 'Home to diverse culture and industries',
          image_url: null,
          created_at: new Date().toISOString()
        },
        {
          id: '9',
          name: 'Telangana',
          capital: 'Hyderabad',
          description: 'Emerging IT hub with historical sites',
          image_url: null,
          created_at: new Date().toISOString()
        },
        {
          id: '10',
          name: 'Madhya Pradesh',
          capital: 'Bhopal',
          description: 'Heart of India with rich wildlife',
          image_url: null,
          created_at: new Date().toISOString()
        }
      ];
      
      setStates(mockStates);

      // Mock attractions data
      const mockAttractions: Attraction[] = [
        {
          id: '1',
          name: 'Red Fort',
          type: 'Historical Site',
          state_id: '1',
          city: 'Delhi',
          rating: 4.5,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Gateway of India',
          type: 'Landmark',
          state_id: '2',
          city: 'Mumbai',
          rating: 4.3,
          created_at: new Date().toISOString()
        }
      ];
      
      setAttractions(mockAttractions);

      // Fetch all users
      const allUsersResponse = await userProfileService.getAllProfiles();
      const allUsers = allUsersResponse.success && allUsersResponse.data ? allUsersResponse.data : [];
      setUsers(allUsers);

      // Fetch all hotels for admin (including pending)
      const allHotels = await getAllHotels(true);
      // Sort by newest first
      const sortedHotels = [...allHotels].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setHotels(sortedHotels);
      
      // Fetch pending tour guides
      const pendingGuides = await getPendingTourGuides();
      const guideData: Guide[] = pendingGuides.map(guide => ({
        id: guide.id,
        full_name: guide.full_name,
        email: guide.email,
        phone: guide.phone,
        city: guide.city,
        state: guide.state,
        createdAt: guide.created_at,
        verified: guide.verified
      }));
      setGuides(guideData);
      
      // Set stats
      setStats({
        totalStates: mockStates.length,
        totalAttractions: mockAttractions.length,
        totalUsers: allUsers.length,
        pendingHotels: allHotels.filter(hotel => hotel.status === 'pending').length,
        approvedHotels: allHotels.filter(hotel => hotel.status === 'approved').length
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <Shield className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h1 className="font-display text-3xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-8">
            You don't have permission to access the admin dashboard. 
            Please contact an administrator if you believe this is an error.
          </p>
          <Button onClick={() => navigate('/')}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  const handleApproveHotel = async (hotelId: string) => {
    try {
      const result = await updateHotelStatus(hotelId, 'approved');
      if (result.success) {
        // Send approval notification email
        try {
          const hotel = await getHotel(hotelId);
          if (hotel) {
            await emailService.sendHotelApprovalNotification(
              hotel.contact.email,
              hotel.name,
              hotel.contact.email // Using email as owner name since we don't have owner name in the hotel object
            );
          }
        } catch (emailError) {
          console.error('Failed to send approval email:', emailError);
          // Don't throw error for email failure, just log it
        }
        
        toast.success('Hotel approved successfully');
        // Refresh the hotel list
        fetchData();
      } else {
        toast.error(result.error || 'Failed to approve hotel');
      }
    } catch (error) {
      console.error('Error approving hotel:', error);
      toast.error('Failed to approve hotel');
    }
  };

  const handleRejectHotel = async (hotelId: string) => {
    try {
      const result = await updateHotelStatus(hotelId, 'rejected');
      if (result.success) {
        // Send rejection notification email
        try {
          const hotel = await getHotel(hotelId);
          if (hotel) {
            await emailService.sendHotelRejectionNotification(hotel.contact.email, hotel.name);
          }
        } catch (emailError) {
          console.error('Failed to send rejection email:', emailError);
          // Don't throw error for email failure, just log it
        }
        
        toast.success('Hotel rejected successfully');
        // Refresh the hotel list
        fetchData();
      } else {
        toast.error(result.error || 'Failed to reject hotel');
      }
    } catch (error) {
      console.error('Error rejecting hotel:', error);
      toast.error('Failed to reject hotel');
    }
  };

  const handleApproveGuide = async (guideId: string) => {
    try {
      const result = await updateTourGuideVerificationStatus(guideId, true);
      if (result.success) {
        // Send approval notification email
        try {
          const guide = await getTourGuide(guideId);
          if (guide) {
            await emailService.sendTourGuideApprovalNotification(guide.email, guide.full_name);
          }
        } catch (emailError) {
          console.error('Failed to send approval email:', emailError);
          // Don't throw error for email failure, just log it
        }
        
        toast.success('Guide approved successfully');
        // Refresh the guide list
        fetchData();
      } else {
        toast.error(result.error || 'Failed to approve guide');
      }
    } catch (error) {
      console.error('Error approving guide:', error);
      toast.error('Failed to approve guide');
    }
  };

  const handleRejectGuide = async (guideId: string) => {
    try {
      const result = await updateTourGuideVerificationStatus(guideId, false);
      if (result.success) {
        // Send rejection notification email
        try {
          const guide = await getTourGuide(guideId);
          if (guide) {
            await emailService.sendTourGuideRejectionNotification(guide.email, guide.full_name);
          }
        } catch (emailError) {
          console.error('Failed to send rejection email:', emailError);
          // Don't throw error for email failure, just log it
        }
        
        toast.success('Guide rejected successfully');
        // Refresh the guide list
        fetchData();
      } else {
        toast.error(result.error || 'Failed to reject guide');
      }
    } catch (error) {
      console.error('Error rejecting guide:', error);
      toast.error('Failed to reject guide');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Manage platform content and users</p>
          </div>
          <Badge variant="outline" className="text-lg py-2 px-4">
            <Shield className="h-4 w-4 mr-2" />
            Administrator
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <Card className="border-0 shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalStates}</p>
                  <p className="text-sm text-muted-foreground">States</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Mountain className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalAttractions}</p>
                  <p className="text-sm text-muted-foreground">Attractions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-sm text-muted-foreground">Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendingHotels}</p>
                  <p className="text-sm text-muted-foreground">Pending Hotels</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.approvedHotels}</p>
                  <p className="text-sm text-muted-foreground">Approved Hotels</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="states" className="space-y-6">
          <TabsList>
            <TabsTrigger value="states">States</TabsTrigger>
            <TabsTrigger value="attractions">Attractions</TabsTrigger>
            <TabsTrigger value="hotels">Hotel Approvals</TabsTrigger>
            <TabsTrigger value="guides">Guide Approvals</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="states">
            <Card className="border-0 shadow-card">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Manage States</CardTitle>
                  <CardDescription>Add, edit, or remove states from the platform</CardDescription>
                </div>
                <Button variant="saffron">
                  <Plus className="h-4 w-4 mr-2" />
                  Add State
                </Button>
              </CardHeader>
              <CardContent>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search states..." 
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Capital</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {states
                      .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(state => (
                        <TableRow key={state.id}>
                          <TableCell className="font-medium">{state.name}</TableCell>
                          <TableCell>{state.capital || '—'}</TableCell>
                          <TableCell>{new Date(state.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attractions">
            <Card className="border-0 shadow-card">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Manage Attractions</CardTitle>
                  <CardDescription>Add, edit, or remove attractions from the platform</CardDescription>
                </div>
                <Button variant="saffron">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Attraction
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attractions.map(attraction => (
                      <TableRow key={attraction.id}>
                        <TableCell className="font-medium">{attraction.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{attraction.type}</Badge>
                        </TableCell>
                        <TableCell>{attraction.city || '—'}</TableCell>
                        <TableCell>{attraction.rating?.toFixed(1) || '—'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hotels">
            <Card className="border-0 shadow-card">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Hotel Management</CardTitle>
                  <CardDescription>Review, approve, or reject hotel registrations</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {hotels.length > 0 ? (
                  <>
                    <div className="mb-4 flex gap-2">
                      <Badge variant={filters.hotelStatus === 'all' ? 'default' : 'secondary'} 
                             className="cursor-pointer" 
                             onClick={() => setFilters({...filters, hotelStatus: 'all'})}>
                        All Hotels
                      </Badge>
                      <Badge variant={filters.hotelStatus === 'pending' ? 'default' : 'secondary'} 
                             className="cursor-pointer" 
                             onClick={() => setFilters({...filters, hotelStatus: 'pending'})}>
                        Pending
                      </Badge>
                      <Badge variant={filters.hotelStatus === 'approved' ? 'default' : 'secondary'} 
                             className="cursor-pointer" 
                             onClick={() => setFilters({...filters, hotelStatus: 'approved'})}>
                        Approved
                      </Badge>
                      <Badge variant={filters.hotelStatus === 'rejected' ? 'default' : 'secondary'} 
                             className="cursor-pointer" 
                             onClick={() => setFilters({...filters, hotelStatus: 'rejected'})}>
                        Rejected
                      </Badge>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Hotel Name</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {hotels
                          .filter(hotel => filters.hotelStatus === 'all' || hotel.status === filters.hotelStatus)
                          .map(hotel => (
                            <TableRow key={hotel.id}>
                              <TableCell className="font-medium">{hotel.name}</TableCell>
                              <TableCell>
                                {hotel.location.city}, {hotel.location.state}
                              </TableCell>
                              <TableCell>{hotel.contact.email}</TableCell>
                              <TableCell>
                                <Badge variant={
                                  hotel.status === 'pending' ? 'secondary' : 
                                  hotel.status === 'approved' ? 'default' : 'destructive'
                                }>
                                  {hotel.status.charAt(0).toUpperCase() + hotel.status.slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell>{new Date(hotel.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {/* View hotel details */}}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {hotel.status === 'pending' && (
                                    <>
                                      <Button 
                                        variant="default" 
                                        size="sm"
                                        onClick={() => handleApproveHotel(hotel.id)}
                                      >
                                        <Check className="h-4 w-4 mr-1" />
                                        Approve
                                      </Button>
                                      <Button 
                                        variant="destructive" 
                                        size="sm"
                                        onClick={() => handleRejectHotel(hotel.id)}
                                      >
                                        <X className="h-4 w-4 mr-1" />
                                        Reject
                                      </Button>
                                    </>
                                  )}
                                  {hotel.status === 'approved' && (
                                    <Button 
                                      variant="destructive" 
                                      size="sm"
                                      onClick={() => handleRejectHotel(hotel.id)}
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      Reject
                                    </Button>
                                  )}
                                  {hotel.status === 'rejected' && (
                                    <Button 
                                      variant="default" 
                                      size="sm"
                                      onClick={() => handleApproveHotel(hotel.id)}
                                    >
                                      <Check className="h-4 w-4 mr-1" />
                                      Approve
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        }
                      </TableBody>
                    </Table>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Bed className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="font-display text-xl mb-2">No Hotels Found</h3>
                    <p className="text-muted-foreground">There are no hotels matching your current filters.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guides">
            <Card className="border-0 shadow-card">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Guide Approvals</CardTitle>
                  <CardDescription>Review and approve pending tour guide registrations</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {guides.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Guide Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {guides.map(guide => (
                        <TableRow key={guide.id}>
                          <TableCell className="font-medium">{guide.full_name}</TableCell>
                          <TableCell>
                            <div>{guide.email}</div>
                            <div className="text-sm text-muted-foreground">{guide.phone}</div>
                          </TableCell>
                          <TableCell>
                            {guide.city}, {guide.state}
                          </TableCell>
                          <TableCell>{new Date(guide.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => handleApproveGuide(guide.id)}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleRejectGuide(guide.id)}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <UserCheck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="font-display text-xl mb-2">No Pending Guides</h3>
                    <p className="text-muted-foreground">There are no tour guides awaiting approval at this time.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="border-0 shadow-card">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>View and manage platform users</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {users.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map(user => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={
                              user.role === 'admin' ? 'default' : 
                              user.role === 'tour_guide' ? 'secondary' : 'outline'
                            }>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="font-display text-xl mb-2">No Users Found</h3>
                    <p className="text-muted-foreground">There are no users registered on the platform yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              <Card className="border-0 shadow-card">
                <CardHeader>
                  <CardTitle>Platform Overview</CardTitle>
                  <CardDescription>Key metrics and statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-0 shadow-sm">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Users className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{stats.totalUsers}</p>
                            <p className="text-sm text-muted-foreground">Total Users</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-0 shadow-sm">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <Bed className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{hotels.length}</p>
                            <p className="text-sm text-muted-foreground">Total Hotels</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-0 shadow-sm">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <UserCheck className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{guides.length}</p>
                            <p className="text-sm text-muted-foreground">Total Guides</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-0 shadow-sm">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <MapPin className="h-6 w-6 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{stats.totalStates}</p>
                            <p className="text-sm text-muted-foreground">States</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-card">
                  <CardHeader>
                    <CardTitle>User Distribution</CardTitle>
                    <CardDescription>By role</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(users.reduce((acc, user) => {
                        acc[user.role] = (acc[user.role] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)).map(([role, count]) => (
                        <div key={role} className="flex items-center justify-between">
                          <span className="capitalize">{role.replace('_', ' ')}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${(count / Math.max(stats.totalUsers, 1)) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium w-8">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-0 shadow-card">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Last 7 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>New Registrations</span>
                        <span className="font-medium">12</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Hotel Submissions</span>
                        <span className="font-medium">5</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Guide Applications</span>
                        <span className="font-medium">8</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Bookings</span>
                        <span className="font-medium">24</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Reviews</span>
                        <span className="font-medium">17</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="border-0 shadow-card">
                <CardHeader>
                  <CardTitle>Popular Destinations</CardTitle>
                  <CardDescription>Most viewed states</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: 'Rajasthan', views: 1242 },
                      { name: 'Kerala', views: 987 },
                      { name: 'Goa', views: 856 },
                      { name: 'Tamil Nadu', views: 743 },
                      { name: 'Uttar Pradesh', views: 621 }
                    ].map((destination, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground w-6">#{index + 1}</span>
                          <span>{destination.name}</span>
                        </div>
                        <span className="font-medium">{destination.views.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
