'use client'

import { useState } from 'react'
import ChatModal from './ChatModal'

export default function ChatButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Floating chat button — above audio player */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-24 right-6 z-[50] flex h-14 w-14 items-center justify-center rounded-full bg-accent shadow-lg transition-colors hover:bg-accent-hover"
        aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
      >
        {isOpen ? (
          /* Close (X) icon */
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          /* Sparkle / chat icon */
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
          </svg>
        )}
      </button>

      {/* Chat modal */}
      <ChatModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
