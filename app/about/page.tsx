import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About FEATUNE | Vocal Topline Marketplace',
  description:
    'FEATUNE connects music producers with professional vocal toplines from talented creators worldwide.',
}

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-4 text-xl font-bold text-text-primary sm:text-2xl">
        {title}
      </h2>
      <div className="space-y-4 text-text-secondary">{children}</div>
    </section>
  )
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          About FEATUNE
        </h1>
        <p className="mt-4 text-lg text-text-secondary">
          The vocal topline marketplace for producers, songwriters, and artists.
        </p>
      </header>

      <div className="space-y-12">
        <Section id="our-mission" title="Our Mission">
          <p>
            FEATUNE exists to bridge the gap between vocal talent and music
            production. We believe every producer deserves access to
            professional-quality vocal toplines &mdash; whether performed by
            human vocalists or generated with AI &mdash; without the complexity
            of traditional session bookings, lengthy negotiations, or unclear
            licensing.
          </p>
          <p>
            Our marketplace brings together a curated catalogue of vocal
            performances spanning genres, moods, and styles, ready to be
            licensed and used in your next release. From pop hooks to R&amp;B
            melodies, hip-hop adlibs to electronic vocal chops, FEATUNE is
            where vocals meet production.
          </p>
        </Section>

        <Section id="how-it-works" title="How It Works">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-lg border border-border-default bg-bg-elevated p-5">
              <div className="mb-3 text-2xl font-bold text-accent">1</div>
              <h3 className="mb-2 text-lg font-semibold text-text-primary">
                Browse
              </h3>
              <p className="text-sm">
                Explore our catalogue of vocal toplines. Filter by genre, mood,
                BPM, key, vocalist type, and license availability. Preview
                watermarked audio directly in your browser before you buy.
              </p>
            </div>

            <div className="rounded-lg border border-border-default bg-bg-elevated p-5">
              <div className="mb-3 text-2xl font-bold text-accent">2</div>
              <h3 className="mb-2 text-lg font-semibold text-text-primary">
                Purchase
              </h3>
              <p className="text-sm">
                Choose a non-exclusive or exclusive license. Add tracks to your
                cart, benefit from bundle discounts, and check out securely with
                Stripe. Your license PDF is generated instantly.
              </p>
            </div>

            <div className="rounded-lg border border-border-default bg-bg-elevated p-5">
              <div className="mb-3 text-2xl font-bold text-accent">3</div>
              <h3 className="mb-2 text-lg font-semibold text-text-primary">
                Create
              </h3>
              <p className="text-sm">
                Download your acapella, instrumental stems, and lyrics. Drop
                them into your DAW, chop, pitch, remix &mdash; the vocal is
                yours to use in unlimited commercial projects, royalty-free.
              </p>
            </div>
          </div>
        </Section>

        <Section id="quality" title="Quality You Can Trust">
          <p>
            Every vocal topline on FEATUNE goes through a human review process
            before it reaches the marketplace. Our team listens to each
            submission to ensure it meets our standards for audio quality, vocal
            performance, and production readiness.
          </p>
          <ul className="mt-3 list-inside list-disc space-y-2">
            <li>
              <strong className="text-text-primary">Human-reviewed submissions</strong>{' '}
              &mdash; every track is listened to and approved by our team before
              going live
            </li>
            <li>
              <strong className="text-text-primary">Professional audio quality</strong>{' '}
              &mdash; WAV acapellas and instrumentals delivered at studio-grade
              resolution
            </li>
            <li>
              <strong className="text-text-primary">Clear licensing</strong>{' '}
              &mdash; transparent terms, instant license PDFs, and no hidden
              royalties or fees
            </li>
            <li>
              <strong className="text-text-primary">AI transparency</strong>{' '}
              &mdash; every track is clearly labelled as human-performed or
              AI-generated so you always know what you are licensing
            </li>
          </ul>
        </Section>

        <Section id="for-creators" title="For Creators">
          <p>
            FEATUNE is also a home for vocalists, songwriters, and vocal
            producers. Upload your toplines, set your prices, and earn revenue
            every time someone licenses your work. We handle the payments,
            licensing, and delivery &mdash; you focus on creating.
          </p>
          <div className="mt-4 rounded-lg border border-border-default bg-bg-elevated p-5">
            <p className="text-sm text-text-muted">
              Interested in selling your vocals on FEATUNE? Create an account
              and apply to become a creator from your dashboard.
            </p>
          </div>
        </Section>
      </div>

      <footer className="mt-16 border-t border-border-default pt-8">
        <p className="text-sm text-text-muted">
          Have questions about FEATUNE? Reach out to us at{' '}
          <a
            href="mailto:support@featune.com"
            className="text-accent hover:underline"
          >
            support@featune.com
          </a>
        </p>
      </footer>
    </div>
  )
}
