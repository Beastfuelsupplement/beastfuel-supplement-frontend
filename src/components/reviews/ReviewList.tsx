import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import StarRating from './StarRating';
import type { Review } from '@/hooks/useReviews';
import { formatDistanceToNow } from 'date-fns';

interface ReviewListProps {
  reviews: Review[];
  isLoading: boolean;
  currentUserId?: string;
}

const ReviewList = ({ reviews, isLoading, currentUserId }: ReviewListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-secondary/50 p-6 border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div>
                  <div className="h-4 w-24 bg-muted rounded mb-1" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
              </div>
              <div className="h-4 w-full bg-muted rounded mb-2" />
              <div className="h-4 w-3/4 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Filter out current user's review from the list (shown separately in form)
  const filteredReviews = reviews.filter(r => r.user_id !== currentUserId);

  if (filteredReviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No reviews yet. Be the first to review this product!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredReviews.map((review, index) => (
        <motion.div
          key={review.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-secondary/30 p-6 border border-border"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{review.user_name || 'Anonymous'}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <StarRating rating={review.rating} size="sm" />
          </div>
          
          {review.review_text && (
            <p className="text-muted-foreground leading-relaxed">
              {review.review_text}
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default ReviewList;
