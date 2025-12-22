import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash from URL (contains the verification token)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('[AuthCallback] Processing callback', { type, hasAccessToken: !!accessToken });

        if (type === 'signup' || type === 'email') {
          if (accessToken && refreshToken) {
            // Set the session with the tokens
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error('[AuthCallback] Session error:', error);
              setStatus('error');
              setMessage('Email verification failed. Please try again.');
              setTimeout(() => navigate('/auth'), 3000);
              return;
            }

            console.log('[AuthCallback] Email verified successfully', data);
            setStatus('success');
            setMessage('Email verified successfully! Redirecting...');
            
            // Redirect to home or appropriate page after 2 seconds
            setTimeout(() => navigate('/'), 2000);
          } else {
            setStatus('error');
            setMessage('Invalid verification link. Please request a new one.');
            setTimeout(() => navigate('/auth'), 3000);
          }
        } else {
          // Handle other callback types (password reset, etc.)
          setStatus('success');
          setMessage('Processing authentication...');
          setTimeout(() => navigate('/'), 2000);
        }
      } catch (error: any) {
        console.error('[AuthCallback] Error:', error);
        setStatus('error');
        setMessage('An error occurred during verification.');
        setTimeout(() => navigate('/auth'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            {status === 'loading' && (
              <>
                <Loader2 className="h-16 w-16 animate-spin text-orange-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email</h2>
                <p className="text-gray-600">{message}</p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
                <p className="text-gray-600">{message}</p>
              </>
            )}
            
            {status === 'error' && (
              <>
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
                <p className="text-gray-600">{message}</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}