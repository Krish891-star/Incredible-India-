/**
 * Simple Authentication Service for Supabase
 * Clean implementation focused on core authentication
 */

import { supabase } from '@/integrations/supabase/client';
import { userProfileService, userPassionService } from './database.service';

// Type definitions
export type UserRole = 'tourist' | 'tour_guide' | 'hotel_partner' | 'admin';

export interface AuthResponse {
  success: boolean;
  error?: string;
  data?: {
    user?: any;
    session?: any;
    needsEmailConfirmation?: boolean;
  };
}

/**
 * Simple Authentication Service
 */
export class AuthService {
  /**
   * Sign up a new user
   */
  static async signUp(
    email: string,
    password: string,
    phone: string,
    fullName: string,
    userRole: UserRole = 'tourist'
  ): Promise<AuthResponse> {
    try {
      console.log('[Auth Service] Starting signup for:', email);
      
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        phone,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            phone: phone,
            role: userRole,
            user_role: userRole
          }
        }
      });

      if (error) {
        console.error('[Auth Service] Signup error:', error);
        
        if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
          return {
            success: false,
            error: 'This email is already registered. Please sign in instead.'
          };
        }
        
        if (error.message?.includes('Error sending confirmation email')) {
          console.log('[Auth Service] Email confirmation failed, checking if user was created...');
          
          // Try to sign in to see if user was created despite email error
          try {
            const signInResult = await supabase.auth.signInWithPassword({
              email,
              password
            });
            
            if (signInResult.error) {
              if (signInResult.error.message?.includes('Invalid login credentials')) {
                return {
                  success: false,
                  error: 'Account creation failed. Please try again.'
                };
              } else if (signInResult.error.message?.includes('Email not confirmed')) {
                return {
                  success: true,
                  data: {
                    user: data.user,
                    session: null,
                    needsEmailConfirmation: true
                  }
                };
              }
              throw signInResult.error;
            } else {
              return {
                success: true,
                data: {
                  user: signInResult.data.user,
                  session: signInResult.data.session
                }
              };
            }
          } catch (signInError: any) {
            console.error('[Auth Service] Sign in test failed:', signInError);
            return {
              success: false,
              error: 'Account creation encountered issues. Please contact support.'
            };
          }
        }
        
        return {
          success: false,
          error: error.message || 'Sign up failed'
        };
      }

      console.log('[Auth Service] Signup successful:', data.user?.id);

      return {
        success: true,
        data: {
          user: data.user,
          session: data.session,
          needsEmailConfirmation: !data.session
        }
      };
    } catch (error: any) {
      console.error('[Auth Service] Unexpected signup error:', error);
      return {
        success: false,
        error: error.message || 'Sign up failed'
      };
    }
  }

  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log('[Auth Service] Starting signin for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[Auth Service] Signin error:', error);
        
        if (error.message?.includes('Invalid login credentials')) {
          return {
            success: false,
            error: 'Invalid email or password.'
          };
        }
        
        if (error.message?.includes('Email not confirmed')) {
          return {
            success: false,
            error: 'Please check your email and click the confirmation link.'
          };
        }
        
        return {
          success: false,
          error: error.message || 'Sign in failed'
        };
      }

      console.log('[Auth Service] Signin successful:', data.user?.id);

      return {
        success: true,
        data: {
          user: data.user,
          session: data.session
        }
      };
    } catch (error: any) {
      console.error('[Auth Service] Unexpected signin error:', error);
      return {
        success: false,
        error: error.message || 'Sign in failed'
      };
    }
  }

  /**
   * Sign out
   */
  static async signOut(): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('[Auth Service] Signout error:', error);
        return {
          success: false,
          error: error.message || 'Sign out failed'
        };
      }

      return {
        success: true
      };
    } catch (error: any) {
      console.error('[Auth Service] Unexpected signout error:', error);
      return {
        success: false,
        error: error.message || 'Sign out failed'
      };
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser(): Promise<AuthResponse> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[Auth Service] Get session error:', error);
        return {
          success: false,
          error: error.message || 'Failed to get current user'
        };
      }

      return {
        success: true,
        data: {
          user: session?.user || null,
          session: session
        }
      };
    } catch (error: any) {
      console.error('[Auth Service] Unexpected get user error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get current user'
      };
    }
  }

  /**
   * Resend email confirmation
   */
  static async resendConfirmation(email: string): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('[Auth Service] Resend confirmation error:', error);
        return {
          success: false,
          error: error.message || 'Failed to resend confirmation email'
        };
      }

      return {
        success: true
      };
    } catch (error: any) {
      console.error('[Auth Service] Unexpected resend error:', error);
      return {
        success: false,
        error: error.message || 'Failed to resend confirmation email'
      };
    }
  }
}

export default AuthService;