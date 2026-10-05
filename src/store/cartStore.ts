import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  weight: string;
  flavor?: string;
  stock: number;
}

export interface CartItem extends Product {
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  getItemQuantity: (productId: string) => number;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product, requestedQuantity = 1) => {
        const state = get();
        const existingItem = state.items.find((item) => item.id === product.id);
        const currentQuantity = existingItem ? existingItem.quantity : 0;
        const availableStock = product.stock ?? 0;
        
        // Check if adding would exceed stock
        if (currentQuantity + requestedQuantity > availableStock) {
          const canAdd = availableStock - currentQuantity;
          if (canAdd <= 0) {
            return; // Can't add any more
          }
          // Add only what's available
          requestedQuantity = canAdd;
        }
        
        set((state) => {
          const existingItem = state.items.find((item) => item.id === product.id);
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + requestedQuantity }
                  : item
              ),
            };
          }
          return { items: [...state.items, { ...product, quantity: requestedQuantity }] };
        });
      },
      
      getItemQuantity: (productId) => {
        const item = get().items.find((item) => item.id === productId);
        return item ? item.quantity : 0;
      },
      
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        }));
      },
      
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.id === productId ? { ...item, quantity } : item
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
