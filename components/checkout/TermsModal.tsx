'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface TermsModalProps {
  isOpen: boolean
  onClose: () => void
  onAccept: () => void
}

export function TermsModal({ isOpen, onClose, onAccept }: TermsModalProps) {
  const [agreed, setAgreed] = useState(false)

  // Reset agreed state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAgreed(false)
    }
  }, [isOpen])

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    },
    [isOpen, onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleAccept = () => {
    if (agreed) {
      onAccept()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-modal-title"
        className="relative z-10 mx-4 max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl border border-border-default bg-bg-card shadow-2xl"
      >
        {/* Header */}
        <div className="border-b border-border-default px-6 py-4">
          <div className="flex items-center justify-between">
            <h2
              id="terms-modal-title"
              className="text-lg font-bold text-text-primary"
            >
              License Terms & Conditions
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
              aria-label="Close modal"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[50vh] overflow-y-auto px-6 py-5">
          <p className="mb-4 text-sm text-text-secondary">
            By completing this purchase, you agree to the following terms:
          </p>

          {/* Key Terms Summary */}
          <div className="space-y-4">
            {/* Rights */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-accent">
                Your Rights
              </h3>
              <ul className="space-y-1.5 text-sm text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                  <span>Unlimited commercial use (music, video, games, ads)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                  <span>Full modification rights (pitch, chop, remix)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                  <span>Worldwide, perpetual usage - no expiry</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                  <span>No royalties after purchase</span>
                </li>
              </ul>
            </div>

            {/* Restrictions */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-error">
                Restrictions
              </h3>
              <ul className="space-y-1.5 text-sm text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-error" />
                  <span>No redistribution of raw files</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-error" />
                  <span>No sublicensing or transfer to others</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-error" />
                  <span>No AI training or voice synthesis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-error" />
                  <span>No use in illegal or harmful content</span>
                </li>
              </ul>
            </div>

            {/* Ownership */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-text-primary">
                Ownership
              </h3>
              <p className="text-sm text-text-secondary">
                The creator retains copyright. You receive usage rights as
                defined by your license type. Your finished work is your own.
              </p>
            </div>
          </div>

          {/* Link to full terms */}
          <div className="mt-5 rounded-lg border border-border-default bg-bg-elevated px-4 py-3">
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
            >
              View full License Terms & Conditions
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border-default bg-bg-elevated px-6 py-4">
          {/* Checkbox */}
          <label className="mb-4 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-5 w-5 flex-shrink-0 cursor-pointer appearance-none rounded border-2 border-border-default bg-bg-card checked:border-accent checked:bg-accent focus:outline-none focus:ring-2 focus:ring-accent/50"
              style={{
                backgroundImage: agreed
                  ? `url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3E%3C/svg%3E")`
                  : 'none',
              }}
            />
            <span className="text-sm text-text-secondary">
              I have read and agree to the{' '}
              <Link
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-accent hover:underline"
              >
                License Terms & Conditions
              </Link>
            </span>
          </label>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border-default bg-bg-card px-4 py-3 text-sm font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAccept}
              disabled={!agreed}
              className="flex-1 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue to Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
