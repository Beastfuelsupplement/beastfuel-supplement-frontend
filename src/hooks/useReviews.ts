import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  updated_at: string;
  user_name?: string;
}

export const useReviews = (productId: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchReviews = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.getProductReviews(productId);
      const mapped = data.map((r: any) => ({
        id: r._id || r.id,
        product_id: r.productId || r.product_id,
        user_id: r.userId || r.user_id,
        rating: r.rating,
        review_text: r.reviewText || r.review_text || null,
        created_at: r.createdAt || r.created_at,
        updated_at: r.updatedAt || r.updated_at,
        user_name: r.userName || r.user_name || 'Anonymous User',
      }));
      setReviews(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchReviews();
    }
  }, [productId]);

  const userReview = reviews.find(r => r.user_id === user?.id);

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const submitReview = async (rating: number, reviewText: string) => {
    if (!user) throw new Error('Must be logged in to submit a review');
    await api.submitReview(productId, rating, reviewText);
    await fetchReviews();
  };

  const deleteReview = async () => {
    if (!user || !userReview) return;
    await api.deleteReview(userReview.id);
    await fetchReviews();
  };

  return {
    reviews,
    isLoading,
    error,
    userReview,
    averageRating,
    totalReviews: reviews.length,
    submitReview,
    deleteReview,
    refetch: fetchReviews,
  };
};
