import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us | FEATUNE',
  description:
    'Get in touch with the FEATUNE team for support, business inquiries, or general questions.',
}

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          Contact Us
        </h1>
        <p className="mt-4 text-lg text-text-secondary">
          We&apos;d love to hear from you. Whether you have a question about
          licensing, need help with an order, or want to explore a partnership,
          our team is here to help.
        </p>
      </header>

      <div className="space-y-8">
        <div className="rounded-xl border border-border-default bg-bg-card p-6">
          <h2 className="mb-2 text-xl font-bold text-text-primary sm:text-2xl">
            General Support
          </h2>
          <p className="mb-4 text-text-secondary">
            For questions about your account, orders, downloads, licensing, or
            anything else related to using FEATUNE.
          </p>
          <a
            href="mailto:support@featune.com"
            className="inline-block text-lg font-semibold text-accent hover:underline"
          >
            support@featune.com
          </a>
        </div>

        <div className="rounded-xl border border-border-default bg-bg-card p-6">
          <h2 className="mb-2 text-xl font-bold text-text-primary sm:text-2xl">
            Business Inquiries
          </h2>
          <p className="mb-4 text-text-secondary">
            For partnership proposals, press inquiries, bulk licensing, or other
            business-related matters.
          </p>
          <a
            href="mailto:business@featune.com"
            className="inline-block text-lg font-semibold text-accent hover:underline"
          >
            business@featune.com
          </a>
        </div>

        <div className="rounded-xl border border-border-default bg-bg-card p-6">
          <h2 className="mb-2 text-xl font-bold text-text-primary sm:text-2xl">
            Creator Support
          </h2>
          <p className="mb-4 text-text-secondary">
            Questions about uploading tracks, payouts, or your creator account?
            Reach out to our support team and mention that you are a creator in
            your message.
          </p>
          <a
            href="mailto:support@featune.com"
            className="inline-block text-lg font-semibold text-accent hover:underline"
          >
            support@featune.com
          </a>
        </div>

        <div className="rounded-lg border border-border-default bg-bg-elevated p-5">
          <h3 className="mb-3 text-lg font-semibold text-text-primary">
            Response Times
          </h3>
          <ul className="list-inside list-disc space-y-2 text-text-secondary">
            <li>
              <strong className="text-text-primary">General support:</strong>{' '}
              We aim to respond within 24&ndash;48 hours on business days
            </li>
            <li>
              <strong className="text-text-primary">Order issues:</strong>{' '}
              Priority handling &mdash; typically within 24 hours
            </li>
            <li>
              <strong className="text-text-primary">Business inquiries:</strong>{' '}
              We will get back to you within 3&ndash;5 business days
            </li>
          </ul>
          <p className="mt-4 text-sm text-text-muted">
            Please include your account email and any relevant order or track
            IDs in your message so we can help you as quickly as possible.
          </p>
        </div>
      </div>

      <footer className="mt-16 border-t border-border-default pt-8">
        <p className="text-sm text-text-muted">
          FEATUNE is committed to providing prompt and helpful support to all
          our users and creators.
        </p>
      </footer>
    </div>
  )
}
