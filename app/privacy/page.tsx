import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | FEATUNE',
  description:
    'Learn how FEATUNE collects, uses, and protects your personal information.',
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

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-lg text-text-secondary">
          Last updated: February 2026
        </p>
        <p className="mt-2 text-sm text-text-muted">
          This privacy policy explains how FEATUNE collects, uses, and protects
          your personal information when you use our platform.
        </p>
      </header>

      <nav className="mb-12 rounded-xl border border-border-default bg-bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-muted">
          Contents
        </h2>
        <ol className="grid gap-2 text-sm sm:grid-cols-2">
          {[
            { id: 'information-we-collect', label: '1. Information We Collect' },
            { id: 'how-we-use-it', label: '2. How We Use Your Information' },
            { id: 'data-sharing', label: '3. Data Sharing' },
            { id: 'cookies', label: '4. Cookies & Tracking' },
            { id: 'data-security', label: '5. Data Security' },
            { id: 'data-retention', label: '6. Data Retention' },
            { id: 'your-rights', label: '7. Your Rights' },
            { id: 'contact', label: '8. Contact' },
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

      <div className="space-y-12">
        <Section id="information-we-collect" title="1. Information We Collect">
          <p>
            We collect information that you provide directly to us, as well as
            information generated through your use of the platform.
          </p>
          <ul className="mt-3 list-inside list-disc space-y-2">
            <li>
              <strong className="text-text-primary">Account information</strong>{' '}
              &mdash; name, email address, and password when you create an
              account
            </li>
            <li>
              <strong className="text-text-primary">Payment information</strong>{' '}
              &mdash; billing details processed securely through Stripe; we do
              not store your full card number
            </li>
            <li>
              <strong className="text-text-primary">Creator information</strong>{' '}
              &mdash; display name, biography, profile image, and payout
              details if you apply as a creator
            </li>
            <li>
              <strong className="text-text-primary">Usage data</strong> &mdash;
              pages visited, tracks previewed, search queries, and interactions
              with the platform
            </li>
            <li>
              <strong className="text-text-primary">Device information</strong>{' '}
              &mdash; browser type, operating system, IP address, and general
              location data
            </li>
          </ul>
        </Section>

        <Section id="how-we-use-it" title="2. How We Use Your Information">
          <p>We use your information for the following purposes:</p>
          <ul className="mt-3 list-inside list-disc space-y-2">
            <li>To provide, maintain, and improve the FEATUNE platform</li>
            <li>
              To process transactions, send purchase confirmations, and deliver
              licensed files
            </li>
            <li>
              To manage creator accounts, calculate earnings, and process
              payouts
            </li>
            <li>
              To send transactional emails such as order confirmations, track
              approvals, and payout notifications
            </li>
            <li>To respond to your support requests and inquiries</li>
            <li>
              To detect and prevent fraud, abuse, and security incidents
            </li>
          </ul>
        </Section>

        <Section id="data-sharing" title="3. Data Sharing">
          <p>
            We do not sell your personal information. We may share your data
            with the following parties only as necessary to operate the
            platform:
          </p>
          <ul className="mt-3 list-inside list-disc space-y-2">
            <li>
              <strong className="text-text-primary">Stripe</strong> &mdash; for
              secure payment processing
            </li>
            <li>
              <strong className="text-text-primary">Supabase</strong> &mdash;
              for authentication and database services
            </li>
            <li>
              <strong className="text-text-primary">Resend</strong> &mdash; for
              transactional email delivery
            </li>
            <li>
              <strong className="text-text-primary">Hosting providers</strong>{' '}
              &mdash; Vercel and Railway for application hosting
            </li>
          </ul>
          <p className="mt-3">
            Creators will see limited buyer information (name and license type)
            in their sales dashboard. Buyers&apos; email addresses are not
            shared with creators.
          </p>
        </Section>

        <Section id="cookies" title="4. Cookies & Tracking">
          <p>FEATUNE uses cookies and similar technologies to:</p>
          <ul className="mt-3 list-inside list-disc space-y-2">
            <li>
              <strong className="text-text-primary">Essential cookies</strong>{' '}
              &mdash; maintain your session, authenticate your account, and
              remember your cart
            </li>
            <li>
              <strong className="text-text-primary">Analytics cookies</strong>{' '}
              &mdash; understand how visitors use the platform so we can improve
              the experience
            </li>
          </ul>
          <p className="mt-3">
            We do not use advertising or tracking cookies. You can control
            cookie preferences through your browser settings, though disabling
            essential cookies may affect platform functionality.
          </p>
        </Section>

        <Section id="data-security" title="5. Data Security">
          <p>
            We take reasonable technical and organisational measures to protect
            your personal information, including:
          </p>
          <ul className="mt-3 list-inside list-disc space-y-2">
            <li>Encryption of data in transit using HTTPS/TLS</li>
            <li>
              Secure password hashing through our authentication provider
            </li>
            <li>
              Row-level security policies on our database to prevent
              unauthorised access
            </li>
            <li>
              Payment data handled entirely by Stripe&apos;s PCI-compliant
              infrastructure
            </li>
            <li>
              Private audio files stored in access-controlled storage buckets
            </li>
          </ul>
        </Section>

        <Section id="data-retention" title="6. Data Retention">
          <ul className="list-inside list-disc space-y-2">
            <li>
              Account data is retained for as long as your account is active
            </li>
            <li>
              Order and license records are retained indefinitely to ensure you
              can always access proof of your purchases
            </li>
            <li>
              You may request deletion of your account and associated personal
              data by contacting our support team
            </li>
          </ul>
        </Section>

        <Section id="your-rights" title="7. Your Rights">
          <p>
            Depending on your jurisdiction, you may have the following rights
            regarding your personal data:
          </p>
          <ul className="mt-3 list-inside list-disc space-y-2">
            <li>
              <strong className="text-text-primary">Access</strong> &mdash;
              request a copy of the personal data we hold about you
            </li>
            <li>
              <strong className="text-text-primary">Correction</strong> &mdash;
              ask us to correct any inaccurate or incomplete information
            </li>
            <li>
              <strong className="text-text-primary">Deletion</strong> &mdash;
              request that we delete your personal data, subject to legal
              retention requirements
            </li>
            <li>
              <strong className="text-text-primary">Portability</strong> &mdash;
              receive your data in a structured, machine-readable format
            </li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, please contact us using the details
            below. We will respond to your request within 30 days.
          </p>
        </Section>

        <Section id="contact" title="8. Contact">
          <p>
            If you have any questions about this privacy policy or how we handle
            your data, please contact us:
          </p>
          <div className="mt-4 rounded-lg border border-border-default bg-bg-elevated p-5">
            <p className="font-medium text-text-primary">FEATUNE Privacy Team</p>
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

      <footer className="mt-16 border-t border-border-default pt-8">
        <p className="text-sm text-text-muted">
          We may update this privacy policy from time to time. Any changes will
          be posted on this page with an updated revision date. Your continued
          use of FEATUNE after changes are posted constitutes your acceptance of
          the updated policy.
        </p>
      </footer>
    </div>
  )
}
