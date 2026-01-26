# FEATUNE - Product Requirements Document

## Executive Summary

FEATUNE (pronounced "fee-tune") is a marketplace for AI-generated and human vocal toplines, targeting music producers across all experience levels. The platform enables creators to upload, watermark, and sell vocal tracks while providing buyers with an intuitive discovery experience powered by AI-assisted search.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js (React) | UI, lightweight API routes, auth flows |
| Frontend Hosting | Vercel | Deployment, CDN |
| Backend Service | FastAPI (Python) | Audio processing, watermarking, waveform generation, AI chat |
| Backend Hosting | Railway / Render | Python microservice deployment |
| Database | Supabase (PostgreSQL) | Data storage, Row Level Security |
| Authentication | Supabase Auth | User accounts, sessions |
| File Storage | Supabase Storage / Cloudflare R2 | Audio files, artwork, stems |
| Payments | Stripe | One-time purchases, checkout |
| Email | Resend | Transactional emails |
| AI Chat | LLM integration (OpenAI/Anthropic) | Conversational product discovery |

---

## User Types

### Customer
- Browse and purchase vocal tracks
- Manage account and download history
- Use subscription credits
- Access AI-powered search assistant

### Creator
- Verified sellers who upload and sell vocal tracks
- Manage uploads, view sales, request payouts
- Set pricing within platform guidelines
- Linked to customer account ("Manage your creator profile")

### Admin
- Approve/reject creator applications and track submissions
- Edit all content (tracks, metadata, pricing, creator splits)
- Access analytics dashboard
- Process manual payouts
- Remove tracks from marketplace

---

## Pricing Model

### Track Licensing Tiers

| Tier | Description | Guideline Price | Behaviour |
|------|-------------|-----------------|-----------|
| Non-Exclusive Unlimited | Unlimited purchases available | £20 | Remains on sale indefinitely |
| Non-Exclusive Limited | Capped number of licenses (set by creator) | £40 | Shows "Sold Out" when limit reached, remains visible |
| Exclusive | One-time purchase, full ownership | £250 | Removed from shop upon purchase |

Human vocals follow the same structure at higher price points (set by creator).

Creators set their own prices. Platform provides guidelines, not restrictions.

### Deliverables on Purchase

All license types receive the same files:
- Acapella (WAV)
- Instrumental (WAV or ZIP of stems)
- Lyrics (PDF if uploaded, otherwise text)
- License PDF (dynamically generated)

### Bundle Builder Discounts

| Quantity | Discount |
|----------|----------|
| 2 toplines | 10% off total |
| 3+ toplines | 20% off total |

**Revenue calculation:**
1. Calculate cart total at full price
2. Apply bundle discount (deducted from top)
3. Split remaining revenue per track using creator split (default 70/30)

**Example:**
- 3 tracks at £20 each = £60
- 20% bundle discount = -£12
- Net revenue: £48
- Per track: £16
- Creator receives: £11.20 per track (70%)
- FEATUNE receives: £4.80 per track (30%)

---

## Revenue Model

| Party | Split |
|-------|-------|
| Creator | 70% |
| FEATUNE | 30% |

Admin can adjust individual creator splits as needed.

---

## Product Data Model

