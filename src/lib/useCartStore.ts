import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  stock?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  isCheckoutOpen: boolean; // <-- Nuevo
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  openCheckout: () => void;  // <-- Nuevo
  closeCheckout: () => void; // <-- Nuevo
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      isCheckoutOpen: false, // <-- Inicial
      
      addToCart: (product) => {
        const currentItems = get().items;
        const existingItem = currentItems.find(
          (item) => item.product.id === product.id
        );

        if (existingItem) {
          set({
            items: currentItems.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
            isOpen: true,
          });
        } else {
          set({
            items: [...currentItems, { product, quantity: 1 }],
            isOpen: true,
          });
        }
      },

      removeFromCart: (productId) => {
        set({
          items: get().items.filter((item) => item.product.id !== productId),
        });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }

        set({
          items: get().items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        });
      },

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      // Nuevas funciones para el Checkout
      openCheckout: () => set({ isOpen: false, isCheckoutOpen: true }),
      closeCheckout: () => set({ isCheckoutOpen: false }),

      getTotalItems: () => {
        return get().items.reduce((acc, item) => acc + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (acc, item) => acc + item.product.price * item.quantity,
          0
        );
      },
    }),
    {
      name: 'crakcio-cart-storage',
      partialize: (state) => ({ items: state.items }), // Solo guardar items en LocalStorage
    }
  )
);