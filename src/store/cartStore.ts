import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProductVariant {
  id?: string;
  _id?: string;
  weight: string;
  flavor?: string;
  price: number;
  stock: number;
  sku?: string;
  hasOffer?: boolean;
  originalPrice?: number;
  offerDiscount?: number;
  offerDiscountType?: 'percentage' | 'fixed';
  offerDiscountAmount?: number;
  offerBadge?: string;
  offerFreeProduct?: string;
}

export interface WeightOffer {
  weight: string;
  hasOffer: boolean;
  price?: number;
  originalPrice?: number;
  offerDiscount?: number;
  offerDiscountType?: 'percentage' | 'fixed';
  offerDiscountAmount?: number;
  offerBadge?: string;
  offerFreeProduct?: string;
}

export interface Product {
  id: string;
  _id?: string;
  name: string;
  brand?: string;
  price: number;
  image: string;
  images?: string[];
  category: string;
  countryOfOrigin?: string;
  description: string;
  weight: string;
  weights?: string[];
  flavor?: string;
  flavors?: string[];
  variants?: ProductVariant[];
  stock: number;
  lowStockThreshold?: number;
  featured?: boolean;
  isActive?: boolean;
  hasOffer?: boolean;
  offerScope?: 'all' | 'weights';
  weightOffers?: WeightOffer[];
  offerBadge?: string;
  offerDiscount?: number;
  offerDiscountType?: 'percentage' | 'fixed';
  offerDiscountAmount?: number;
  offerStartDate?: string;
  offerEndDate?: string;
  offerFreeProduct?: string;
  originalPrice?: number;
  offerPrice?: number;
  averageRating?: number;
  reviewsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem extends Product {
  cartItemId: string;
  selectedWeight: string;
  selectedFlavor?: string;
  quantity: number;
  variantId?: string;
  sku?: string;
}

export interface AddItemOptions {
  weight?: string;
  flavor?: string;
  price?: number;
  stock?: number;
  variantId?: string;
  sku?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, options?: AddItemOptions) => void;
  getItemQuantity: (productIdOrCartItemId: string) => number;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product, requestedQuantity = 1, options) => {
        const state = get();
        
        const selectedWeight = options?.weight || product.weight || (product.weights && product.weights[0]) || 'Standard';
        const selectedFlavor = options?.flavor || product.flavor || (product.flavors && product.flavors[0]) || undefined;
        const itemPrice = options?.price !== undefined ? options.price : product.price;
        const availableStock = options?.stock !== undefined ? options.stock : (product.stock ?? 0);
        
        // Composite unique key for this exact variant
        const cartItemId = `${product.id || product._id}-${selectedWeight}-${selectedFlavor || 'default'}`;
        
        const existingItem = state.items.find((item) => item.cartItemId === cartItemId);
        const currentQuantity = existingItem ? existingItem.quantity : 0;
        
        // Prevent exceeding variant stock
        if (currentQuantity + requestedQuantity > availableStock) {
          const canAdd = availableStock - currentQuantity;
          if (canAdd <= 0) {
            return;
          }
          requestedQuantity = canAdd;
        }
        
        set((state) => {
          const exists = state.items.find((item) => item.cartItemId === cartItemId);
          
          if (exists) {
            return {
              items: state.items.map((item) =>
                item.cartItemId === cartItemId
                  ? { ...item, quantity: item.quantity + requestedQuantity }
                  : item
              ),
            };
          }
          
          const newItem: CartItem = {
            ...product,
            id: product.id || (product._id as string),
            price: itemPrice,
            stock: availableStock,
            cartItemId,
            selectedWeight,
            selectedFlavor,
            variantId: options?.variantId,
            sku: options?.sku,
            quantity: requestedQuantity,
          };
          
          return { items: [...state.items, newItem] };
        });
      },
      
      getItemQuantity: (productIdOrCartItemId) => {
        if (!productIdOrCartItemId) return 0;
        const items = get().items || [];
        // Check by exact cartItemId first
        const exact = items.find(
          (item) => item && (item.cartItemId === productIdOrCartItemId || item.id === productIdOrCartItemId)
        );
        if (exact) return exact.quantity || 0;
        // Or aggregate by product id
        const matched = items.filter(
          (item) =>
            item &&
            (item.id === productIdOrCartItemId ||
              (typeof item.cartItemId === 'string' &&
                item.cartItemId.startsWith(`${productIdOrCartItemId}-`)))
        );
        return matched.reduce((sum, item) => sum + (item?.quantity || 0), 0);
      },
      
      removeItem: (cartItemId) => {
        set((state) => ({
          items: (state.items || []).filter(
            (item) => item && item.cartItemId !== cartItemId && item.id !== cartItemId
          ),
        }));
      },
      
      updateQuantity: (cartItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(cartItemId);
          return;
        }
        set((state) => ({
          items: (state.items || []).map((item) =>
            item && (item.cartItemId === cartItemId || item.id === cartItemId)
              ? { ...item, quantity: Math.min(quantity, item.stock ?? quantity) }
              : item
          ),
        }));
      },
      
      clearCart: () => set({ items: [] }),
      
      getTotalItems: () => {
        return (get().items || []).reduce((total, item) => total + (item?.quantity || 0), 0);
      },
      
      getTotalPrice: () => {
        return (get().items || []).reduce(
          (total, item) => total + (item?.price || 0) * (item?.quantity || 0),
          0
        );
      },
    }),
    {
      name: 'cart-storage',
      migrate: (persistedState: any) => {
        if (persistedState && Array.isArray(persistedState.items)) {
          persistedState.items = persistedState.items.map((item: any) => ({
            ...item,
            cartItemId:
              item.cartItemId ||
              `${item.id || item._id || 'item'}-${item.selectedWeight || item.weight || 'Standard'}-${item.selectedFlavor || item.flavor || 'default'}`,
          }));
        }
        return persistedState;
      },
    }
  )
);
