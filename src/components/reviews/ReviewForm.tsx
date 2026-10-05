import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Trash2, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import StarRating from './StarRating';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import type { Review } from '@/hooks/useReviews';

interface ReviewFormProps {
  productId: string;
  existingReview?: Review;
  onSubmit: (rating: number, reviewText: string) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const ReviewForm = ({ productId, existingReview, onSubmit, onDelete }: ReviewFormProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [reviewText, setReviewText] = useState(existingReview?.review_text || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(!existingReview);

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-secondary/50 p-6 border border-border"
      >
        <p className="text-muted-foreground text-center">
          <Link to="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>{' '}
          to leave a review
        </p>
      </motion.div>
    );
  }

  if (existingReview && !isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-secondary/50 p-6 border border-border"
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold">Your Review</h4>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit3 className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={async () => {
                if (onDelete) {
                  try {
                    await onDelete();
                    toast.success('Review deleted');
                    setRating(0);
                    setReviewText('');
                  } catch {
                    toast.error('Failed to delete review');
                  }
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
        <StarRating rating={existingReview.rating} size="md" />
        {existingReview.review_text && (
          <p className="mt-3 text-muted-foreground">{existingReview.review_text}</p>
        )}
      </motion.div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(rating, reviewText);
      toast.success(existingReview ? 'Review updated!' : 'Review submitted!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-secondary/50 p-6 border border-border"
    >
      <h4 className="font-semibold mb-4">
        {existingReview ? 'Edit Your Review' : 'Write a Review'}
      </h4>
      
      <div className="mb-4">
        <label className="block text-sm text-muted-foreground mb-2">Rating</label>
        <StarRating
          rating={rating}
          size="lg"
          interactive
          onRatingChange={setRating}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm text-muted-foreground mb-2">
          Review (optional)
        </label>
        <Textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share your experience with this product..."
          rows={4}
          maxLength={1000}
          className="bg-background"
        />
        <p className="text-xs text-muted-foreground mt-1">
          {reviewText.length}/1000 characters
        </p>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting || rating === 0}>
          <Send className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
        </Button>
        {existingReview && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsEditing(false);
              setRating(existingReview.rating);
              setReviewText(existingReview.review_text || '');
            }}
          >
            Cancel
          </Button>
        )}
      </div>
    </motion.form>
  );
};

export default ReviewForm;
