'use client'

import { useCallback, useRef } from 'react'
import { usePlayerStore } from '@/stores/playerStore'

interface WaveformDisplayProps {
  waveformData: number[]
  trackId: string
}

export default function WaveformDisplay({ waveformData, trackId }: WaveformDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const currentTrack = usePlayerStore((state) => state.currentTrack)
  const progress = usePlayerStore((state) => state.progress)
  const setProgress = usePlayerStore((state) => state.setProgress)

  const isThisTrack = currentTrack?.id === trackId
  const currentProgress = isThisTrack ? progress : 0

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isThisTrack || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const newProgress = Math.max(0, Math.min(1, x / rect.width))
      setProgress(newProgress)
    },
    [isThisTrack, setProgress]
  )

  if (!waveformData || waveformData.length === 0) {
    return (
      <div className="flex h-20 items-center justify-center rounded-lg bg-bg-elevated">
        <p className="text-xs text-text-muted">No waveform data</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className={`flex h-20 items-end gap-[2px] rounded-lg bg-bg-elevated px-2 py-2 ${
        isThisTrack ? 'cursor-pointer' : 'cursor-default'
      }`}
      role="slider"
      aria-label="Waveform seek bar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(currentProgress * 100)}
      tabIndex={isThisTrack ? 0 : -1}
    >
      {waveformData.map((value, index) => {
        const barProgress = index / waveformData.length
        const isPlayed = barProgress < currentProgress
        // Ensure minimum height for visual appearance
        const height = Math.max(4, value * 100)

        return (
          <div
            key={index}
            className={`flex-1 rounded-sm transition-colors duration-100 ${
              isPlayed ? 'bg-accent' : 'bg-text-muted/40'
            }`}
            style={{ height: `${height}%`, minWidth: '2px', maxWidth: '4px' }}
          />
        )
      })}
    </div>
  )
}
