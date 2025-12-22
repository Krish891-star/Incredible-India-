import { useState } from 'react';
import { Star, ThumbsUp, User } from 'lucide-react';
import type { Review } from '@/lib/supabaseData';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';

interface ReviewCardProps {
  review: Review;
  onHelpful?: (reviewId: string, increment: number) => void;
}

export default function ReviewCard({ review, onHelpful }: ReviewCardProps) {
  const { user } = useAuth();
  const [helpfulClicked, setHelpfulClicked] = useState(false);

  const handleHelpfulClick = () => {
    if (!user) return;
    if (!helpfulClicked) {
      onHelpful?.(review.id, 1);
      setHelpfulClicked(true);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="border-b border-border pb-6 mb-6 last:border-b-0 last:pb-0 last:mb-0">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="bg-muted rounded-full w-10 h-10 flex items-center justify-center">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium">Anonymous User</h4>
            <span className="text-sm text-muted-foreground">
              {formatDate(review.created_at)}
            </span>
          </div>
          
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= review.rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted-foreground'
                }`}
              />
            ))}
          </div>
          
          <p className="text-muted-foreground mb-3">{review.review_text}</p>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={handleHelpfulClick}
              disabled={!user || helpfulClicked}
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              Helpful
            </Button>
            
            {helpfulClicked && (
              <span className="text-xs text-green-600">Thank you!</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}