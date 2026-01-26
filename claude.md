# FEATUNE - Development Reference

> Vocal topline marketplace for AI and human vocals. Dark mode, black + bold orange (#FF6B00) + white.

## Tech Stack

| Layer | Tech | Notes |
|-------|------|-------|
| Frontend | Next.js (React, TypeScript) | Deployed on Vercel |
| Backend | FastAPI (Python) | Deployed on Railway/Render |
| Database | Supabase (PostgreSQL) | Auth + RLS + Storage |
| Payments | Stripe | One-time purchases only |
| Email | Resend | Transactional emails |
| File Storage | Supabase Storage / Cloudflare R2 | Audio, artwork, stems |

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│    Supabase     │
│   (Vercel)      │     │  (DB + Auth)    │
└────────┬────────┘     └─────────────────┘
         │
         │ Audio processing,
         │ AI chat, watermarking
         ▼
┌─────────────────┐     ┌─────────────────┐
│  FastAPI Service│────▶│  File Storage   │
│  (Railway)      │     │  (R2/Supabase)  │
└─────────────────┘     └─────────────────┘
```

**When to call FastAPI vs handle in Next.js:**
- FastAPI: Audio watermarking, waveform generation, AI chat queries
- Next.js API routes: Auth flows, CRUD operations, Stripe webhooks, Resend emails

## User Types

| Type | Permissions |
|------|-------------|
| Customer | Browse, purchase, download, view order history |
| Creator | All customer perms + upload tracks, view sales, request payouts |
| Admin | Full access: approve/reject, edit anything, process payouts, analytics |

Creator accounts are linked to customer accounts ("Become a Creator" flow).

## Database Schema (Key Tables)

```sql
-- Users (extends Supabase auth.users)
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT,
  full_name TEXT,
  is_creator BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP
)

-- Creator profiles
creators (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles,
  display_name TEXT,
  bio TEXT,
  profile_image_url TEXT,
  revenue_split DECIMAL DEFAULT 0.70,  -- Admin can override
  payout_details JSONB,
  status ENUM ('pending', 'approved', 'rejected'),
  created_at TIMESTAMP
)

-- Tracks
tracks (
  id UUID PRIMARY KEY,
  creator_id UUID REFERENCES creators,
  title TEXT,
  vocalist_type ENUM ('male', 'female'),
  genre TEXT,
  mood TEXT,
  bpm INTEGER,
  key TEXT,
  length_seconds INTEGER,
  license_type ENUM ('unlimited', 'limited', 'exclusive'),
  license_limit INTEGER,  -- NULL if unlimited
  licenses_sold INTEGER DEFAULT 0,
  price_non_exclusive DECIMAL,
  price_exclusive DECIMAL,
  lyrics TEXT,
  lyrics_pdf_url TEXT,
  artwork_url TEXT,
  listening_file_url TEXT,      -- Original MP3
  preview_clip_url TEXT,        -- 30s watermarked
  preview_clip_start INTEGER,   -- Timestamp in seconds
  full_preview_url TEXT,        -- Full watermarked
  acapella_url TEXT,            -- WAV, private
  instrumental_url TEXT,        -- WAV/ZIP, private
  waveform_data JSONB,
  is_ai_generated BOOLEAN,
  status ENUM ('pending', 'approved', 'rejected', 'sold_out', 'removed'),
  created_at TIMESTAMP,
  approved_at TIMESTAMP
)

-- Orders
orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles,
  stripe_payment_intent TEXT,
  subtotal DECIMAL,
  discount_percent INTEGER,  -- 0, 10, or 20
  discount_amount DECIMAL,
  total DECIMAL,
  status ENUM ('pending', 'completed', 'failed'),
  created_at TIMESTAMP
)

-- Order items
order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders,
  track_id UUID REFERENCES tracks,
  license_type ENUM ('non_exclusive', 'exclusive'),
  price_at_purchase DECIMAL,
  creator_earnings DECIMAL,  -- After split calculation
  license_pdf_url TEXT,
  created_at TIMESTAMP
)

