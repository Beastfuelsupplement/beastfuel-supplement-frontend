import { motion } from 'framer-motion';
import { User, MessageSquare } from 'lucide-react';
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
        {[...Array(2)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-card p-6 border border-border rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div>
                  <div className="h-4 w-32 bg-muted rounded mb-1" />
                  <div className="h-3 w-20 bg-muted rounded" />
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

  // Filter out current user's review (shown in form)
  // and only include reviews that have written comments
  const commentReviews = reviews.filter(
    (r) => r.user_id !== currentUserId && r.review_text && r.review_text.trim().length > 0
  );

  if (commentReviews.length === 0) {
    return (
      <div className="text-center py-10 bg-card border border-border/70 rounded-2xl p-6 text-muted-foreground space-y-2">
        <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
        <p className="font-semibold text-foreground text-sm">No written comments yet</p>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          {reviews.length > 0
            ? 'Customers have rated this product, but no comments have been posted yet. Be the first to share your experience!'
            : 'Be the first customer to leave a review and comment on this product!'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border/50">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          Customer Comments ({commentReviews.length})
        </h3>
      </div>

      {commentReviews.map((review, index) => {
        // Display user Gmail / email
        const displayEmail = review.user_email || review.user_name || 'Customer';

        return (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="bg-card p-5 sm:p-6 border border-border rounded-2xl shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0 border border-primary/20">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm flex items-center gap-2 flex-wrap">
                    <span>{displayEmail}</span>
                    {review.user_name && review.user_email && review.user_name !== review.user_email && (
                      <span className="text-xs text-muted-foreground font-normal">
                        ({review.user_name})
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-foreground/90 leading-relaxed text-sm whitespace-pre-wrap pl-13">
              {review.review_text}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ReviewList;
