/**
 * Demo Google Sign-In Service - Production-Ready OAuth 2.0 Architecture
 * 
 * This is a DEMO implementation that simulates Google OAuth authentication
 * without using real Google API credentials or accessing actual Google accounts.
 * 
 * It follows the official OAuth 2.0 design pattern and is fully prepared for
 * seamless integration with real Google Sign-In using Google Cloud OAuth Client ID.
 * 
 * Security Features:
 * - Simulates OAuth 2.0 flow
 * - Session-based authentication
 * - No real Google account data accessed
 * - Pre-verified demo profiles
 * - Compatible with real Google Sign-In integration
 */

interface DemoGoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
}

// Demo user profiles for testing
const DEMO_GOOGLE_USERS: DemoGoogleUser[] = [
  {
    id: 'demo_user_1',
    email: 'tourist.demo@gmail.com',
    name: 'Demo Tourist',
    picture: 'https://ui-avatars.com/api/?name=Demo+Tourist&background=FF6B35&color=fff',
    verified_email: true
  },
  {
    id: 'demo_user_2',
    email: 'guide.demo@gmail.com',
    name: 'Demo Tour Guide',
    picture: 'https://ui-avatars.com/api/?name=Demo+Guide&background=004E89&color=fff',
    verified_email: true
  }
];

const GOOGLE_AUTH_SESSION_KEY = 'demo_google_auth_session';

/**
 * Simulates Google OAuth 2.0 Sign-In Flow
 * 
 * In production, this would:
 * 1. Redirect to Google OAuth consent screen
 * 2. User authorizes app
 * 3. Google redirects back with auth code
 * 4. Exchange code for access token
 * 5. Fetch user profile from Google
 */
export async function signInWithDemoGoogle(): Promise<{
  success: boolean;
  user?: DemoGoogleUser;
  message: string;
}> {
  try {
    // Simulate OAuth loading delay (mimics real redirect flow)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For demo purposes, randomly select a user or use first user
    const demoUser = DEMO_GOOGLE_USERS[0];

    // Create session
    const session = {
      user: demoUser,
      accessToken: generateDemoToken(),
      expiresAt: Date.now() + (3600 * 1000), // 1 hour
      provider: 'google',
      createdAt: Date.now()
    };

    // Store in session storage
    sessionStorage.setItem(GOOGLE_AUTH_SESSION_KEY, JSON.stringify(session));

    console.log('[DEMO GOOGLE AUTH] User signed in:', demoUser.email);

    return {
      success: true,
      user: demoUser,
      message: 'Successfully signed in with Google (Demo)'
    };
  } catch (error) {
    console.error('Demo Google Sign-In error:', error);
    return {
      success: false,
      message: 'Failed to sign in with Google. Please try again.'
    };
  }
}

/**
 * Gets current Google auth session
 */
export function getDemoGoogleSession(): {
  user: DemoGoogleUser;
  accessToken: string;
  expiresAt: number;
} | null {
  try {
    const sessionData = sessionStorage.getItem(GOOGLE_AUTH_SESSION_KEY);
    
    if (!sessionData) {
      return null;
    }

    const session = JSON.parse(sessionData);
    
    // Check if expired
    if (session.expiresAt < Date.now()) {
      clearDemoGoogleSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error retrieving Google session:', error);
    return null;
  }
}

/**
 * Clears Google auth session
 */
export function clearDemoGoogleSession(): void {
  try {
    sessionStorage.removeItem(GOOGLE_AUTH_SESSION_KEY);
  } catch (error) {
    console.error('Error clearing Google session:', error);
  }
}

/**
 * Checks if user is authenticated with Google
 */
export function isDemoGoogleAuthenticated(): boolean {
  const session = getDemoGoogleSession();
  return session !== null;
}

/**
 * Generates a demo access token (simulates OAuth token)
 */
function generateDemoToken(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `demo_token_${timestamp}_${random}`;
}

/**
 * Signs out from Google
 */
export function signOutDemoGoogle(): void {
  clearDemoGoogleSession();
  console.log('[DEMO GOOGLE AUTH] User signed out');
}

/**
 * PRODUCTION INTEGRATION GUIDE:
 * 
 * To integrate with real Google Sign-In:
 * 
 * 1. Set up Google Cloud Project:
 *    - Go to console.cloud.google.com
 *    - Create new project or select existing
 *    - Enable Google+ API
 *    - Create OAuth 2.0 Client ID (Web application)
 *    - Add authorized JavaScript origins
 *    - Add authorized redirect URIs
 * 
 * 2. Install Google Identity Services:
 *    npm install @react-oauth/google
 * 
 * 3. Replace demo functions with real implementation:
 * 
 *    import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
 * 
 *    // Wrap app with provider
 *    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
 *      <App />
 *    </GoogleOAuthProvider>
 * 
 *    // Use in component
 *    const login = useGoogleLogin({
 *      onSuccess: async (tokenResponse) => {
 *        const userInfo = await fetch(
 *          'https://www.googleapis.com/oauth2/v3/userinfo',
 *          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` }}
 *        );
 *        const user = await userInfo.json();
 *        // Process user data
 *      },
 *      onError: () => console.log('Login Failed'),
 *    });
 * 
 * 4. Alternative: Use Supabase Google OAuth:
 *    const { data, error } = await supabase.auth.signInWithOAuth({
 *      provider: 'google',
 *      options: {
 *        redirectTo: `${window.location.origin}/auth/callback`
 *      }
 *    });
 * 
 * All session management and state handling remains unchanged!
 */

/**
 * Demo user selector for testing different user types
 */
export function selectDemoGoogleUser(userType: 'tourist' | 'guide'): DemoGoogleUser {
  return userType === 'tourist' ? DEMO_GOOGLE_USERS[0] : DEMO_GOOGLE_USERS[1];
}
