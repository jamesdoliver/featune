/**
 * Shared pricing logic – imported by both client (cart store) and server
 * (checkout API) to guarantee consistent discount calculations.
 */

/** Return the discount rate (0, 0.10, or 0.20) based on item count. */
export function calculateDiscount(itemCount: number): number {
  if (itemCount >= 3) return 0.20
  if (itemCount >= 2) return 0.10
  return 0
}
