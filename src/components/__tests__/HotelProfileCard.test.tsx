/**
 * Hotel Profile Card Property Tests
 * Tests for hotel profile information display
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import HotelProfileCard from '../HotelProfileCard';
import { HotelSearchResult } from '@/services/search.service';

describe('Hotel Profile Card Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 11: Hotel Profile Information Display
   * Feature: public-user-directory, Property 11: For any hotel profile display, it should include hotel name, location, amenities, room types, and contact information
   * Validates: Requirements 3.2
   */
  describe('Property 11: Hotel Profile Information Display', () => {
    it('should display all required hotel profile information fields', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          userId: fc.uuid(),
          passionType: fc.constant('hotel_partner' as const),
          displayName: fc.oneof(
            fc.constant('Grand Palace Hotel'),
            fc.constant('Luxury Beach Resort'),
            fc.constant('Heritage Homestay'),
            fc.constant('Mountain View Lodge'),
            fc.constant('City Center Inn'),
            fc.constant('Royal Heritage Hotel'),
            fc.constant('Seaside Paradise Resort')
          ),
          bio: fc.string({ minLength: 20, maxLength: 200 }),
          location: fc.record({
            city: fc.oneof(
              fc.constant('Delhi'),
              fc.constant('Mumbai'),
              fc.constant('Goa'),
              fc.constant('Jaipur'),
              fc.constant('Bangalore'),
              fc.constant('Chennai'),
              fc.constant('Kolkata')
            ),
            state: fc.oneof(
              fc.constant('Delhi'),
              fc.constant('Maharashtra'),
              fc.constant('Goa'),
              fc.constant('Rajasthan'),
              fc.constant('Karnataka'),
              fc.constant('Tamil Nadu'),
              fc.constant('West Bengal')
            )
          }),
          contactInfo: fc.record({
            phone: fc.oneof(
              fc.constant('+91-9876543210'),
              fc.constant('022-12345678'),
              fc.constant('+91-8765432109'),
              fc.constant('011-87654321')
            ),
            email: fc.oneof(
              fc.constant('info@grandpalace.com'),
              fc.constant('reservations@luxuryresort.com'),
              fc.constant('contact@heritage.com'),
              fc.constant('booking@mountainlodge.com')
            ),
            website: fc.oneof(
              fc.constant('https://grandpalace.com'),
              fc.constant('https://luxuryresort.com'),
              fc.constant('https://heritage.com'),
              fc.constant('https://mountainlodge.com')
            )
          }),
          isVerified: fc.boolean(),
          isActive: fc.constant(true),
          createdAt: fc.date(),
          hotelType: fc.oneof(
            fc.constant('Hotel'),
            fc.constant('Resort'),
            fc.constant('Homestay'),
            fc.constant('Lodge'),
            fc.constant('Guesthouse'),
            fc.constant('Villa'),
            fc.constant('Boutique Hotel')
          ),
          amenities: fc.array(
            fc.oneof(
              fc.constant('WiFi'),
              fc.constant('Parking'),
              fc.constant('Restaurant'),
              fc.constant('Room Service'),
              fc.constant('Swimming Pool'),
              fc.constant('Gym'),
              fc.constant('Spa'),
              fc.constant('Conference Room'),
              fc.constant('Airport Shuttle'),
              fc.constant('Pet Friendly'),
              fc.constant('Air Conditioning'),
              fc.constant('Laundry Service')
            ),
            { minLength: 2, maxLength: 8 }
          ),
          roomTypes: fc.array(
            fc.oneof(
              fc.constant('Standard Room'),
              fc.constant('Deluxe Room'),
              fc.constant('Suite'),
              fc.constant('Family Room'),
              fc.constant('Executive Room'),
              fc.constant('Presidential Suite')
            ),
            { minLength: 1, maxLength: 4 }
          ),
          priceRange: fc.record({
            min: fc.integer({ min: 500, max: 3000 }),
            max: fc.integer({ min: 3000, max: 15000 })
          }),
          nearbyAttractions: fc.array(fc.string({ minLength: 5, maxLength: 30 }), { maxLength: 5 }),
          images: fc.array(fc.webUrl(), { maxLength: 5 }),
          rating: fc.float({ min: 1, max: 5 }),
          reviewCount: fc.integer({ min: 0, max: 1000 })
        }),
        async (hotelData) => {
          const mockOnViewDetails = jest.fn();

          // Render the component
          render(
            <HotelProfileCard 
              hotel={hotelData} 
              onViewDetails={mockOnViewDetails}
              showContactInfo={true}
            />
          );

          // Verify hotel name is displayed
          expect(screen.getByText(hotelData.displayName)).toBeInTheDocument();

          // Verify location is displayed (city and state)
          const locationText = `${hotelData.location.city}, ${hotelData.location.state}`;
          expect(screen.getByText(locationText)).toBeInTheDocument();

          // Verify hotel type is displayed
          expect(screen.getByText(hotelData.hotelType)).toBeInTheDocument();

          // Verify amenities are displayed
          // At least some amenities should be visible (component shows first 6)
          const visibleAmenities = hotelData.amenities.slice(0, 6);
          for (const amenity of visibleAmenities) {
            expect(screen.getByText(amenity)).toBeInTheDocument();
          }

          // Verify room types are displayed if available
          if (hotelData.roomTypes && hotelData.roomTypes.length > 0) {
            // Component shows first 2 room types
            const visibleRoomTypes = hotelData.roomTypes.slice(0, 2);
            const roomTypeText = visibleRoomTypes.join(', ');
            expect(screen.getByText(new RegExp(roomTypeText))).toBeInTheDocument();
          }

          // Verify contact information is displayed when showContactInfo is true
          if (hotelData.contactInfo.phone) {
            expect(screen.getByText(hotelData.contactInfo.phone)).toBeInTheDocument();
          }
          if (hotelData.contactInfo.email) {
            expect(screen.getByText(hotelData.contactInfo.email)).toBeInTheDocument();
          }
          if (hotelData.contactInfo.website) {
            expect(screen.getByText('Website')).toBeInTheDocument();
          }

          // Verify price range is displayed
          if (hotelData.priceRange && (hotelData.priceRange.min > 0 || hotelData.priceRange.max > 0)) {
            const priceText = `₹${hotelData.priceRange.min.toLocaleString()} - ₹${hotelData.priceRange.max.toLocaleString()}/night`;
            expect(screen.getByText(priceText)).toBeInTheDocument();
          }

          // Verify rating is displayed
          if (hotelData.rating > 0) {
            expect(screen.getByText(hotelData.rating.toFixed(1))).toBeInTheDocument();
          } else {
            expect(screen.getByText('New Hotel')).toBeInTheDocument();
          }

          // Verify review count is displayed if there are reviews
          if (hotelData.reviewCount > 0) {
            const reviewText = hotelData.reviewCount === 1 ? 'review' : 'reviews';
            expect(screen.getByText(new RegExp(`${hotelData.reviewCount}.*${reviewText}`))).toBeInTheDocument();
          }

          // Verify verification status is displayed
          if (hotelData.isVerified) {
            expect(screen.getByText('Verified Hotel')).toBeInTheDocument();
          } else {
            expect(screen.getByText('Hotel Partner')).toBeInTheDocument();
          }

          // Verify action button is present
          expect(screen.getByText('View Details & Book')).toBeInTheDocument();
        }
      ), { numRuns: 10 });
    });

    it('should handle missing optional information gracefully', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          userId: fc.uuid(),
          passionType: fc.constant('hotel_partner' as const),
          displayName: fc.string({ minLength: 5, maxLength: 50 }),
          bio: fc.oneof(fc.constant(''), fc.constant(null), fc.string({ minLength: 1, maxLength: 100 })),
          location: fc.record({
            city: fc.string({ minLength: 2, maxLength: 20 }),
            state: fc.string({ minLength: 2, maxLength: 20 })
          }),
          contactInfo: fc.record({
            phone: fc.oneof(fc.constant(''), fc.constant(null), fc.string({ minLength: 10, maxLength: 15 })),
            email: fc.oneof(fc.constant(''), fc.constant(null), fc.emailAddress()),
            website: fc.oneof(fc.constant(''), fc.constant(null), fc.webUrl())
          }),
          isVerified: fc.boolean(),
          isActive: fc.constant(true),
          createdAt: fc.date(),
          hotelType: fc.oneof(fc.constant(''), fc.string({ minLength: 3, maxLength: 20 })),
          amenities: fc.oneof(fc.constant([]), fc.array(fc.string({ minLength: 3, maxLength: 20 }), { maxLength: 3 })),
          roomTypes: fc.oneof(fc.constant([]), fc.array(fc.string({ minLength: 5, maxLength: 20 }), { maxLength: 2 })),
          priceRange: fc.oneof(
            fc.constant({ min: 0, max: 0 }),
            fc.record({
              min: fc.integer({ min: 100, max: 1000 }),
              max: fc.integer({ min: 1000, max: 5000 })
            })
          ),
          nearbyAttractions: fc.array(fc.string({ minLength: 5, maxLength: 30 }), { maxLength: 3 }),
          images: fc.oneof(fc.constant([]), fc.array(fc.webUrl(), { maxLength: 2 })),
          rating: fc.oneof(fc.constant(0), fc.float({ min: 1, max: 5 })),
          reviewCount: fc.integer({ min: 0, max: 100 })
        }),
        async (hotelData) => {
          const mockOnViewDetails = jest.fn();

          // Render the component
          render(
            <HotelProfileCard 
              hotel={hotelData} 
              onViewDetails={mockOnViewDetails}
              showContactInfo={false}
            />
          );

          // Essential information should always be displayed
          expect(screen.getByText(hotelData.displayName)).toBeInTheDocument();
          expect(screen.getByText(`${hotelData.location.city}, ${hotelData.location.state}`)).toBeInTheDocument();

          // Optional information should be handled gracefully
          // Bio should show default text if empty
          if (!hotelData.bio || hotelData.bio.trim() === '') {
            expect(screen.getByText(/Experience comfort and hospitality/)).toBeInTheDocument();
          }

          // Hotel type should be displayed if available
          if (hotelData.hotelType && hotelData.hotelType.trim() !== '') {
            expect(screen.getByText(hotelData.hotelType)).toBeInTheDocument();
          }

          // Rating should show appropriate text
          if (hotelData.rating > 0) {
            expect(screen.getByText(hotelData.rating.toFixed(1))).toBeInTheDocument();
          } else {
            expect(screen.getByText('New Hotel')).toBeInTheDocument();
          }

          // Contact info should not be displayed when showContactInfo is false
          expect(screen.queryByText(hotelData.contactInfo.phone || '')).not.toBeInTheDocument();
          expect(screen.queryByText(hotelData.contactInfo.email || '')).not.toBeInTheDocument();

          // Component should not crash with empty arrays
          expect(screen.getByText('View Details & Book')).toBeInTheDocument();
        }
      ), { numRuns: 10 });
    });

    it('should display information consistently across different variants', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          userId: fc.uuid(),
          passionType: fc.constant('hotel_partner' as const),
          displayName: fc.string({ minLength: 5, maxLength: 30 }),
          bio: fc.string({ minLength: 10, maxLength: 100 }),
          location: fc.record({
            city: fc.string({ minLength: 3, maxLength: 15 }),
            state: fc.string({ minLength: 3, maxLength: 15 })
          }),
          contactInfo: fc.record({
            phone: fc.string({ minLength: 10, maxLength: 15 }),
            email: fc.emailAddress(),
            website: fc.webUrl()
          }),
          isVerified: fc.boolean(),
          isActive: fc.constant(true),
          createdAt: fc.date(),
          hotelType: fc.string({ minLength: 3, maxLength: 15 }),
          amenities: fc.array(fc.string({ minLength: 3, maxLength: 15 }), { minLength: 2, maxLength: 5 }),
          roomTypes: fc.array(fc.string({ minLength: 5, maxLength: 15 }), { minLength: 1, maxLength: 3 }),
          priceRange: fc.record({
            min: fc.integer({ min: 500, max: 2000 }),
            max: fc.integer({ min: 2000, max: 8000 })
          }),
          nearbyAttractions: fc.array(fc.string({ minLength: 5, maxLength: 25 }), { maxLength: 3 }),
          images: fc.array(fc.webUrl(), { minLength: 1, maxLength: 3 }),
          rating: fc.float({ min: 2, max: 5 }),
          reviewCount: fc.integer({ min: 1, max: 500 })
        }),
        fc.oneof(fc.constant('list'), fc.constant('grid')),
        async (hotelData, variant) => {
          const mockOnViewDetails = jest.fn();

          // Render the component with the specified variant
          const { container } = render(
            <HotelProfileCard 
              hotel={hotelData} 
              variant={variant as 'list' | 'grid'}
              onViewDetails={mockOnViewDetails}
              showContactInfo={true}
            />
          );

          // Core information should be displayed in both variants
          expect(screen.getByText(hotelData.displayName)).toBeInTheDocument();
          expect(screen.getByText(`${hotelData.location.city}, ${hotelData.location.state}`)).toBeInTheDocument();
          expect(screen.getByText(hotelData.hotelType)).toBeInTheDocument();
          expect(screen.getByText(hotelData.rating.toFixed(1))).toBeInTheDocument();

          // Amenities should be displayed (at least some of them)
          const visibleAmenities = variant === 'grid' ? hotelData.amenities.slice(0, 3) : hotelData.amenities.slice(0, 6);
          for (const amenity of visibleAmenities) {
            expect(screen.getByText(amenity)).toBeInTheDocument();
          }

          // Price range should be displayed
          const priceText = `₹${hotelData.priceRange.min.toLocaleString()} - ₹${hotelData.priceRange.max.toLocaleString()}/night`;
          expect(screen.getByText(priceText)).toBeInTheDocument();

          // Action button should be present
          const buttonText = variant === 'grid' ? 'View Details' : 'View Details & Book';
          expect(screen.getByText(buttonText)).toBeInTheDocument();

          // Verification status should be displayed
          if (hotelData.isVerified) {
            expect(screen.getByText('Verified Hotel')).toBeInTheDocument();
          } else {
            expect(screen.getByText('Hotel Partner')).toBeInTheDocument();
          }

          // Component should render without errors
          expect(container.firstChild).toBeInTheDocument();
        }
      ), { numRuns: 8 });
    });
  });
});