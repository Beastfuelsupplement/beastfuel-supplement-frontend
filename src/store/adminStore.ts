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

export interface DeletedOrder extends Order {
  deletedAt: string;
  deletedBy?: string;
  deletionReason?: string;
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
  tagline?: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  workingHours?: string;
  weekendHours?: string;
  contactSubtext?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    facebook?: string;
    whatsapp?: string;
    tiktok?: string;
  };
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
  shippingType?: 'free' | 'flat_rate';
  shippingCost?: number;
  enableFreeShippingThreshold?: boolean;
  freeShippingThreshold?: number;
  shippingEstimatedDays?: string;
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
  deleteOrder: (id: string, reason?: string, deletedBy?: string) => void;
  deletedOrders: DeletedOrder[];
  restoreOrder: (id: string) => void;
  permanentlyDeleteOrder: (id: string) => void;
  clearDeletedOrders: () => void;
  setOrders: (orders: Order[]) => void;
  setCustomers: (customers: Customer[]) => void;
  
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
  tagline: 'Fuel Your Ascent. Premium supplements for peak performance and optimal recovery.',
  storeEmail: 'supportbeastfuelsupplement@gmail.com',
  storePhone: '+1 (555) 123-4567',
  storeAddress: '123 Fitness Street, Gym City, GC 12345',
  workingHours: 'Mon - Fri: 9AM - 6PM',
  weekendHours: 'Sat - Sun: Closed',
  contactSubtext: 'We reply within 24 hours',
  socialLinks: {
    instagram: 'https://instagram.com/beastfuel',
    twitter: 'https://twitter.com/beastfuel',
    youtube: 'https://youtube.com/@beastfuel',
    facebook: 'https://facebook.com/beastfuel',
    whatsapp: '',
    tiktok: '',
  },
  currency: 'LKR',
  timezone: 'Asia/Colombo',
  emailNotifications: true,
  orderNotifications: true,
  marketingEmails: false,
  twoFactorAuth: false,
  sessionTimeout: '30',
  paymentMethods: defaultPaymentMethods,
  adminEmail: 'dilmunasingha91@gmail.com',
  lowStockThreshold: 10,
  shippingType: 'free',
  shippingCost: 0,
  enableFreeShippingThreshold: false,
  freeShippingThreshold: 50,
  shippingEstimatedDays: '1-3 Business Days',
};

export const isMockOrder = (o: Order) =>
  ['ORD-001', 'ORD-002', 'ORD-003', 'ORD-004'].includes(o.id) &&
  (o.customerEmail?.includes('@example.com') || o.customerName === 'John Doe');

export const isMockCustomer = (c: Customer) =>
  ['cust-1', 'cust-2', 'cust-3', 'cust-4'].includes(c.id) &&
  (c.email?.includes('@example.com') || c.name === 'John Doe');

const defaultCustomers: Customer[] = [];
const defaultOrders: Order[] = [];

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      products: initialProducts,
      orders: defaultOrders,
      deletedOrders: [],
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

      deleteOrder: (id, reason = 'Admin deletion', deletedBy = 'Admin User') => {
        const orderToDelete = get().orders.find((o) => o.id === id);
        if (orderToDelete) {
          const deletedRecord: DeletedOrder = {
            ...orderToDelete,
            deletedAt: new Date().toLocaleString(),
            deletedBy,
            deletionReason: reason,
          };
          set((state) => ({
            orders: state.orders.filter((o) => o.id !== id),
            deletedOrders: [deletedRecord, ...(state.deletedOrders || [])],
          }));
        } else {
          set((state) => ({
            orders: state.orders.filter((o) => o.id !== id),
          }));
        }
      },

      restoreOrder: (id) => {
        const orderToRestore = get().deletedOrders?.find((o) => o.id === id);
        if (orderToRestore) {
          const { deletedAt, deletedBy, deletionReason, ...cleanOrder } = orderToRestore;
          set((state) => ({
            deletedOrders: (state.deletedOrders || []).filter((o) => o.id !== id),
            orders: [cleanOrder as Order, ...state.orders],
          }));
        }
      },

      permanentlyDeleteOrder: (id) => {
        set((state) => ({
          deletedOrders: (state.deletedOrders || []).filter((o) => o.id !== id),
        }));
      },

      clearDeletedOrders: () => {
        set({ deletedOrders: [] });
      },

      setOrders: (orders) => {
        set({ orders: orders.filter((o) => !isMockOrder(o)) });
      },

      setCustomers: (customers) => {
        set({ customers: customers.filter((c) => !isMockCustomer(c)) });
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
        const validOrders = (state.orders || []).filter((o) => !isMockOrder(o));
        const validCustomers = (state.customers || []).filter((c) => !isMockCustomer(c));
        const totalRevenue = validOrders
          .filter((o) => o.status === 'Completed' || o.paymentStatus === 'Paid')
          .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

        return {
          totalRevenue: Number(totalRevenue.toFixed(2)),
          totalOrders: validOrders.length,
          totalCustomers: validCustomers.length,
          totalProducts: (state.products || []).length,
        };
      },
    }),
    {
      name: 'admin-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (Array.isArray(state.orders)) {
            state.orders = state.orders.filter((o) => !isMockOrder(o));
          }
          if (Array.isArray(state.customers)) {
            state.customers = state.customers.filter((c) => !isMockCustomer(c));
          }
        }
      },
    }
  )
);
