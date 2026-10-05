import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { products as initialProducts } from '@/data/products';
import { Product } from '@/store/cartStore';
import { checkAndNotifyLowStock } from '@/utils/stockNotification';

export interface PaymentDetails {
  method: 'card' | 'paypal' | 'bank_transfer' | 'cash_on_delivery';
  cardLast4?: string;
  cardBrand?: string;
  transactionId?: string;
  paidAt?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: Array<{ productId: string; productName: string; quantity: number; price: number }>;
  total: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Completed' | 'Cancelled';
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  paymentDetails?: PaymentDetails;
  createdAt: string;
  shippingAddress?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  orders: number;
  totalSpent: number;
  joinedAt: string;
  status: 'Active' | 'Inactive';
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'paypal' | 'bank_transfer' | 'cash_on_delivery';
  enabled: boolean;
  description: string;
}

export interface StoreSettings {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  currency: string;
  timezone: string;
  emailNotifications: boolean;
  orderNotifications: boolean;
  marketingEmails: boolean;
  twoFactorAuth: boolean;
  sessionTimeout: string;
  paymentMethods: PaymentMethod[];
  adminEmail: string;
  lowStockThreshold: number;
}

interface AdminStore {
  products: Product[];
  orders: Order[];
  customers: Customer[];
  settings: StoreSettings;
  
  // Products
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  // Orders
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => string;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  updatePaymentStatus: (id: string, paymentStatus: Order['paymentStatus'], paymentDetails?: PaymentDetails) => void;
  deleteOrder: (id: string) => void;
  
  // Customers
  addCustomer: (customer: Omit<Customer, 'id' | 'orders' | 'totalSpent' | 'joinedAt'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  
  // Settings
  updateSettings: (settings: Partial<StoreSettings>) => void;
  addPaymentMethod: (method: Omit<PaymentMethod, 'id'>) => void;
  updatePaymentMethod: (id: string, updates: Partial<PaymentMethod>) => void;
  deletePaymentMethod: (id: string) => void;
  
  // Stats
  getStats: () => {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
  };
}

const defaultPaymentMethods: PaymentMethod[] = [
  { id: 'pm-1', name: 'Credit/Debit Card', type: 'card', enabled: true, description: 'Accept Visa, MasterCard, Amex' },
  { id: 'pm-2', name: 'PayPal', type: 'paypal', enabled: true, description: 'Pay with PayPal account' },
  { id: 'pm-3', name: 'Bank Transfer', type: 'bank_transfer', enabled: false, description: 'Direct bank transfer' },
  { id: 'pm-4', name: 'Cash on Delivery', type: 'cash_on_delivery', enabled: false, description: 'Pay when you receive' },
];

const defaultSettings: StoreSettings = {
  storeName: 'BEASTFUEL Supplements',
  storeEmail: 'contact@beastfuel.com',
  storePhone: '+1 (555) 123-4567',
  storeAddress: '123 Fitness Street, Gym City, GC 12345',
  currency: 'USD',
  timezone: 'America/New_York',
  emailNotifications: true,
  orderNotifications: true,
  marketingEmails: false,
  twoFactorAuth: false,
  sessionTimeout: '30',
  paymentMethods: defaultPaymentMethods,
  adminEmail: 'dilmunasingha91@gmail.com',
  lowStockThreshold: 10,
};

const defaultCustomers: Customer[] = [
  { id: 'cust-1', name: 'John Doe', email: 'john@example.com', orders: 12, totalSpent: 1249.99, joinedAt: '2023-06-15', status: 'Active' },
  { id: 'cust-2', name: 'Jane Smith', email: 'jane@example.com', orders: 8, totalSpent: 879.99, joinedAt: '2023-07-22', status: 'Active' },
  { id: 'cust-3', name: 'Mike Johnson', email: 'mike@example.com', orders: 5, totalSpent: 459.99, joinedAt: '2023-08-10', status: 'Active' },
  { id: 'cust-4', name: 'Sarah Wilson', email: 'sarah@example.com', orders: 3, totalSpent: 299.99, joinedAt: '2023-09-05', status: 'Inactive' },
];

const defaultOrders: Order[] = [
  { id: 'ORD-001', customerId: 'cust-1', customerName: 'John Doe', customerEmail: 'john@example.com', items: [{ productId: '1', productName: 'Whey Protein Isolate', quantity: 2, price: 59.99 }], total: 119.98, status: 'Completed', paymentStatus: 'Paid', paymentDetails: { method: 'card', cardLast4: '4242', cardBrand: 'Visa', transactionId: 'txn_001', paidAt: '2024-01-15' }, createdAt: '2024-01-15' },
  { id: 'ORD-002', customerId: 'cust-2', customerName: 'Jane Smith', customerEmail: 'jane@example.com', items: [{ productId: '2', productName: 'Pre-Workout Surge', quantity: 1, price: 44.99 }], total: 44.99, status: 'Processing', paymentStatus: 'Paid', paymentDetails: { method: 'paypal', transactionId: 'pp_002', paidAt: '2024-01-14' }, createdAt: '2024-01-14' },
  { id: 'ORD-003', customerId: 'cust-3', customerName: 'Mike Johnson', customerEmail: 'mike@example.com', items: [{ productId: '3', productName: 'Creatine Monohydrate', quantity: 3, price: 29.99 }], total: 89.97, status: 'Shipped', paymentStatus: 'Paid', paymentDetails: { method: 'card', cardLast4: '1234', cardBrand: 'MasterCard', transactionId: 'txn_003', paidAt: '2024-01-14' }, createdAt: '2024-01-14' },
  { id: 'ORD-004', customerId: 'cust-4', customerName: 'Sarah Wilson', customerEmail: 'sarah@example.com', items: [{ productId: '4', productName: 'BCAA Recovery', quantity: 1, price: 34.99 }], total: 34.99, status: 'Pending', paymentStatus: 'Pending', createdAt: '2024-01-13' },
];

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      products: initialProducts,
      orders: defaultOrders,
      customers: defaultCustomers,
      settings: defaultSettings,

