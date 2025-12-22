import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { passionService } from '@/services/database.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface DynamicRegistrationFormProps {
  passionKey: string;
  onComplete?: () => void;
}

// Field configurations for different passions
const fieldConfigurations = {
  tourist: {
    travel_preferences: {
      type: 'multi-select',
      label: 'Travel Interests',
      options: [
        'Heritage & Monuments', 'Temples & Spirituality', 'Wildlife & Nature', 'Adventure Sports',
        'Beach & Islands', 'Hill Stations', 'Culture & Festivals', 'Food & Cuisine',
        'Photography', 'Trekking & Hiking', 'Art & Craft', 'Historical Sites'
      ]
    },
    preferred_language: {
      type: 'select',
      label: 'Preferred Language',
      options: ['Hindi', 'English', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Gujarati', 'Malayalam']
    },
    budget_range: {
      type: 'select',
      label: 'Budget Range (per day)',
      options: ['Under ₹2,000', '₹2,000 - ₹5,000', '₹5,000 - ₹10,000', 'Above ₹10,000']
    }
  },
  tour_guide: {
    experience_years: {
      type: 'number',
      label: 'Years of Experience',
      min: 0,
      max: 50
    },
    hourly_rate: {
      type: 'number',
      label: 'Hourly Rate (₹)',
      min: 100,
      max: 10000
    },
    specialties: {
      type: 'multi-select',
      label: 'Specialties',
      options: [
        'Heritage Tours', 'Wildlife Tours', 'Adventure Tours', 'Cultural Tours',
        'Food Tours', 'Photography Tours', 'Spiritual Tours', 'Trekking Tours'
      ]
    },
    languages_spoken: {
      type: 'multi-select',
      label: 'Languages Spoken',
      options: ['Hindi', 'English', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Gujarati', 'Malayalam']
    },
    certifications: {
      type: 'textarea',
      label: 'Certifications & Qualifications',
      placeholder: 'List your relevant certifications, training, or qualifications'
    },
    portfolio_url: {
      type: 'url',
      label: 'Portfolio/Website URL',
      placeholder: 'https://your-portfolio.com'
    }
  },
  hotel_partner: {
    hotel_type: {
      type: 'select',
      label: 'Property Type',
      options: ['Hotel', 'Resort', 'Homestay', 'Lodge', 'Villa', 'Guest House']
    },
    room_count: {
      type: 'number',
      label: 'Number of Rooms',
      min: 1,
      max: 1000
    },
    amenities: {
      type: 'multi-select',
      label: 'Amenities',
      options: [
        'WiFi', 'Parking', 'Restaurant', 'Gym', 'Pool', 'Spa', 'Room Service',
        'Air Conditioning', 'TV', 'Laundry', 'Concierge', 'Business Center'
      ]
    },
    star_rating: {
      type: 'select',
      label: 'Star Rating',
      options: ['1 Star', '2 Star', '3 Star', '4 Star', '5 Star', 'Unrated']
    },
    check_in_time: {
      type: 'time',
      label: 'Check-in Time'
    },
    check_out_time: {
      type: 'time',
      label: 'Check-out Time'
    }
  }
};

export default function DynamicRegistrationForm({ passionKey, onComplete }: DynamicRegistrationFormProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [passionDefinition, setPassionDefinition] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadPassionDefinition();
  }, [passionKey]);

  const loadPassionDefinition = async () => {
    try {
      const response = await passionService.getPassionDefinition(passionKey);
      if (response.success && response.data) {
        setPassionDefinition(response.data);
        // Initialize form data with default values
        const initialData: Record<string, any> = {};
        response.data.registration_fields.required.forEach((field: string) => {
          initialData[field] = '';
        });
        response.data.registration_fields.optional.forEach((field: string) => {
          initialData[field] = '';
        });
        setFormData(initialData);
      }
    } catch (error) {
      console.error('Error loading passion definition:', error);
      toast.error('Failed to load registration form');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!passionDefinition) return false;

    // Validate required fields
    passionDefinition.registration_fields.required.forEach((field: string) => {
      const value = formData[field];
      if (!value || (Array.isArray(value) && value.length === 0)) {
        newErrors[field] = `${field.replace('_', ' ')} is required`;
      }
    });

    // Validate specific field types
    Object.entries(formData).forEach(([field, value]) => {
      const config = fieldConfigurations[passionKey as keyof typeof fieldConfigurations]?.[field as keyof any];
      
      if (config?.type === 'number' && value) {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          newErrors[field] = 'Must be a valid number';
        } else if (config.min !== undefined && numValue < config.min) {
          newErrors[field] = `Must be at least ${config.min}`;
        } else if (config.max !== undefined && numValue > config.max) {
          newErrors[field] = `Must be at most ${config.max}`;
        }
      }

      if (config?.type === 'url' && value && !isValidUrl(value)) {
        newErrors[field] = 'Must be a valid URL';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !passionDefinition) {
      toast.error('Authentication required');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsLoading(true);

    try {
      // Submit passion registration
      const response = await passionService.submitPassionRegistration(
        user.id,
        passionKey,
        formData
      );

      if (response.success) {
        setIsSubmitted(true);
        toast.success('Registration submitted successfully!');
        if (onComplete) {
          onComplete();
        }
      } else {
        toast.error(response.error || 'Failed to submit registration');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error('Failed to submit registration');
    } finally {
      setIsLoading(false);
    }
  };

  const renderField = (fieldName: string, isRequired: boolean) => {
    const config = fieldConfigurations[passionKey as keyof typeof fieldConfigurations]?.[fieldName as keyof any];
    const value = formData[fieldName] || '';
    const error = errors[fieldName];

    if (!config) {
      // Default text input for fields without specific configuration
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName}>
            {fieldName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Input
            id={fieldName}
            value={value}
            onChange={(e) => setFormData(prev => ({ ...prev, [fieldName]: e.target.value }))}
            className={error ? 'border-red-500' : ''}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      );
    }

    switch (config.type) {
      case 'textarea':
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName}>
              {config.label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={fieldName}
              value={value}
              onChange={(e) => setFormData(prev => ({ ...prev, [fieldName]: e.target.value }))}
              placeholder={config.placeholder}
              className={error ? 'border-red-500' : ''}
              rows={4}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'select':
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName}>
              {config.label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select value={value} onValueChange={(val) => setFormData(prev => ({ ...prev, [fieldName]: val }))}>
              <SelectTrigger className={error ? 'border-red-500' : ''}>
                <SelectValue placeholder={`Select ${config.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {config.options.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'multi-select':
        return (
          <div key={fieldName} className="space-y-2">
            <Label>
              {config.label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="flex flex-wrap gap-2">
              {config.options.map((option: string) => (
                <Badge
                  key={option}
                  variant={value.includes(option) ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => {
                    const currentValues = Array.isArray(value) ? value : [];
                    const newValues = currentValues.includes(option)
                      ? currentValues.filter((v: string) => v !== option)
                      : [...currentValues, option];
                    setFormData(prev => ({ ...prev, [fieldName]: newValues }));
                  }}
                >
                  {option}
                </Badge>
              ))}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'number':
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName}>
              {config.label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              type="number"
              value={value}
              onChange={(e) => setFormData(prev => ({ ...prev, [fieldName]: e.target.value }))}
              min={config.min}
              max={config.max}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'url':
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName}>
              {config.label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              type="url"
              value={value}
              onChange={(e) => setFormData(prev => ({ ...prev, [fieldName]: e.target.value }))}
              placeholder={config.placeholder}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'time':
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName}>
              {config.label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              type="time"
              value={value}
              onChange={(e) => setFormData(prev => ({ ...prev, [fieldName]: e.target.value }))}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      default:
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName}>
              {config.label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              value={value}
              onChange={(e) => setFormData(prev => ({ ...prev, [fieldName]: e.target.value }))}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );
    }
  };

  if (isSubmitted) {
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
              <h2 className="font-display text-2xl font-bold mb-2">Registration Submitted!</h2>
              <p className="text-muted-foreground mb-6">
                Thank you for completing your {passionDefinition?.display_name.toLowerCase()} registration. 
                Our team will review your application and notify you once approved.
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => navigate('/dashboard')} className="w-full sm:w-auto">
                  Go to Dashboard
                </Button>
                <Button variant="outline" onClick={() => navigate('/profile')} className="w-full sm:w-auto">
                  View Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!passionDefinition) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold">
              {passionDefinition.display_name} Registration
            </h1>
            <p className="text-muted-foreground mt-2">{passionDefinition.description}</p>
          </div>
          
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle>Complete Your Profile</CardTitle>
              <CardDescription>
                Fill in the information below to complete your {passionDefinition.display_name.toLowerCase()} registration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Required Fields */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-red-600">Required Information</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {passionDefinition.registration_fields.required.map((field: string) => 
                      renderField(field, true)
                    )}
                  </div>
                </div>

                {/* Optional Fields */}
                {passionDefinition.registration_fields.optional.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-600">Optional Information</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      {passionDefinition.registration_fields.optional.map((field: string) => 
                        renderField(field, false)
                      )}
                    </div>
                  </div>
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
                    onClick={() => navigate('/dashboard')}
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