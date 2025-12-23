import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthService } from '@/services/auth.service';

// Check if Supabase is properly configured
const isSupabaseConfigured = typeof supabase.auth !== 'undefined';

// Define a mock session for when Supabase is not configured
const MOCK_USER = null;
const MOCK_SESSION = null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, phone: string, fullName: string, userRole?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithPhone: (phone: string) => Promise<{ error: Error | null }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: initializing');
    
    if (isSupabaseConfigured) {
      // Set up auth state listener FIRST
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log('AuthProvider: auth state changed', { event, session });
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      );

      // THEN check for existing session
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log('AuthProvider: getSession result', { session });
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });

      return () => {
        console.log('AuthProvider: unsubscribing');
        subscription.unsubscribe();
      };
    } else {
      // If Supabase is not configured, set mock values and finish loading
      console.warn('AuthProvider: Supabase not configured, using mock values');
      setUser(MOCK_USER);
      setSession(MOCK_SESSION);
      setLoading(false);
    }
  }, []);

  // Function to manually refresh the session
  const refreshSession = async () => {
    if (isSupabaseConfigured) {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
    }
  };

  const signUp = async (email: string, password: string, phone: string, fullName: string, userRole: string = 'tourist') => {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured - signup not available');
      return { error: new Error('Authentication service not configured') };
    }
    
    // Use AuthService for signup to leverage duplicate user checking
    const response = await AuthService.signUp(email, password, phone, fullName, userRole as any);
    
    // Convert response to match expected format
    if (response.success) {
      return { error: null };
    } else {
      return { error: new Error(response.error || 'Signup failed') };
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured - signIn not available');
      return { error: new Error('Authentication service not configured') };
    }
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signInWithPhone = async (phone: string) => {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured - signInWithPhone not available');
      return { error: new Error('Authentication service not configured') };
    }
    
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });
    return { error: error as Error | null };
  };

  const verifyOtp = async (phone: string, token: string) => {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured - verifyOtp not available');
      return { error: new Error('Authentication service not configured') };
    }
    
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    return { error: error as Error | null };
  };

  // Google OAuth removed as requested by user

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    // Reset local state regardless
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signUp, 
      signIn, 
      signInWithPhone, 
      verifyOtp, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
