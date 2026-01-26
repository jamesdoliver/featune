import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HomeTrackGrid from './HomeTrackGrid'

const GENRES = [
  { name: 'Pop', slug: 'pop' },
  { name: 'R&B', slug: 'r&b' },
  { name: 'Hip-Hop', slug: 'hip-hop' },
  { name: 'EDM', slug: 'edm' },
  { name: 'Afrobeats', slug: 'afrobeats' },
]

const STEPS = [
  {
    number: '01',
    title: 'Browse',
    description:
      'Explore our curated library of premium vocal toplines. Filter by genre, mood, BPM, and more.',
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Preview',
    description:
      'Listen to full-length watermarked previews. Every track comes with genre, mood, BPM, and key info.',
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'License',
    description:
      'Purchase non-exclusive or exclusive licenses instantly. Download stems, acapella, and lyrics.',
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
  },
]

export default async function Home() {
  const supabase = await createClient()

  const { data: rawTracks } = await supabase
    .from('tracks')
    .select(
      `
      id, title, artwork_url, genre, mood, bpm, key,
      price_non_exclusive, price_exclusive, license_type,
      is_ai_generated, vocalist_type, preview_clip_url, full_preview_url,
      creators!inner(id, display_name)
    `
    )
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(8)

  // Normalize Supabase join: creators comes back as an array type even with
  // !inner. Map it to the single-object shape that ProductCard expects.
  const tracks = (rawTracks ?? []).map((track) => {
    const creatorsData = track.creators as unknown as
      | { id: string; display_name: string }
      | { id: string; display_name: string }[]
    const creatorObj = Array.isArray(creatorsData)
      ? creatorsData[0]
      : creatorsData
    return { ...track, creators: creatorObj }
  })

  return (
    <>
      {/* ===== Hero Section ===== */}
      <section
        className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-6 text-center"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(255,107,0,0.08) 0%, transparent 60%)',
        }}
      >
        {/* Decorative grid lines for depth */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Discover Premium{' '}
            <span className="text-accent">Vocal Toplines</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-text-secondary sm:text-xl">
            AI and human vocals for your next hit. Browse, preview, and license
            instantly.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/search"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-accent px-8 text-base font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              Browse Tracks
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-border-default px-8 text-base font-semibold text-text-primary transition-colors hover:border-accent hover:text-accent"
            >
              Start Selling
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Featured Tracks Section ===== */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-text-primary">
              Fresh Releases
            </h2>
            <Link
              href="/search"
              className="text-sm font-medium text-text-secondary transition-colors hover:text-accent"
            >
              View All
            </Link>
          </div>

          <HomeTrackGrid tracks={tracks} />
        </div>
      </section>

      {/* ===== Genre Quick Links Section ===== */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-10 text-2xl font-bold text-text-primary">
            Browse by Genre
          </h2>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {GENRES.map((genre) => (
              <Link
                key={genre.slug}
                href={`/search?genre=${encodeURIComponent(genre.slug)}`}
                className="group flex h-28 items-center justify-center rounded-xl border border-border-default bg-bg-card text-center transition-all duration-200 hover:border-accent hover:shadow-[0_0_20px_rgba(255,107,0,0.1)]"
              >
                <span className="text-lg font-semibold text-text-primary transition-colors group-hover:text-accent">
                  {genre.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== How It Works Section ===== */}
      <section className="border-t border-border-default py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-14 text-center text-2xl font-bold text-text-primary">
            How It Works
          </h2>

          <div className="grid gap-10 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.number} className="flex flex-col items-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-bg-elevated text-accent">
                  {step.icon}
                </div>
                <span className="mb-1 text-xs font-bold uppercase tracking-widest text-text-muted">
                  Step {step.number}
                </span>
                <h3 className="mb-2 text-xl font-bold text-text-primary">
                  {step.title}
                </h3>
                <p className="max-w-xs text-sm leading-relaxed text-text-secondary">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
