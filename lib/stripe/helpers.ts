import Stripe from 'stripe'

let _stripe: Stripe | null = null

/**
 * Returns a lazily-initialized Stripe client.
 * Lazy initialization prevents build-time errors when STRIPE_SECRET_KEY
 * is not available in the build environment.
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  }
  return _stripe
}