### Track Entity

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | Primary key |
| title | String | Yes | Track name |
| creator_id | UUID | Yes | FK to creator profile |
| vocalist_type | Enum | Yes | Male / Female |
| genre | String | Yes | House, EDM, Afro, Pop, Drum and Bass, etc. |
| mood | String | Yes | Energetic, Melancholic, Dark, Uplifting, etc. |
| bpm | Integer | Yes | Beats per minute |
| key | String | Yes | Musical key (e.g., C Minor, F# Major) |
| length | Integer | Yes | Duration in seconds |
| license_type | Enum | Yes | Unlimited / Limited / Exclusive |
| license_limit | Integer | No | Only for Limited type |
| licenses_sold | Integer | Yes | Counter, default 0 |
| price_non_exclusive | Decimal | Yes | Price for non-exclusive license |
| price_exclusive | Decimal | Yes | Price for exclusive purchase |
| lyrics | Text | Yes | Full lyrics (typed or extracted from PDF) |
| lyrics_pdf_url | String | No | Original PDF if uploaded |
| artwork_url | String | Yes | Cover artwork |
| listening_file_url | String | Yes | Original MP3 upload (source for preview generation) |
| preview_clip_url | String | Yes | 30-second watermarked preview (generated) |
| preview_clip_start | Integer | Yes | Start timestamp for 30s clip (set by uploader) |
| full_preview_url | String | Yes | Full-length watermarked audio (generated) |
| acapella_url | String | Yes | Clean vocal WAV (delivered on purchase) |
| instrumental_url | String | Yes | Instrumental WAV or ZIP of stems (delivered on purchase) |
| waveform_data | JSON | Yes | Pre-generated waveform for UI rendering |
| status | Enum | Yes | Pending / Approved / Rejected / Sold Out / Removed |
| is_ai_generated | Boolean | Yes | AI vocal vs human vocal flag |
| created_at | Timestamp | Yes | Upload date |
| approved_at | Timestamp | No | Approval date |

---

## Audio Processing Pipeline

Handled by FastAPI microservice on track upload:

### 1. Input Files
- **Listening File (MP3)** → Source for all preview generation
- **Acapella (WAV)** → Stored securely, delivered on purchase
- **Instrumental (WAV/ZIP)** → Stored securely, delivered on purchase
- **Lyrics (Text/PDF)** → If PDF, text extracted and stored; original PDF retained

### 2. Watermarking
- **Voice tag:** "Featune" audio clip
- **Full preview:** Generated from Listening File, watermark at regular intervals (every 15-20 seconds)
- **30-second preview:** Generated from Listening File, watermark at 10s and 24s positions
- **Preview clip:** Extracted from timestamp specified by uploader

### 3. Waveform Generation
- Process Listening File with librosa
- Extract amplitude data
- Store as JSON for frontend rendering

### 4. File Storage
- Acapella (WAV) → private storage (delivered on purchase)
- Instrumental (WAV/ZIP) → private storage (delivered on purchase)
- Lyrics PDF (if uploaded) → private storage (delivered on purchase)
- Watermarked previews → public CDN
- Artwork → public CDN

---

## User Flows

### Guest Checkout → Account Creation

```
Guest browses catalogue
    ↓
Adds track(s) to cart
    ↓
Proceeds to checkout
    ↓
Enters: Email, Name, Billing Address
    ↓
Opts into Terms & Conditions ✓
Opts into Privacy Policy ✓
    ↓
Completes Stripe payment
    ↓
Account auto-created
    ↓
Receives emails:
  - Welcome + Set Password link
  - Purchase confirmation + License PDF attachment
    ↓
Track files available in account dashboard
```

### Become a Creator

```
User has existing account
    ↓
Clicks "Become a Creator"
    ↓
Fills creator profile:
  - Display name
  - Bio
  - Profile picture
  - Payment details (bank/PayPal)
    ↓
Uploads 1 sample track (undergoes full processing)
    ↓
Submits for review
    ↓
Admin receives email notification
    ↓
Admin reviews in dashboard:
  - Approve → Creator notified, can upload tracks
  - Reject → Creator notified with reason
```

### Track Upload (Creator)

```
Creator accesses dashboard
    ↓
Clicks "Upload New Track"
    ↓
Provides:

  **Required Files:**
  1. **Listening File** (MP3) - Used for watermarked preview generation
  2. **Acapella** (WAV) - Clean vocal track, delivered on purchase
  3. **Instrumental** (WAV or ZIP) - Backing track or stems bundle, delivered on purchase
  4. **Lyrics** - Either typed directly or uploaded as PDF
  
  **Required Metadata:**
  - 30-second preview start timestamp
  - Artwork (JPG/PNG)
  - Title
  - Genre
  - Mood
  - BPM
  - Key
  - Vocalist type (Male/Female)
  
  **Pricing & Licensing:**
  - License type + limit (if applicable)
  - Non-exclusive price
  - Exclusive price
    ↓
System processes:
  - Generates watermarked full preview
  - Generates 30-second watermarked clip
  - Extracts waveform data
  - Stores all files
    ↓
Track enters "Pending" status
    ↓
Admin reviews and approves/rejects
    ↓
If approved → Track live on marketplace
```

### Purchase Flow

```
User adds track(s) to cart
    ↓
Cart modal slides out showing:
  - Items in cart
  - Current discount tier (if applicable)
  - Upsell prompt: "Add 1 more for 10% off!" or "Add 1 more for 20% off!"
  - Running total with discount applied
    ↓
Views full cart page (can adjust quantities, remove items)
    ↓
Checkout:
  - If logged in → pre-fill details
  - If guest → enter details + auto-create account
    ↓
T&Cs and Privacy Policy opt-in required
    ↓
Stripe checkout
    ↓
On success:
  - Order recorded
  - License PDF generated (dynamic with buyer details)
  - Files available for download
  - Creator notified of sale
  - If Exclusive → track removed from shop
  - If Limited → increment counter, check if sold out
```

---

## Page Specifications

### Homepage

Vertical stack layout (top to bottom):

| Section | Content | Actions |
|---------|---------|---------|
| 1. Hero Banner | FEATUNE branding, tagline, **Bundle offer highlight: "Buy 2, get 10% off · Buy 3+, get 20% off"** | Sign up / Browse |
| 2. Recommended For You | 4 cards based on user's purchase history (genre patterns) | "See All" → personalised search results |
| 3. New Vocals | 4 most recently approved tracks | "See More" → search sorted by newest |
| 4. Genre: House | 4 most popular House tracks this week | "See More" → search filtered by House |
| 5. Genre: EDM | 4 most popular EDM tracks this week | "See More" → search filtered by EDM |
| 6. Genre: Afro | 4 most popular Afro tracks this week | "See More" → search filtered by Afro |
| 7. Genre: Pop | 4 most popular Pop tracks this week | "See More" → search filtered by Pop |
| 8. Genre: Drum and Bass | 4 most popular DnB tracks this week | "See More" → search filtered by DnB |

**Product Card Component:**
- Artwork thumbnail
- Title
- Creator name
- Price
- Play/pause button (30-second preview)
- Quick-add to cart

**"See More" buttons:** Positioned right-aligned, level with section titles, with visual icon.

### Search Page

**Filters (sidebar or top bar):**
- Genre (multi-select)
- Mood (multi-select)
- BPM (range slider)
- Key (dropdown)
- Vocalist (Male / Female / Any)
- Price range
- License type (Unlimited / Limited / Exclusive)
- AI / Human vocal

**Results:**
- Infinite scroll
- Grid of product cards
- Sort options: Newest, Popular, Price (low-high, high-low)

### Product Page

**Layout:**

| Section | Content |
|---------|---------|
| Header | Artwork (large), Title, Creator name + link to profile |
| Audio Player | Waveform visualisation, play/pause, timeline |
| Metadata | Genre, Mood, BPM, Key, Length, Vocalist type, AI/Human badge |
| Pricing | Non-exclusive price, Exclusive price (if available), License limit status |
| Actions | Add to Cart (dropdown: Non-exclusive / Exclusive) |
| Lyrics | Expandable/collapsible lyrics section |
| Creator Bio | Profile picture, bio text, link to creator profile |
| Related Tracks | 4 similar tracks by genre/mood |

### Creator Profile Page

- Profile picture
- Display name
- Bio
- Total tracks
- Grid of their tracks (filterable by status for the creator themselves)

### Account Dashboard (Customer)

| Tab | Content |
|-----|---------|
| Purchases | Order history with track details, download links, license PDFs |
| Settings | Email, password, notification preferences |

### Creator Dashboard

| Tab | Content |
|-----|---------|
| My Tracks | All uploads with status (Pending/Approved/Rejected/Sold Out), edit, view stats |
| Upload | New track upload form |
| Sales | Sales history, filterable by date/track |
| Earnings | Current balance, payout history |
| Payouts | Request payout, submit invoice, payment details |
| Profile | Edit creator profile (bio, picture) |

### Admin Dashboard

| Tab | Content |
|-----|---------|
| Submissions | Pending tracks queue - approve/reject/request changes |
| Creator Applications | Pending creator reviews |
| Tracks | All tracks, search/filter, edit any field, remove from shop |
| Creators | All creators, edit splits, view performance |
| Orders | All orders, search by customer/track |
| Payouts | Pending payout requests, mark as paid |
| Analytics | Sales trends, popular genres, top creators, revenue breakdown |

---

## AI Chat Assistant

**Trigger:** Floating button (bottom-right) → opens modal on right side of screen

**Behaviour:**
- Query-based search (not conversational follow-ups)
- User types natural language: "House vocal with lyrics about echoes"
- Bot parses intent, searches catalogue by relevant tags
- Returns clickable track cards linking to product pages
- Chat history preserved within session

**Technical approach:**
- LLM receives user query + available filter schema
- LLM extracts structured filters (genre, mood, keywords)
- System queries database with filters
- Results formatted and returned with product links

---

## Persistent Audio Player

**Behaviour:**
- Footer bar, visible site-wide
- Continues playback during navigation
- Shows: artwork thumbnail, track title, creator, waveform/progress, play/pause, volume
- Click track title → navigate to product page

---

## Transactional Emails (via Resend)

| Trigger | Recipient | Content |
|---------|-----------|---------|
| Purchase complete | Customer | Order summary, download links, license PDF attached |
| Welcome | New customer | Account created, set password link |
| Creator sale | Creator | Track sold notification, earnings update |
| Track approved | Creator | Track now live |
| Track rejected | Creator | Rejection reason, resubmit instructions |
| Payout processed | Creator | Payout confirmation, amount, method |
| New submission | Admin | Track pending review notification |
| Creator application | Admin | New creator pending review |

---

## License PDF Generation

Dynamically generated on purchase containing:

- FEATUNE branding
- License type (Non-Exclusive / Exclusive)
- Buyer name
- Buyer email
- Purchase date
- Track title
- Creator name
- Unique license ID
- Terms of use (linked to full T&Cs)
- Restrictions based on license type

---

## Legal Requirements

### Checkout
- Checkbox: "I agree to the Terms & Conditions" (required, linked)
- Checkbox: "I agree to the Privacy Policy" (required, linked)

### Creator Upload
- Agreement that content is original / properly licensed
- Agreement to platform terms for sellers

---

## Design System

### Colour Scheme

| Element | Colour | Hex |
|---------|--------|-----|
| Background (primary) | Black | #000000 |
| Background (secondary/cards) | Dark grey | #111111 / #1A1A1A |
| Accent (primary) | Bold Orange | #FF6B00 |
| Accent (hover) | Lighter Orange | #FF8533 |
| Text (primary) | White | #FFFFFF |
| Text (secondary) | Light grey | #A0A0A0 |
| Success | Green | #22C55E |
| Error | Red | #EF4444 |
| Warning | Amber | #F59E0B |

### Design Principles

- **Dark mode only** - no light mode variant for V1
- Orange accent used for: CTAs, buttons, links, hover states, progress bars, waveform highlights
- High contrast maintained for accessibility (WCAG AA minimum)
- Subtle borders/dividers in dark grey (#2A2A2A) to separate sections
- Artwork and creator images provide colour variety against dark background

---

## Responsive Design

**Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

**Mobile considerations:**
- Hamburger navigation
- Stacked product cards (1-2 per row)
- Bottom sheet for filters on search
- Collapsible AI chat
- Sticky audio player (slimmer variant)

---

## Future Considerations (Out of Scope for V1)

- Stripe Connect for automated creator payouts
- Native mobile apps
- Stems preview (individual stem playback)
- Collaboration features (split royalties between multiple creators)
- Sample pack bundles
- Affiliate programme
- Public API for third-party integrations

---

## Success Metrics

| Metric | Target (6 months post-launch) |
|--------|-------------------------------|
| Registered users | 5,000 |
| Active creators | 100 |
| Tracks in catalogue | 2,000 |
| Monthly transactions | 500 |
| Average cart size | 2.5 tracks |
| Creator approval rate | 60% |

---

## Appendix A: Genre Taxonomy

Initial supported genres:
- House
- EDM
- Afro
- Pop
- Drum and Bass
- Techno
- Trance
- Hip Hop
- R&B
- Dancehall
- Reggaeton
- Indie
- Rock
- Other

Expandable by admin as needed.

## Appendix B: Mood Taxonomy

Initial supported moods:
- Energetic
- Melancholic
- Dark
- Uplifting
- Romantic
- Aggressive
- Chill
- Euphoric
- Mysterious
- Nostalgic
- Empowering
- Sensual

Expandable by admin as needed.

---

*Document version: 1.0*
*Last updated: January 2025*
*Author: James French / Claude*
