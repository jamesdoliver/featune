'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { AdminTrack } from './page'

const FILTER_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Sold Out', value: 'sold_out' },
  { label: 'Removed', value: 'removed' },
  { label: 'Deleted', value: 'deleted' },
] as const

type FilterValue = (typeof FILTER_TABS)[number]['value']

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-error/10 text-error',
  sold_out: 'bg-text-muted/10 text-text-muted',
  removed: 'bg-text-muted/10 text-text-muted',
  deleted: 'bg-text-muted/10 text-text-muted',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  sold_out: 'Sold Out',
  removed: 'Removed',
  deleted: 'Deleted',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatPrice(price: number | null): string {
  if (price == null) return '--'
  return `$${price.toFixed(2)}`
}

function formatLicenseType(type: string | null): string {
  if (!type) return '--'
  return type.charAt(0).toUpperCase() + type.slice(1)
}

export default function AdminTrackList({ tracks }: { tracks: AdminTrack[] }) {
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all')
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteModalTrack, setDeleteModalTrack] = useState<AdminTrack | null>(null)
  const [localTracks, setLocalTracks] = useState<AdminTrack[]>(tracks)

  const filteredTracks =
    activeFilter === 'all'
      ? localTracks
      : localTracks.filter((t) => t.status === activeFilter)

  async function handleRemove(trackId: string) {
    if (!confirm('Are you sure you want to remove this track?')) return

    setRemovingId(trackId)
    try {
      const res = await fetch(`/api/admin/tracks/${trackId}/remove`, {
        method: 'PATCH',
      })

      if (!res.ok) {
        const body = await res.json()
        alert(body.error ?? 'Failed to remove track')
        return
      }

      setLocalTracks((prev) =>
        prev.map((t) => (t.id === trackId ? { ...t, status: 'removed' } : t))
      )
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setRemovingId(null)
    }
  }

  async function handleDelete(trackId: string) {
    setDeletingId(trackId)
    try {
      const res = await fetch(`/api/admin/tracks/${trackId}/delete`, {
        method: 'PATCH',
      })

      if (!res.ok) {
        const body = await res.json()
        alert(body.error ?? 'Failed to delete track')
        return
      }

      setLocalTracks((prev) =>
        prev.map((t) => (t.id === trackId ? { ...t, status: 'deleted' } : t))
      )
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setDeletingId(null)
      setDeleteModalTrack(null)
    }
  }

  return (
    <>
      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent text-white'
                  : 'bg-bg-elevated text-text-secondary hover:bg-bg-card hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {filteredTracks.length === 0 ? (
        <div className="rounded-xl border border-border-default bg-bg-elevated p-8 text-center">
          <p className="text-text-muted">
            No tracks found
            {activeFilter !== 'all' &&
              ` with status "${STATUS_LABELS[activeFilter]}"`}
            .
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-border-default bg-bg-elevated md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-default text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                  <th className="px-5 py-3">Track</th>
                  <th className="px-5 py-3">Creator</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Genre</th>
                  <th className="px-5 py-3">License</th>
                  <th className="px-5 py-3 text-right">Price</th>
                  <th className="px-5 py-3 text-right">Created</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {filteredTracks.map((track) => (
                  <tr
                    key={track.id}
                    className="transition-colors hover:bg-bg-card"
                  >
                    {/* Track with artwork */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-bg-card">
                          {track.artwork_url ? (
                            <Image
                              src={track.artwork_url}
                              alt={track.title}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <MusicNoteIcon className="h-5 w-5 text-text-muted" />
                            </div>
                          )}
                        </div>
                        <Link
                          href={`/track/${track.id}`}
                          className="text-sm font-medium text-text-primary hover:text-accent"
                        >
                          {track.title}
                        </Link>
                      </div>
                    </td>

                    {/* Creator */}
                    <td className="px-5 py-4 text-sm text-text-secondary">
                      {track.creator_name}
                    </td>

                    {/* Status badge */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          STATUS_STYLES[track.status] ?? 'bg-bg-card text-text-muted'
                        }`}
                      >
                        {STATUS_LABELS[track.status] ?? track.status}
                      </span>
                    </td>

                    {/* Genre */}
                    <td className="px-5 py-4 text-sm text-text-secondary">
                      {track.genre ?? '--'}
                    </td>

                    {/* License type */}
                    <td className="px-5 py-4 text-sm text-text-secondary">
                      {formatLicenseType(track.license_type)}
                    </td>

                    {/* Price */}
                    <td className="px-5 py-4 text-right text-sm text-text-secondary">
                      {formatPrice(track.price_non_exclusive)}
                    </td>

                    {/* Created date */}
                    <td className="px-5 py-4 text-right text-sm text-text-muted">
                      {formatDate(track.created_at)}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/tracks/${track.id}/edit`}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
                        >
                          Edit
                        </Link>
                        {track.status === 'approved' && (
                          <button
                            onClick={() => handleRemove(track.id)}
                            disabled={removingId === track.id}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-error transition-colors hover:bg-error/10 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {removingId === track.id ? 'Removing...' : 'Remove'}
                          </button>
                        )}
                        {track.status !== 'deleted' && (
                          <button
                            onClick={() => setDeleteModalTrack(track)}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-text-muted/10 hover:text-text-secondary"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filteredTracks.map((track) => (
              <div
                key={track.id}
                className="rounded-xl border border-border-default bg-bg-elevated p-4"
              >
                <div className="flex items-start gap-3">
                  {/* Artwork */}
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-bg-card">
                    {track.artwork_url ? (
                      <Image
                        src={track.artwork_url}
                        alt={track.title}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <MusicNoteIcon className="h-5 w-5 text-text-muted" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/track/${track.id}`}
                      className="text-sm font-medium text-text-primary hover:text-accent"
                    >
                      {track.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-text-secondary">
                      {track.creator_name}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          STATUS_STYLES[track.status] ?? 'bg-bg-card text-text-muted'
                        }`}
                      >
                        {STATUS_LABELS[track.status] ?? track.status}
                      </span>
                      {track.genre && (
                        <span className="text-xs text-text-muted">
                          {track.genre}
                        </span>
                      )}
                      <span className="text-xs text-text-muted">
                        {formatLicenseType(track.license_type)}
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className="text-sm font-medium text-text-primary">
                      {formatPrice(track.price_non_exclusive)}
                    </p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {formatDate(track.created_at)}
                    </p>
                  </div>
                </div>

                {/* Action row */}
                <div className="mt-3 flex items-center justify-end gap-2 border-t border-border-default pt-3">
                  <Link
                    href={`/admin/tracks/${track.id}/edit`}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
                  >
                    Edit
                  </Link>
                  {track.status === 'approved' && (
                    <button
                      onClick={() => handleRemove(track.id)}
                      disabled={removingId === track.id}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-error transition-colors hover:bg-error/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {removingId === track.id ? 'Removing...' : 'Remove'}
                    </button>
                  )}
                  {track.status !== 'deleted' && (
                    <button
                      onClick={() => setDeleteModalTrack(track)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-text-muted/10 hover:text-text-secondary"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Delete confirmation modal */}
      {deleteModalTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-border-default bg-bg-elevated p-6">
            <h3 className="text-lg font-semibold text-text-primary">
              Delete Track
            </h3>
            <p className="mt-3 text-sm text-text-secondary">
              Are you sure you want to delete &ldquo;{deleteModalTrack.title}&rdquo;?
            </p>
            <p className="mt-2 text-sm text-text-muted">
              This will hide the track from the store and creator profile.
              Existing purchasers will retain access to their downloads.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteModalTrack(null)}
                disabled={deletingId === deleteModalTrack.id}
                className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-card hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteModalTrack.id)}
                disabled={deletingId === deleteModalTrack.id}
                className="rounded-lg bg-error px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-error/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingId === deleteModalTrack.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* --- Placeholder icon --- */

function MusicNoteIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  )
}
