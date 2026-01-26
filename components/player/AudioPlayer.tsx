'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { usePlayerStore } from '@/stores/playerStore'

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const volumeBarRef = useRef<HTMLDivElement>(null)

  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const volume = usePlayerStore((s) => s.volume)
  const progress = usePlayerStore((s) => s.progress)
  const duration = usePlayerStore((s) => s.duration)

  const play = usePlayerStore((s) => s.play)
  const pause = usePlayerStore((s) => s.pause)
  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const setVolume = usePlayerStore((s) => s.setVolume)
  const setProgress = usePlayerStore((s) => s.setProgress)
  const setDuration = usePlayerStore((s) => s.setDuration)

  // Track the previous volume before muting for mute/unmute toggle
  const [prevVolume, setPrevVolume] = useState(0.8)

  // Track visibility for slide-up animation
  const [visible, setVisible] = useState(false)

  // Show the player with animation when a track is set
  useEffect(() => {
    if (currentTrack) {
      // Small delay to trigger CSS transition after mount
      requestAnimationFrame(() => {
        setVisible(true)
      })
    } else {
      setVisible(false)
    }
  }, [currentTrack])

  // When currentTrack changes, load and play the new source
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return

    audio.src = currentTrack.previewUrl
    audio.load()

    // Play once the audio is ready
    const handleCanPlay = () => {
      if (usePlayerStore.getState().isPlaying) {
        audio.play().catch(() => {
          // Autoplay may be blocked by the browser
          pause()
        })
      }
    }

    audio.addEventListener('canplay', handleCanPlay, { once: true })

    return () => {
      audio.removeEventListener('canplay', handleCanPlay)
    }
  }, [currentTrack, pause])

  // Sync play/pause state with the audio element
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return

    if (isPlaying) {
      // Only attempt play if the audio has a source loaded
      if (audio.readyState >= 2) {
        audio.play().catch(() => {
          pause()
        })
      }
    } else {
      audio.pause()
    }
  }, [isPlaying, currentTrack, pause])

  // Sync volume with the audio element
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = volume
  }, [volume])

  // Audio event handlers
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    setProgress(audio.currentTime / audio.duration)
  }, [setProgress])

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    setDuration(audio.duration)
  }, [setDuration])

  const handleEnded = useCallback(() => {
    pause()
    setProgress(0)
  }, [pause, setProgress])

  // Progress bar click to seek
  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current
      const bar = progressBarRef.current
      if (!audio || !bar || !audio.duration) return

      const rect = bar.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const fraction = Math.max(0, Math.min(1, clickX / rect.width))

      audio.currentTime = fraction * audio.duration
      setProgress(fraction)
    },
    [setProgress]
  )

  // Volume bar click
  const handleVolumeClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const bar = volumeBarRef.current
      if (!bar) return

      const rect = bar.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const fraction = Math.max(0, Math.min(1, clickX / rect.width))

      setVolume(fraction)
    },
    [setVolume]
  )

  // Mute/unmute toggle
  const handleMuteToggle = useCallback(() => {
    if (volume > 0) {
      setPrevVolume(volume)
      setVolume(0)
    } else {
      setVolume(prevVolume > 0 ? prevVolume : 0.8)
    }
  }, [volume, prevVolume, setVolume])

  const currentTime = duration * progress

  // Don't render if no track
  if (!currentTrack) return null

  return (
    <>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* Player bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 border-t border-border-default bg-bg-secondary/95 backdrop-blur-xl transition-transform duration-300 ease-out ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-4 px-4 sm:px-6">
          {/* Artwork thumbnail */}
          <div className="flex-shrink-0">
            {currentTrack.artworkUrl ? (
              <Image
                src={currentTrack.artworkUrl}
                alt={currentTrack.title}
                width={40}
                height={40}
                className="h-10 w-10 rounded object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded bg-bg-elevated">
                {/* Music note placeholder icon */}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-text-muted"
                >
                  <path
                    d="M9 18V5l12-2v13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2" />
                  <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
            )}
          </div>

          {/* Track info */}
          <div className="min-w-0 w-32 flex-shrink-0 sm:w-40">
            <p className="truncate text-sm font-medium text-text-primary">
              {currentTrack.title}
            </p>
            <p className="truncate text-xs text-text-secondary">
              {currentTrack.creatorName}
            </p>
          </div>

          {/* Play/Pause button */}
          <div className="flex-shrink-0">
            <button
              onClick={togglePlay}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-accent transition-colors hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-secondary"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                /* Pause icon */
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                /* Play icon */
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5.14v13.72a1 1 0 001.5.86l11.04-6.86a1 1 0 000-1.72L9.5 4.28A1 1 0 008 5.14z" />
                </svg>
              )}
            </button>
          </div>

          {/* Progress bar + time display */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {/* Current time */}
            <span className="hidden w-10 flex-shrink-0 text-right font-mono text-xs text-text-muted sm:block">
              {formatTime(currentTime)}
            </span>

            {/* Clickable progress bar */}
            <div
              ref={progressBarRef}
              onClick={handleProgressClick}
              className="group relative h-5 flex-1 cursor-pointer flex items-center"
              role="slider"
              aria-label="Seek"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
            >
              {/* Track background */}
              <div className="h-1 w-full rounded-full bg-bg-elevated transition-all group-hover:h-1.5">
                {/* Progress fill */}
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>

            {/* Total duration */}
            <span className="hidden w-10 flex-shrink-0 font-mono text-xs text-text-muted sm:block">
              {formatTime(duration)}
            </span>
          </div>

          {/* Volume control */}
          <div className="hidden items-center gap-2 sm:flex">
            {/* Volume icon / mute toggle */}
            <button
              onClick={handleMuteToggle}
              className="flex-shrink-0 text-text-secondary transition-colors hover:text-text-primary focus:outline-none"
              aria-label={volume === 0 ? 'Unmute' : 'Mute'}
            >
              {volume === 0 ? (
                /* Muted icon */
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : volume < 0.5 ? (
                /* Low volume icon */
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path d="M15.54 8.46a5 5 0 010 7.07" />
                </svg>
              ) : (
                /* High volume icon */
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path d="M15.54 8.46a5 5 0 010 7.07" />
                  <path d="M19.07 4.93a10 10 0 010 14.14" />
                </svg>
              )}
            </button>

            {/* Volume slider */}
            <div
              ref={volumeBarRef}
              onClick={handleVolumeClick}
              className="group relative h-5 w-20 cursor-pointer flex items-center"
              role="slider"
              aria-label="Volume"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(volume * 100)}
            >
              <div className="h-1 w-full rounded-full bg-bg-elevated transition-all group-hover:h-1.5">
                <div
                  className="h-full rounded-full bg-text-secondary transition-all"
                  style={{ width: `${volume * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
