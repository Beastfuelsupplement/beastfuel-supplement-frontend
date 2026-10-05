import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Product } from '@/store/cartStore';
import { toast } from 'sonner';

const mapApiToProduct = (p: any): Product => ({
  id: p._id || p.id,
  name: p.name,
  price: Number(p.price),
  image: p.image || '/placeholder.svg',
  category: p.category,
  description: p.description || '',
  weight: p.weight || '',
  flavor: p.flavor || undefined,
  stock: p.stock,
});

export const useProducts = (activeOnly = true) => {
  return useQuery({
    queryKey: ['products', { activeOnly }],
    queryFn: async () => {
      const data = await api.getProducts();
      // Backend already filters by isActive for the public route
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
    mutationFn: async (product: Omit<Product, 'id'>) => {
      await api.createProduct({
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        description: product.description,
        weight: product.weight,
        flavor: product.flavor || null,
        stock: product.stock,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add product');
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
      await api.updateProduct(id, {
        name: updates.name,
        price: updates.price,
        image: updates.image,
        category: updates.category,
        description: updates.description,
        weight: updates.weight,
        flavor: updates.flavor || null,
        stock: updates.stock,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated successfully');
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
      await api.deleteProduct(id);
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
