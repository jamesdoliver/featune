'use client'

export default function ChatButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-28 right-4 z-[50] flex h-12 w-12 items-center justify-center rounded-full bg-accent shadow-lg transition-colors hover:bg-accent-hover sm:bottom-24 sm:right-6 sm:h-14 sm:w-14"
      aria-label="Search tracks with AI"
    >
      {/* Search icon with sparkle */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="sm:h-6 sm:w-6"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
        {/* Small sparkle accent */}
        <path d="M16 4l.5 1.5L18 6l-1.5.5L16 8l-.5-1.5L14 6l1.5-.5L16 4" strokeWidth="1.5" />
      </svg>
    </button>
  )
}
