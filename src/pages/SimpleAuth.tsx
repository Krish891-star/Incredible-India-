import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, UserCircle, Briefcase, Bed } from 'lucide-react';

type UserRole = 'tourist' | 'tour_guide' | 'hotel_partner';

export default function SimpleAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [step, setStep] = useState<'role' | 'signup' | 'login'>('role');
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('tourist');
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    // Only redirect to dashboard if user is on auth pages
    const authPages = ['/auth', '/login', '/signup', '/register'];
    const currentPath = location.pathname;
    
    if (!loading && user && authPages.includes(currentPath)) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate, location.pathname]);

  const handleRoleSelection = (role: UserRole) => {
    setUserRole(role);
    setStep('signup');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !fullName) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      console.log('[SimpleAuth] Signing up with role:', userRole);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_role: userRole
          }
        }
      });

      if (error) {
        console.error('[SimpleAuth] Signup error:', error);
        toast.error('Signup failed: ' + error.message);
      } else {
        console.log('[SimpleAuth] Signup successful:', data.user?.email);
        toast.success('Account created successfully! Redirecting to dashboard...');
        
        // Don't wait - let PostAuthRedirect handle it
        // The redirect will happen automatically via usePostAuthRedirect hook
      }
    } catch (err: any) {
      console.error('[SimpleAuth] Signup error:', err);
      toast.error('Signup failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in email and password');
      return;
    }

    setIsLoading(true);

    try {
      console.log('[SimpleAuth] Logging in...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('[SimpleAuth] Login error:', error);
        toast.error('Login failed: ' + error.message);
      } else {
        console.log('[SimpleAuth] Login successful:', data.user?.email);
        toast.success('Welcome back! Redirecting to dashboard...');
        
        // Don't wait - let PostAuthRedirect handle it
        // The redirect will happen automatically via usePostAuthRedirect hook
      }
    } catch (err: any) {
      console.error('[SimpleAuth] Login error:', err);
      toast.error('Login failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-orange-500" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'tourist': return <UserCircle className="h-8 w-8" />;
      case 'tour_guide': return <Briefcase className="h-8 w-8" />;
      case 'hotel_partner': return <Bed className="h-8 w-8" />;
    }
  };

  const getRoleTitle = (role: UserRole) => {
    switch (role) {
      case 'tourist': return 'Tourist';
      case 'tour_guide': return 'Tour Guide';
      case 'hotel_partner': return 'Hotel Partner';
    }
  };

  const getRoleDescription = (role: UserRole) => {
    switch (role) {
      case 'tourist': return 'Explore incredible destinations';
      case 'tour_guide': return 'Share your expertise';
      case 'hotel_partner': return 'Manage your property';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Incredible India Tourism</h1>
          <p className="mt-2 text-gray-600">Choose your role and get started</p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              {step === 'role' && 'Choose Your Role'}
              {step === 'signup' && 'Create Account'}
              {step === 'login' && 'Sign In'}
            </CardTitle>
            <CardDescription className="text-center">
              {step === 'role' && 'Select how you want to use the platform'}
              {step === 'signup' && `Creating ${getRoleTitle(userRole)} account`}
              {step === 'login' && 'Welcome back! Please sign in'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {step === 'role' && (
              <div className="space-y-4">
                {(['tourist', 'tour_guide', 'hotel_partner'] as UserRole[]).map((role) => (
                  <Button
                    key={role}
                    variant="outline"
                    className="w-full h-20 flex items-center justify-start gap-4 text-left hover:bg-orange-50"
                    onClick={() => handleRoleSelection(role)}
                  >
                    <div className="text-orange-500">
                      {getRoleIcon(role)}
                    </div>
                    <div>
                      <div className="font-semibold">{getRoleTitle(role)}</div>
                      <div className="text-sm text-muted-foreground">{getRoleDescription(role)}</div>
                    </div>
                  </Button>
                ))}
                
                <div className="text-center pt-4">
                  <Button
                    variant="ghost"
                    onClick={() => setStep('login')}
                    className="text-orange-600 hover:text-orange-500"
                  >
                    Already have an account? Sign in
                  </Button>
                </div>
              </div>
            )}

            {step === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center gap-2 text-orange-600">
                    {getRoleIcon(userRole)}
                    <span className="font-semibold">{getRoleTitle(userRole)}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password (min 6 characters)"
                    minLength={6}
                    required
                  />
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
                    'Create Account'
                  )}
                </Button>
                
                <div className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep('role')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ← Back to role selection
                  </Button>
                </div>
              </form>
            )}

            {step === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loginEmail">Email</Label>
                  <Input
                    id="loginEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="loginPassword">Password</Label>
                  <Input
                    id="loginPassword"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
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
                    'Sign In'
                  )}
                </Button>
                
                <div className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep('role')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ← Back to role selection
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
        
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