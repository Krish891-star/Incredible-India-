/**
 * Hotel Directory Property Tests
 * Tests for hotel directory completeness and functionality
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import * as fc from 'fast-check';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HotelDirectoryPage from '../HotelDirectory';
import { HotelSearchResult } from '@/services/search.service';

// Mock the search service
jest.mock('@/services/search.service', () => ({
  searchEngine: {
    searchHotels: jest.fn()
  }
}));

// Mock other dependencies
jest.mock('@/components/Navbar', () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});

jest.mock('@/components/Footer', () => {
  return function MockFooter() {
    return <div data-testid="footer">Footer</div>;
  };
});

jest.mock('@/components/LocationMap', () => {
  return function MockLocationMap() {
    return <div data-testid="location-map">Map</div>;
  };
});

jest.mock('@/components/HotelProfileCard', () => {
  return function MockHotelProfileCard({ hotel }: { hotel: HotelSearchResult }) {
    return (
      <div data-testid={`hotel-card-${hotel.id}`}>
        <h3>{hotel.displayName}</h3>
        <p>{hotel.location.city}, {hotel.location.state}</p>
        <p>{hotel.hotelType}</p>
      </div>
    );
  };
});

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn()
  }
}));

describe('Hotel Directory Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 10: Hotel Directory Completeness
   * Feature: public-user-directory, Property 10: For any request to access the Hotel directory, all registered hotel partners should be displayed
   * Validates: Requirements 3.1
   */
  describe('Property 10: Hotel Directory Completeness', () => {
    it('should display all registered hotel partners when accessing the directory', async () => {
      await fc.assert(fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.uuid(),
            userId: fc.uuid(),
            passionType: fc.constant('hotel_partner' as const),
            displayName: fc.oneof(
              fc.constant('Grand Palace Hotel'),
              fc.constant('Luxury Beach Resort'),
              fc.constant('Heritage Homestay'),
              fc.constant('Mountain Lodge'),
              fc.constant('City Center Inn')
            ),
            bio: fc.string({ minLength: 10, maxLength: 200 }),
            location: fc.record({
              city: fc.oneof(
                fc.constant('Delhi'),
                fc.constant('Mumbai'),
                fc.constant('Goa'),
                fc.constant('Jaipur'),
                fc.constant('Bangalore')
              ),
              state: fc.oneof(
                fc.constant('Delhi'),
                fc.constant('Maharashtra'),
                fc.constant('Goa'),
                fc.constant('Rajasthan'),
                fc.constant('Karnataka')
              )
            }),
            contactInfo: fc.record({
              phone: fc.string({ minLength: 10, maxLength: 15 }),
              email: fc.emailAddress(),
              website: fc.webUrl()
            }),
            isVerified: fc.boolean(),
            isActive: fc.constant(true),
            createdAt: fc.date(),
            hotelType: fc.oneof(
              fc.constant('Hotel'),
              fc.constant('Resort'),
              fc.constant('Homestay'),
              fc.constant('Lodge'),
              fc.constant('Guesthouse')
            ),
            amenities: fc.array(
              fc.oneof(
                fc.constant('WiFi'),
                fc.constant('Parking'),
                fc.constant('Restaurant'),
                fc.constant('Pool'),
                fc.constant('Gym')
              ),
              { minLength: 1, maxLength: 5 }
            ),
            roomTypes: fc.array(fc.string({ minLength: 5, maxLength: 20 }), { maxLength: 3 }),
            priceRange: fc.record({
              min: fc.integer({ min: 500, max: 2000 }),
              max: fc.integer({ min: 2000, max: 10000 })
            }),
            nearbyAttractions: fc.array(fc.string({ minLength: 5, maxLength: 30 }), { maxLength: 5 }),
            images: fc.array(fc.webUrl(), { maxLength: 5 }),
            rating: fc.float({ min: 1, max: 5 }),
            reviewCount: fc.integer({ min: 0, max: 1000 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (hotelData) => {
          // Mock successful search response
          const { searchEngine } = require('@/services/search.service');
          searchEngine.searchHotels.mockResolvedValue({
            success: true,
            data: hotelData,
            totalCount: hotelData.length,
            page: 1,
            hasMore: false
          });

          // Render the component
          render(
            <BrowserRouter>
              <HotelDirectoryPage />
            </BrowserRouter>
          );

          // Wait for the component to load
          await waitFor(() => {
            expect(screen.queryByText('Find Your Perfect Stay')).toBeInTheDocument();
          });

          // Wait for hotels to be loaded
          await waitFor(() => {
            const hotelCountText = screen.getByText(new RegExp(`${hotelData.length} Hotel`));
            expect(hotelCountText).toBeInTheDocument();
          });

          // Verify all hotels are displayed
          for (const hotel of hotelData) {
            await waitFor(() => {
              const hotelCard = screen.getByTestId(`hotel-card-${hotel.id}`);
              expect(hotelCard).toBeInTheDocument();
              expect(hotelCard).toHaveTextContent(hotel.displayName);
              expect(hotelCard).toHaveTextContent(`${hotel.location.city}, ${hotel.location.state}`);
              expect(hotelCard).toHaveTextContent(hotel.hotelType);
            });
          }

          // Verify search was called with correct parameters
          expect(searchEngine.searchHotels).toHaveBeenCalledWith(
            expect.objectContaining({
              filters: expect.any(Object),
              sort: expect.any(String),
              pagination: expect.objectContaining({
                page: 1,
                limit: 50
              })
            })
          );
        }
      ), { numRuns: 5 });
    });

    it('should handle empty hotel directory gracefully', async () => {
      // Mock empty search response
      const { searchEngine } = require('@/services/search.service');
      searchEngine.searchHotels.mockResolvedValue({
        success: true,
        data: [],
        totalCount: 0,
        page: 1,
        hasMore: false
      });

      // Render the component
      render(
        <BrowserRouter>
          <HotelDirectoryPage />
        </BrowserRouter>
      );

      // Wait for the component to load
      await waitFor(() => {
        expect(screen.getByText('Find Your Perfect Stay')).toBeInTheDocument();
      });

      // Wait for empty state to be displayed
      await waitFor(() => {
        expect(screen.getByText('0 Hotels Available')).toBeInTheDocument();
        expect(screen.getByText('No verified hotels found')).toBeInTheDocument();
      });

      // Verify the empty state message is appropriate
      expect(screen.getByText(/There are currently no verified hotels matching your criteria/)).toBeInTheDocument();
      expect(screen.getByText('Clear Filters')).toBeInTheDocument();
    });

    it('should handle search service errors gracefully', async () => {
      // Mock search service error
      const { searchEngine } = require('@/services/search.service');
      searchEngine.searchHotels.mockResolvedValue({
        success: false,
        error: 'Database connection failed'
      });

      // Render the component
      render(
        <BrowserRouter>
          <HotelDirectoryPage />
        </BrowserRouter>
      );

      // Wait for the component to load
      await waitFor(() => {
        expect(screen.getByText('Find Your Perfect Stay')).toBeInTheDocument();
      });

      // Wait for error handling to complete
      await waitFor(() => {
        expect(screen.getByText('0 Hotels Available')).toBeInTheDocument();
      });

      // Verify error was handled and empty state is shown
      expect(screen.getByText('No verified hotels found')).toBeInTheDocument();
    });

    it('should maintain directory completeness across different filter combinations', async () => {
      await fc.assert(fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.uuid(),
            userId: fc.uuid(),
            passionType: fc.constant('hotel_partner' as const),
            displayName: fc.string({ minLength: 5, maxLength: 50 }),
            bio: fc.string({ minLength: 10, maxLength: 200 }),
            location: fc.record({
              city: fc.oneof(
                fc.constant('Delhi'),
                fc.constant('Mumbai'),
                fc.constant('Goa')
              ),
              state: fc.oneof(
                fc.constant('Delhi'),
                fc.constant('Maharashtra'),
                fc.constant('Goa')
              )
            }),
            contactInfo: fc.record({
              phone: fc.string({ minLength: 10, maxLength: 15 }),
              email: fc.emailAddress()
            }),
            isVerified: fc.constant(true),
            isActive: fc.constant(true),
            createdAt: fc.date(),
            hotelType: fc.oneof(
              fc.constant('Hotel'),
              fc.constant('Resort'),
              fc.constant('Homestay')
            ),
            amenities: fc.array(
              fc.oneof(
                fc.constant('WiFi'),
                fc.constant('Parking'),
                fc.constant('Restaurant')
              ),
              { minLength: 1, maxLength: 3 }
            ),
            roomTypes: fc.array(fc.string({ minLength: 5, maxLength: 20 }), { maxLength: 2 }),
            priceRange: fc.record({
              min: fc.integer({ min: 500, max: 2000 }),
              max: fc.integer({ min: 2000, max: 5000 })
            }),
            nearbyAttractions: fc.array(fc.string({ minLength: 5, maxLength: 30 }), { maxLength: 3 }),
            images: fc.array(fc.webUrl(), { maxLength: 3 }),
            rating: fc.float({ min: 3, max: 5 }),
            reviewCount: fc.integer({ min: 0, max: 500 })
          }),
          { minLength: 3, maxLength: 8 }
        ),
        fc.record({
          searchText: fc.oneof(fc.constant(''), fc.string({ minLength: 1, maxLength: 20 })),
          cityFilter: fc.oneof(fc.constant(''), fc.constant('Delhi'), fc.constant('Mumbai')),
          hotelTypeFilter: fc.oneof(fc.constant(''), fc.constant('Hotel'), fc.constant('Resort')),
          amenityFilter: fc.oneof(fc.constant(''), fc.constant('WiFi'), fc.constant('Parking'))
        }),
        async (allHotels, filters) => {
          // Filter hotels based on the test filters to simulate expected results
          const expectedHotels = allHotels.filter(hotel => {
            if (filters.cityFilter && hotel.location.city !== filters.cityFilter) return false;
            if (filters.hotelTypeFilter && hotel.hotelType !== filters.hotelTypeFilter) return false;
            if (filters.amenityFilter && !hotel.amenities.includes(filters.amenityFilter)) return false;
            if (filters.searchText && !hotel.displayName.toLowerCase().includes(filters.searchText.toLowerCase())) return false;
            return true;
          });

          // Mock search response with filtered results
          const { searchEngine } = require('@/services/search.service');
          searchEngine.searchHotels.mockResolvedValue({
            success: true,
            data: expectedHotels,
            totalCount: expectedHotels.length,
            page: 1,
            hasMore: false
          });

          // Render the component
          render(
            <BrowserRouter>
              <HotelDirectoryPage />
            </BrowserRouter>
          );

          // Wait for the component to load
          await waitFor(() => {
            expect(screen.getByText('Find Your Perfect Stay')).toBeInTheDocument();
          });

          // Wait for results to be displayed
          await waitFor(() => {
            const hotelCountText = screen.getByText(new RegExp(`${expectedHotels.length} Hotel`));
            expect(hotelCountText).toBeInTheDocument();
          });

          // Verify that the search was called (indicating the directory is attempting to be complete)
          expect(searchEngine.searchHotels).toHaveBeenCalled();

          // If there are expected results, verify they are all displayed
          if (expectedHotels.length > 0) {
            for (const hotel of expectedHotels) {
              await waitFor(() => {
                const hotelCard = screen.getByTestId(`hotel-card-${hotel.id}`);
                expect(hotelCard).toBeInTheDocument();
              });
            }
          }
        }
      ), { numRuns: 3 });
    });
  });
});