import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useState, useEffect } from 'react';

export interface CartItem {
  courseId: number;
  slug: string;
  title: string;
  price: number;
  thumbnailUrl?: string | null;
  levelCode?: string | null;
  levelName?: string | null;
  batchId?: number | null;
  batchName?: string | null;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (courseId: number) => void;
  updateBatch: (courseId: number, batchId: number | null, batchName?: string | null) => void;
  updateItemPrice: (courseId: number, price: number) => void;
  clearCart: () => void;
  isInCart: (courseId: number) => boolean;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const exists = state.items.some((i) => i.courseId === item.courseId);
          if (exists) return state;
          return { items: [...state.items, item] };
        });
      },

      removeItem: (courseId) => {
        set((state) => ({
          items: state.items.filter((i) => i.courseId !== courseId),
        }));
      },

      updateBatch: (courseId, batchId, batchName = null) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.courseId === courseId
              ? { ...i, batchId: batchId || null, batchName: batchName || null }
              : i
          ),
        }));
      },

      updateItemPrice: (courseId, price) => {
        set((state) => {
          const numPrice = Number(price) || 0;
          const currentItem = state.items.find((i) => i.courseId === courseId);
          if (currentItem && currentItem.price === numPrice) {
            return state;
          }
          return {
            items: state.items.map((i) =>
              i.courseId === courseId
                ? { ...i, price: numPrice }
                : i
            ),
          };
        });
      },

      clearCart: () => set({ items: [] }),

      isInCart: (courseId) => {
        return get().items.some((i) => i.courseId === courseId);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (Number(item.price) || 0), 0);
      },
    }),
    {
      name: 'digiblue-cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/**
 * Hook untuk membaca jumlah item di keranjang secara aman tanpa hydration mismatch
 */
export function useCartCount() {
  const items = useCartStore((state) => state.items);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? items.length : 0;
}

/**
 * Hook untuk mengecek apakah kursus sudah ada di keranjang secara aman tanpa hydration mismatch
 */
export function useIsInCart(courseId: number) {
  const inCart = useCartStore((state) => state.items.some((i) => i.courseId === courseId));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? inCart : false;
}
