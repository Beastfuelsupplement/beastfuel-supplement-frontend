import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Order, PaymentDetails } from '@/store/adminStore';
import { toast } from 'sonner';

export const ORDERS_QUERY_KEY = ['admin-orders'];

export const mapApiOrder = (o: any): Order => {
  const rawId = o._id || o.id;
  const orderNumber = o.orderNumber || (rawId ? `ORD-${String(rawId).slice(-5).toUpperCase()}` : `ORD-${Date.now()}`);

  const items = Array.isArray(o.items)
    ? o.items.map((it: any) => ({
        productId: it.productId?._id || it.productId || '',
        productName: it.productName || 'Product',
        quantity: Number(it.quantity) || 1,
        price: Number(it.price) || 0,
      }))
    : [];

  const rawStatus = o.status || 'Pending';
  const status: Order['status'] =
    rawStatus === 'Delivered'
      ? 'Completed'
      : (['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'].includes(rawStatus)
          ? rawStatus
          : 'Pending');

  const paymentDetails: PaymentDetails | undefined = o.paymentDetails
    ? o.paymentDetails
    : o.paymentMethod
      ? {
          method: (['card', 'paypal', 'bank_transfer', 'cash_on_delivery'].includes(o.paymentMethod)
            ? o.paymentMethod
            : 'card') as any,
          transactionId: o.paymentTransactionId,
          paidAt: o.paymentStatus === 'Paid' ? (o.updatedAt || o.createdAt) : undefined,
        }
      : undefined;

  return {
    id: o.orderNumber || rawId || orderNumber,
    customerId: o.userId?._id || o.userId || o.customerId || o.customerEmail || 'guest',
    customerName: o.customerName || 'Anonymous Customer',
    customerEmail: o.customerEmail || '',
    items,
    total: Number(o.total ?? o.subtotal ?? 0),
    status,
    paymentStatus: o.paymentStatus || (status === 'Completed' ? 'Paid' : 'Pending'),
    paymentDetails,
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
    shippingAddress: o.shippingAddress || '',
  };
};

export const useOrders = () => {
  return useQuery({
    queryKey: ORDERS_QUERY_KEY,
    queryFn: async (): Promise<Order[]> => {
      try {
        const raw = await api.getAllOrders().catch(() => api.getOrders());
        if (Array.isArray(raw)) {
          return raw.map(mapApiOrder);
        }
        return [];
      } catch (err: any) {
        console.warn('[useOrders] Failed to fetch orders from API:', err?.message);
        return [];
      }
    },
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, paymentStatus }: { id: string; status: Order['status']; paymentStatus?: Order['paymentStatus'] }) => {
      return await api.updateOrderStatus(id, status, paymentStatus);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      toast.success('Order status updated');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update order status');
    },
  });
};

export const useDeleteOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return await api.deleteOrder(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      toast.success('Order deleted');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete order');
    },
  });
};
