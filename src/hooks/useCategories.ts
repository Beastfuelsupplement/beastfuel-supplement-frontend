import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, CategoryItem } from '@/lib/api';
import { toast } from 'sonner';

export const CATEGORIES_QUERY_KEY = ['categories'];

// Fallback preset categories if backend is not yet populated
export const FALLBACK_CATEGORIES: CategoryItem[] = [
  {
    _id: 'fallback-whey-protein',
    name: 'Whey Protein',
    slug: 'whey-protein',
    image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800&auto=format&fit=crop&q=80',
    description: 'High-purity whey protein isolates and blends for rapid muscle recovery and lean growth.',
    featured: true,
    order: 1,
    productCount: 4,
  },
  {
    _id: 'fallback-pre-workout',
    name: 'Pre-Workout',
    slug: 'pre-workout',
    image: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=800&auto=format&fit=crop&q=80',
    description: 'Explosive energy amplifiers, laser focus, and maximum muscle endurance for high-intensity training.',
    featured: true,
    order: 2,
    productCount: 3,
  },
  {
    _id: 'fallback-performance',
    name: 'Performance',
    slug: 'performance',
    image: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=800&auto=format&fit=crop&q=80',
    description: 'Micronized creatine, beta-alanine, and strength optimizers to boost overall output.',
    featured: true,
    order: 3,
    productCount: 3,
  },
  {
    _id: 'fallback-recovery',
    name: 'Recovery',
    slug: 'recovery',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=80',
    description: 'Fermented BCAAs, EAAs, and hydration electrolytes to reduce post-workout soreness.',
    featured: true,
    order: 4,
    productCount: 2,
  },
  {
    _id: 'fallback-weight-gain',
    name: 'Weight Gain',
    slug: 'weight-gain',
    image: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=80',
    description: 'Calorie-dense mass gainers enriched with complex carbs and peptides for serious size.',
    featured: true,
    order: 5,
    productCount: 2,
  },
  {
    _id: 'fallback-health',
    name: 'Health',
    slug: 'health',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
    description: 'Comprehensive daily multivitamins, Omega-3s, and joint protection formulas for longevity.',
    featured: true,
    order: 6,
    productCount: 2,
  },
  {
    _id: 'fallback-vitamins',
    name: 'Vitamins & Minerals',
    slug: 'vitamins-minerals',
    image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=800&auto=format&fit=crop&q=80',
    description: 'Essential micronutrients and immune support minerals for daily athletic performance.',
    featured: true,
    order: 7,
    productCount: 3,
  },
  {
    _id: 'fallback-energy',
    name: 'Energy & Endurance',
    slug: 'energy-endurance',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
    description: 'Clean sustained energy, hydration boosters, and stamina enhancers.',
    featured: true,
    order: 8,
    productCount: 3,
  },
];

export const useCategories = () => {
  return useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: async (): Promise<CategoryItem[]> => {
      try {
        const categories = await api.getCategories();
        if (Array.isArray(categories) && categories.length > 0) {
          return categories;
        }
        return FALLBACK_CATEGORIES;
      } catch (error) {
        console.warn('Failed to fetch categories from API, using fallback:', error);
        return FALLBACK_CATEGORIES;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
};

export const useCategory = (idOrSlug: string) => {
  return useQuery({
    queryKey: ['category', idOrSlug],
    queryFn: async () => {
      if (!idOrSlug) return null;
      return api.getCategory(idOrSlug);
    },
    enabled: Boolean(idOrSlug),
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryData: Partial<CategoryItem>) => api.createCategory(categoryData),
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      toast.success(`Category "${newCategory.name}" created successfully!`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create category');
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoryItem> & { syncProducts?: boolean } }) =>
      api.updateCategory(id, data),
    onSuccess: (updatedCategory) => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`Category "${updatedCategory.name}" updated successfully!`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update category');
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) => api.deleteCategory(id, force),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      toast.success(res.message || 'Category deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete category');
    },
  });
};
