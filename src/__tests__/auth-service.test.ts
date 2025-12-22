/**
 * Simple Auth Service Tests
 * Basic tests for authentication functionality
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AuthService } from '../services/auth.service';

// Create properly typed mocks
const createMockSupabaseResponse = <T>(data: T, error: any = null) => ({
  data,
  error
});

// Mock Supabase with proper typing
jest.mock('@/integrations/supabase/client', () => {
  return {
    supabase: {
      auth: {
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
        getSession: jest.fn(),
        resend: jest.fn()
      },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn()
          }))
        })),
        insert: jest.fn(),
        upsert: jest.fn()
      }))
    }
  };
});

describe('AuthService', () => {
  let mockSignUp: jest.MockedFunction<any>;
  let mockSignInWithPassword: jest.MockedFunction<any>;
  let mockSignOut: jest.MockedFunction<any>;
  let mockGetSession: jest.MockedFunction<any>;

  beforeEach(() => {
    // Get the mocked functions
    const { supabase } = require('@/integrations/supabase/client');
    mockSignUp = supabase.auth.signUp as jest.MockedFunction<any>;
    mockSignInWithPassword = supabase.auth.signInWithPassword as jest.MockedFunction<any>;
    mockSignOut = supabase.auth.signOut as jest.MockedFunction<any>;
    mockGetSession = supabase.auth.getSession as jest.MockedFunction<any>;
    
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('should handle successful signup', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockSession = { access_token: 'token' };
      
      mockSignUp.mockResolvedValue(
        createMockSupabaseResponse({ user: mockUser, session: mockSession })
      );

      const result = await AuthService.signUp(
        'test@example.com',
        'password123',
        '+1234567890',
        'Test User',
        'tourist'
      );

      expect(result.success).toBe(true);
      expect(result.data?.user).toEqual(mockUser);
    });

    it('should handle signup errors', async () => {
      mockSignUp.mockResolvedValue(
        createMockSupabaseResponse({ user: null, session: null }, { message: 'Email already registered' })
      );

      const result = await AuthService.signUp(
        'test@example.com',
        'password123',
        '+1234567890',
        'Test User',
        'tourist'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('already registered');
    });
  });

  describe('signIn', () => {
    it('should handle successful signin', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockSession = { access_token: 'token' };
      
      mockSignInWithPassword.mockResolvedValue(
        createMockSupabaseResponse({ user: mockUser, session: mockSession })
      );

      const result = await AuthService.signIn('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.data?.user).toEqual(mockUser);
    });

    it('should handle signin errors', async () => {
      mockSignInWithPassword.mockResolvedValue(
        createMockSupabaseResponse({ user: null, session: null }, { message: 'Invalid login credentials' })
      );

      const result = await AuthService.signIn('test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email or password');
    });
  });

  describe('signOut', () => {
    it('should handle successful signout', async () => {
      mockSignOut.mockResolvedValue(createMockSupabaseResponse({}));

      const result = await AuthService.signOut();

      expect(result.success).toBe(true);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user session', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockSession = { user: mockUser, access_token: 'token' };
      
      mockGetSession.mockResolvedValue(
        createMockSupabaseResponse({ session: mockSession })
      );

      const result = await AuthService.getCurrentUser();

      expect(result.success).toBe(true);
      expect(result.data?.user).toEqual(mockUser);
    });
  });
});