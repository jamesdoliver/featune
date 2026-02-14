import { calculateDiscount } from '@/lib/pricing'

describe('calculateDiscount', () => {
  it('returns 0 for 0 items', () => {
    expect(calculateDiscount(0)).toBe(0)
  })

  it('returns 0 for 1 item', () => {
    expect(calculateDiscount(1)).toBe(0)
  })

  it('returns 0.10 for 2 items', () => {
    expect(calculateDiscount(2)).toBe(0.10)
  })

  it('returns 0.20 for 3 items', () => {
    expect(calculateDiscount(3)).toBe(0.20)
  })

  it('returns 0.20 for 4+ items (discount cap)', () => {
    expect(calculateDiscount(4)).toBe(0.20)
    expect(calculateDiscount(10)).toBe(0.20)
    expect(calculateDiscount(100)).toBe(0.20)
  })

  it('returns 0 for negative item count', () => {
    expect(calculateDiscount(-1)).toBe(0)
    expect(calculateDiscount(-100)).toBe(0)
  })
})
