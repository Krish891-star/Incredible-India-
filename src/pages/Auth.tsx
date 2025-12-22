import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { emailService } from '@/lib/emailService';
import { supabase } from '@/integrations/supabase/client';
import PassionSelector from '@/components/PassionSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Loader2, Mail, User, Lock, Eye, EyeOff, 
  Chrome, Shield, MapPin, UserCircle, Briefcase, ArrowRight, Bed, CheckCircle
} from 'lucide-react';
import { z } from 'zod';


const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const nameSchema = z.string().min(2, 'Name must be at least 2 characters');

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp, signIn, signInWithGoogle, loading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthOptions, setShowAuthOptions] = useState(true);
  const [showPassionSelector, setShowPassionSelector] = useState(false);
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [userRole, setUserRole] = useState<'tourist' | 'tour_guide' | 'hotel_partner' | 'admin'>('tourist');
  const [currentUserId, setCurrentUserId] = useState<string>('');  
  const [selectPassion, setSelectPassion] = useState(false);
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Debug: Log loading state
  useEffect(() => {
    console.log('Auth component loading state:', loading);
  }, [loading]);

  useEffect(() => {
    console.log('Auth: useEffect triggered', { loading, searchParams: Object.fromEntries(searchParams.entries()) });
    
    // Check if user is already authenticated
    if (!loading) {
      console.log('Auth: not loading, checking redirect');
      const redirectTo = searchParams.get('redirect');
      if (redirectTo) {
        console.log('Auth: redirecting to', redirectTo);
        navigate(redirectTo);
      }
      
      // Check if we need to show passion selector
      const showPassionSelectorParam = searchParams.get('select-passion');
      console.log('Auth: showPassionSelectorParam', showPassionSelectorParam);
      if (showPassionSelectorParam === 'true') {
        console.log('Auth: setting selectPassion to true');
        setSelectPassion(true);
      }
    } else {
      console.log('Auth: still loading, skipping redirect logic');
    }
  }, [loading, navigate, searchParams]);

  const validateForm = (isSignUp: boolean) => {
    const newErrors: Record<string, string> = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    if (isSignUp) {
      const nameResult = nameSchema.safeParse(fullName);
      if (!nameResult.success) {
        newErrors.fullName = nameResult.error.errors[0].message;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(true)) return;

    setIsLoading(true);

    try {
      // For Supabase, we need to adapt the signup to match the new signature
      // Use a placeholder phone number since it's required by Supabase but not collected in this form
      const phoneNumber = '+919999999999'; // Placeholder - user can update later
      const result = await signUp(email, password, phoneNumber, fullName, userRole);
      
      if (!result.error) {
        // Show email verification message
        toast.success('Account created successfully! Please check your email for verification link.');
        
        // Redirect to email verification notice page
        setShowAuthOptions(false);
      } else {
        // Check if this is a duplicate signup error
        if (result.error.message?.includes('already registered') || result.error.message?.includes('already exists')) {
          toast.error('This email is already registered. Please sign in instead.');
          setAuthMode('login');
        } 
        // Handle email confirmation issues
        else if (result.error.message?.includes('email configuration issues') || result.error.message?.includes('Email confirmation')) {
          toast.success('Account created successfully! Email verification is temporarily unavailable but you can use your account immediately.');
          // Redirect to main page since email verification failed but account was created
          navigate('/');
        } else {
          toast.error(result.error.message || 'Failed to create account');
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(false)) return;

    setIsLoading(true);

    try {
      const result = await signIn(email, password);
      if (!result.error) {
        // Check what passions the user has
        if (result.data?.user?.id) {
          const { data: passions, error } = await supabase
            .from('user_passions')
            .select('passion as passion_type')
            .eq('user_id', result.data.user.id);
          
          if (passions && passions.length > 0) {
            // If user has multiple passions, show a selection screen
            if (passions.length > 1) {
              setCurrentUserId(result.data.user.id);
              setShowPassionSelector(true);
              return;
            }
            
            // If user has only one passion, redirect accordingly
            const role = passions[0].passion_type;
            if (role === 'tour_guide') {
              toast.success('Welcome back! Redirecting to your guide registration.');
              navigate('/tour-guide-registration');
            } else if (role === 'hotel_partner') {
              toast.success('Welcome back! Redirecting to your hotel partner registration.');
              navigate('/hotel-partner-registration');
            } else {
              // For tourists, check if they've completed registration
              const { data: touristProfile } = await supabase
                .from('tourists')
                .select('id')
                .eq('id', result.data.user.id)
                .single();
              
              if (touristProfile) {
                toast.success('Welcome back! You have been signed in successfully.');
                navigate('/');
              } else {
                toast.success('Welcome! Please complete your tourist registration.');
                navigate('/tourist-registration');
              }
            }
          } else {
            // Fallback to user metadata if no passions found
            const userMetadata = result.data?.user?.user_metadata || {};
            const role = userMetadata.current_passion || userMetadata.role || userMetadata.user_role || 'tourist';
            
            if (role === 'tour_guide') {
              toast.success('Welcome back! Redirecting to your guide registration.');
              navigate('/tour-guide-registration');
            } else if (role === 'hotel_partner') {
              toast.success('Welcome back! Redirecting to your hotel partner registration.');
              navigate('/hotel-partner-registration');
            } else {
              // For tourists, check if they've completed registration
              const { data: touristProfile } = await supabase
                .from('tourists')
                .select('id')
                .eq('id', result.data.user.id)
                .single();
              
              if (touristProfile) {
                toast.success('Welcome back! You have been signed in successfully.');
                navigate('/');
              } else {
                toast.success('Welcome! Please complete your tourist registration.');
                navigate('/tourist-registration');
              }
            }
          }
        } else {
          toast.success('Welcome back! You have been signed in successfully.');
          navigate('/');
        }
      } else {
        toast.error(result.error.message || 'Invalid credentials');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    try {
      const result = await signInWithGoogle();
      if (result.error) {
        toast.error(result.error.message || 'Failed to sign in with Google');
      } else {
        toast.success('Welcome! Signed in with Google.');
        // For Google sign-in, we'll redirect to the main page
        // The proper redirection will happen after email verification and role selection
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in with Google');
    }
    
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status"></div>
          <p className="mt-4 text-gray-600">Loading authentication...</p>
        </div>
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
          <h1 className="text-3xl font-bold text-gray-900">Incredible India Tourism</h1>
          <p className="mt-2 text-gray-600">
            {showAuthOptions ? 'Join our community of travelers and tourism professionals' : 'Email Verification Required'}
          </p>
        </div>

        {showAuthOptions && !selectPassion ? (
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">
                Get Started
              </CardTitle>
              <CardDescription className="text-center">
                Choose your path to begin your journey
              </CardDescription>
            </CardHeader>
                    
            <CardContent className="space-y-6">
              {/* Onboarding Options */}
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  onClick={() => {
                    setAuthMode('signup');
                    setUserRole('tourist');
                  }}
                >
                  <UserCircle className="h-6 w-6 text-orange-500" />
                  <span className="font-medium">I'm a Tourist</span>
                  <span className="text-xs text-muted-foreground">Explore India</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  onClick={() => {
                    setAuthMode('signup');
                    setUserRole('tour_guide');
                  }}
                >
                  <Briefcase className="h-6 w-6 text-orange-500" />
                  <span className="font-medium">I'm a Tour Guide</span>
                  <span className="text-xs text-muted-foreground">Share your expertise</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  onClick={() => {
                    setAuthMode('signup');
                    setUserRole('hotel_partner');
                  }}
                >
                  <Bed className="h-6 w-6 text-orange-500" />
                  <span className="font-medium">Hotel Partner</span>
                  <span className="text-xs text-muted-foreground">List your property</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  onClick={() => setAuthMode('login')}
                >
                  <Mail className="h-6 w-6 text-orange-500" />
                  <span className="font-medium">Already Member</span>
                  <span className="text-xs text-muted-foreground">Sign in to account</span>
                </Button>
              </div>
              
              {/* Role Selection for Signup */}
              {authMode === 'signup' && (
                <>
                  <div className="space-y-4">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="full-name">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="full-name"
                            placeholder="Enter your full name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="password"
                            type="password"
                            placeholder="Create a password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Account...
                          </>
                        ) : (
                          <>
                            Sign Up
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </form>
                    
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Or continue with
                        </span>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                    >
                      <GoogleIcon />
                      <span className="ml-2">Sign up with Google</span>
                    </Button>
                  </div>
                </>
              )}
              
              {/* Login Form */}
              {authMode === 'login' && (
                <>
                  <div className="space-y-4">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="login-password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing In...
                          </>
                        ) : (
                          <>
                            Sign In
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </form>
                    
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Or continue with
                        </span>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                    >
                      <GoogleIcon />
                      <span className="ml-2">Sign in with Google</span>
                    </Button>
                    
                    <div className="text-center text-sm">
                      <button
                        onClick={() => setAuthMode('signup')}
                        className="text-orange-600 hover:text-orange-500 font-medium"
                      >
                        Don't have an account? Sign up
                      </button>
                    </div>
                  </div>
                </>
              )}
            
              {/* Security Notice */}
              <Alert className="border-green-200 bg-green-50">
                <Lock className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Secure Authentication:</strong> All data is encrypted and stored securely.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        ) : showPassionSelector || selectPassion ? (
          <PassionSelector userId={currentUserId} />
        ) : (
          /* Email Verification Notice */
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
              <p className="text-gray-600 mb-4">
                We've sent a verification email to <strong>{email}</strong>. Please check your inbox and click the verification link to complete your registration.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Didn't receive the email? Check your spam folder or contact support.
              </p>
              <Button 
                onClick={() => {
                  setShowAuthOptions(true);
                  setAuthMode('login');
                  setEmail('');
                  setPassword('');
                  setFullName('');
                }}
                variant="outline"
                className="w-full"
              >
                Back to Sign In
              </Button>
            </CardContent>
          </Card>
        )}
        
        <p className="mt-8 text-center text-sm text-gray-600">
          By continuing, you agree to our{' '}
          <a href="#" className="font-medium text-orange-600 hover:text-orange-500">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="font-medium text-orange-600 hover:text-orange-500">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}