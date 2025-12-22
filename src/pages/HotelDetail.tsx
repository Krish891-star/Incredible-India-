import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { getHotel, saveBooking, getItemReviews, calculateAverageRating, saveReview, Hotel } from '@/lib/supabaseData';
import { emailService } from '@/lib/emailService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Bed, MapPin, Star, Phone, Mail, Check, Calendar,
  Wifi, Car, Utensils, Dumbbell, Waves, Shield, Clock,
  Heart, Share2, Users, Bath
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LocationMap from '@/components/LocationMap';
import ReviewCard from '@/components/ReviewCard';
import ReviewForm from '@/components/ReviewForm';
import type { Review, Booking } from '@/lib/supabaseData';

export default function HotelDetail() {
  const { hotelId } = useParams<{ hotelId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    if (hotelId) {
      fetchHotel();
      fetchReviews();
    }
  }, [hotelId]);

  const fetchHotel = async () => {
    try {
      const hotelData = await getHotel(hotelId || '');
      if (hotelData) {
        setHotel(hotelData);
        
        // Set default dates
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        setCheckInDate(today.toISOString().split('T')[0]);
        setCheckOutDate(tomorrow.toISOString().split('T')[0]);
      } else {
        navigate('/hotels');
      }
    } catch (error) {
      console.error('Error fetching hotel:', error);
      navigate('/hotels');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      if (hotelId) {
        const hotelReviews = await getItemReviews(hotelId, 'hotel');
        setReviews(hotelReviews);
        
        // Calculate average rating
        const avg = await calculateAverageRating(hotelId, 'hotel');
        setAvgRating(avg);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      toast.error('Please sign in to book a stay');
      navigate('/auth');
      return;
    }

    if (!checkInDate || !checkOutDate) {
      toast.error('Please select check-in and check-out dates');
      return;
    }

    try {
      const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const totalPrice = hotel?.price_per_night_min ? hotel.price_per_night_min * rooms * calculateNights() : 0;
      
      const bookingData: Partial<Booking> = {
        id: bookingId,
        hotel_id: hotelId || '',
        user_id: user.id,
        guest_name: user.username,
        guest_email: user.email,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        guests: guests,
        rooms: rooms,
        total_price: totalPrice,
        status: 'pending',
        special_requests: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = await saveBooking(bookingId, bookingData);
      
      if (result.success) {
        // Send booking confirmation email
        try {
          if (hotel && user) {
            await emailService.sendBookingConfirmation(
              user.email,
              user.username,
              hotel.name,
              checkInDate,
              checkOutDate,
              totalPrice
            );
            
            // Also send confirmation to hotel manager
            await emailService.sendBookingConfirmation(
              hotel.contact_email,
              hotel.contact_email, // Using email as name since we don't have owner name
              hotel.name,
              checkInDate,
              checkOutDate,
              totalPrice
            );
          }
        } catch (emailError) {
          console.error('Failed to send booking confirmation email:', emailError);
          // Don't throw error for email failure, just log it
        }
        
        toast.success('Booking request submitted successfully!');
        navigate('/profile');
      } else {
        throw new Error(result.error || 'Failed to create booking');
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      toast.error(error.message || 'Failed to create booking');
    }
  };

  const handleReviewSubmit = async (reviewData: { rating: number; title: string; comment: string }) => {
    try {
      if (!user || !hotelId) return;
      
      const reviewId = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const review: Partial<Review> = {
        id: reviewId,
        item_id: hotelId,
        item_type: 'hotel',
        user_id: user.id,
        rating: reviewData.rating,
        title: reviewData.title,
        comment: reviewData.comment,
        helpful_count: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = await saveReview(reviewId, review);
      
      if (result.success) {
        toast.success('Review submitted successfully!');
        setShowReviewForm(false);
        fetchReviews(); // Refresh reviews
        
        // Update hotel rating if needed
        if (hotel) {
          const newAvgRating = await calculateAverageRating(hotelId, 'hotel');
          setAvgRating(newAvgRating);
        }
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

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();
  const totalPrice = hotel?.price_per_night_min ? hotel.price_per_night_min * rooms * nights : 0;

  const getHotelTypeLabel = (type: string) => {
    switch (type) {
      case 'hotel': return 'Hotel';
      case 'resort': return 'Resort';
      case 'homestay': return 'Homestay';
      case 'lodge': return 'Lodge';
      case 'villa': return 'Villa';
      case 'guesthouse': return 'Guest House';
      default: return type;
    }
  };

  const amenityIcons: Record<string, any> = {
    'wifi': Wifi,
    'parking': Car,
    'restaurant': Utensils,
    'gym': Dumbbell,
    'pool': Waves,
    'spa': Waves,
    'room_service': Bed,
    'air_conditioning': Waves,
    'tv': Waves
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i}>
                    <Skeleton className="h-32 w-full" />
                  </Card>
                ))}
              </div>
              <Skeleton className="h-6 w-1/3 mb-4" />
              <Skeleton className="h-24 w-full mb-6" />
            </div>
            <div>
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-8 w-full mb-4" />
                  <Skeleton className="h-12 w-full mb-4" />
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

  if (!hotel) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold mb-4">Hotel Not Found</h1>
          <p className="text-muted-foreground mb-6">The hotel you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/hotels')}>Browse Hotels</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Hotel Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/hotels')}
            className="mb-4"
          >
            ← Back to Hotels
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-3xl font-display font-bold">{hotel.name}</h1>
                <Badge variant="secondary">
                  {getHotelTypeLabel(hotel.type)}
                </Badge>
              </div>
              
              <p className="text-muted-foreground flex items-center gap-1 mb-4">
                <MapPin className="h-4 w-4" />
                {hotel.address}, {hotel.city}, {hotel.state}
              </p>
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="ml-1 font-medium">{avgRating > 0 ? avgRating.toFixed(1) : hotel.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground ml-1">({reviews.length} reviews)</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Check-in: {hotel.check_in_time}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Check-out: {hotel.check_out_time}</span>
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
          {hotel.images && hotel.images.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="md:col-span-2 lg:col-span-2">
                <img
                  src={hotel.images[0]}
                  alt={hotel.name}
                  className="h-96 w-full object-cover rounded-lg"
                />
              </div>
              {hotel.images.slice(1, 5).map((image, index) => (
                <div key={index} className="h-48">
                  <img
                    src={image}
                    alt={`${hotel.name} ${index + 2}`}
                    className="h-full w-full object-cover rounded-lg"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
              <Bed className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Hotel Details */}
          <div className="lg:col-span-2">
            {/* Description */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>About This Property</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {hotel.description}
                </p>
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Property Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {hotel.amenities.map((amenity, index) => {
                    const IconComponent = amenityIcons[amenity.toLowerCase().replace(/\s+/g, '_')] || Bed;
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <IconComponent className="h-5 w-5 text-primary" />
                        <span className="capitalize">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Room Types */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Room Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {hotel.room_types.map((room, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{room.name}</h3>
                        <p className="text-sm text-muted-foreground">₹{room.price} per night</p>
                        <p className="text-sm text-muted-foreground">{room.availability} rooms available</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Select Room
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Nearby Attractions */}
            {hotel.nearby_attractions && hotel.nearby_attractions.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Nearby Attractions</CardTitle>
                  <CardDescription>Popular landmarks and tourist spots near this hotel</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hotel.nearby_attractions.map((attraction, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{attraction}</h4>
                          <p className="text-sm text-muted-foreground">Approx. 2.5 km away</p>
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <Button variant="outline" className="w-full">
                      <MapPin className="h-4 w-4 mr-2" />
                      View All Attractions on Map
                    </Button>
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
                      itemId={hotelId || ''}
                      itemType="hotel"
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
                      Be the first to share your experience at this property
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
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent>
                <LocationMap
                  coordinates={{
                    latitude: hotel.latitude,
                    longitude: hotel.longitude
                  }}
                  locationName={hotel.name}
                  height="400px"
                />
              </CardContent>
            </Card>
          </div>

          {/* Booking Panel */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Book Your Stay</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">₹{hotel.price_per_night_min}</p>
                  <p className="text-muted-foreground">per night</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Check-in Date</label>
                    <input
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Check-out Date</label>
                    <input
                      type="date"
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      min={checkInDate || new Date().toISOString().split('T')[0]}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Guests</label>
                      <select
                        value={guests}
                        onChange={(e) => setGuests(parseInt(e.target.value))}
                        className="w-full p-2 border rounded-md"
                      >
                        {[1, 2, 3, 4, 5, 6].map(num => (
                          <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">Rooms</label>
                      <select
                        value={rooms}
                        onChange={(e) => setRooms(parseInt(e.target.value))}
                        className="w-full p-2 border rounded-md"
                      >
                        {[1, 2, 3, 4, 5].map(num => (
                          <option key={num} value={num}>{num} {num === 1 ? 'Room' : 'Rooms'}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <Separator />

                {nights > 0 && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>₹{hotel.price_per_night_min} × {rooms} room{rooms > 1 ? 's' : ''} × {nights} night{nights > 1 ? 's' : ''}</span>
                      <span>₹{totalPrice}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>₹{totalPrice}</span>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleBooking}
                  className="w-full"
                  size="lg"
                  disabled={!checkInDate || !checkOutDate}
                >
                  Book Now
                </Button>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Contact Information</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{hotel.contact_phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{hotel.contact_email}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Free cancellation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Confirmation within 1 hour</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>24/7 customer support</span>
                  </div>
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