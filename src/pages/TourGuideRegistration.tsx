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
import { Loader2, CheckCircle, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const travelInterests = [
  'Heritage & Monuments', 'Temples & Spirituality', 'Wildlife & Nature', 'Adventure Sports',
  'Beach & Islands', 'Hill Stations', 'Culture & Festivals', 'Food & Cuisine',
  'Photography', 'Trekking & Hiking', 'Art & Craft', 'Historical Sites'
];

const languageOptions = [
  'Hindi', 'English', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Gujarati', 'Malayalam', 
  'Kannada', 'Punjabi', 'French', 'German', 'Spanish', 'Japanese'
];

export default function TourGuideRegistration() {
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
  const [hourlyRate, setHourlyRate] = useState('');
  const [experience, setExperience] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>([]);
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
      const status = await RegistrationService.getRegistrationStatus(user.id, 'tour_guide');
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
        company_name: companyName || '',
        license_number: licenseNumber || '',
        hourly_rate: parseFloat(hourlyRate),
        experience_years: parseInt(experience),
        specialties: specialties,
        languages_spoken: preferredLanguages,
        address: address,
        city: city,
        state: state,
        pincode: pincode,
        website: website || '',
        verified: false
      };
      
      const result = await RegistrationService.registerForRole(user.id, 'tour_guide', registrationData);
      
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
  
  const toggleSpecialty = (specialty: string) => {
    setSpecialties(prev => 
      prev.includes(specialty) 
        ? prev.filter(s => s !== specialty) 
        : [...prev, specialty]
    );
  };
  
  const toggleLanguage = (language: string) => {
    setPreferredLanguages(prev => 
      prev.includes(language) 
        ? prev.filter(l => l !== language) 
        : [...prev, language]
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
                Thank you for registering as a Tour Guide. Our team will review your application and notify you once approved.
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
              <Briefcase className="h-5 w-5" />
            </div>
            <h1 className="font-display text-3xl font-bold">Tour Guide Registration</h1>
            <p className="text-muted-foreground mt-2">Register as a tour guide to share your expertise and guide travelers</p>
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
                
                {/* Professional Information */}
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
                  <h3 className="font-medium">Specialties *</h3>
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
                      placeholder="https://yourwebsite.com"
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