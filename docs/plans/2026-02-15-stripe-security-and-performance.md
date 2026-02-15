# Stripe Security & Performance Improvements

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 5 Stripe security/correctness issues and 3 performance quick wins.

**Architecture:** Direct edits to existing API routes (checkout, webhook) and layout. No new libraries or infrastructure.

**Tech Stack:** Next.js API routes, Stripe SDK, next/dynamic, next/image

---

## Task 1: Price Validation in Checkout

**Files:**
- Modify: `app/api/checkout/route.ts:156-174`

**Context:** Cart prices come from the frontend and are never validated against DB prices. A user could tamper with localStorage to pay less.

**Step 1: Add price validation after line 143 (end of availability loop)**

Insert a new validation loop between the existing availability check (line 144) and the discount calculation (line 153). After the `unavailableItems` early return at line 151, add:

```typescript
  // 4b. Validate that cart prices match database prices
  for (const item of body.items) {
    const track = trackMap.get(item.trackId)!
    const dbPrice =
      item.licenseType === 'exclusive'
        ? track.price_exclusive
        : track.price_non_exclusive

    // Note: prices are already validated as non-null in the availability check above
    if (dbPrice === null || dbPrice === undefined) continue
  }
```

Wait — the current `CartItem` interface doesn't include `price`. The price is only derived server-side at line 160-163. Let me re-check.

Looking at the code again: `lineItemsData` at line 156 derives price FROM the database (`track.price_exclusive` / `track.price_non_exclusive`), not from the cart item. **The frontend cart only sends `{ trackId, licenseType }` — prices are already fetched server-side.**

**Verdict: This is NOT a vulnerability.** The checkout route already uses DB prices, not client prices. The audit report was incorrect. Skip this task.

---

## Task 2: Webhook Replay Protection

**Files:**
- Modify: `app/api/webhooks/stripe/route.ts:96-104`

**Context:** If Stripe retries a webhook (e.g., timeout), `handleCheckoutSessionCompleted` runs again and creates a duplicate order. We need to check if an order with this `session.id` already exists.

**Step 1: Add duplicate check at the start of `handleCheckoutSessionCompleted`**

Insert after line 104 (after the metadata.userId check):

```typescript
  // Guard against duplicate webhook deliveries
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id')
    .eq('stripe_payment_intent', session.id)
    .maybeSingle()

  if (existingOrder) {
    console.log('Webhook already processed for session', session.id)
    return
  }
```

**Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: Clean

**Step 3: Commit**

```
feat: add webhook replay protection for duplicate Stripe events
```

---

## Task 3: Rate Limiting on Checkout Endpoint

**Files:**
- Modify: `app/api/checkout/route.ts` (top of file + inside POST handler)

**Context:** No rate limiting exists on the checkout endpoint. Reuse the same in-memory pattern from `app/api/downloads/[trackId]/route.ts`.

**Step 1: Add rate limiter at top of file (after imports)**

```typescript
// Simple per-user rate limiter: max 5 checkout attempts per 10 minutes
const CHECKOUT_RATE_LIMIT_MAX = 5
const CHECKOUT_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const checkoutRequests = new Map<string, number[]>()

function isCheckoutRateLimited(userId: string): boolean {
  const now = Date.now()
  const timestamps = (checkoutRequests.get(userId) ?? []).filter(
    (t) => now - t < CHECKOUT_RATE_LIMIT_WINDOW_MS
  )
  if (timestamps.length >= CHECKOUT_RATE_LIMIT_MAX) {
    checkoutRequests.set(userId, timestamps)
    return true
  }
  timestamps.push(now)
  checkoutRequests.set(userId, timestamps)
  return false
}
```

**Step 2: Add rate limit check after auth (after line 31)**

```typescript
  if (isCheckoutRateLimited(user.id)) {
    return NextResponse.json(
      { error: 'Too many checkout attempts. Please try again later.' },
      { status: 429 }
    )
  }
```

**Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: Clean

**Step 4: Commit**

```
feat: add rate limiting to checkout endpoint (5 per 10min)
```

---

## Task 4: Alert on PDF Generation Failure

**Files:**
- Modify: `app/api/webhooks/stripe/route.ts:271-281`

**Context:** When license PDF generation fails, it's silently marked `GENERATION_FAILED`. No one is notified. Add a console.error with structured data an admin can grep for, and store the failure info on the order item.

**Step 1: Replace the PDF failure catch block (lines 271-281)**

Replace:
```typescript
        } catch (pdfErr) {
          console.error(
            `Failed to generate/upload license PDF for track ${item.trackId}:`,
            pdfErr
          )
          // Mark the order item so admins can identify and regenerate failed PDFs
          await supabase
            .from('order_items')
            .update({ license_pdf_url: 'GENERATION_FAILED' })
            .eq('id', orderItem.id)
        }
```

