import { create } from "zustand"

export interface PlayerTrack {
  id: string
  title: string
  creatorName: string
  artworkUrl: string | null
  previewUrl: string // the audio URL to play
}

interface PlayerState {
  currentTrack: PlayerTrack | null
  isPlaying: boolean
  volume: number // 0-1
  progress: number // 0-1 (current position / duration)
  duration: number // in seconds
}

interface PlayerActions {
  play: (track?: PlayerTrack) => void
  pause: () => void
  togglePlay: () => void
  setTrack: (track: PlayerTrack) => void
  setVolume: (volume: number) => void
  setProgress: (progress: number) => void
  setDuration: (duration: number) => void
  stop: () => void
}

export type PlayerStore = PlayerState & PlayerActions

export const usePlayerStore = create<PlayerStore>()((set, get) => ({
  // State
  currentTrack: null,
  isPlaying: false,
  volume: 0.8,
  progress: 0,
  duration: 0,

  // Actions
  play: (track?: PlayerTrack) => {
    if (track) {
      set({
        currentTrack: track,
        isPlaying: true,
        progress: 0,
        duration: 0,
      })
    } else {
      // Resume only if there is a current track
      if (get().currentTrack) {
        set({ isPlaying: true })
      }
    }
  },

  pause: () => {
    set({ isPlaying: false })
  },

  togglePlay: () => {
    const { isPlaying, currentTrack } = get()
    if (currentTrack) {
      set({ isPlaying: !isPlaying })
    }
  },

  setTrack: (track: PlayerTrack) => {
    set({
      currentTrack: track,
      isPlaying: false,
      progress: 0,
      duration: 0,
    })
  },

  setVolume: (volume: number) => {
    set({ volume: Math.max(0, Math.min(1, volume)) })
  },

  setProgress: (progress: number) => {
    set({ progress: Math.max(0, Math.min(1, progress)) })
  },

  setDuration: (duration: number) => {
    set({ duration: Math.max(0, duration) })
  },

  stop: () => {
    set({
      currentTrack: null,
      isPlaying: false,
      progress: 0,
      duration: 0,
    })
  },
}))
