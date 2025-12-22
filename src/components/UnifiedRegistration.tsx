import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, User, Briefcase, Bed, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UnifiedRegistrationProps {
  role: 'tourist' | 'tour_guide' | 'hotel_partner';
  onComplete: () => void;
}

const travelInterests = [
  'Heritage & Monuments', 'Temples & Spirituality', 'Wildlife & Nature', 'Adventure Sports',
  'Beach & Islands', 'Hill Stations', 'Culture & Festivals', 'Food & Cuisine',
  'Photography', 'Trekking & Hiking', 'Art & Craft', 'Historical Sites'
];

const languageOptions = [
  'Hindi', 'English', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Gujarati', 'Malayalam', 
  'Kannada', 'Punjabi', 'French', 'German', 'Spanish', 'Japanese'
];

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

export default function UnifiedRegistration({ role, onComplete }: UnifiedRegistrationProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  
  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [hotelType, setHotelType] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [website, setWebsite] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [experience, setExperience] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  
  // Check if user is already registered for this role
  useEffect(() => {
    checkRegistrationStatus();
  }, [user, role]);
  
  const checkRegistrationStatus = async () => {
    if (!user) return;
    
    try {
      // First check if user has the passion
      const { data: passionData, error: passionError } = await supabase
        .from('user_passions')
        .select('id')
        .match({ user_id: user.id, passion: role })
        .single();
      
      if (passionError) {
        // User doesn't have this passion, which is fine
        return;
      }
      
      // If user has the passion, check if they have a profile
      let tableName = '';
      switch (role) {
        case 'tourist':
          tableName = 'tourists';
          break;
        case 'tour_guide':
          tableName = 'tour_guides';
          break;
        case 'hotel_partner':
          tableName = 'hotel_partners';
          break;
      }
      
      const { data, error } = await supabase
        .from(tableName)
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (data) {
        setIsRegistered(true);
      } else {
        // User has the passion but no profile, create a basic one
        await supabase.from(tableName).upsert({
          id: user.id,
          full_name: user.user_metadata?.full_name || '',
          phone: user.user_metadata?.phone || '',
          email: user.email || '',
          is_active: true
        }, { onConflict: 'id' });
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
    
    if (role === 'tourist') {
      if (interests.length === 0) {
        toast.error('Please select at least one travel interest');
        return false;
      }
    }
    
    if (role === 'tour_guide') {
      if (!hourlyRate || isNaN(Number(hourlyRate)) || Number(hourlyRate) <= 0) {
        toast.error('Valid hourly rate is required');
        return false;
      }
      
      if (!experience.trim() || isNaN(Number(experience)) || Number(experience) < 0) {
        toast.error('Valid experience is required');
        return false;
      }
      
      if (specialties.length === 0) {
        toast.error('Please select at least one specialty');
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
    }
    
    if (role === 'hotel_partner') {
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
      // Validate session before submission
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expired. Please log in again.');
        navigate('/auth');
        return;
      }
      
      // Prepare data based on role
      let registrationData: any = {
        id: user.id,
        full_name: fullName,
        phone: phone,
        bio: bio || null,
        updated_at: new Date().toISOString(),
        is_active: true
      };
      
      switch (role) {
        case 'tourist':
          registrationData.travel_preferences = interests.length > 0 ? interests : null;
          registrationData.preferred_language = preferredLanguages.length > 0 ? preferredLanguages[0] : 'en';
          registrationData.email = user.email || '';
          break;
          
        case 'tour_guide':
          registrationData.company_name = companyName || null;
          registrationData.license_number = licenseNumber || null;
          registrationData.hourly_rate = hourlyRate ? parseFloat(hourlyRate) : null;
          registrationData.experience_years = experience ? parseInt(experience) : null;
          registrationData.specialties = specialties.length > 0 ? specialties : null;
          registrationData.languages_spoken = preferredLanguages.length > 0 ? preferredLanguages : ['en'];
          registrationData.address = address || null;
          registrationData.city = city || null;
          registrationData.district = city || null; // Using city as district for now
          registrationData.state = state || null;
          registrationData.state_id = null; // Will be set by admin
          registrationData.pincode = pincode || null;
          registrationData.website = website || null;
          registrationData.verified = false; // Requires admin approval
          break;
          
        case 'hotel_partner':
          registrationData.company_name = companyName;
          registrationData.license_number = licenseNumber || null;
          registrationData.hotel_type = hotelType;
          registrationData.amenities = amenities.length > 0 ? amenities : null;
          registrationData.address = address;
          registrationData.city = city;
          registrationData.district = city; // Using city as district for now
          registrationData.state = state;
          registrationData.state_id = null; // Will be set by admin
          registrationData.pincode = pincode;
          registrationData.website = website || null;
          registrationData.is_verified = false; // Requires admin approval
          registrationData.email = user.email || '';
          break;
      }
      
      // Insert data into appropriate table
      let tableName = '';
      switch (role) {
        case 'tourist':
          tableName = 'tourists';
          break;
        case 'tour_guide':
          tableName = 'tour_guides';
          break;
        case 'hotel_partner':
          tableName = 'hotel_partners';
          break;
      }
      
      // First check if user already has a profile
      const { data: existingProfile } = await supabase
        .from(tableName)
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      // Check if user already has this passion
      const { data: existingPassion, error: passionCheckError } = await supabase
        .from('user_passions')
        .select('id')
        .match({ user_id: user.id, passion: role })
        .single();
      
      if (passionCheckError && passionCheckError.code !== 'PGRST116') {
        throw passionCheckError;
      }
      
      // Add user passion if not already exists
      const { error: passionError } = await supabase
        .from('user_passions')
        .upsert({
          user_id: user.id,
          passion: role
        }, { onConflict: 'user_id,passion' });
        
      if (passionError) throw passionError;
      
      const { error } = await supabase
        .from(tableName)
        .upsert(registrationData, { onConflict: 'id' });
        
      if (error) throw error;
      
      toast.success('Registration submitted successfully! Our team will review your application.');
      setIsRegistered(true);
      onComplete();
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to submit registration');
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleInterest = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest) 
        : [...prev, interest]
    );
  };
  
  const toggleLanguage = (language: string) => {
    setPreferredLanguages(prev => 
      prev.includes(language) 
        ? prev.filter(l => l !== language) 
        : [...prev, language]
    );
  };
  
  const toggleAmenity = (amenity: string) => {
    setAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity) 
        : [...prev, amenity]
    );
  };
  
  const toggleSpecialty = (specialty: string) => {
    setSpecialties(prev => 
      prev.includes(specialty) 
        ? prev.filter(s => s !== specialty) 
        : [...prev, specialty]
    );
  };
  
  const getRoleTitle = () => {
    switch (role) {
      case 'tourist': return 'Tourist Registration';
      case 'tour_guide': return 'Tour Guide Registration';
      case 'hotel_partner': return 'Hotel Partner Registration';
    }
  };
  
  const getRoleDescription = () => {
    switch (role) {
      case 'tourist': return 'Complete your tourist profile to explore India and book experiences';
      case 'tour_guide': return 'Register as a tour guide to share your expertise and guide travelers';
      case 'hotel_partner': return 'Register as a hotel partner to list your property and manage bookings';
    }
  };
  
  const getRoleIcon = () => {
    switch (role) {
      case 'tourist': return <User className="h-5 w-5" />;
      case 'tour_guide': return <Briefcase className="h-5 w-5" />;
      case 'hotel_partner': return <Bed className="h-5 w-5" />;
    }
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
                Thank you for registering as a {getRoleTitle().toLowerCase()}. Our team will review your application and notify you once approved.
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
              {getRoleIcon()}
            </div>
            <h1 className="font-display text-3xl font-bold">{getRoleTitle()}</h1>
            <p className="text-muted-foreground mt-2">{getRoleDescription()}</p>
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
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                </div>
                
                {/* Role-specific fields */}
                {role === 'tourist' && (
                  <>
                    <div className="space-y-4">
                      <h3 className="font-medium">Travel Interests</h3>
                      <div className="flex flex-wrap gap-2">
                        {travelInterests.map((interest) => (
                          <Badge
                            key={interest}
                            variant={interests.includes(interest) ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={() => toggleInterest(interest)}
                          >
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="font-medium">Preferred Languages</h3>
                      <div className="flex flex-wrap gap-2">
                        {languageOptions.map((language) => (
                          <Badge
                            key={language}
                            variant={preferredLanguages.includes(language) ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={() => toggleLanguage(language)}
                          >
                            {language}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                
                {role === 'tour_guide' && (
                  <>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input
                          id="companyName"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="Your company or individual name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="licenseNumber">License Number</Label>
                        <Input
                          id="licenseNumber"
                          value={licenseNumber}
                          onChange={(e) => setLicenseNumber(e.target.value)}
                          placeholder="Professional license number"
                        />
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="hourlyRate">Hourly Rate (₹) *</Label>
                        <Input
                          id="hourlyRate"
                          type="number"
                          value={hourlyRate}
                          onChange={(e) => setHourlyRate(e.target.value)}
                          placeholder="1500"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="experience">Years of Experience *</Label>
                        <Input
                          id="experience"
                          type="number"
                          value={experience}
                          onChange={(e) => setExperience(e.target.value)}
                          placeholder="5"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="font-medium">Specialties</h3>
                      <div className="flex flex-wrap gap-2">
                        {travelInterests.map((specialty) => (
                          <Badge
                            key={specialty}
                            variant={specialties.includes(specialty) ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={() => toggleSpecialty(specialty)}
                          >
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="font-medium">Preferred Languages</h3>
                      <div className="flex flex-wrap gap-2">
                        {languageOptions.map((language) => (
                          <Badge
                            key={language}
                            variant={preferredLanguages.includes(language) ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={() => toggleLanguage(language)}
                          >
                            {language}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Street address"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="City"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
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
                        <Label htmlFor="pincode">Pincode</Label>
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
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                    </div>
                  </>
                )}
                
                {role === 'hotel_partner' && (
                  <>
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
                      <h3 className="font-medium">Amenities</h3>
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
                  </>
                )}
                
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