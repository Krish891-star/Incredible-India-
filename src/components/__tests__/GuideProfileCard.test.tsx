/**
 * Guide Profile Card Property Tests
 * Tests for guide profile information display functionality
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import * as fc from 'fast-check';
import GuideProfileCard from '@/components/GuideProfileCard';
import { GuideSearchResult } from '@/services/search.service';

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('Guide Profile Card Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 6: Guide Profile Information Display
   * Feature: public-user-directory, Property 6: For any tour guide profile display, it should include name, location, specialties, experience, and contact information
   * Validates: Requirements 2.2
   */
  describe('Property 6: Guide Profile Information Display', () => {
    it('should display all required guide profile information fields', async () => {
      await fc.assert(fc.property(
        fc.record({
          id: fc.uuid(),
          userId: fc.uuid(),
          passionType: fc.constant('tour_guide' as const),
          displayName: fc.oneof(
            fc.constant('John Doe'),
            fc.constant('Jane Smith'),
            fc.constant('Mike Johnson'),
            fc.constant('Sarah Wilson'),
            fc.constant('David Brown')
          ),
          bio: fc.oneof(
            fc.constant('Experienced local guide with 10+ years'),
            fc.constant('Professional tour guide specializing in heritage'),
            fc.constant('Cultural expert and adventure tourism specialist'),
            fc.constant('Certified guide with extensive knowledge')
          ),
          location: fc.record({
            city: fc.oneof(
              fc.constant('Delhi'),
              fc.constant('Mumbai'),
              fc.constant('Goa'),
              fc.constant('Jaipur'),
              fc.constant('Agra')
            ),
            state: fc.oneof(
              fc.constant('Delhi'),
              fc.constant('Maharashtra'),
              fc.constant('Goa'),
              fc.constant('Rajasthan'),
              fc.constant('Uttar Pradesh')
            )
          }),
          contactInfo: fc.record({
            phone: fc.oneof(
              fc.constant('+91-9876543210'),
              fc.constant('9876543210'),
              fc.constant('+1234567890')
            ),
            email: fc.oneof(
              fc.constant('guide@example.com'),
              fc.constant('john.doe@guides.com'),
              fc.constant('jane@tourism.com')
            ),
            website: fc.option(fc.oneof(
              fc.constant('https://www.guidejohn.com'),
              fc.constant('https://janetours.com'),
              fc.constant('https://mikeadventures.com')
            ))
          }),
          isVerified: fc.boolean(),
          isActive: fc.constant(true),
          createdAt: fc.date(),
          specialties: fc.array(
            fc.oneof(
              fc.constant('Historical Tours'),
              fc.constant('Cultural Tours'),
              fc.constant('Adventure Tours'),
              fc.constant('Wildlife Tours'),
              fc.constant('Heritage Sites'),
              fc.constant('Religious Tours')
            ),
            { minLength: 1, maxLength: 4 }
          ),
          languagesSpoken: fc.array(
            fc.oneof(
              fc.constant('Hindi'),
              fc.constant('English'),
              fc.constant('Bengali'),
              fc.constant('Tamil'),
              fc.constant('Gujarati'),
              fc.constant('Marathi')
            ),
            { minLength: 1, maxLength: 5 }
          ),
          experienceYears: fc.integer({ min: 1, max: 25 }),
          hourlyRate: fc.option(fc.integer({ min: 100, max: 5000 })),
          certifications: fc.array(
            fc.oneof(
              fc.constant('Government Certified Guide'),
              fc.constant('Tourism Board Certified'),
              fc.constant('Heritage Guide License'),
              fc.constant('Adventure Tourism Certificate')
            ),
            { maxLength: 3 }
          ),
          nearbyAttractions: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { maxLength: 5 }),
          rating: fc.float({ min: 0, max: 5.0 }),
          reviewCount: fc.integer({ min: 0, max: 100 })
        }),
        (guideData) => {
          const mockOnViewDetails = jest.fn();

          // Render the guide profile card
          render(
            <TestWrapper>
              <GuideProfileCard 
                guide={guideData}
                onViewDetails={mockOnViewDetails}
                showContactInfo={true}
              />
            </TestWrapper>
          );

          // Verify name is displayed
          expect(screen.getByText(guideData.displayName)).toBeInTheDocument();

          // Verify location is displayed
          const locationText = `${guideData.location.city}, ${guideData.location.state}`;
          expect(screen.getByText(locationText)).toBeInTheDocument();

          // Verify experience is displayed
          const experienceText = `${guideData.experienceYears} ${guideData.experienceYears === 1 ? 'year' : 'years'} experience`;
          expect(screen.getByText(experienceText)).toBeInTheDocument();

          // Verify specialties are displayed (at least some of them)
          if (guideData.specialties.length > 0) {
            // Check that at least the first specialty is shown
            expect(screen.getByText(guideData.specialties[0])).toBeInTheDocument();
          }

          // Verify languages are displayed (at least some of them)
          if (guideData.languagesSpoken.length > 0) {
            const languageText = guideData.languagesSpoken.slice(0, 2).join(', ');
            expect(screen.getByText(new RegExp(languageText))).toBeInTheDocument();
          }

          // Verify contact information is displayed when showContactInfo is true
          if (guideData.contactInfo.phone) {
            expect(screen.getByText(guideData.contactInfo.phone)).toBeInTheDocument();
          }
          if (guideData.contactInfo.email) {
            expect(screen.getByText(guideData.contactInfo.email)).toBeInTheDocument();
          }

          // Verify hourly rate is displayed if available
          if (guideData.hourlyRate) {
            const rateText = `₹${guideData.hourlyRate}/hour`;
            expect(screen.getByText(rateText)).toBeInTheDocument();
          }

          // Verify rating is displayed
          const ratingText = guideData.rating > 0 ? guideData.rating.toFixed(1) : 'New Guide';
          expect(screen.getByText(new RegExp(ratingText))).toBeInTheDocument();

          // Verify verification status is indicated
          if (guideData.isVerified) {
            expect(screen.getByText(/Verified Guide/i)).toBeInTheDocument();
          }

          // Verify certifications are indicated if present
          if (guideData.certifications && guideData.certifications.length > 0) {
            expect(screen.getByText(/Certified/i)).toBeInTheDocument();
          }

          // Verify View Profile button is present
          expect(screen.getByText('View Profile')).toBeInTheDocument();
        }
      ), { numRuns: 10 });
    });

    it('should handle missing optional information gracefully', async () => {
      await fc.assert(fc.property(
        fc.record({
          id: fc.uuid(),
          userId: fc.uuid(),
          passionType: fc.constant('tour_guide' as const),
          displayName: fc.string({ minLength: 5, maxLength: 50 }),
          bio: fc.option(fc.string({ minLength: 10, maxLength: 200 })),
          location: fc.record({
            city: fc.string({ minLength: 3, maxLength: 30 }),
            state: fc.string({ minLength: 3, maxLength: 30 })
          }),
          contactInfo: fc.record({
            phone: fc.option(fc.string({ minLength: 10, maxLength: 15 })),
            email: fc.option(fc.emailAddress()),
            website: fc.option(fc.webUrl())
          }),
          isVerified: fc.boolean(),
          isActive: fc.constant(true),
          createdAt: fc.date(),
          specialties: fc.option(fc.array(fc.string({ minLength: 5, maxLength: 30 }), { minLength: 0, maxLength: 3 })),
          languagesSpoken: fc.option(fc.array(fc.string({ minLength: 3, maxLength: 15 }), { minLength: 0, maxLength: 4 })),
          experienceYears: fc.integer({ min: 0, max: 30 }),
          hourlyRate: fc.option(fc.integer({ min: 50, max: 10000 })),
          certifications: fc.option(fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 0, maxLength: 3 })),
          nearbyAttractions: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { maxLength: 5 }),
          rating: fc.float({ min: 0, max: 5.0 }),
          reviewCount: fc.integer({ min: 0, max: 200 })
        }),
        (guideData) => {
          const mockOnViewDetails = jest.fn();

          // Render the guide profile card
          render(
            <TestWrapper>
              <GuideProfileCard 
                guide={guideData}
                onViewDetails={mockOnViewDetails}
                showContactInfo={false}
              />
            </TestWrapper>
          );

          // Essential information should always be displayed
          expect(screen.getByText(guideData.displayName)).toBeInTheDocument();
          
          const locationText = `${guideData.location.city}, ${guideData.location.state}`;
          expect(screen.getByText(locationText)).toBeInTheDocument();

          const experienceText = `${guideData.experienceYears} ${guideData.experienceYears === 1 ? 'year' : 'years'} experience`;
          expect(screen.getByText(experienceText)).toBeInTheDocument();

          // Optional information should be handled gracefully
          // The component should not crash and should display fallback text when needed

          // Verify the component renders without errors
          expect(screen.getByText('View Profile')).toBeInTheDocument();

          // If no specialties, should not show specialty section or show empty gracefully
          if (!guideData.specialties || guideData.specialties.length === 0) {
            // Component should still render without errors
            expect(screen.getByText(guideData.displayName)).toBeInTheDocument();
          }

          // If no languages, should handle gracefully
          if (!guideData.languagesSpoken || guideData.languagesSpoken.length === 0) {
            // Should show "Not specified" or similar fallback
            expect(screen.getByText(/Not specified/i) || screen.getByText(guideData.displayName)).toBeInTheDocument();
          }

          // If no hourly rate, should show "N/A" or not show rate section
          if (!guideData.hourlyRate) {
            // Should either show N/A or not show the rate at all
            const rateElements = screen.queryAllByText(/₹.*\/hour/);
            if (rateElements.length > 0) {
              expect(screen.getByText(/N\/A/)).toBeInTheDocument();
            }
          }
        }
      ), { numRuns: 10 });
    });

    it('should display contact information only when showContactInfo is true', async () => {
      await fc.assert(fc.property(
        fc.record({
          id: fc.uuid(),
          userId: fc.uuid(),
          passionType: fc.constant('tour_guide' as const),
          displayName: fc.string({ minLength: 5, maxLength: 50 }),
          bio: fc.string({ minLength: 10, maxLength: 200 }),
          location: fc.record({
            city: fc.string({ minLength: 3, maxLength: 30 }),
            state: fc.string({ minLength: 3, maxLength: 30 })
          }),
          contactInfo: fc.record({
            phone: fc.string({ minLength: 10, maxLength: 15 }),
            email: fc.emailAddress(),
            website: fc.option(fc.webUrl())
          }),
          isVerified: fc.boolean(),
          isActive: fc.constant(true),
          createdAt: fc.date(),
          specialties: fc.array(fc.string({ minLength: 5, maxLength: 30 }), { minLength: 1, maxLength: 3 }),
          languagesSpoken: fc.array(fc.string({ minLength: 3, maxLength: 15 }), { minLength: 1, maxLength: 4 }),
          experienceYears: fc.integer({ min: 1, max: 30 }),
          hourlyRate: fc.integer({ min: 50, max: 10000 }),
          certifications: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { maxLength: 3 }),
          nearbyAttractions: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { maxLength: 5 }),
          rating: fc.float({ min: 0, max: 5.0 }),
          reviewCount: fc.integer({ min: 0, max: 200 })
        }),
        fc.boolean(),
        (guideData, showContactInfo) => {
          const mockOnViewDetails = jest.fn();

          // Render the guide profile card
          render(
            <TestWrapper>
              <GuideProfileCard 
                guide={guideData}
                onViewDetails={mockOnViewDetails}
                showContactInfo={showContactInfo}
              />
            </TestWrapper>
          );

          if (showContactInfo) {
            // Contact information should be displayed
            expect(screen.getByText(guideData.contactInfo.phone)).toBeInTheDocument();
            expect(screen.getByText(guideData.contactInfo.email)).toBeInTheDocument();
            
            if (guideData.contactInfo.website) {
              expect(screen.getByText('Website')).toBeInTheDocument();
            }
          } else {
            // Contact information should not be displayed
            expect(screen.queryByText(guideData.contactInfo.phone)).not.toBeInTheDocument();
            expect(screen.queryByText(guideData.contactInfo.email)).not.toBeInTheDocument();
          }

          // Other information should always be displayed regardless of showContactInfo
          expect(screen.getByText(guideData.displayName)).toBeInTheDocument();
          const locationText = `${guideData.location.city}, ${guideData.location.state}`;
          expect(screen.getByText(locationText)).toBeInTheDocument();
        }
      ), { numRuns: 10 });
    });
  });
});