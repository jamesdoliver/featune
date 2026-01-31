import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'License Terms & Conditions | FEATUNE',
  description:
    'Full license terms and conditions for vocal toplines purchased on FEATUNE.',
}

// ---------------------------------------------------------------------------
// Section Component
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Main Terms Page
// ---------------------------------------------------------------------------

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
      {/* Header */}
      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          License Terms & Conditions
        </h1>
        <p className="mt-4 text-lg text-text-secondary">
          Last updated: January 2025
        </p>
        <p className="mt-2 text-sm text-text-muted">
          These terms govern your use of vocal toplines purchased through FEATUNE.
        </p>
      </header>

      {/* Table of Contents */}
      <nav className="mb-12 rounded-xl border border-border-default bg-bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-muted">
          Contents
        </h2>
        <ol className="grid gap-2 text-sm sm:grid-cols-2">
          {[
            { id: 'definitions', label: '1. Definitions' },
            { id: 'grant-of-license', label: '2. Grant of License' },
            { id: 'permitted-uses', label: '3. Permitted Uses' },
            { id: 'prohibited-uses', label: '4. Prohibited Uses' },
            { id: 'copyright-ownership', label: '5. Copyright & Ownership' },
            { id: 'attribution', label: '6. Attribution' },
            { id: 'warranty-liability', label: '7. Warranty & Liability' },
            { id: 'termination', label: '8. Termination' },
            { id: 'governing-law', label: '9. Governing Law' },
            { id: 'general', label: '10. General Provisions' },
            { id: 'contact', label: '11. Contact Information' },
          ].map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="text-text-secondary transition-colors hover:text-accent"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* Sections */}
      <div className="space-y-12">
        {/* 1. Definitions */}
        <Section id="definitions" title="1. Definitions">
          <ul className="list-inside list-disc space-y-2">
            <li>
              <strong className="text-text-primary">&ldquo;FEATUNE&rdquo;</strong> refers
              to the platform operator and marketplace for vocal toplines.
            </li>
            <li>
              <strong className="text-text-primary">&ldquo;Creator&rdquo;</strong> means
              the vocal performer or producer who uploaded the track to FEATUNE.
            </li>
            <li>
              <strong className="text-text-primary">
                &ldquo;Buyer&rdquo; or &ldquo;Licensee&rdquo;
              </strong>{' '}
              refers to the individual or entity purchasing a license.
            </li>
            <li>
              <strong className="text-text-primary">&ldquo;Track&rdquo;</strong> means
              the vocal topline being licensed, including all associated audio files.
            </li>
            <li>
              <strong className="text-text-primary">&ldquo;License&rdquo;</strong>{' '}
              refers to the rights granted under these terms upon purchase.
            </li>
          </ul>
        </Section>

        {/* 2. Grant of License */}
        <Section id="grant-of-license" title="2. Grant of License">
          <div className="space-y-6">
            {/* Non-Exclusive */}
            <div className="rounded-lg border border-border-default bg-bg-elevated p-5">
              <h3 className="mb-3 text-lg font-semibold text-accent">
                Non-Exclusive License
              </h3>
              <p className="mb-3">
                A non-exclusive license grants you the following rights:
              </p>
              <ul className="list-inside list-disc space-y-1.5">
                <li>Use in unlimited commercial projects</li>
                <li>
                  Music releases, videos, games, advertisements, podcasts, and films
                </li>
                <li>
                  Monetization on all streaming platforms with no revenue caps
                </li>
                <li>Full modification rights (pitch, chop, effects, remix)</li>
                <li>Worldwide distribution</li>
                <li>Perpetual usage (license never expires)</li>
                <li>No royalties owed after purchase</li>
              </ul>
              <p className="mt-3 text-sm text-text-muted">
                Note: The Creator retains the right to license this track to other
                buyers.
              </p>
            </div>

            {/* Exclusive */}
            <div className="rounded-lg border border-accent/30 bg-accent-muted p-5">
              <h3 className="mb-3 text-lg font-semibold text-accent">
                Exclusive License
              </h3>
              <p className="mb-3">
                An exclusive license includes all non-exclusive rights, plus:
              </p>
              <ul className="list-inside list-disc space-y-1.5">
                <li>
                  <strong>Sole commercial usage rights</strong> &ndash; no new licenses
                  will be issued
                </li>
                <li>Track is removed from the FEATUNE marketplace</li>
                <li>
                  Prior non-exclusive licenses remain valid (existing buyers keep their
                  rights)
                </li>
              </ul>
            </div>
          </div>
        </Section>

        {/* 3. Permitted Uses */}
        <Section id="permitted-uses" title="3. Permitted Uses">
          <p>You may use licensed tracks for:</p>
          <ul className="mt-3 list-inside list-disc space-y-1.5">
            <li>Commercial music releases (singles, albums, EPs)</li>
            <li>Sync licensing (film, television, advertisements, video games)</li>
            <li>Video content (YouTube, TikTok, Instagram, Twitch, etc.)</li>
            <li>Podcasts and audio content</li>
            <li>Remixes and derivative works</li>
            <li>Sampling and chopping</li>
            <li>Cover versions and reinterpretations</li>
            <li>Live performances and DJ sets</li>
          </ul>
        </Section>

        {/* 4. Prohibited Uses */}
        <Section id="prohibited-uses" title="4. Prohibited Uses">
          <p>You may NOT use licensed tracks for:</p>
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-error/80">
            <li>
              <span className="text-text-secondary">
                Redistribution of raw audio files (sharing, reselling, or giving away
                the original files)
              </span>
            </li>
            <li>
              <span className="text-text-secondary">
                Sublicensing to third parties (you cannot sell or transfer your
                license)
              </span>
            </li>
            <li>
              <span className="text-text-secondary">
                Use in hate speech, discriminatory, or offensive content
              </span>
            </li>
            <li>
              <span className="text-text-secondary">
                Use in illegal or unlawful content
              </span>
            </li>
            <li>
              <span className="text-text-secondary">
                Use in defamatory content or content that harms the Creator&apos;s
                reputation
              </span>
            </li>
            <li>
              <span className="text-text-secondary">
                Training AI or machine learning models, including voice synthesis and
                cloning
              </span>
            </li>
            <li>
              <span className="text-text-secondary">
                Claiming authorship of the original vocal performance
              </span>
            </li>
          </ul>
        </Section>

        {/* 5. Copyright & Ownership */}
        <Section id="copyright-ownership" title="5. Copyright & Ownership">
          <ul className="list-inside list-disc space-y-2">
            <li>
              The Creator retains copyright and authorship of the original vocal
              performance
            </li>
            <li>
              The Buyer receives usage rights as defined by the purchased license type
            </li>
            <li>
              The Creator is credited as the performer if credit is given (see
              Attribution)
            </li>
            <li>FEATUNE retains platform and marketplace rights</li>
            <li>
              Your finished work (the song you create using the vocal) is your own
              original work
            </li>
          </ul>
        </Section>

        {/* 6. Attribution */}
        <Section id="attribution" title="6. Attribution">
          <p>
            Attribution to the Creator is <strong>appreciated but not required</strong>.
          </p>
          <p className="mt-3">If you choose to give credit, we suggest:</p>
          <div className="mt-3 rounded-lg border border-border-default bg-bg-elevated px-4 py-3 font-mono text-sm">
            Vocals by [Creator Name] via FEATUNE
          </div>
        </Section>

        {/* 7. Warranty & Liability */}
        <Section id="warranty-liability" title="7. Warranty & Liability">
          <ul className="list-inside list-disc space-y-2">
            <li>
              The Creator warrants that they own the rights to the vocal and have the
              authority to license it
            </li>
            <li>
              Files are provided &ldquo;as is&rdquo; without warranty of merchantability or
              fitness for a particular purpose
            </li>
            <li>
              Maximum liability is limited to the purchase price of the license
            </li>
            <li>
              The Buyer indemnifies FEATUNE and the Creator against any claims arising
              from their use of the licensed material
            </li>
            <li>
              FEATUNE is not responsible for disputes between Buyers and Creators
            </li>
          </ul>
        </Section>

        {/* 8. Termination */}
        <Section id="termination" title="8. Termination">
          <ul className="list-inside list-disc space-y-2">
            <li>
              The license may be terminated if you breach these terms
            </li>
            <li>
              Upon termination, you must cease all use and destroy all copies of the
              licensed files
            </li>
            <li>
              The prohibition on AI training survives termination
            </li>
            <li>
              FEATUNE reserves the right to investigate potential breaches
            </li>
          </ul>
        </Section>

        {/* 9. Governing Law */}
        <Section id="governing-law" title="9. Governing Law">
          <ul className="list-inside list-disc space-y-2">
            <li>
              These terms are governed by the laws of England and Wales
            </li>
            <li>
              Any disputes shall be subject to the exclusive jurisdiction of the
              English courts
            </li>
            <li>
              Consumer statutory rights are preserved where applicable
            </li>
          </ul>
        </Section>

        {/* 10. General Provisions */}
        <Section id="general" title="10. General Provisions">
          <ul className="list-inside list-disc space-y-2">
            <li>
              These terms constitute the entire agreement between you and FEATUNE
              regarding the license
            </li>
            <li>
              If any provision is found invalid, the remaining provisions remain in
              effect (severability)
            </li>
            <li>
              Failure to enforce any provision does not waive the right to enforce it
              later
            </li>
            <li>
              The license is personal and non-transferable
            </li>
            <li>
              FEATUNE may update these terms; continued use constitutes acceptance
            </li>
          </ul>
        </Section>

        {/* 11. Contact */}
        <Section id="contact" title="11. Contact Information">
          <p>
            For questions about these terms or licensing inquiries, please contact us:
          </p>
          <div className="mt-4 rounded-lg border border-border-default bg-bg-elevated p-5">
            <p className="font-medium text-text-primary">FEATUNE Support</p>
            <p className="mt-2">
              Email:{' '}
              <a
                href="mailto:support@featune.com"
                className="text-accent hover:underline"
              >
                support@featune.com
              </a>
            </p>
          </div>
        </Section>
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-border-default pt-8">
        <p className="text-sm text-text-muted">
          By purchasing a license on FEATUNE, you acknowledge that you have read,
          understood, and agree to be bound by these terms and conditions.
        </p>
      </footer>
    </div>
  )
}
