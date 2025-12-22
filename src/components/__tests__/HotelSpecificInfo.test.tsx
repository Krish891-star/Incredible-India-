/**
 * Hotel-Specific Information Display Property Tests
 * Tests for hotel-specific information display requirements
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import HotelProfileCard from '../HotelProfileCard';
import { HotelSearchResult } from '@/services/search.service';

describe('Hotel-Specific Information Display Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 26: Hotel-Specific Information Display
   * Feature: public-user-directory, Property 26: For any hotel profile display, it should show room availability, pricing ranges, and booking information
   * Validates: Requirements 6.4
   */
  describe('Property 26: Hotel-Specific Information Display', () => {
    it('should display hotel-specific information including room availability, pricing, and booking details', async () => {
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
            fc.constant('City Center Inn')
          ),
          bio: fc.string({ minLength: 20, maxLength: 150 }),
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
            phone: fc.oneof(
              fc.constant('+91-9876543210'),
              fc.constant('022-12345678'),
              fc.constant('+91-8765432109')
            ),
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
              fc.constant('Room Service'),
              fc.constant('Swimming Pool'),
              fc.constant('Gym'),
              fc.constant('Spa'),
              fc.constant('Conference Room')
            ),
            { minLength: 2, maxLength: 6 }
          ),
          roomTypes: fc.array(
            fc.oneof(
              fc.constant('Standard Room'),
              fc.constant('Deluxe Room'),
              fc.constant('Suite'),
              fc.constant('Family Room'),
              fc.constant('Executive Room')
            ),
            { minLength: 1, maxLength: 4 }
          ),
          priceRange: fc.record({
            min: fc.integer({ min: 1000, max: 3000 }),
            max: fc.integer({ min: 3000, max: 15000 })
          }),
          nearbyAttractions: fc.array(
            fc.oneof(
              fc.constant('Red Fort'),
              fc.constant('India Gate'),
              fc.constant('Taj Mahal'),
              fc.constant('Gateway of India'),
              fc.constant('Hawa Mahal')
            ),
            { minLength: 1, maxLength: 4 }
          ),
          images: fc.array(fc.webUrl(), { minLength: 1, maxLength: 5 }),
          rating: fc.float({ min: 2, max: 5 }),
          reviewCount: fc.integer({ min: 1, max: 1000 })
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

          // Verify room availability information is displayed
          // The component shows "Available for booking" text
          expect(screen.getByText('Available for booking')).toBeInTheDocument();

          // Verify pricing ranges are displayed
          const priceText = `₹${hotelData.priceRange.min.toLocaleString()} - ₹${hotelData.priceRange.max.toLocaleString()}/night`;
          expect(screen.getByText(priceText)).toBeInTheDocument();

          // Verify room types are displayed (hotel-specific information)
          if (hotelData.roomTypes && hotelData.roomTypes.length > 0) {
            // Component shows first 2 room types
            const visibleRoomTypes = hotelData.roomTypes.slice(0, 2);
            const roomTypeText = visibleRoomTypes.join(', ');
            expect(screen.getByText(new RegExp(roomTypeText))).toBeInTheDocument();
          }

          // Verify booking information is available through the action button
          expect(screen.getByText('View Details & Book')).toBeInTheDocument();

          // Verify hotel-specific amenities are displayed
          const visibleAmenities = hotelData.amenities.slice(0, 6);
          for (const amenity of visibleAmenities) {
            expect(screen.getByText(amenity)).toBeInTheDocument();
          }

          // Verify hotel type is displayed (hotel-specific classification)
          expect(screen.getByText(hotelData.hotelType)).toBeInTheDocument();

          // Verify rating and review information (important for booking decisions)
          expect(screen.getByText(hotelData.rating.toFixed(1))).toBeInTheDocument();
          const reviewText = hotelData.reviewCount === 1 ? 'review' : 'reviews';
          expect(screen.getByText(new RegExp(`${hotelData.reviewCount}.*${reviewText}`))).toBeInTheDocument();

          // Verify contact information for booking inquiries
          expect(screen.getByText(hotelData.contactInfo.phone)).toBeInTheDocument();
          expect(screen.getByText(hotelData.contactInfo.email)).toBeInTheDocument();
          expect(screen.getByText('Website')).toBeInTheDocument();
        }
      ), { numRuns: 8 });
    });

    it('should handle hotels with minimal room and pricing information', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          userId: fc.uuid(),
          passionType: fc.constant('hotel_partner' as const),
          displayName: fc.string({ minLength: 10, maxLength: 40 }),
          bio: fc.string({ minLength: 20, maxLength: 100 }),
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
          hotelType: fc.string({ minLength: 4, maxLength: 15 }),
          amenities: fc.array(fc.string({ minLength: 3, maxLength: 15 }), { minLength: 1, maxLength: 3 }),
          roomTypes: fc.oneof(
            fc.constant([]),
            fc.array(fc.string({ minLength: 5, maxLength: 20 }), { minLength: 1, maxLength: 2 })
          ),
          priceRange: fc.oneof(
            fc.record({
              min: fc.integer({ min: 500, max: 1500 }),
              max: fc.integer({ min: 1500, max: 5000 })
            }),
            fc.record({
              min: fc.constant(0),
              max: fc.constant(0)
            })
          ),
          nearbyAttractions: fc.array(fc.string({ minLength: 5, maxLength: 25 }), { maxLength: 2 }),
          images: fc.oneof(
            fc.constant([]),
            fc.array(fc.webUrl(), { minLength: 1, maxLength: 2 })
          ),
          rating: fc.float({ min: 1, max: 5 }),
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

          // Essential hotel information should always be displayed
          expect(screen.getByText(hotelData.displayName)).toBeInTheDocument();
          expect(screen.getByText(hotelData.hotelType)).toBeInTheDocument();

          // Availability information should be shown
          expect(screen.getByText('Available for booking')).toBeInTheDocument();

          // Pricing should be displayed if available
          if (hotelData.priceRange.min > 0 || hotelData.priceRange.max > 0) {
            const priceText = `₹${hotelData.priceRange.min.toLocaleString()} - ₹${hotelData.priceRange.max.toLocaleString()}/night`;
            expect(screen.getByText(priceText)).toBeInTheDocument();
          }

          // Room types should be displayed if available
          if (hotelData.roomTypes && hotelData.roomTypes.length > 0) {
            const visibleRoomTypes = hotelData.roomTypes.slice(0, 2);
            const roomTypeText = visibleRoomTypes.join(', ');
            expect(screen.getByText(new RegExp(roomTypeText))).toBeInTheDocument();
          }

          // Booking action should always be available
          expect(screen.getByText('View Details & Book')).toBeInTheDocument();

          // Rating should be displayed appropriately
          if (hotelData.rating > 0) {
            expect(screen.getByText(hotelData.rating.toFixed(1))).toBeInTheDocument();
          } else {
            expect(screen.getByText('New Hotel')).toBeInTheDocument();
          }

          // Component should render without errors even with minimal data
          expect(screen.getByText(hotelData.displayName)).toBeInTheDocument();
        }
      ), { numRuns: 8 });
    });

    it('should display comprehensive hotel information for fully-featured properties', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          userId: fc.uuid(),
          passionType: fc.constant('hotel_partner' as const),
          displayName: fc.string({ minLength: 15, maxLength: 50 }),
          bio: fc.string({ minLength: 50, maxLength: 200 }),
          location: fc.record({
            city: fc.string({ minLength: 4, maxLength: 20 }),
            state: fc.string({ minLength: 4, maxLength: 20 })
          }),
          contactInfo: fc.record({
            phone: fc.string({ minLength: 10, maxLength: 15 }),
            email: fc.emailAddress(),
            website: fc.webUrl()
          }),
          isVerified: fc.constant(true),
          isActive: fc.constant(true),
          createdAt: fc.date(),
          hotelType: fc.string({ minLength: 5, maxLength: 20 }),
          amenities: fc.array(
            fc.string({ minLength: 4, maxLength: 20 }),
            { minLength: 4, maxLength: 10 }
          ),
          roomTypes: fc.array(
            fc.string({ minLength: 8, maxLength: 25 }),
            { minLength: 2, maxLength: 5 }
          ),
          priceRange: fc.record({
            min: fc.integer({ min: 2000, max: 5000 }),
            max: fc.integer({ min: 5000, max: 20000 })
          }),
          nearbyAttractions: fc.array(
            fc.string({ minLength: 8, maxLength: 30 }),
            { minLength: 2, maxLength: 5 }
          ),
          images: fc.array(fc.webUrl(), { minLength: 2, maxLength: 8 }),
          rating: fc.float({ min: 4, max: 5 }),
          reviewCount: fc.integer({ min: 50, max: 2000 })
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

          // Verify all hotel-specific information is displayed
          expect(screen.getByText(hotelData.displayName)).toBeInTheDocument();
          expect(screen.getByText(hotelData.hotelType)).toBeInTheDocument();

          // Verify comprehensive pricing information
          const priceText = `₹${hotelData.priceRange.min.toLocaleString()} - ₹${hotelData.priceRange.max.toLocaleString()}/night`;
          expect(screen.getByText(priceText)).toBeInTheDocument();

          // Verify room availability and types
          expect(screen.getByText('Available for booking')).toBeInTheDocument();
          const visibleRoomTypes = hotelData.roomTypes.slice(0, 2);
          const roomTypeText = visibleRoomTypes.join(', ');
          expect(screen.getByText(new RegExp(roomTypeText))).toBeInTheDocument();

          // Verify extensive amenities are displayed
          const visibleAmenities = hotelData.amenities.slice(0, 6);
          for (const amenity of visibleAmenities) {
            expect(screen.getByText(amenity)).toBeInTheDocument();
          }

          // Verify high-quality rating and review information
          expect(screen.getByText(hotelData.rating.toFixed(1))).toBeInTheDocument();
          const reviewText = hotelData.reviewCount === 1 ? 'review' : 'reviews';
          expect(screen.getByText(new RegExp(`${hotelData.reviewCount}.*${reviewText}`))).toBeInTheDocument();

          // Verify verification status for premium properties
          expect(screen.getByText('Verified Hotel')).toBeInTheDocument();

          // Verify comprehensive contact information for booking
          expect(screen.getByText(hotelData.contactInfo.phone)).toBeInTheDocument();
          expect(screen.getByText(hotelData.contactInfo.email)).toBeInTheDocument();
          expect(screen.getByText('Website')).toBeInTheDocument();

          // Verify booking action is prominently displayed
          expect(screen.getByText('View Details & Book')).toBeInTheDocument();

          // Verify image gallery information
          if (hotelData.images.length > 1) {
            expect(screen.getByText(hotelData.images.length.toString())).toBeInTheDocument();
          }
        }
      ), { numRuns: 5 });
    });
  });
});