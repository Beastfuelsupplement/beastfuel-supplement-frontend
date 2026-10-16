import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Product } from '@/store/cartStore';
import { toast } from 'sonner';

export const mapApiToProduct = (p: any): Product => {
  const id = p._id || p.id;
  const rawVariants = Array.isArray(p.variants) ? p.variants : [];
  
  const variants = rawVariants.map((v: any, index: number) => ({
    id: v._id || v.id || `v-${index}`,
    _id: v._id || v.id,
    weight: v.weight || '',
    flavor: v.flavor || '',
    price: Number(v.price) || 0,
    stock: Number(v.stock) || 0,
    sku: v.sku || '',
  }));

  const weights = Array.isArray(p.weights) && p.weights.length > 0
    ? p.weights
    : Array.from(new Set(variants.map((v: any) => v.weight).filter(Boolean)));

  const flavors = Array.isArray(p.flavors) && p.flavors.length > 0
    ? p.flavors
    : Array.from(new Set(variants.map((v: any) => v.flavor).filter(Boolean)));

  const primaryImage = p.image || (Array.isArray(p.images) && p.images[0]) || '/placeholder.svg';
  const allImages = Array.isArray(p.images) && p.images.length > 0
    ? Array.from(new Set([primaryImage, ...p.images]))
    : [primaryImage];

  return {
    id,
    _id: id,
    name: p.name || 'Unnamed Product',
    brand: p.brand || 'BEASTFUEL',
    price: Number(p.price) || (variants[0] ? variants[0].price : 0),
    image: primaryImage,
    images: allImages,
    category: p.category || 'Supplements',
    countryOfOrigin: p.countryOfOrigin || 'USA',
    description: p.description || '',
    weight: p.weight || (weights[0] || '1kg'),
    weights: weights.length > 0 ? weights : [p.weight || '1kg'],
    flavor: p.flavor || (flavors[0] || 'Standard'),
    flavors: flavors.length > 0 ? flavors : [p.flavor || 'Standard'],
    variants,
    stock: typeof p.stock === 'number' ? p.stock : variants.reduce((s: number, v: any) => s + v.stock, 0),
    featured: Boolean(p.featured),
    isActive: p.isActive !== false,
    hasOffer: Boolean(p.hasOffer),
    offerPrice: p.offerPrice ? Number(p.offerPrice) : undefined,
    originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
    offerDiscount: p.offerDiscount ? Number(p.offerDiscount) : undefined,
    offerBadge: p.offerBadge || (p.hasOffer ? 'SPECIAL DEAL' : undefined),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
};

export const useProducts = (activeOnly = true, filters?: { category?: string; brand?: string; origin?: string; search?: string }) => {
  return useQuery({
    queryKey: ['products', { activeOnly, ...filters }],
    queryFn: async () => {
      const data = await api.getProducts({
        all: activeOnly ? undefined : 'true',
        ...filters,
      });
      return data.map(mapApiToProduct);
    },
  });
};

export const useProduct = (id: string | undefined) => {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      if (!id) return null;
      const data = await api.getProduct(id);
      if (!data) return null;
      return mapApiToProduct(data);
    },
    enabled: !!id,
  });
};

export const useAddProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (product: Omit<Product, 'id'> | any) => {
      return await api.createProduct({
        name: product.name,
        brand: product.brand,
        price: product.price,
        image: product.image,
        images: product.images,
        category: product.category,
        countryOfOrigin: product.countryOfOrigin,
        description: product.description,
        weight: product.weight,
        weights: product.weights,
        flavor: product.flavor,
        flavors: product.flavors,
        variants: product.variants,
        stock: product.stock,
        isActive: product.isActive !== false,
        featured: Boolean(product.featured),
        hasOffer: Boolean(product.hasOffer),
        offerBadge: product.offerBadge,
        offerDiscount: product.offerDiscount,
        originalPrice: product.originalPrice,
        offerPrice: product.offerPrice,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product published successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to publish product');
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
      return await api.updateProduct(id, {
        name: updates.name,
        brand: updates.brand,
        price: updates.price,
        image: updates.image,
        images: updates.images,
        category: updates.category,
        countryOfOrigin: updates.countryOfOrigin,
        description: updates.description,
        weight: updates.weight,
        weights: updates.weights,
        flavor: updates.flavor,
        flavors: updates.flavors,
        variants: updates.variants,
        stock: updates.stock,
        isActive: updates.isActive !== false,
        featured: updates.featured,
        hasOffer: updates.hasOffer,
        offerBadge: updates.offerBadge,
        offerDiscount: updates.offerDiscount,
        originalPrice: updates.originalPrice,
        offerPrice: updates.offerPrice,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update product');
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return await api.deleteProduct(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete product');
    },
  });
};
