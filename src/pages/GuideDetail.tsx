import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { getTourGuide, saveReview, getItemReviews, calculateAverageRating } from '@/lib/supabaseData';
import type { Review } from '@/lib/supabaseData';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MapPin, Star, Languages, Clock, Award, 
  Heart, Share2, Phone, Mail, Calendar,
  User, MessageSquare, Check
} from 'lucide-react';
import { toast } from 'sonner';
import LocationMap from '@/components/LocationMap';
import ReviewCard from '@/components/ReviewCard';
import ReviewForm from '@/components/ReviewForm';

export default function GuideDetail() {
  const { guideId } = useParams<{ guideId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [guide, setGuide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    if (guideId) {
      fetchGuide();
      fetchReviews();
    }
  }, [guideId]);

  const fetchGuide = async () => {
    try {
      const guideData = await getTourGuide(guideId || '');
      if (guideData) {
        setGuide(guideData);
      } else {
        navigate('/guides');
      }
    } catch (error) {
      console.error('Error fetching guide:', error);
      navigate('/guides');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      if (guideId) {
        const guideReviews = await getItemReviews(guideId, 'guide');
        setReviews(guideReviews);
        
        // Calculate average rating
        const avg = await calculateAverageRating(guideId, 'guide');
        setAvgRating(avg);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleContact = () => {
    if (!user) {
      toast.error('Please sign in to contact this guide');
      navigate('/auth');
      return;
    }

    // In a real implementation, this would open a chat or booking request
    toast.success('Contact feature coming soon! For now, you can call or email the guide directly.');
  };

  const handleBooking = () => {
    if (!user) {
      toast.error('Please sign in to book this guide');
      navigate('/auth');
      return;
    }

    // In a real implementation, this would open a booking form
    toast.success('Booking feature coming soon! For now, you can contact the guide directly.');
  };

  const handleReviewSubmit = async (reviewData: { rating: number; title: string; comment: string }) => {
    try {
      if (!user || !guideId) return;
      
      const reviewId = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const review: Partial<Review> = {
        id: reviewId,
        guide_id: guideId,
        user_id: user.id,
        rating: reviewData.rating,
        review_text: reviewData.comment,
        created_at: new Date().toISOString()
      };

      const result = await saveReview(reviewId, review);
      
      if (result.success) {
        toast.success('Review submitted successfully!');
        setShowReviewForm(false);
        fetchReviews(); // Refresh reviews
        
        // Update guide rating if needed
        const newAvgRating = await calculateAverageRating(guideId, 'guide');
        setAvgRating(newAvgRating);
      } else {
        throw new Error(result.error || 'Failed to submit review');
      }
    } catch (error: any) {
      console.error('Review error:', error);
      toast.error(error.message || 'Failed to submit review');
    }
  };

  const handleHelpfulClick = async (reviewId: string, increment: number) => {
    // In a real implementation, we would track which users found reviews helpful
    // For now, we'll just update the count
    toast.success('Thanks for your feedback!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-96 w-full mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-12 w-3/4 mb-4" />
              <Skeleton className="h-6 w-1/2 mb-6" />
              <Skeleton className="h-24 w-full mb-6" />
            </div>
            <div>
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-8 w-full mb-4" />
                  <Skeleton className="h-12 w-full mb-4" />
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold mb-4">Guide Not Found</h1>
          <p className="text-muted-foreground mb-6">The guide you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/guides')}>Browse Guides</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Guide Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/guides')}
            className="mb-4"
          >
            ← Back to Guides
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-3xl font-display font-bold">{guide.full_name}</h1>
                <Badge variant="secondary">
                  Verified Guide
                </Badge>
              </div>
              
              <p className="text-muted-foreground flex items-center gap-1 mb-4">
                <MapPin className="h-4 w-4" />
                {guide.city}, {guide.state}
              </p>
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="ml-1 font-medium">{avgRating > 0 ? avgRating.toFixed(1) : 'N/A'}</span>
                  <span className="text-muted-foreground ml-1">({reviews.length} reviews)</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {guide.years_of_experience || 0} {guide.years_of_experience === 1 ? 'year' : 'years'} experience
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setIsFavorite(!isFavorite)}
              >
                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="mb-8">
          {guide.profile_photo ? (
            <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
              <img
                src={guide.profile_photo}
                alt={guide.full_name}
                className="h-full w-full object-cover rounded-lg"
              />
            </div>
          ) : (
            <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
              <User className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Guide Details */}
          <div className="lg:col-span-2">
            {/* Bio */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>About Me</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {guide.short_bio || 'No bio available.'}
                </p>
              </CardContent>
            </Card>

            {/* Historical Knowledge */}
            {guide.historical_details && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Historical Expertise</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {guide.historical_details}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Specializations */}
            {guide.nearby_monuments && guide.nearby_monuments.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Areas of Expertise</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {guide.nearby_monuments.map((monument: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{monument}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Languages */}
            {guide.languages_spoken && guide.languages_spoken.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Languages Spoken</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {guide.languages_spoken.map((language: string, index: number) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        <Languages className="h-3 w-3" />
                        {language}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Certifications */}
            {guide.certifications && guide.certifications.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Certifications & Awards</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {guide.certifications.map((cert: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>{cert}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews Section */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {user && !showReviewForm && (
                  <div className="mb-6">
                    <Button onClick={() => setShowReviewForm(true)}>
                      Write a Review
                    </Button>
                  </div>
                )}

                {showReviewForm && (
                  <div className="mb-8">
                    <ReviewForm
                      itemId={guideId || ''}
                      itemType="guide"
                      onSubmit={handleReviewSubmit}
                      onCancel={() => setShowReviewForm(false)}
                    />
                  </div>
                )}

                {reviews.length > 0 ? (
                  <div>
                    {reviews.map((review) => (
                      <ReviewCard
                        key={review.id}
                        review={review}
                        onHelpful={handleHelpfulClick}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Be the first to share your experience with this guide
                    </p>
                    {!user && (
                      <Button onClick={() => navigate('/auth')}>
                        Sign in to Review
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Map */}
            <Card>
              <CardHeader>
                <CardTitle>Service Area</CardTitle>
              </CardHeader>
              <CardContent>
                <LocationMap
                  coordinates={{
                    latitude: 28.6139, // Default to Delhi coordinates
                    longitude: 77.2090
                  }}
                  locationName={`${guide.city}, ${guide.state}`}
                  height="400px"
                />
              </CardContent>
            </Card>
          </div>

          {/* Contact Panel */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Contact {guide.full_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    ₹{guide.hourly_rate || 'N/A'}<span className="text-base font-normal text-muted-foreground">/hour</span>
                  </p>
                  <p className="text-muted-foreground">or ₹{guide.daily_rate || 'N/A'}/day</p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Button 
                    onClick={handleBooking}
                    className="w-full"
                    size="lg"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Book a Tour
                  </Button>

                  <Button 
                    variant="outline"
                    onClick={handleContact}
                    className="w-full"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Contact Information</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{guide.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{guide.email || 'Not provided'}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Verified Profile</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Professional Guide</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>24/7 Support</span>
                  </div>
                </div>

                <Separator />

                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">Need help?</p>
                  <p>Contact our support team for assistance with bookings or inquiries.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}