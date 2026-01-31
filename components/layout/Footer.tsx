import Link from "next/link";
import LeadForm from "@/components/LeadForm";

export default function Footer() {
  return (
    <footer className="border-t border-border-default bg-bg-secondary">
      {/* Newsletter Section */}
      <div className="border-b border-border-default">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                Stay in the loop
              </h3>
              <p className="mt-1 text-sm text-text-muted">
                Get notified about new releases and exclusive deals.
              </p>
            </div>
            <div className="w-full max-w-md">
              <LeadForm source="footer" />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="text-lg font-bold tracking-tight">
              FEA<span className="text-accent">TUNE</span>
            </Link>
            <p className="mt-3 text-sm text-text-muted">
              Premium vocal toplines for music producers. AI and human vocals.
            </p>
          </div>

          {/* Browse */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
              Browse
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/search?genre=pop"
                  className="text-sm text-text-muted transition-colors hover:text-text-primary"
                >
                  Pop
                </Link>
              </li>
              <li>
                <Link
                  href="/search?genre=rnb"
                  className="text-sm text-text-muted transition-colors hover:text-text-primary"
                >
                  R&B
                </Link>
              </li>
              <li>
                <Link
                  href="/search?genre=hiphop"
                  className="text-sm text-text-muted transition-colors hover:text-text-primary"
                >
                  Hip-Hop
                </Link>
              </li>
              <li>
                <Link
                  href="/search?genre=edm"
                  className="text-sm text-text-muted transition-colors hover:text-text-primary"
                >
                  EDM
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
              Company
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-text-muted transition-colors hover:text-text-primary"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-text-muted transition-colors hover:text-text-primary"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-text-muted transition-colors hover:text-text-primary"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-text-muted transition-colors hover:text-text-primary"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Creators */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
              Creators
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/dashboard"
                  className="text-sm text-text-muted transition-colors hover:text-text-primary"
                >
                  Start Selling
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/earnings"
                  className="text-sm text-text-muted transition-colors hover:text-text-primary"
                >
                  Earnings
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-border-default pt-6">
          <p className="text-center text-xs text-text-muted">
            &copy; {new Date().getFullYear()} Featune. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
