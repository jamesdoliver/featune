import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HomepageSection from './HomepageSection'
import LeadForm from '@/components/LeadForm'
import RecommendedSection from './RecommendedSection'
import { getRecommendations } from '@/lib/data/recommendations'

interface HomepageSectionData {
  id: string
  section_type: 'featured' | 'genre'
  genre: string | null
  title: string
  display_order: number
}

interface PinnedTrackRow {
  position: number
  tracks: TrackRow
}

interface TrackRow {
  id: string
  title: string
  artwork_url: string | null
  genre: string | null
  mood: string | null
  bpm: number | null
  key: string | null
  price_non_exclusive: number | null
  price_exclusive: number | null
  license_type: string
  is_ai_generated: boolean
  vocalist_type: string | null
  preview_clip_url: string | null
  full_preview_url: string | null
  created_at: string
  creators: { id: string; display_name: string } | { id: string; display_name: string }[]
}

interface TrackData {
  id: string
  title: string
  artwork_url: string | null
  genre: string | null
  mood: string | null
  bpm: number | null
  key: string | null
  price_non_exclusive: number | null
  price_exclusive: number | null
  license_type: string
  is_ai_generated: boolean
  vocalist_type: string | null
  preview_clip_url: string | null
  full_preview_url: string | null
  creators: { id: string; display_name: string }
}

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

// Normalize Supabase join: creators comes back as an array type even with !inner
function normalizeCreator(track: TrackRow): TrackData {
  const creatorsData = track.creators as
    | { id: string; display_name: string }
    | { id: string; display_name: string }[]
  const creatorObj = Array.isArray(creatorsData) ? creatorsData[0] : creatorsData
  return { ...track, creators: creatorObj }
}

// Merge pinned tracks with auto-fill tracks to produce final 4-track array
function mergeTracksForSection(
  pinnedTracks: { track: TrackData; position: number }[],
  autoFillTracks: TrackData[]
): TrackData[] {
  const result: (TrackData | null)[] = [null, null, null, null]

  // Place pinned tracks in their positions (1-indexed to 0-indexed)
  for (const { track, position } of pinnedTracks) {
    if (position >= 1 && position <= 4) {
      result[position - 1] = track
    }
  }

  // Fill remaining slots with auto-fill tracks
  let autoFillIndex = 0
  for (let i = 0; i < 4; i++) {
    if (result[i] === null && autoFillIndex < autoFillTracks.length) {
      result[i] = autoFillTracks[autoFillIndex]
      autoFillIndex++
    }
  }

  // Filter out any remaining nulls and return
  return result.filter((t): t is TrackData => t !== null)
}

// ISR: Revalidate homepage every 5 minutes
export const revalidate = 300

