/**
 * Guide-Specific Information Display Property Tests
 * Tests for guide-specific information display functionality
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

describe('Guide-Specific Information Display Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 25: Guide-Specific Information Display
   * Feature: public-user-directory, Property 25: For any tour guide profile display, it should show languages spoken, areas of expertise, and years of experience
   * Validates: Requirements 6.3
   */
  describe('Property 25: Guide-Specific Information Display', () => {
    it('should display languages spoken, areas of expertise, and years of experience for all guides', async () => {
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
          // Guide-specific information that must be displayed
          specialties: fc.array(
            fc.oneof(
              fc.constant('Historical Tours'),
              fc.constant('Cultural Tours'),
              fc.constant('Adventure Tours'),
              fc.constant('Wildlife Tours'),
              fc.constant('Heritage Sites'),
              fc.constant('Religious Tours'),
              fc.constant('Food Tours'),
              fc.constant('Photography Tours')
            ),
            { minLength: 1, maxLength: 5 }
          ),
          languagesSpoken: fc.array(
            fc.oneof(
              fc.constant('Hindi'),
              fc.constant('English'),
              fc.constant('Bengali'),
              fc.constant('Tamil'),
              fc.constant('Gujarati'),
              fc.constant('Marathi'),
              fc.constant('Telugu'),
              fc.constant('Kannada'),
              fc.constant('Malayalam'),
              fc.constant('Punjabi')
            ),
            { minLength: 1, maxLength: 6 }
          ),
          experienceYears: fc.integer({ min: 1, max: 30 }),
          hourlyRate: fc.option(fc.integer({ min: 100, max: 5000 })),
          certifications: fc.array(
            fc.oneof(
              fc.constant('Government Certified Guide'),
              fc.constant('Tourism Board Certified'),
              fc.constant('Heritage Guide License'),
              fc.constant('Adventure Tourism Certificate'),
              fc.constant('Wildlife Guide Certification')
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
              />
            </TestWrapper>
          );

          // Verify years of experience is displayed
          const experienceText = `${guideData.experienceYears} ${guideData.experienceYears === 1 ? 'year' : 'years'} experience`;
          expect(screen.getByText(experienceText)).toBeInTheDocument();

          // Verify languages spoken are displayed (at least some of them)
          if (guideData.languagesSpoken.length > 0) {
            // Check that at least the first two languages are shown or indicated
            const displayedLanguages = guideData.languagesSpoken.slice(0, 2).join(', ');
            expect(screen.getByText(new RegExp(displayedLanguages.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeInTheDocument();
            
            // If there are more than 2 languages, check for the "+X" indicator
            if (guideData.languagesSpoken.length > 2) {
              const additionalCount = guideData.languagesSpoken.length - 2;
              expect(screen.getByText(new RegExp(`\\+${additionalCount}`))).toBeInTheDocument();
            }
          }

          // Verify areas of expertise (specialties) are displayed
          if (guideData.specialties.length > 0) {
            // Check that "Specializes in:" label is present
            expect(screen.getByText(/Specializes in:/i)).toBeInTheDocument();
            
            // Check that at least the first specialty is shown
            expect(screen.getByText(guideData.specialties[0])).toBeInTheDocument();
            
            // If there are more specialties than displayed, check for the "+X more" indicator
            const maxDisplayed = 3; // Based on component implementation
            if (guideData.specialties.length > maxDisplayed) {
              const additionalCount = guideData.specialties.length - maxDisplayed;
              expect(screen.getByText(new RegExp(`\\+${additionalCount}`))).toBeInTheDocument();
            }
          }

          // Verify that all three required pieces of information are present
          // 1. Languages (already checked above)
          // 2. Experience (already checked above)  
          // 3. Areas of expertise (already checked above)
          
          // Additional verification: ensure the component doesn't crash with this data
          expect(screen.getByText('View Profile')).toBeInTheDocument();
        }
      ), { numRuns: 10 });
    });

    it('should handle edge cases with minimal guide-specific information', async () => {
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
          // Edge cases: minimal or empty guide-specific information
          specialties: fc.oneof(
            fc.constant([]), // No specialties
            fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 1 }) // Single specialty
          ),
          languagesSpoken: fc.oneof(
            fc.constant([]), // No languages
            fc.array(fc.string({ minLength: 2, maxLength: 15 }), { minLength: 1, maxLength: 1 }) // Single language
          ),
          experienceYears: fc.oneof(
            fc.constant(0), // No experience
            fc.constant(1), // Minimal experience
            fc.integer({ min: 2, max: 5 }) // Some experience
          ),
          hourlyRate: fc.option(fc.integer({ min: 50, max: 10000 })),
          certifications: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { maxLength: 2 }),
          nearbyAttractions: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { maxLength: 3 }),
          rating: fc.float({ min: 0, max: 5.0 }),
          reviewCount: fc.integer({ min: 0, max: 50 })
        }),
        (guideData) => {
          const mockOnViewDetails = jest.fn();

          // Render the guide profile card
          render(
            <TestWrapper>
              <GuideProfileCard 
                guide={guideData}
                onViewDetails={mockOnViewDetails}
              />
            </TestWrapper>
          );

          // Experience should always be displayed, even if 0
          const experienceText = `${guideData.experienceYears} ${guideData.experienceYears === 1 ? 'year' : 'years'} experience`;
          expect(screen.getByText(experienceText)).toBeInTheDocument();

          // Languages: should handle empty array gracefully
          if (guideData.languagesSpoken.length === 0) {
            // Should show "Not specified" or similar fallback
            expect(screen.getByText(/Not specified/i) || screen.getByText(guideData.displayName)).toBeInTheDocument();
          } else {
            // Should show the available language(s)
            const languageText = guideData.languagesSpoken[0];
            expect(screen.getByText(new RegExp(languageText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeInTheDocument();
          }

          // Specialties: should handle empty array gracefully
          if (guideData.specialties.length === 0) {
            // Should not show "Specializes in:" section or show it empty
            const specializesElements = screen.queryAllByText(/Specializes in:/i);
            // Either no section shown, or section shown but empty
            expect(specializesElements.length).toBeLessThanOrEqual(1);
          } else {
            // Should show the available specialty/specialties
            expect(screen.getByText(/Specializes in:/i)).toBeInTheDocument();
            expect(screen.getByText(guideData.specialties[0])).toBeInTheDocument();
          }

          // Component should render without errors regardless of minimal data
          expect(screen.getByText('View Profile')).toBeInTheDocument();
        }
      ), { numRuns: 10 });
    });

    it('should display comprehensive guide information when all fields are populated', async () => {
      await fc.assert(fc.property(
        fc.record({
          id: fc.uuid(),
          userId: fc.uuid(),
          passionType: fc.constant('tour_guide' as const),
          displayName: fc.string({ minLength: 5, maxLength: 50 }),
          bio: fc.string({ minLength: 20, maxLength: 200 }),
          location: fc.record({
            city: fc.string({ minLength: 3, maxLength: 30 }),
            state: fc.string({ minLength: 3, maxLength: 30 })
          }),
          contactInfo: fc.record({
            phone: fc.string({ minLength: 10, maxLength: 15 }),
            email: fc.emailAddress(),
            website: fc.webUrl()
          }),
          isVerified: fc.constant(true), // Verified guides
          isActive: fc.constant(true),
          createdAt: fc.date(),
          // Comprehensive guide-specific information
          specialties: fc.array(
            fc.string({ minLength: 5, maxLength: 30 }),
            { minLength: 3, maxLength: 8 } // Multiple specialties
          ),
          languagesSpoken: fc.array(
            fc.string({ minLength: 3, maxLength: 15 }),
            { minLength: 2, maxLength: 8 } // Multiple languages
          ),
          experienceYears: fc.integer({ min: 5, max: 25 }), // Experienced guides
          hourlyRate: fc.integer({ min: 200, max: 3000 }),
          certifications: fc.array(
            fc.string({ minLength: 10, maxLength: 50 }),
            { minLength: 1, maxLength: 4 }
          ),
          nearbyAttractions: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 2, maxLength: 8 }),
          rating: fc.float({ min: 3.5, max: 5.0 }), // Good ratings
          reviewCount: fc.integer({ min: 5, max: 200 })
        }),
        (guideData) => {
          const mockOnViewDetails = jest.fn();

          // Render the guide profile card
          render(
            <TestWrapper>
              <GuideProfileCard 
                guide={guideData}
                onViewDetails={mockOnViewDetails}
              />
            </TestWrapper>
          );

          // Verify comprehensive experience display
          const experienceText = `${guideData.experienceYears} ${guideData.experienceYears === 1 ? 'year' : 'years'} experience`;
          expect(screen.getByText(experienceText)).toBeInTheDocument();

          // Verify multiple languages are displayed with proper truncation
          const displayedLanguages = guideData.languagesSpoken.slice(0, 3).join(', ');
          expect(screen.getByText(new RegExp(displayedLanguages.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeInTheDocument();
          
          if (guideData.languagesSpoken.length > 3) {
            const additionalCount = guideData.languagesSpoken.length - 3;
            expect(screen.getByText(new RegExp(`\\+${additionalCount}`))).toBeInTheDocument();
          }

          // Verify multiple specialties are displayed with proper truncation
          expect(screen.getByText(/Specializes in:/i)).toBeInTheDocument();
          
          // Check first few specialties are shown
          const maxSpecialtiesShown = Math.min(4, guideData.specialties.length);
          for (let i = 0; i < maxSpecialtiesShown; i++) {
            expect(screen.getByText(guideData.specialties[i])).toBeInTheDocument();
          }
          
          if (guideData.specialties.length > 4) {
            const additionalCount = guideData.specialties.length - 4;
            expect(screen.getByText(new RegExp(`\\+${additionalCount}`))).toBeInTheDocument();
          }

          // Verify verification status is shown for verified guides
          expect(screen.getByText(/Verified Guide/i)).toBeInTheDocument();

          // Verify certifications are indicated
          if (guideData.certifications.length > 0) {
            expect(screen.getByText(/Certified/i)).toBeInTheDocument();
          }

          // Verify rating is displayed properly
          const ratingText = guideData.rating.toFixed(1);
          expect(screen.getByText(new RegExp(ratingText))).toBeInTheDocument();

          // Verify review count is displayed
          if (guideData.reviewCount > 0) {
            const reviewText = `${guideData.reviewCount} ${guideData.reviewCount === 1 ? 'review' : 'reviews'}`;
            expect(screen.getByText(new RegExp(reviewText))).toBeInTheDocument();
          }

          // Component should render without errors
          expect(screen.getByText('View Profile')).toBeInTheDocument();
        }
      ), { numRuns: 5 });
    });
  });
});