import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, BrandItem } from '@/lib/api';
import { toast } from 'sonner';

export const BRANDS_QUERY_KEY = ['brands'];

// Fallback brands if backend is not yet populated
export const FALLBACK_BRANDS: BrandItem[] = [
  {
    _id: 'fallback-on',
    name: 'Optimum Nutrition',
    slug: 'optimum-nutrition',
    countryOfOrigin: 'USA',
    description: "The World's #1 selling whey protein brand, setting the Gold Standard in sports nutrition since 1986.",
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Optimum_Nutrition_Logo.svg/1200px-Optimum_Nutrition_Logo.svg.png',
    featured: true,
    productCount: 4,
  },
  {
    _id: 'fallback-muscletech',
    name: 'MuscleTech',
    slug: 'muscletech',
    countryOfOrigin: 'USA',
    description: 'Scientifically engineered performance formulas for bodybuilders, athletes, and fitness enthusiasts.',
    logo: 'https://cdn.iconscout.com/icon/free/png-256/free-muscletech-logo-icon-download-in-svg-png-gif-file-formats--brand-social-media-brands-pack-logos-icons-226343.png',
    featured: true,
    productCount: 3,
  },
  {
    _id: 'fallback-beastfuel',
    name: 'BEASTFUEL',
    slug: 'beastfuel',
    countryOfOrigin: 'Sri Lanka',
    description: 'Engineered for untamed power, high-purity protein blends, and explosive athletic performance.',
    logo: '',
    featured: true,
    productCount: 5,
  },
  {
    _id: 'fallback-dymatize',
    name: 'Dymatize',
    slug: 'dymatize',
    countryOfOrigin: 'USA',
    description: 'Renowned for award-winning ISO100 hydrolyzed 100% whey isolate, pristine purity, and unmatched taste.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Dymatize_Nutrition_Logo.svg/1200px-Dymatize_Nutrition_Logo.svg.png',
    featured: true,
    productCount: 2,
  },
  {
    _id: 'fallback-cellucor',
    name: 'Cellucor',
    slug: 'cellucor',
    countryOfOrigin: 'USA',
    description: 'Makers of America’s legendary C4 pre-workout, delivering explosive energy and relentless focus.',
    logo: 'https://cdn.worldvectorlogo.com/logos/cellucor.svg',
    featured: true,
    productCount: 2,
  },
  {
    _id: 'fallback-bsn',
    name: 'BSN',
    slug: 'bsn',
    countryOfOrigin: 'USA',
    description: 'Bio-Engineered Supplements and Nutrition, creators of Syntha-6 and high-caliber recovery formulas.',
    logo: 'https://cdn.worldvectorlogo.com/logos/bsn-finish-first.svg',
    featured: false,
    productCount: 1,
  },
];

export const useBrands = () => {
  return useQuery({
    queryKey: BRANDS_QUERY_KEY,
    queryFn: async (): Promise<BrandItem[]> => {
      try {
        const brands = await api.getBrands();
        if (Array.isArray(brands) && brands.length > 0) {
          return brands;
        }
        return FALLBACK_BRANDS;
      } catch (error) {
        console.warn('Failed to fetch brands from API, using fallback:', error);
        return FALLBACK_BRANDS;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
};

export const useBrand = (idOrSlug: string) => {
  return useQuery({
    queryKey: ['brand', idOrSlug],
    queryFn: async () => {
      if (!idOrSlug) return null;
      return api.getBrand(idOrSlug);
    },
    enabled: Boolean(idOrSlug),
  });
};

export const useCreateBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (brandData: Partial<BrandItem>) => api.createBrand(brandData),
    onSuccess: (newBrand) => {
      queryClient.invalidateQueries({ queryKey: BRANDS_QUERY_KEY });
      toast.success(`Brand "${newBrand.name}" created successfully!`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create brand');
    },
  });
};

export const useUpdateBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BrandItem> }) => api.updateBrand(id, data),
    onSuccess: (updatedBrand) => {
      queryClient.invalidateQueries({ queryKey: BRANDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`Brand "${updatedBrand.name}" updated successfully!`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update brand');
    },
  });
};

export const useDeleteBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) => api.deleteBrand(id, force),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: BRANDS_QUERY_KEY });
      toast.success(res.message || 'Brand deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete brand');
    },
  });
};
