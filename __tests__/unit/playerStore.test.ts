import { usePlayerStore } from '@/stores/playerStore'
import type { PlayerTrack } from '@/stores/playerStore'

// Helper to create test tracks
function createTrack(overrides: Partial<PlayerTrack> = {}): PlayerTrack {
  return {
    id: `track-${Math.random().toString(36).slice(2)}`,
    title: 'Test Track',
    creatorName: 'Test Creator',
    artworkUrl: null,
    previewUrl: 'https://example.com/preview.mp3',
    ...overrides,
  }
}

describe('playerStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    usePlayerStore.setState({
      currentTrack: null,
      isPlaying: false,
      volume: 0.8,
      progress: 0,
      duration: 0,
    })
  })

  describe('initial state', () => {
    it('has correct defaults', () => {
      const state = usePlayerStore.getState()

      expect(state.currentTrack).toBeNull()
      expect(state.isPlaying).toBe(false)
      expect(state.volume).toBe(0.8)
      expect(state.progress).toBe(0)
      expect(state.duration).toBe(0)
    })
  })

  describe('play', () => {
    it('sets currentTrack, isPlaying=true, and resets progress/duration when called with a track', () => {
      // Set some pre-existing progress/duration to verify they get reset
      usePlayerStore.setState({ progress: 0.5, duration: 120 })

      const track = createTrack()
      usePlayerStore.getState().play(track)

      const state = usePlayerStore.getState()
      expect(state.currentTrack).toEqual(track)
      expect(state.isPlaying).toBe(true)
      expect(state.progress).toBe(0)
      expect(state.duration).toBe(0)
    })

    it('resumes playback if currentTrack exists and no track argument given', () => {
      const track = createTrack()
      usePlayerStore.setState({ currentTrack: track, isPlaying: false })

      usePlayerStore.getState().play()

      expect(usePlayerStore.getState().isPlaying).toBe(true)
    })

    it('does nothing if no currentTrack and no track argument given', () => {
      usePlayerStore.getState().play()

      const state = usePlayerStore.getState()
      expect(state.currentTrack).toBeNull()
      expect(state.isPlaying).toBe(false)
    })
  })

  describe('pause', () => {
    it('sets isPlaying to false', () => {
      const track = createTrack()
      usePlayerStore.getState().play(track)
      expect(usePlayerStore.getState().isPlaying).toBe(true)

      usePlayerStore.getState().pause()
      expect(usePlayerStore.getState().isPlaying).toBe(false)
    })
  })

  describe('togglePlay', () => {
    it('toggles isPlaying when a track is loaded', () => {
      const track = createTrack()
      usePlayerStore.setState({ currentTrack: track, isPlaying: false })

      usePlayerStore.getState().togglePlay()
      expect(usePlayerStore.getState().isPlaying).toBe(true)

      usePlayerStore.getState().togglePlay()
      expect(usePlayerStore.getState().isPlaying).toBe(false)
    })

    it('does nothing when no track is loaded', () => {
      usePlayerStore.getState().togglePlay()
      expect(usePlayerStore.getState().isPlaying).toBe(false)
    })
  })

  describe('setTrack', () => {
    it('sets the track, isPlaying=false, and resets progress/duration', () => {
      // Start with a playing track and some progress
      usePlayerStore.setState({
        currentTrack: createTrack({ id: 'old-track' }),
        isPlaying: true,
        progress: 0.7,
        duration: 200,
      })

      const newTrack = createTrack({ id: 'new-track' })
      usePlayerStore.getState().setTrack(newTrack)

      const state = usePlayerStore.getState()
      expect(state.currentTrack).toEqual(newTrack)
      expect(state.isPlaying).toBe(false)
      expect(state.progress).toBe(0)
      expect(state.duration).toBe(0)
    })
  })

  describe('setVolume', () => {
    it('clamps volume between 0 and 1', () => {
      usePlayerStore.getState().setVolume(0.5)
      expect(usePlayerStore.getState().volume).toBe(0.5)

      usePlayerStore.getState().setVolume(-0.5)
      expect(usePlayerStore.getState().volume).toBe(0)

      usePlayerStore.getState().setVolume(1.5)
      expect(usePlayerStore.getState().volume).toBe(1)

      usePlayerStore.getState().setVolume(0)
      expect(usePlayerStore.getState().volume).toBe(0)

      usePlayerStore.getState().setVolume(1)
      expect(usePlayerStore.getState().volume).toBe(1)
    })
  })

  describe('setProgress', () => {
    it('clamps progress between 0 and 1', () => {
      usePlayerStore.getState().setProgress(0.5)
      expect(usePlayerStore.getState().progress).toBe(0.5)

      usePlayerStore.getState().setProgress(-0.3)
      expect(usePlayerStore.getState().progress).toBe(0)

      usePlayerStore.getState().setProgress(2.0)
      expect(usePlayerStore.getState().progress).toBe(1)

      usePlayerStore.getState().setProgress(0)
      expect(usePlayerStore.getState().progress).toBe(0)

      usePlayerStore.getState().setProgress(1)
      expect(usePlayerStore.getState().progress).toBe(1)
    })
  })

  describe('setDuration', () => {
    it('floors duration at 0', () => {
      usePlayerStore.getState().setDuration(180)
      expect(usePlayerStore.getState().duration).toBe(180)

      usePlayerStore.getState().setDuration(-10)
      expect(usePlayerStore.getState().duration).toBe(0)

      usePlayerStore.getState().setDuration(0)
      expect(usePlayerStore.getState().duration).toBe(0)
    })
  })

  describe('stop', () => {
    it('clears currentTrack, isPlaying, progress, and duration', () => {
      usePlayerStore.setState({
        currentTrack: createTrack(),
        isPlaying: true,
        progress: 0.6,
        duration: 240,
      })

      usePlayerStore.getState().stop()

      const state = usePlayerStore.getState()
      expect(state.currentTrack).toBeNull()
      expect(state.isPlaying).toBe(false)
      expect(state.progress).toBe(0)
      expect(state.duration).toBe(0)
    })
  })
})