With:
```typescript
        } catch (pdfErr) {
          const errorMessage = pdfErr instanceof Error ? pdfErr.message : 'Unknown error'
          console.error(
            '[PDF_GENERATION_FAILED]',
            JSON.stringify({
              orderId: order.id,
              orderItemId: orderItem.id,
              trackId: item.trackId,
              trackTitle: track.title,
              buyerEmail,
              error: errorMessage,
            })
          )
          // Mark the order item so admins can identify and regenerate failed PDFs
          await supabase
            .from('order_items')
            .update({ license_pdf_url: 'GENERATION_FAILED' })
            .eq('id', orderItem.id)
        }
```

**Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: Clean

**Step 3: Commit**

```
fix: add structured logging for PDF generation failures
```

---

## Task 5: Dynamic Imports in Layout

**Files:**
- Modify: `app/layout.tsx`

**Context:** `AudioPlayer`, `CartDrawer`, and `ChatWrapper` are imported synchronously and add ~100KB+ to every page's JS bundle. Use `next/dynamic` with `{ ssr: false }` since these are client-only interactive components.

**Step 1: Replace static imports with dynamic imports**

Replace lines 6-8:
```typescript
import AudioPlayer from "@/components/player/AudioPlayer";
import CartDrawer from "@/components/cart/CartDrawer";
import ChatWrapper from "@/components/chat/ChatWrapper";
```

With:
```typescript
import dynamic from "next/dynamic";

const AudioPlayer = dynamic(() => import("@/components/player/AudioPlayer"), {
  ssr: false,
});
const CartDrawer = dynamic(() => import("@/components/cart/CartDrawer"), {
  ssr: false,
});
const ChatWrapper = dynamic(() => import("@/components/chat/ChatWrapper"), {
  ssr: false,
});
```

**Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: Clean

**Step 3: Commit**

```
perf: dynamic import AudioPlayer, CartDrawer, ChatWrapper to reduce initial JS
```

---

## Task 6: Replace `<img>` with `next/image` in TrackClient

**Files:**
- Modify: `app/track/[id]/TrackClient.tsx:196-200`

**Context:** Track artwork uses raw `<img>` — no WebP/AVIF conversion, no lazy loading, no responsive sizing. `next.config.ts` already has Supabase remote patterns configured.

**Step 1: Add Image import at top of file**

Add to existing imports:
```typescript
import Image from 'next/image'
```

**Step 2: Replace the `<img>` tag at line 196-200**

Replace:
```tsx
              <img
                src={track.artwork_url}
                alt={track.title}
                className="h-full w-full object-cover"
              />
```

With:
```tsx
              <Image
                src={track.artwork_url}
                alt={track.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority
              />
```

Note: The parent `div` already has `aspect-square w-full overflow-hidden rounded-xl` — we need to add `relative` to it for the `fill` prop to work. Change the parent div (line 194) from:
```tsx
          <div className="aspect-square w-full overflow-hidden rounded-xl border border-border-default">
```
To:
```tsx
          <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border-default">
```

**Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: Clean

**Step 4: Commit**

```
perf: use next/image for track artwork (WebP/AVIF, lazy loading)
```

---

## Task 7: Replace `<img>` with `next/image` in ChatModal

**Files:**
- Modify: `components/chat/ChatModal.tsx:323-328`

**Context:** Same issue as Task 6 — chat results use raw `<img>` for track artwork thumbnails (48x48).

**Step 1: Add Image import at top of file**

```typescript
import Image from 'next/image'
```

**Step 2: Replace the `<img>` tag at lines 324-328**

Replace:
```tsx
                      <img
                        src={track.artwork_url}
                        alt={track.title}
                        className="h-full w-full object-cover"
                      />
```

With:
```tsx
                      <Image
                        src={track.artwork_url}
                        alt={track.title}
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                      />
```

**Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: Clean

**Step 4: Commit**

```
perf: use next/image for chat modal artwork thumbnails
```

---

## Task 8: Add `generateStaticParams` for Track Pages

**Files:**
- Modify: `app/track/[id]/page.tsx`

**Context:** Every track page is SSR'd on demand. Popular approved tracks can be pre-generated at build time with ISR revalidation.

**Step 1: Add `generateStaticParams` and `revalidate` exports**

Add after the imports (after line 4):
```typescript
export const revalidate = 300 // Revalidate every 5 minutes
```

Add after the `generateMetadata` function (after line 42):
```typescript
export async function generateStaticParams() {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data: tracks } = await supabase
    .from('tracks')
    .select('id')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(50)

  return (tracks ?? []).map((track) => ({ id: track.id }))
}
```

**Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: Clean

**Step 3: Commit**

```
perf: pre-generate top 50 track pages with ISR (5min revalidation)
```

---

## Final Verification

Run: `npx tsc --noEmit && npm test`
Expected: All clean, all 68 tests pass.
