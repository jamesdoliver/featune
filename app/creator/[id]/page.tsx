import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CreatorTrackGrid from './CreatorTrackGrid'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: creator } = await supabase
    .from('creators')
    .select('display_name')
    .eq('id', id)
    .eq('status', 'approved')
    .single()

  if (!creator) {
    return { title: 'Creator Not Found - FEATUNE' }
  }

  return {
    title: `${creator.display_name} - FEATUNE Creator`,
    description: `Browse vocal toplines by ${creator.display_name} on FEATUNE.`,
  }
}

function formatMemberSince(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase()
}

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch creator profile
  const { data: creator } = await supabase
    .from('creators')
    .select('id, display_name, bio, profile_image_url, created_at')
    .eq('id', id)
    .eq('status', 'approved')
    .single()

  if (!creator) notFound()

  // Fetch creator's approved tracks
  const { data: tracks } = await supabase
    .from('tracks')
    .select(
      `
      id, title, artwork_url, genre, mood, bpm, key,
      price_non_exclusive, price_exclusive, license_type,
      is_ai_generated, vocalist_type, preview_clip_url, full_preview_url,
      creators!inner(id, display_name)
    `
    )
    .eq('creator_id', id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  // Normalize the tracks data: Supabase returns the joined creators as an
  // array at the type level even though !inner guarantees a single record.
  // Map it to the single-object shape that ProductCard expects.
  const trackList = (tracks ?? []).map((track) => {
    const creatorsData = track.creators as unknown as
      | { id: string; display_name: string }
      | { id: string; display_name: string }[]
    const creatorObj = Array.isArray(creatorsData)
      ? creatorsData[0]
      : creatorsData
    return {
      ...track,
      creators: creatorObj,
    } as {
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
  })

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Creator Header */}
      <section className="border-b border-border-default bg-bg-secondary">
        <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-12 text-center sm:px-6 md:py-16 lg:px-8">
          {/* Profile Image */}
          {creator.profile_image_url ? (
            <img
              src={creator.profile_image_url}
              alt={creator.display_name}
              className="h-24 w-24 rounded-full border-2 border-accent object-cover md:h-32 md:w-32"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-accent bg-bg-elevated md:h-32 md:w-32">
              <span className="text-3xl font-bold text-accent md:text-4xl">
                {getInitial(creator.display_name)}
              </span>
            </div>
          )}

          {/* Creator Name */}
          <h1 className="mt-5 text-2xl font-bold text-text-primary md:text-3xl">
            {creator.display_name}
          </h1>

          {/* Bio */}
          {creator.bio && (
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary md:text-base">
              {creator.bio}
            </p>
          )}

          {/* Meta Info */}
          <div className="mt-4 flex items-center gap-4 text-sm text-text-muted">
            <span>Member since {formatMemberSince(creator.created_at)}</span>
            <span aria-hidden="true" className="text-border-default">
              |
            </span>
            <span>
              {trackList.length} {trackList.length === 1 ? 'track' : 'tracks'}{' '}
              published
            </span>
          </div>
        </div>
      </section>

      {/* Tracks Section */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        <h2 className="mb-6 text-lg font-semibold text-text-primary md:text-xl">
          Tracks by {creator.display_name}
        </h2>
        <CreatorTrackGrid tracks={trackList} />
      </section>
    </div>
  )
}
