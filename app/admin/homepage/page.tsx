'use client'

import { useEffect, useState } from 'react'
import SectionList from './SectionList'
import TrackPickerModal from './TrackPickerModal'

interface HomepageSection {
  id: string
  section_type: 'featured' | 'genre'
  genre: string | null
  title: string
  display_order: number
  is_active: boolean
  pinned_count: number
}

interface PinnedTrack {
  id: string
  position: number
  tracks: {
    id: string
    title: string
    artwork_url: string | null
    genre: string | null
    creators: { id: string; display_name: string }
  }
}

export default function AdminHomepagePage() {
  const [sections, setSections] = useState<HomepageSection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null)
  const [pinnedTracks, setPinnedTracks] = useState<PinnedTrack[]>([])
  const [showAddGenre, setShowAddGenre] = useState(false)
  const [newGenre, setNewGenre] = useState('')
  const [newGenreTitle, setNewGenreTitle] = useState('')
  const [saving, setSaving] = useState(false)

  // Fetch sections on mount
  useEffect(() => {
    fetchSections()
  }, [])

  async function fetchSections() {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/homepage/sections')
      if (!res.ok) throw new Error('Failed to fetch sections')
      const data = await res.json()
      setSections(data.sections)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sections')
    } finally {
      setLoading(false)
    }
  }

  async function handleReorder(reorderedSections: HomepageSection[]) {
    const order = reorderedSections.map((s, idx) => ({
      id: s.id,
      display_order: idx,
    }))

    // Optimistic update
    setSections(reorderedSections.map((s, idx) => ({ ...s, display_order: idx })))

    try {
      const res = await fetch('/api/admin/homepage/sections/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order }),
      })
      if (!res.ok) throw new Error('Failed to reorder')
    } catch {
      // Revert on error
      fetchSections()
    }
  }

  async function handleDeleteSection(sectionId: string) {
    if (!confirm('Are you sure you want to delete this section?')) return

    try {
      const res = await fetch(`/api/admin/homepage/sections/${sectionId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete')
      }
      setSections((prev) => prev.filter((s) => s.id !== sectionId))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete section')
    }
  }

  async function handleToggleActive(section: HomepageSection) {
    try {
      const res = await fetch(`/api/admin/homepage/sections/${section.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !section.is_active }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setSections((prev) =>
        prev.map((s) =>
          s.id === section.id ? { ...s, is_active: !s.is_active } : s
        )
      )
    } catch {
      alert('Failed to update section')
    }
  }

  async function handleEditSection(section: HomepageSection) {
    setEditingSection(section)
    // Fetch pinned tracks for this section
    try {
      const res = await fetch(`/api/admin/homepage/sections/${section.id}/tracks`)
      if (!res.ok) throw new Error('Failed to fetch tracks')
      const data = await res.json()
      setPinnedTracks(data.tracks)
    } catch {
      setPinnedTracks([])
    }
  }

  async function handleSavePinnedTracks(
    tracks: { track_id: string; position: number }[]
  ) {
    if (!editingSection) return

    setSaving(true)
    try {
      const res = await fetch(
        `/api/admin/homepage/sections/${editingSection.id}/tracks`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tracks }),
        }
      )
      if (!res.ok) throw new Error('Failed to save')

      // Update pinned count in sections list
      setSections((prev) =>
        prev.map((s) =>
          s.id === editingSection.id ? { ...s, pinned_count: tracks.length } : s
        )
      )
      setEditingSection(null)
      setPinnedTracks([])
    } catch {
      alert('Failed to save pinned tracks')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddGenreSection() {
    if (!newGenre.trim() || !newGenreTitle.trim()) return

    setSaving(true)
    try {
      const res = await fetch('/api/admin/homepage/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre: newGenre.trim(), title: newGenreTitle.trim() }),
      })
      if (!res.ok) throw new Error('Failed to create section')
      const data = await res.json()
      setSections((prev) => [...prev, { ...data.section, pinned_count: 0 }])
      setShowAddGenre(false)
      setNewGenre('')
      setNewGenreTitle('')
    } catch {
      alert('Failed to create section')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center text-red-400">
        {error}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Homepage Sections
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Configure the sections displayed on the homepage
          </p>
        </div>
        <button
          onClick={() => setShowAddGenre(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          <PlusIcon className="h-4 w-4" />
          Add Genre Section
        </button>
      </div>

      {/* Section List */}
      <SectionList
        sections={sections}
        onReorder={handleReorder}
        onEdit={handleEditSection}
        onDelete={handleDeleteSection}
        onToggleActive={handleToggleActive}
      />

      {/* Track Picker Modal */}
      {editingSection && (
        <TrackPickerModal
          section={editingSection}
          pinnedTracks={pinnedTracks}
          onClose={() => {
            setEditingSection(null)
            setPinnedTracks([])
          }}
          onSave={handleSavePinnedTracks}
          saving={saving}
        />
      )}

      {/* Add Genre Section Modal */}
      {showAddGenre && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-xl border border-border-default bg-bg-card p-6">
            <h2 className="mb-4 text-lg font-bold text-text-primary">
              Add Genre Section
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                  Genre (must match track genre exactly)
                </label>
                <input
                  type="text"
                  value={newGenre}
                  onChange={(e) => setNewGenre(e.target.value)}
                  placeholder="e.g. House, EDM, Pop"
                  className="w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                  Display Title
                </label>
                <input
                  type="text"
                  value={newGenreTitle}
                  onChange={(e) => setNewGenreTitle(e.target.value)}
                  placeholder="e.g. House Music, Electronic Dance"
                  className="w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddGenre(false)
                  setNewGenre('')
                  setNewGenreTitle('')
                }}
                className="rounded-lg border border-border-default px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleAddGenreSection}
                disabled={saving || !newGenre.trim() || !newGenreTitle.trim()}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Section'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