-- Creator payouts
payouts (
  id UUID PRIMARY KEY,
  creator_id UUID REFERENCES creators,
  amount DECIMAL,
  status ENUM ('pending', 'processing', 'completed'),
  invoice_url TEXT,
  created_at TIMESTAMP,
  paid_at TIMESTAMP
)
```

## Key Business Logic

### Bundle Discounts
```typescript
function calculateDiscount(itemCount: number): number {
  if (itemCount >= 3) return 0.20;  // 20% off
  if (itemCount >= 2) return 0.10;  // 10% off
  return 0;
}

// Revenue split AFTER discount
function calculateCreatorEarnings(
  itemPrice: number, 
  discountPercent: number, 
  creatorSplit: number = 0.70
): number {
  const discountedPrice = itemPrice * (1 - discountPercent);
  return discountedPrice * creatorSplit;
}
```

### Track Status Transitions
```
pending → approved (admin approves)
pending → rejected (admin rejects)
approved → sold_out (licenses_sold >= license_limit)
approved → removed (exclusive purchased OR admin removes)
sold_out → approved (admin increases limit)
```

### Exclusive Purchase Flow
1. User purchases exclusive license
2. Mark track status = 'removed'
3. Track hidden from shop, visible on creator profile with "Sold" badge
4. All files delivered to buyer
5. Creator notified

## Audio Processing (FastAPI)

### Watermarking
```python
# Full preview: watermark every 15-20 seconds
# 30-second clip: watermark at 10s and 24s
# Voice tag: "Featune" audio file

def watermark_audio(audio_path: str, positions: list[int]) -> str:
    # Use pydub to overlay voice tag at specified positions
    pass
```

### Waveform Generation
```python
def generate_waveform(audio_path: str) -> list[float]:
    # Use librosa to extract amplitude data
    # Return as JSON-serializable list for frontend rendering
    pass
```

### Upload Processing Pipeline
1. Receive files: listening_file.mp3, acapella.wav, instrumental.wav/.zip, lyrics.txt/.pdf
2. Generate full watermarked preview from listening file
3. Extract 30-second clip at specified timestamp, watermark at 10s + 24s
4. Generate waveform JSON from listening file
5. Store private files (acapella, instrumental, lyrics PDF) in private bucket
6. Store public files (previews, artwork) in public CDN bucket
7. Return URLs for database storage

## File Upload Requirements

| File | Format | Purpose |
|------|--------|---------|
| Listening File | MP3 | Source for watermarked previews |
| Acapella | WAV | Delivered on purchase |
| Instrumental | WAV or ZIP | Delivered on purchase (stems if ZIP) |
| Lyrics | Text input OR PDF | Displayed + delivered |
| Artwork | JPG/PNG | Product display |

## API Endpoints (Next.js)

```
Auth
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/reset-password

Tracks
GET    /api/tracks                    # List with filters
GET    /api/tracks/[id]               # Single track
POST   /api/tracks                    # Create (creator/admin)
PATCH  /api/tracks/[id]               # Update (creator/admin)
DELETE /api/tracks/[id]               # Remove (admin only)

Cart & Checkout
GET    /api/cart                      # Get cart (session-based or user)
POST   /api/cart/add                  # Add item
DELETE /api/cart/[itemId]             # Remove item
POST   /api/checkout                  # Create Stripe session
POST   /api/webhooks/stripe           # Handle payment success

Creators
GET    /api/creators/[id]             # Public profile
POST   /api/creators/apply            # Become a creator
GET    /api/creators/me/tracks        # My uploads
GET    /api/creators/me/sales         # My sales
GET    /api/creators/me/earnings      # Balance + history
POST   /api/creators/me/payout        # Request payout

