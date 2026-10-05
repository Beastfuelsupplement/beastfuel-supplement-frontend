import { motion } from 'framer-motion';
import StarRating from './StarRating';
import ReviewForm from './ReviewForm';
import ReviewList from './ReviewList';
import { useReviews } from '@/hooks/useReviews';
import { useAuth } from '@/hooks/useAuth';

interface ProductReviewsProps {
  productId: string;
}

const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const { user } = useAuth();
  const {
    reviews,
    isLoading,
    userReview,
    averageRating,
    totalReviews,
    submitReview,
    deleteReview,
  } = useReviews(productId);

  return (
    <section className="mt-20 pt-20 border-t border-border">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h2 className="text-display text-3xl md:text-4xl mb-4">CUSTOMER REVIEWS</h2>
        
        {totalReviews > 0 && (
          <div className="flex items-center gap-4">
            <StarRating rating={Math.round(averageRating)} size="lg" />
            <span className="text-2xl font-semibold">{averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground">
              Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </span>
          </div>
        )}
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Review Form */}
        <div className="lg:col-span-1">
          <ReviewForm
            productId={productId}
            existingReview={userReview}
            onSubmit={submitReview}
            onDelete={deleteReview}
          />
        </div>

        {/* Reviews List */}
        <div className="lg:col-span-2">
          <ReviewList
            reviews={reviews}
            isLoading={isLoading}
            currentUserId={user?.id}
          />
        </div>
      </div>
    </section>
  );
};

export default ProductReviews;