      // Products
      addProduct: (product) => {
        const newProduct = {
          ...product,
          id: `prod-${Date.now()}`,
        };
        set((state) => ({ products: [...state.products, newProduct] }));
      },

      updateProduct: (id, updates) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
      },

      deleteProduct: (id) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        }));
      },

      // Orders
      addOrder: (order) => {
        const orderId = `ORD-${String(get().orders.length + 1).padStart(3, '0')}`;
        const newOrder: Order = {
          ...order,
          id: orderId,
          createdAt: new Date().toISOString().split('T')[0],
        };
        set((state) => ({ orders: [newOrder, ...state.orders] }));
        
        // Update customer stats
        const customer = get().customers.find(c => c.id === order.customerId);
        if (customer) {
          get().updateCustomer(customer.id, {
            orders: customer.orders + 1,
            totalSpent: customer.totalSpent + order.total,
          });
        }
        
        // Send new order notification
        const adminEmail = get().settings.adminEmail;
        if (adminEmail && get().settings.orderNotifications) {
          import('@/utils/orderNotification').then(({ sendNewOrderNotification }) => {
            sendNewOrderNotification({
              orderId,
              customerName: order.customerName,
              customerEmail: order.customerEmail,
              items: order.items,
              total: order.total,
              shippingAddress: order.shippingAddress,
              adminEmail,
            });
          });
        }
        
        return orderId;
      },

      updateOrderStatus: (id, status) => {
        const order = get().orders.find(o => o.id === id);
        const previousStatus = order?.status;
        
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id ? { ...o, status } : o
          ),
        }));
        
        // Send status update email to customer
        if (order && previousStatus !== status && get().settings.emailNotifications) {
          import('@/utils/orderStatusNotification').then(({ sendOrderStatusNotification }) => {
            sendOrderStatusNotification({
              orderId: order.id,
              customerName: order.customerName,
              customerEmail: order.customerEmail,
              newStatus: status,
              previousStatus: previousStatus || 'Unknown',
              items: order.items,
              total: order.total,
              shippingAddress: order.shippingAddress,
              storeName: get().settings.storeName,
            });
          });
        }
        
        // Reduce stock when order is completed
        if (status === 'Completed' && previousStatus !== 'Completed' && order) {
          order.items.forEach(item => {
            const product = get().products.find(p => p.id === item.productId);
            if (product) {
              get().updateProduct(product.id, {
                stock: Math.max(0, product.stock - item.quantity)
              });
            }
          });
          
          // Check for low stock and send notification
          const adminEmail = get().settings.adminEmail;
          const threshold = get().settings.lowStockThreshold;
          if (adminEmail && get().settings.emailNotifications) {
            // Use setTimeout to ensure stock updates are applied first
            setTimeout(() => {
              checkAndNotifyLowStock(get().products, adminEmail, threshold);
            }, 100);
          }
        }
      },

      updatePaymentStatus: (id, paymentStatus, paymentDetails) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id ? { 
              ...o, 
              paymentStatus,
              paymentDetails: paymentDetails || o.paymentDetails,
            } : o
          ),
        }));
      },

      deleteOrder: (id) => {
        set((state) => ({
          orders: state.orders.filter((o) => o.id !== id),
        }));
      },

      // Customers
      addCustomer: (customer) => {
        const newCustomer: Customer = {
          ...customer,
          id: `cust-${Date.now()}`,
          orders: 0,
          totalSpent: 0,
          joinedAt: new Date().toISOString().split('T')[0],
        };
        set((state) => ({ customers: [...state.customers, newCustomer] }));
      },

      updateCustomer: (id, updates) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },

      deleteCustomer: (id) => {
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id),
        }));
      },

      // Settings
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      addPaymentMethod: (method) => {
        const newMethod: PaymentMethod = {
          ...method,
          id: `pm-${Date.now()}`,
        };
        set((state) => ({
          settings: {
            ...state.settings,
            paymentMethods: [...state.settings.paymentMethods, newMethod],
          },
        }));
      },

      updatePaymentMethod: (id, updates) => {
        set((state) => ({
          settings: {
            ...state.settings,
            paymentMethods: state.settings.paymentMethods.map((pm) =>
              pm.id === id ? { ...pm, ...updates } : pm
            ),
          },
        }));
      },

      deletePaymentMethod: (id) => {
        set((state) => ({
          settings: {
            ...state.settings,
            paymentMethods: state.settings.paymentMethods.filter((pm) => pm.id !== id),
          },
        }));
      },

      // Stats
      getStats: () => {
        const state = get();
        const totalRevenue = state.orders
          .filter(o => o.status === 'Completed')
          .reduce((sum, o) => sum + o.total, 0);
        
        return {
          totalRevenue,
          totalOrders: state.orders.length,
          totalCustomers: state.customers.length,
          totalProducts: state.products.length,
        };
      },
    }),
    {
      name: 'admin-storage',
    }
  )
);
