import { create } from "zustand"
import { persist } from "zustand/middleware"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CartItem {
  trackId: string
  title: string
  creatorName: string
  artworkUrl: string | null
  licenseType: "non_exclusive" | "exclusive"
  price: number
}

interface CartState {
  items: CartItem[]
  isDrawerOpen: boolean
}

interface CartActions {
  /** Add an item to the cart. If the same trackId already exists, it is replaced
   *  (handles exclusive/non-exclusive conflict automatically). */
  addItem: (item: CartItem) => void
  /** Remove the item with the given trackId from the cart. */
  removeItem: (trackId: string) => void
  /** Remove all items from the cart. */
  clearCart: () => void
  /** Toggle the cart drawer open/closed. */
  toggleDrawer: () => void
  /** Open the cart drawer. */
  openDrawer: () => void
  /** Close the cart drawer. */
  closeDrawer: () => void

  // Computed helpers (implemented as functions that read current state)
  getSubtotal: () => number
  getDiscountPercent: () => number
  getDiscountAmount: () => number
  getTotal: () => number
  getItemCount: () => number
}

export type CartStore = CartState & CartActions

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return the discount rate based on the number of items in the cart. */
function calculateDiscount(itemCount: number): number {
  if (itemCount >= 3) return 0.2 // 20 % off
  if (itemCount >= 2) return 0.1 // 10 % off
  return 0
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // -- State ----------------------------------------------------------
      items: [],
      isDrawerOpen: false,

      // -- Actions --------------------------------------------------------

      addItem: (item: CartItem) => {
        set((state) => {
          // Remove any existing entry for the same track (prevents duplicates
          // and handles exclusive <-> non-exclusive replacement).
          const filtered = state.items.filter(
            (i) => i.trackId !== item.trackId,
          )
          return { items: [...filtered, item] }
        })
      },

      removeItem: (trackId: string) => {
        set((state) => ({
          items: state.items.filter((i) => i.trackId !== trackId),
        }))
      },

      clearCart: () => {
        set({ items: [] })
      },

      toggleDrawer: () => {
        set((state) => ({ isDrawerOpen: !state.isDrawerOpen }))
      },

      openDrawer: () => {
        set({ isDrawerOpen: true })
      },

      closeDrawer: () => {
        set({ isDrawerOpen: false })
      },

      // -- Computed -------------------------------------------------------

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.price, 0)
      },

      getDiscountPercent: () => {
        const count = get().items.length
        return calculateDiscount(count) * 100 // return 0, 10, or 20
      },

      getDiscountAmount: () => {
        const { items } = get()
        const subtotal = items.reduce((sum, item) => sum + item.price, 0)
        const rate = calculateDiscount(items.length)
        return subtotal * rate
      },

      getTotal: () => {
        const { items } = get()
        const subtotal = items.reduce((sum, item) => sum + item.price, 0)
        const rate = calculateDiscount(items.length)
        return subtotal * (1 - rate)
      },

      getItemCount: () => {
        return get().items.length
      },
    }),
    {
      name: "featune-cart",
      // Only persist items, not the transient drawer state.
      partialize: (state) => ({ items: state.items }),
    },
  ),
)
