import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { RegistrationService } from '@/services/registration.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, CheckCircle, Bed } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const hotelTypes = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'resort', label: 'Resort' },
  { value: 'homestay', label: 'Homestay' },
  { value: 'lodge', label: 'Lodge' },
  { value: 'villa', label: 'Villa' },
  { value: 'guesthouse', label: 'Guest House' }
];

const amenityOptions = [
  'wifi', 'parking', 'restaurant', 'gym', 'pool', 'spa', 'room_service', 
  'air_conditioning', 'tv', 'laundry', 'concierge', 'business_center'
];

export default function HotelPartnerRegistration() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<'pending' | 'completed' | 'approved' | 'rejected'>('pending');
  
  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [hotelType, setHotelType] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [website, setWebsite] = useState('');
  
  // Check registration status
  useEffect(() => {
    checkRegistrationStatus();
  }, [user]);
  
  const checkRegistrationStatus = async () => {
    if (!user) return;
    
    try {
      const status = await RegistrationService.getRegistrationStatus(user.id, 'hotel_partner');
      setRegistrationStatus(status.status as 'pending' | 'completed' | 'approved' | 'rejected');
      setIsRegistered(status.status === 'completed' || status.status === 'approved');
      
      // Pre-fill form if user has existing data
      if (status.status !== 'pending') {
        // In a real implementation, you would fetch the existing data
        // For now, we'll just set the basic info
        setFullName(user.user_metadata?.full_name || '');
        setPhone(user.user_metadata?.phone || '');
      }
    } catch (error) {
      console.error('Error checking registration status:', error);
    }
  };
  
  const validateForm = () => {
    if (!fullName.trim()) {
      toast.error('Full name is required');
      return false;
    }
    
    if (!phone.trim()) {
      toast.error('Phone number is required');
      return false;
    }
    
    if (!companyName.trim()) {
      toast.error('Company name is required');
      return false;
    }
    
    if (!hotelType) {
      toast.error('Hotel type is required');
      return false;
    }
    
    if (!address.trim()) {
      toast.error('Address is required');
      return false;
    }
    
    if (!city.trim()) {
      toast.error('City is required');
      return false;
    }
    
    if (!state.trim()) {
      toast.error('State is required');
      return false;
    }
    
    if (!pincode.trim() || pincode.length !== 6 || !/^[0-9]+$/.test(pincode)) {
      toast.error('Valid 6-digit pincode is required');
      return false;
    }
    
    if (amenities.length === 0) {
      toast.error('Please select at least one amenity');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Authentication required');
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const registrationData = {
        id: user.id,
        full_name: fullName,
        phone: phone,
        bio: bio || '',
        email: user.email || '',
        company_name: companyName,
        license_number: licenseNumber || '',
        hotel_type: hotelType,
        amenities: amenities,
        address: address,
        city: city,
        state: state,
        pincode: pincode,
        website: website || '',
        is_verified: false
      };
      
      const result = await RegistrationService.registerForRole(user.id, 'hotel_partner', registrationData);
      
      if (result.success) {
        toast.success(result.message || 'Registration submitted successfully!');
        setIsRegistered(true);
        setRegistrationStatus('completed');
        navigate('/profile');
      } else {
        toast.error(result.error || 'Failed to submit registration');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to submit registration');
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleAmenity = (amenity: string) => {
    setAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity) 
        : [...prev, amenity]
    );
  };
  
  if (isRegistered) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h2 className="font-display text-2xl font-bold mb-2">Registration Completed!</h2>
              <p className="text-muted-foreground mb-6">
                Thank you for registering as a Hotel Partner. Our team will review your application and notify you once approved.
              </p>
              <Button onClick={() => navigate('/profile')} className="w-full sm:w-auto">
                View Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 text-primary mb-4">
              <Bed className="h-5 w-5" />
            </div>
            <h1 className="font-display text-3xl font-bold">Hotel Partner Registration</h1>
            <p className="text-muted-foreground mt-2">Register as a hotel partner to list your property and manage bookings</p>
          </div>
          
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle>Registration Form</CardTitle>
              <CardDescription>Please fill in all required information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about your hotel..."
                    rows={4}
                  />
                </div>
                
                {/* Hotel Information */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Hotel or resort name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License Number</Label>
                    <Input
                      id="licenseNumber"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="Business license number"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hotelType">Hotel Type *</Label>
                  <Select value={hotelType} onValueChange={setHotelType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select hotel type" />
                    </SelectTrigger>
                    <SelectContent>
                      {hotelTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium">Amenities *</h3>
                  <div className="flex flex-wrap gap-2">
                    {amenityOptions.map((amenity) => (
                      <Badge
                        key={amenity}
                        variant={amenities.includes(amenity) ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => toggleAmenity(amenity)}
                      >
                        {amenity.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street address"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="State"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="110001"
                      maxLength={6}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="website">Website (Optional)</Label>
                    <Input
                      id="website"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://yourhotel.com"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button 
                    type="submit" 
                    className="w-full sm:w-auto"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Registration'
                    )}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full sm:w-auto"
                    onClick={() => navigate('/profile')}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}