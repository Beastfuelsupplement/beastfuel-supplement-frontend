import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProductVariant {
  id?: string;
  weight: string;
  flavor?: string;
  price: number;
  stock: number;
  sku?: string;
}

export interface Product {
  id: string;
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
  featured?: boolean;
  isActive?: boolean;
}

export interface CartItem extends Product {
  cartItemId: string;
  selectedWeight: string;
  selectedFlavor?: string;
  quantity: number;
}

export interface AddItemOptions {
  weight?: string;
  flavor?: string;
  price?: number;
  stock?: number;
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
        
        // Generate a composite unique key for this variant
        const cartItemId = `${product.id}-${selectedWeight}-${selectedFlavor || 'default'}`;
        
        const existingItem = state.items.find(
          (item) => item.cartItemId === cartItemId || (!item.cartItemId && item.id === product.id)
        );
        const currentQuantity = existingItem ? existingItem.quantity : 0;
        
        // Check if adding would exceed stock
        if (currentQuantity + requestedQuantity > availableStock) {
          const canAdd = availableStock - currentQuantity;
          if (canAdd <= 0) {
            return; // Can't add any more
          }
          requestedQuantity = canAdd;
        }
        
        set((state) => {
          const exists = state.items.find(
            (item) => item.cartItemId === cartItemId || (!item.cartItemId && item.id === product.id)
          );
          
          if (exists) {
            return {
              items: state.items.map((item) =>
                (item.cartItemId === cartItemId || (!item.cartItemId && item.id === product.id))
                  ? { ...item, quantity: item.quantity + requestedQuantity }
                  : item
              ),
            };
          }
          
          const newItem: CartItem = {
            ...product,
            price: itemPrice,
            stock: availableStock,
            cartItemId,
            selectedWeight,
            selectedFlavor,
            quantity: requestedQuantity,
          };
          
          return { items: [...state.items, newItem] };
        });
      },
      
      getItemQuantity: (productIdOrCartItemId) => {
        const items = get().items;
        // Check by exact cartItemId first
        const exact = items.find((item) => item.cartItemId === productIdOrCartItemId);
        if (exact) return exact.quantity;
        // Or aggregate by product id
        const matched = items.filter((item) => item.id === productIdOrCartItemId);
        return matched.reduce((sum, item) => sum + item.quantity, 0);
      },
      
      removeItem: (cartItemId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => item.cartItemId !== cartItemId && item.id !== cartItemId
          ),
        }));
      },
      
      updateQuantity: (cartItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(cartItemId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            (item.cartItemId === cartItemId || item.id === cartItemId)
              ? { ...item, quantity }
              : item
          ),
        }));
      },
      
      clearCart: () => set({ items: [] }),
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      
      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
