import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';

/**
 * Custom hook to handle post-authentication redirects to passion-based dashboard
 * This hook should be used in the main App component or a layout component
 */
export const usePostAuthRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    console.log('PostAuthRedirect: user state changed', { 
      user: user?.id, 
      pathname: location.pathname,
      hasRedirected: hasRedirected.current 
    });
    
    // Reset redirect flag when user changes
    if (!user) {
      hasRedirected.current = false;
      return;
    }

    // Only redirect once per user session
    if (hasRedirected.current) {
      console.log('PostAuthRedirect: already redirected, skipping');
      return;
    }

    const handleRedirect = async () => {
      try {
        console.log('PostAuthRedirect: handling redirect for user', user.id);
        
        // Add a delay to allow trigger to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check what passions the user has
        const { data: passions, error } = await supabase
          .from('user_passions')
          .select('passion')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching user passions:', error);
          // For new users, assume they need to go to dashboard anyway
          console.log('PostAuthRedirect: error fetching passions, redirecting to dashboard');
          hasRedirected.current = true;
          navigate('/dashboard');
          return;
        }
        
        console.log('PostAuthRedirect: user passions', passions);

        // Always redirect to dashboard - let dashboard handle missing passions
        console.log('PostAuthRedirect: redirecting to dashboard');
        hasRedirected.current = true;
        navigate('/dashboard');
        
      } catch (error) {
        console.error('Error handling post-auth redirect:', error);
        // Always fallback to dashboard
        hasRedirected.current = true;
        navigate('/dashboard');
      }
    };

    // Run redirect logic on auth-related pages only
    console.log('PostAuthRedirect: checking pathname', location.pathname);
    const authPages = ['/', '/auth', '/login', '/signup', '/register', '/auth/callback', '/auth/magic-link-callback'];
    const isAuthPage = authPages.includes(location.pathname);
    
    if (isAuthPage) {
      console.log('PostAuthRedirect: calling handleRedirect');
      handleRedirect();
    } else {
      console.log('PostAuthRedirect: not on auth page, skipping redirect');
    }
  }, [user, navigate, location.pathname]);
};