export default async function Home() {
  const supabase = await createClient()

  // Get user session for recommendations (fast, cached check)
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Fetch sections and recommendations in parallel
  const [sectionsResult, recommendationsResult] = await Promise.all([
    supabase
      .from('homepage_sections')
      .select('id, section_type, genre, title, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true }),
    getRecommendations(supabase, user?.id ?? null),
  ])

  const activeSections: HomepageSectionData[] = sectionsResult.data ?? []
  const sectionIds = activeSections.map((s) => s.id)

  // 2. Batch fetch ALL pinned tracks for ALL sections in a single query
  const { data: allPinnedRows } = sectionIds.length > 0
    ? await supabase
        .from('homepage_section_tracks')
        .select(
          `
          section_id,
          position,
          tracks!inner(
            id, title, artwork_url, genre, mood, bpm, key,
            price_non_exclusive, price_exclusive, license_type,
            is_ai_generated, vocalist_type, preview_clip_url, full_preview_url, created_at,
            creators!inner(id, display_name)
          )
        `
        )
        .in('section_id', sectionIds)
        .order('position', { ascending: true })
    : { data: null }

  // Group pinned tracks by section_id
  const pinnedBySection = new Map<string, { track: TrackData; position: number }[]>()
  for (const row of (allPinnedRows as (PinnedTrackRow & { section_id: string })[] | null) ?? []) {
    const sectionId = row.section_id
    if (!pinnedBySection.has(sectionId)) {
      pinnedBySection.set(sectionId, [])
    }
    pinnedBySection.get(sectionId)!.push({
      track: normalizeCreator(row.tracks),
      position: row.position,
    })
  }

  // 3. Build auto-fill queries for each section and run in parallel
  const autoFillPromises = activeSections.map(async (section) => {
    const pinnedTracks = pinnedBySection.get(section.id) ?? []
    const pinnedIds = pinnedTracks.map((p) => p.track.id)
    const autoFillCount = 4 - pinnedTracks.length

    if (autoFillCount <= 0) {
      return { sectionId: section.id, tracks: [] as TrackData[] }
    }

    let query = supabase
      .from('tracks')
      .select(
        `
        id, title, artwork_url, genre, mood, bpm, key,
        price_non_exclusive, price_exclusive, license_type,
        is_ai_generated, vocalist_type, preview_clip_url, full_preview_url, created_at,
        creators!inner(id, display_name)
      `
      )
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(autoFillCount)

    // Filter by genre for genre sections
    if (section.section_type === 'genre' && section.genre) {
      query = query.eq('genre', section.genre)
    }

    // Exclude already pinned tracks
    if (pinnedIds.length > 0) {
      query = query.not('id', 'in', `(${pinnedIds.join(',')})`)
    }

    const { data: autoFillRows } = await query
    const tracks = ((autoFillRows as TrackRow[] | null) ?? []).map(normalizeCreator)
    return { sectionId: section.id, tracks }
  })

  const autoFillResults = await Promise.all(autoFillPromises)

  // 4. Merge pinned + auto-fill tracks for each section
  const sectionTracksMap: Map<string, TrackData[]> = new Map()
  for (const { sectionId, tracks: autoFillTracks } of autoFillResults) {
    const pinnedTracks = pinnedBySection.get(sectionId) ?? []
    const mergedTracks = mergeTracksForSection(pinnedTracks, autoFillTracks)
    sectionTracksMap.set(sectionId, mergedTracks)
  }

  // 3. Build "Browse by Genre" links from active genre sections
  const genreSections = activeSections.filter(
    (s) => s.section_type === 'genre' && s.genre
  )

  return (
    <>
      {/* ===== Hero Section ===== */}
      <section
        className="relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden px-4 py-12 text-center sm:min-h-[70vh] sm:px-6"
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
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
            Discover Premium{' '}
            <span className="text-accent">Vocal Toplines</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-text-secondary sm:mt-6 sm:text-lg md:text-xl">
            AI and human vocals for your next hit. Browse, preview, and license
            instantly.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:justify-center sm:gap-4">
            <Link
              href="/search"
              className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-accent px-8 text-base font-semibold text-white transition-colors hover:bg-accent-hover sm:w-auto"
            >
              Browse Tracks
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-border-default px-8 text-base font-semibold text-text-primary transition-colors hover:border-accent hover:text-accent sm:w-auto"
            >
              Start Selling
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Recommended For You (logged-in users with purchase history) ===== */}
      <RecommendedSection
        tracks={recommendationsResult.tracks}
        hasHistory={recommendationsResult.hasHistory}
      />

      {/* ===== Homepage Sections (Featured + Genre Rows) ===== */}
      {activeSections.map((section) => {
        const tracks = sectionTracksMap.get(section.id) ?? []
        return (
          <HomepageSection
            key={section.id}
            title={section.title}
            sectionType={section.section_type}
            genre={section.genre}
            tracks={tracks}
          />
        )
      })}

      {/* ===== Genre Quick Links Section ===== */}
      {genreSections.length > 0 && (
        <section className="py-12 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="mb-6 text-xl font-bold text-text-primary sm:mb-10 sm:text-2xl">
              Browse by Genre
            </h2>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-5">
              {genreSections.map((section) => (
                <Link
                  key={section.id}
                  href={`/search?genre=${encodeURIComponent(section.genre!)}`}
                  className="group flex h-20 items-center justify-center rounded-xl border border-border-default bg-bg-card text-center transition-all duration-200 hover:border-accent hover:shadow-[0_0_20px_rgba(255,107,0,0.1)] sm:h-28"
                >
                  <span className="text-base font-semibold text-text-primary transition-colors group-hover:text-accent sm:text-lg">
                    {section.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== Newsletter Section ===== */}
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="mb-2 text-xl font-bold text-text-primary sm:mb-3 sm:text-2xl">
            Stay Updated
          </h2>
          <p className="mb-6 text-sm text-text-secondary sm:mb-8 sm:text-base">
            Be the first to hear about new releases, featured creators, and exclusive deals.
          </p>
          <LeadForm source="homepage" showName />
        </div>
      </section>

      {/* ===== How It Works Section ===== */}
      <section className="border-t border-border-default py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="mb-8 text-center text-xl font-bold text-text-primary sm:mb-14 sm:text-2xl">
            How It Works
          </h2>

          <div className="grid gap-8 sm:gap-10 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.number} className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-elevated text-accent sm:mb-5 sm:h-16 sm:w-16">
                  {step.icon}
                </div>
                <span className="mb-1 text-xs font-bold uppercase tracking-widest text-text-muted">
                  Step {step.number}
                </span>
                <h3 className="mb-2 text-lg font-bold text-text-primary sm:text-xl">
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
