import { useState } from 'react';
import { Star, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

interface ReviewFormProps {
  itemId: string;
  itemType: 'hotel' | 'guide';
  onSubmit: (review: { rating: number; title: string; comment: string }) => void;
  onCancel?: () => void;
}

export default function ReviewForm({ itemId, itemType, onSubmit, onCancel }: ReviewFormProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to submit a review');
      return;
    }
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    if (!title.trim()) {
      toast.error('Please enter a title for your review');
      return;
    }
    
    if (!comment.trim()) {
      toast.error('Please enter your review comment');
      return;
    }
    
    onSubmit({
      rating,
      title,
      comment
    });
    
    // Reset form
    setRating(0);
    setTitle('');
    setComment('');
  };

  if (!user) {
    return (
      <div className="bg-muted/50 rounded-lg p-6 text-center">
        <p className="text-muted-foreground mb-4">
          Please sign in to leave a review
        </p>
        <Button variant="outline" disabled>
          Sign in to Review
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-muted/50 rounded-lg p-6">
      <h3 className="text-lg font-medium mb-4">Leave a Review</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Your Rating
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="focus:outline-none"
            >
              <Star
                className={`h-8 w-8 ${
                  star <= (hoverRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted-foreground'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
      
      <div className="mb-4">
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          Title
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          className="w-full"
        />
      </div>
      
      <div className="mb-6">
        <label htmlFor="comment" className="block text-sm font-medium mb-2">
          Your Review
        </label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share details about your experience"
          rows={4}
          className="w-full"
        />
      </div>
      
      <div className="flex gap-3">
        <Button type="submit" className="flex-1">
          <Send className="h-4 w-4 mr-2" />
          Submit Review
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}