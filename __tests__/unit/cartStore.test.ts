import { useCartStore } from '@/stores/cartStore'
import type { CartItem } from '@/stores/cartStore'

// Helper to create test cart items
function createItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    trackId: `track-${Math.random().toString(36).slice(2)}`,
    title: 'Test Track',
    creatorName: 'Test Creator',
    artworkUrl: null,
    licenseType: 'non_exclusive',
    price: 29.99,
    priceNonExclusive: 29.99,
    priceExclusive: 299.99,
    ...overrides,
  }
}

describe('cartStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useCartStore.setState({ items: [], isDrawerOpen: false })
  })

  describe('addItem', () => {
    it('adds an item to the cart', () => {
      const item = createItem()
      useCartStore.getState().addItem(item)
      expect(useCartStore.getState().items).toHaveLength(1)
      expect(useCartStore.getState().items[0]).toEqual(item)
    })

    it('replaces an existing item with the same trackId', () => {
      const trackId = 'same-track'
      const item1 = createItem({ trackId, licenseType: 'non_exclusive', price: 29.99 })
      const item2 = createItem({ trackId, licenseType: 'exclusive', price: 299.99 })

      useCartStore.getState().addItem(item1)
      useCartStore.getState().addItem(item2)

      expect(useCartStore.getState().items).toHaveLength(1)
      expect(useCartStore.getState().items[0].licenseType).toBe('exclusive')
      expect(useCartStore.getState().items[0].price).toBe(299.99)
    })
  })

  describe('removeItem', () => {
    it('removes an item from the cart by trackId', () => {
      const item1 = createItem({ trackId: 'track-1' })
      const item2 = createItem({ trackId: 'track-2' })

      useCartStore.getState().addItem(item1)
      useCartStore.getState().addItem(item2)
      useCartStore.getState().removeItem('track-1')

      expect(useCartStore.getState().items).toHaveLength(1)
      expect(useCartStore.getState().items[0].trackId).toBe('track-2')
    })
  })

  describe('clearCart', () => {
    it('removes all items from the cart', () => {
      useCartStore.getState().addItem(createItem())
      useCartStore.getState().addItem(createItem())
      useCartStore.getState().addItem(createItem())
      useCartStore.getState().clearCart()

      expect(useCartStore.getState().items).toHaveLength(0)
    })
  })

  describe('bundle discount calculations', () => {
    it('returns 0% discount for 1 item', () => {
      useCartStore.getState().addItem(createItem({ price: 100 }))

      expect(useCartStore.getState().getDiscountPercent()).toBe(0)
      expect(useCartStore.getState().getDiscountAmount()).toBe(0)
      expect(useCartStore.getState().getSubtotal()).toBe(100)
      expect(useCartStore.getState().getTotal()).toBe(100)
    })

    it('returns 10% discount for 2 items', () => {
      useCartStore.getState().addItem(createItem({ trackId: 't1', price: 50 }))
      useCartStore.getState().addItem(createItem({ trackId: 't2', price: 50 }))

      expect(useCartStore.getState().getDiscountPercent()).toBe(10)
      expect(useCartStore.getState().getSubtotal()).toBe(100)
      expect(useCartStore.getState().getDiscountAmount()).toBe(10)
      expect(useCartStore.getState().getTotal()).toBe(90)
    })

    it('returns 20% discount for 3 items', () => {
      useCartStore.getState().addItem(createItem({ trackId: 't1', price: 30 }))
      useCartStore.getState().addItem(createItem({ trackId: 't2', price: 30 }))
      useCartStore.getState().addItem(createItem({ trackId: 't3', price: 40 }))

      expect(useCartStore.getState().getDiscountPercent()).toBe(20)
      expect(useCartStore.getState().getSubtotal()).toBe(100)
      expect(useCartStore.getState().getDiscountAmount()).toBe(20)
      expect(useCartStore.getState().getTotal()).toBe(80)
    })

    it('returns 20% discount for 4+ items', () => {
      useCartStore.getState().addItem(createItem({ trackId: 't1', price: 25 }))
      useCartStore.getState().addItem(createItem({ trackId: 't2', price: 25 }))
      useCartStore.getState().addItem(createItem({ trackId: 't3', price: 25 }))
      useCartStore.getState().addItem(createItem({ trackId: 't4', price: 25 }))

      expect(useCartStore.getState().getDiscountPercent()).toBe(20)
      expect(useCartStore.getState().getSubtotal()).toBe(100)
      expect(useCartStore.getState().getDiscountAmount()).toBe(20)
      expect(useCartStore.getState().getTotal()).toBe(80)
    })

    it('calculates correct total with various prices', () => {
      useCartStore.getState().addItem(createItem({ trackId: 't1', price: 29.99 }))
      useCartStore.getState().addItem(createItem({ trackId: 't2', price: 49.99 }))
      useCartStore.getState().addItem(createItem({ trackId: 't3', price: 19.99 }))

      const subtotal = 29.99 + 49.99 + 19.99 // 99.97
      const discountAmount = subtotal * 0.2 // 19.994
      const total = subtotal * 0.8 // 79.976

      expect(useCartStore.getState().getSubtotal()).toBeCloseTo(subtotal, 2)
      expect(useCartStore.getState().getDiscountAmount()).toBeCloseTo(discountAmount, 2)
      expect(useCartStore.getState().getTotal()).toBeCloseTo(total, 2)
    })
  })

  describe('getItemCount', () => {
    it('returns the correct item count', () => {
      expect(useCartStore.getState().getItemCount()).toBe(0)

      useCartStore.getState().addItem(createItem({ trackId: 't1' }))
      expect(useCartStore.getState().getItemCount()).toBe(1)

      useCartStore.getState().addItem(createItem({ trackId: 't2' }))
      expect(useCartStore.getState().getItemCount()).toBe(2)
    })
  })

  describe('drawer state', () => {
    it('toggleDrawer toggles the drawer state', () => {
      expect(useCartStore.getState().isDrawerOpen).toBe(false)
      useCartStore.getState().toggleDrawer()
      expect(useCartStore.getState().isDrawerOpen).toBe(true)
      useCartStore.getState().toggleDrawer()
      expect(useCartStore.getState().isDrawerOpen).toBe(false)
    })

    it('openDrawer and closeDrawer work correctly', () => {
      useCartStore.getState().openDrawer()
      expect(useCartStore.getState().isDrawerOpen).toBe(true)
      useCartStore.getState().closeDrawer()
      expect(useCartStore.getState().isDrawerOpen).toBe(false)
    })
  })
})
