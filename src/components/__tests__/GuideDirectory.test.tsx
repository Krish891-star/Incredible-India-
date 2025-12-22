/**
 * Guide Directory Component Unit Tests
 * Tests for guide directory completeness and display functionality
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock uuid first
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-1234'
}));

// Mock all external dependencies first
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      }))
    }
  }
}));

jest.mock('@/lib/auth', () => ({
  useAuth: () => ({
    user: null,
    signOut: jest.fn()
  })
}));

jest.mock('@/services/search.service', () => ({
  searchEngine: {
    searchGuides: jest.fn()
  }
}));

jest.mock('@/components/Navbar', () => {
  return function MockNavbar() {
    return <nav data-testid="navbar">Navbar</nav>;
  };
});

jest.mock('@/components/Footer', () => {
  return function MockFooter() {
    return <footer data-testid="footer">Footer</footer>;
  };
});

jest.mock('@/components/LocationMap', () => {
  return function MockLocationMap() {
    return <div data-testid="location-map">Map</div>;
  };
});

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn()
  }
}));

// Import after mocking
import GuideDirectoryPage from '@/pages/GuideDirectory';
import { searchEngine } from '@/services/search.service';

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('Guide Directory Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  /**
   * Property 5: Guide Directory Completeness
   * Feature: public-user-directory, Property 5: For any request to access the Tour Guide directory, all registered and verified tour guides should be displayed
   * Validates: Requirements 2.1
   */
  describe('Property 5: Guide Directory Completeness', () => {
    it('should display all registered and verified tour guides when accessing the directory', async () => {
      // Sample guide data
      const registeredGuides = [
        {
          id: '1',
          userId: '1',
          passionType: 'tour_guide' as const,
          displayName: 'John Doe',
          bio: 'Experienced local guide',
          location: { city: 'Delhi', state: 'Delhi' },
          contactInfo: { phone: '+91-9876543210', email: 'john@example.com' },
          isVerified: true,
          isActive: true,
          createdAt: new Date(),
          specialties: ['Historical Tours'],
          languagesSpoken: ['Hindi', 'English'],
          experienceYears: 5,
          hourlyRate: 500,
          certifications: [],
          nearbyAttractions: [],
          rating: 4.5,
          reviewCount: 10
        },
        {
          id: '2',
          userId: '2',
          passionType: 'tour_guide' as const,
          displayName: 'Jane Smith',
          bio: 'Professional tour guide',
          location: { city: 'Mumbai', state: 'Maharashtra' },
          contactInfo: { phone: '+91-9876543211', email: 'jane@example.com' },
          isVerified: true,
          isActive: true,
          createdAt: new Date(),
          specialties: ['Cultural Tours'],
          languagesSpoken: ['Hindi', 'English', 'Marathi'],
          experienceYears: 8,
          hourlyRate: 750,
          certifications: [],
          nearbyAttractions: [],
          rating: 4.8,
          reviewCount: 25
        }
      ];

      // Mock the search engine to return all registered guides
      const mockSearchEngine = searchEngine as jest.Mocked<typeof searchEngine>;
      mockSearchEngine.searchGuides.mockResolvedValue({
        success: true,
        data: registeredGuides,
        totalCount: registeredGuides.length,
        page: 1,
        hasMore: false
      });

      // Render the directory page
      render(
        <TestWrapper>
          <GuideDirectoryPage />
        </TestWrapper>
      );

      // Wait for the component to load and display guides
      await waitFor(() => {
        expect(screen.getByText(/Find Your Perfect Tour Guide/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      // Wait for guides to be loaded
      await waitFor(() => {
        const guideCountText = screen.getByText(/2 Guides Available/i);
        expect(guideCountText).toBeInTheDocument();
      }, { timeout: 5000 });

      // Verify that all registered guides are displayed
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Delhi, Delhi')).toBeInTheDocument();
        expect(screen.getByText('Mumbai, Maharashtra')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Verify the search engine was called correctly
      expect(mockSearchEngine.searchGuides).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: { page: 1, limit: 50 }
        })
      );
    });

    it('should display empty state when no verified guides are available', async () => {
      // Mock empty search results
      const mockSearchEngine = searchEngine as jest.Mocked<typeof searchEngine>;
      mockSearchEngine.searchGuides.mockResolvedValue({
        success: true,
        data: [],
        totalCount: 0,
        page: 1,
        hasMore: false
      });

      // Render the directory page
      render(
        <TestWrapper>
          <GuideDirectoryPage />
        </TestWrapper>
      );

      // Wait for the component to load
      await waitFor(() => {
        expect(screen.getByText(/Find Your Perfect Tour Guide/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      // Wait for empty state to be displayed
      await waitFor(() => {
        expect(screen.getByText('0 Guides Available')).toBeInTheDocument();
        expect(screen.getByText(/No verified guides found/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });
});