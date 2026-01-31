import { Metadata } from 'next'
import Link from 'next/link'
import LeadForm from '@/components/LeadForm'

export const metadata: Metadata = {
  title: 'Newsletter - FEATUNE',
  description: 'Subscribe to the FEATUNE newsletter for new releases, featured creators, and exclusive deals.',
}

export default function NewsletterPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-20">
      <div className="mx-auto max-w-xl text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
          <svg
            className="h-8 w-8 text-accent"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          Join the FEATUNE Newsletter
        </h1>
        <p className="mb-8 text-lg text-text-secondary">
          Get the inside scoop on premium vocal toplines, straight to your inbox.
        </p>

        {/* Benefits */}
        <div className="mb-10 rounded-xl border border-border-default bg-bg-card p-6 text-left">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-muted">
            What you&apos;ll get
          </h2>
          <ul className="space-y-3 text-sm text-text-secondary">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span>Early access to new vocal releases before they hit the marketplace</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span>Exclusive discounts and promotional offers for subscribers</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span>Featured creator spotlights and behind-the-scenes content</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span>Tips and tutorials for music producers</span>
            </li>
          </ul>
        </div>

        {/* Form */}
        <div className="mb-8">
          <LeadForm source="newsletter-page" showName />
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-text-muted">
          We respect your privacy. Unsubscribe anytime with one click.
        </p>

        {/* Back Link */}
        <div className="mt-8">
          <Link
            href="/"
            className="text-sm text-accent transition-colors hover:text-accent-hover"
          >
            &larr; Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