Admin
GET    /api/admin/submissions         # Pending tracks
PATCH  /api/admin/tracks/[id]/approve
PATCH  /api/admin/tracks/[id]/reject
GET    /api/admin/creators            # All creators
PATCH  /api/admin/creators/[id]       # Edit split, status
GET    /api/admin/analytics           # Dashboard data
GET    /api/admin/payouts             # Pending payouts
PATCH  /api/admin/payouts/[id]/complete
```

## API Endpoints (FastAPI)

```
POST   /process/upload                # Full upload processing pipeline
POST   /process/watermark             # Watermark audio file
POST   /process/waveform              # Generate waveform JSON
POST   /chat/query                    # AI search assistant
```

## Frontend Routes

```
/                           # Homepage
/search                     # Search with filters
/track/[id]                 # Product page
/cart                       # Cart page
/checkout                   # Checkout flow
/checkout/success           # Post-purchase
/account                    # Customer dashboard
/account/purchases          # Order history
/creator/[id]               # Public creator profile
/dashboard                  # Creator dashboard
/dashboard/upload           # Upload new track
/dashboard/tracks           # My tracks
/dashboard/sales            # Sales history
/dashboard/earnings         # Earnings + payouts
/admin                      # Admin dashboard
/admin/submissions          # Pending approvals
/admin/tracks               # All tracks
/admin/creators             # All creators
/admin/payouts              # Payout management
/admin/analytics            # Analytics
```

## Design Tokens

```css
:root {
  /* Backgrounds */
  --bg-primary: #000000;
  --bg-secondary: #111111;
  --bg-card: #1A1A1A;
  --bg-elevated: #222222;
  
  /* Accent */
  --accent: #FF6B00;
  --accent-hover: #FF8533;
  --accent-muted: #FF6B0033;
  
  /* Text */
  --text-primary: #FFFFFF;
  --text-secondary: #A0A0A0;
  --text-muted: #666666;
  
  /* Borders */
  --border: #2A2A2A;
  --border-hover: #3A3A3A;
  
  /* Status */
  --success: #22C55E;
  --error: #EF4444;
  --warning: #F59E0B;
}
```

## Component Patterns

### Product Card
```tsx
<ProductCard
  track={track}
  onPlay={() => setNowPlaying(track)}
  onAddToCart={() => addToCart(track.id, 'non_exclusive')}
  showCreator={true}
/>
```

### Persistent Audio Player
- Lives in layout, outside page routing
- State managed via context/zustand
- Shows: artwork, title, creator, waveform, play/pause, volume
- Continues playback during navigation

### Cart Modal
- Slides out on add-to-cart
- Shows current discount tier
- Upsell prompt: "Add X more for Y% off!"
- Links to full cart page

### AI Chat Modal
- Floating button bottom-right
- Opens modal on right side
- Query-based (not conversational)
- Returns clickable track cards

## Email Templates (Resend)

| Template | Trigger | Key Data |
|----------|---------|----------|
| welcome | Account created | Set password link |
| purchase-confirmation | Order complete | Items, total, download links, license PDFs |
| creator-sale | Track sold | Track name, earnings, buyer type |
| track-approved | Admin approves | Track name, link to product |
| track-rejected | Admin rejects | Track name, reason |
| payout-complete | Payout processed | Amount, method |
| new-submission | Track uploaded | Admin link to review |
| creator-application | User applies | Admin link to review |

## License PDF Generation

Dynamic PDF containing:
- FEATUNE branding
- License type
- Buyer name + email
- Purchase date
- Track title + creator
- Unique license ID (UUID)
- Terms summary with link to full T&Cs

Use: `@react-pdf/renderer` or `pdf-lib`

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Resend
RESEND_API_KEY=

# FastAPI Service
FASTAPI_URL=

# Storage (if using R2)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
```

## Testing Checklist

### Critical Paths
- [ ] Guest checkout → account creation → download access
- [ ] Bundle discount calculation (2 items = 10%, 3+ = 20%)
- [ ] Exclusive purchase → track removal from shop
- [ ] Limited license counter → sold out status
- [ ] Creator payout calculation after discount
- [ ] Audio watermarking at correct timestamps
- [ ] Persistent player during navigation

### Edge Cases
- [ ] Same track added twice (should not duplicate)
- [ ] Exclusive added when already in cart as non-exclusive
- [ ] Purchase attempt on sold-out limited track
- [ ] Creator edits track while in someone's cart
- [ ] Concurrent exclusive purchases (only one should succeed)

## Deployment Notes

### Vercel (Next.js)
- Enable ISR for product pages
- Set up Stripe webhook endpoint
- Configure Supabase environment variables

### Railway/Render (FastAPI)
- Ensure ffmpeg installed for audio processing
- Set memory limits appropriate for audio processing
- Configure CORS for Next.js domain

### Supabase
- Enable Row Level Security on all tables
- Set up storage buckets (public + private)
- Configure auth email templates

---

*Reference the full PRD (featune-prd.md) for detailed specifications.*
