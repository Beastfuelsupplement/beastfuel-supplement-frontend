import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
  user_email?: string;
}

export const useReviews = (productId: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fetchReviews = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.getProductReviews(productId);
      const mapped = data.map((r: any) => {
        const u = r.userId && typeof r.userId === 'object' ? r.userId : {};
        const email = r.userEmail || u.email || r.user_email || '';
        const name = r.userName || u.name || r.user_name || email || 'Customer';
        return {
          id: r._id || r.id,
          product_id: r.productId || r.product_id,
          user_id: u._id || (typeof r.userId === 'string' ? r.userId : '') || r.user_id,
          rating: r.rating,
          review_text: r.reviewText || r.review_text || null,
          created_at: r.createdAt || r.created_at,
          updated_at: r.updatedAt || r.updated_at,
          user_name: name,
          user_email: email,
        };
      });
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
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const deleteReview = async () => {
    if (!user || !userReview) return;
    await api.deleteReview(userReview.id);
    await fetchReviews();
    queryClient.invalidateQueries({ queryKey: ['products'] });
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

export interface FeaturedReview {
  id?: string;
  name: string;
  role: string;
  rating: number;
  quote: string;
  isReal?: boolean;
}

export const HARDCODED_TESTIMONIALS: FeaturedReview[] = [
  { name: 'Marcus R.', role: 'Competitive Bodybuilder', rating: 5, quote: "BEASTFUEL whey protein is hands down the cleanest I've tried. No bloating, amazing mixability, and the chocolate flavor actually tastes incredible." },
  { name: 'Sarah K.', role: 'CrossFit Athlete', rating: 5, quote: "The pre-workout gives me insane focus without the jitters. I've PR'd three times since switching to BEASTFUEL. Absolutely love it!" },
  { name: 'David T.', role: 'Marathon Runner', rating: 4, quote: "Their BCAA recovery blend has cut my recovery time in half. I can train harder and more consistently now. Great quality supplements." },
  { name: 'Amaya L.', role: 'Fitness Coach', rating: 5, quote: "I recommend BEASTFUEL to all my clients. Lab-tested, transparent ingredients, and results you can actually feel. Top tier brand." },
  { name: 'Jake W.', role: 'Powerlifter', rating: 5, quote: "The creatine monohydrate is pure and effective. Noticed strength gains within the first two weeks. Shipping was lightning fast too." },
  { name: 'Nina P.', role: 'Yoga Instructor', rating: 4, quote: "Love the plant-based protein option. It's gentle on my stomach and keeps me fueled through back-to-back classes. Highly recommend!" },
];

/**
 * Hook to retrieve up to 6 high-rating (4-star or 5-star) reviews for the homepage.
 * Mainly prioritizes actual customer reviews, and fills any remaining slots
 * with the hardcoded testimonials so there are always up to 6 high-rating reviews.
 */
export const useFeaturedReviews = (maxReviews = 6) => {
  const [reviews, setReviews] = useState<FeaturedReview[]>(HARDCODED_TESTIMONIALS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadReviews = async () => {
      try {
        let realReviews: FeaturedReview[] = [];

        try {
          const data = await api.getFeaturedReviews(maxReviews, 4);
          if (Array.isArray(data) && data.length > 0) {
            realReviews = data
              .filter((r: any) => r.rating >= 4 && (r.quote || r.reviewText))
              .map((r: any) => ({
                id: r._id || r.id,
                name: r.name || r.userName || 'Verified Customer',
                role: r.role || 'Verified Buyer',
                rating: Number(r.rating) || 5,
                quote: (r.quote || r.reviewText || '').trim(),
                isReal: true,
              }));
          }
        } catch {
          // Fallback seamlessly if endpoint not yet reachable
        }

        if (!isMounted) return;

        if (realReviews.length >= maxReviews) {
          setReviews(realReviews.slice(0, maxReviews));
        } else if (realReviews.length > 0) {
          const needed = maxReviews - realReviews.length;
          setReviews([...realReviews, ...HARDCODED_TESTIMONIALS.slice(0, needed)]);
        } else {
          setReviews(HARDCODED_TESTIMONIALS);
        }
      } catch {
        if (isMounted) {
          setReviews(HARDCODED_TESTIMONIALS);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadReviews();

    return () => {
      isMounted = false;
    };
  }, [maxReviews]);

  return { reviews, isLoading };
};
