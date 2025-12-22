import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function MagicLinkCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing magic link...');

  useEffect(() => {
    const handleMagicLinkCallback = async () => {
      try {
        // Get the hash from URL (contains the verification token)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('[MagicLinkCallback] Processing callback', { type, hasAccessToken: !!accessToken });

        if (type === 'recovery' && accessToken && refreshToken) {
          // This is a password reset link being used as magic link
          // Set the session with the tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('[MagicLinkCallback] Session error:', error);
            setStatus('error');
            setMessage('Magic link authentication failed. Please try again.');
            return;
          }

          console.log('[MagicLinkCallback] Magic link authentication successful', data);
          setStatus('success');
          setMessage('Magic link authentication successful! Redirecting...');
          
          // Redirect to home page after 2 seconds
          setTimeout(() => navigate('/'), 2000);
        } else if (type === 'signup' && accessToken && refreshToken) {
          // Handle regular signup confirmation
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('[MagicLinkCallback] Session error:', error);
            setStatus('error');
            setMessage('Email verification failed. Please try again.');
            return;
          }

          console.log('[MagicLinkCallback] Email verified successfully', data);
          setStatus('success');
          setMessage('Email verified successfully! Redirecting...');
          
          // Redirect to home page after 2 seconds
          setTimeout(() => navigate('/'), 2000);
        } else {
          setStatus('error');
          setMessage('Invalid magic link. Please request a new one.');
        }
      } catch (error: any) {
        console.error('[MagicLinkCallback] Error:', error);
        setStatus('error');
        setMessage('An error occurred during authentication.');
      }
    };

    handleMagicLinkCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            {status === 'loading' && (
              <>
                <Loader2 className="h-16 w-16 animate-spin text-orange-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Magic Link</h2>
                <p className="text-gray-600">{message}</p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
                <p className="text-gray-600 mb-4">{message}</p>
                <div className="text-sm text-gray-500">
                  You will be redirected automatically...
                </div>
              </>
            )}
            
            {status === 'error' && (
              <>
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h2>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="space-y-3">
                  <Button
                    onClick={() => navigate('/auth')}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    Try Again
                  </Button>
                  <Button
                    onClick={() => navigate('/')}
                    variant="outline"
                    className="w-full"
                  >
                    Go to Home
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}