import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Customer } from '@/store/adminStore';
import { toast } from 'sonner';

export const CUSTOMERS_QUERY_KEY = ['admin-customers'];

export const mapApiCustomer = (c: any): Customer => {
  return {
    id: c._id || c.id,
    name: c.name || 'Anonymous Customer',
    email: c.email || '',
    orders: Number(c.totalOrders ?? c.orders ?? 0),
    totalSpent: Number(c.totalSpent ?? 0),
    joinedAt: c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : 'Recently',
    status: c.status === 'Inactive' ? 'Inactive' : 'Active',
  };
};

export const useCustomers = () => {
  return useQuery({
    queryKey: CUSTOMERS_QUERY_KEY,
    queryFn: async (): Promise<Customer[]> => {
      try {
        const raw = await api.getCustomers();
        if (Array.isArray(raw)) {
          return raw.map(mapApiCustomer);
        }
        return [];
      } catch (err: any) {
        console.warn('[useCustomers] Failed to fetch customers from API:', err?.message);
        return [];
      }
    },
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Customer> }) => {
      return await api.updateCustomer(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
      toast.success('Customer updated');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update customer');
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return await api.deleteCustomer(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
      toast.success('Customer deleted');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete customer');
    },
  });
};
