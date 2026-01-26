'use client'

import { useState, useCallback } from 'react'

interface Creator {
  id: string
  user_id: string
  display_name: string
  bio: string | null
  profile_image_url: string | null
  revenue_split: number
  status: string
  created_at: string
  track_count: number
}

interface CreatorsListProps {
  initialCreators: Creator[]
}

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  pending: { label: 'Pending', classes: 'bg-warning/20 text-warning' },
  approved: { label: 'Approved', classes: 'bg-success/20 text-success' },
  rejected: { label: 'Rejected', classes: 'bg-error/20 text-error' },
}

export default function CreatorsList({ initialCreators }: CreatorsListProps) {
  const [creators, setCreators] = useState<Creator[]>(initialCreators)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const updateCreator = useCallback(
    async (id: string, fields: { status?: string; revenue_split?: number }) => {
      setActionLoading(id)

      try {
        const res = await fetch(`/api/admin/creators/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fields),
        })

        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || 'Failed to update creator')
        }

        const { creator: updated } = await res.json()

        // Optimistically update the list, preserving track_count from local state
        setCreators((prev) =>
          prev.map((c) =>
            c.id === id
              ? { ...c, ...updated, track_count: c.track_count }
              : c
          )
        )
      } catch (err) {
        console.error('Error updating creator:', err)
        alert(err instanceof Error ? err.message : 'Failed to update creator')
      } finally {
        setActionLoading(null)
        setEditingId(null)
      }
    },
    []
  )

  const handleApprove = useCallback(
    (id: string) => updateCreator(id, { status: 'approved' }),
    [updateCreator]
  )

  const handleReject = useCallback(
    (id: string) => updateCreator(id, { status: 'rejected' }),
    [updateCreator]
  )

  const startEditing = useCallback((creator: Creator) => {
    setEditingId(creator.id)
    setEditValue((creator.revenue_split * 100).toFixed(0))
  }, [])

  const cancelEditing = useCallback(() => {
    setEditingId(null)
    setEditValue('')
  }, [])

  const saveSplit = useCallback(
    (id: string) => {
      const parsed = parseFloat(editValue)
      if (isNaN(parsed) || parsed < 1 || parsed > 100) {
        alert('Please enter a value between 1 and 100.')
        return
      }
      updateCreator(id, { revenue_split: parsed / 100 })
    },
    [editValue, updateCreator]
  )

  const getInitial = (name: string): string => {
    return name.charAt(0).toUpperCase()
  }

  if (creators.length === 0) {
    return (
      <div className="rounded-xl border border-border-default bg-bg-elevated p-8 text-center">
        <p className="text-text-muted">No creators found.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border-default bg-bg-elevated">
      {/* Desktop table */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-default text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
              <th className="px-5 py-3">Creator</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Tracks</th>
              <th className="px-5 py-3 text-right">Revenue Split</th>
              <th className="px-5 py-3 text-right">Joined</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {creators.map((creator) => {
              const statusCfg = STATUS_CONFIG[creator.status] ?? {
                label: creator.status,
                classes: 'bg-bg-card text-text-secondary',
              }
              const isEditing = editingId === creator.id
              const isLoading = actionLoading === creator.id

              return (
                <tr
                  key={creator.id}
                  className="transition-colors hover:bg-bg-card"
                >
                  {/* Creator info */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {creator.profile_image_url ? (
                        <img
                          src={creator.profile_image_url}
                          alt={creator.display_name}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                          {getInitial(creator.display_name)}
                        </div>
                      )}
                      <span className="text-sm font-medium text-text-primary">
                        {creator.display_name}
                      </span>
                    </div>
                  </td>

                  {/* Status badge */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusCfg.classes}`}
                    >
                      {statusCfg.label}
                    </span>
                  </td>

                  {/* Track count */}
                  <td className="px-5 py-4 text-right text-sm text-text-secondary">
                    {creator.track_count}
                  </td>

                  {/* Revenue split */}
                  <td className="px-5 py-4 text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-2">
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-16 rounded-md border border-border-default bg-bg-card px-2 py-1 text-right text-sm text-text-primary outline-none focus:border-accent"
                          disabled={isLoading}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveSplit(creator.id)
                            if (e.key === 'Escape') cancelEditing()
                          }}
                        />
                        <span className="text-xs text-text-muted">%</span>
                        <button
                          onClick={() => saveSplit(creator.id)}
                          disabled={isLoading}
                          className="rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          disabled={isLoading}
                          className="rounded-md px-2 py-1 text-xs text-text-muted transition-colors hover:text-text-primary disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing(creator)}
                        className="text-sm text-text-secondary transition-colors hover:text-accent"
                        title="Click to edit revenue split"
                      >
                        {(creator.revenue_split * 100).toFixed(0)}%
                      </button>
                    )}
                  </td>

                  {/* Joined date */}
                  <td className="px-5 py-4 text-right text-sm text-text-muted">
                    {new Date(creator.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    {creator.status === 'pending' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(creator.id)}
                          disabled={isLoading}
                          className="rounded-md bg-success/20 px-3 py-1.5 text-xs font-semibold text-success transition-colors hover:bg-success/30 disabled:opacity-50"
                        >
                          {isLoading ? 'Saving...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(creator.id)}
                          disabled={isLoading}
                          className="rounded-md bg-error/20 px-3 py-1.5 text-xs font-semibold text-error transition-colors hover:bg-error/30 disabled:opacity-50"
                        >
                          {isLoading ? 'Saving...' : 'Reject'}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-text-muted">--</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className="divide-y divide-border-default md:hidden">
        {creators.map((creator) => {
          const statusCfg = STATUS_CONFIG[creator.status] ?? {
            label: creator.status,
            classes: 'bg-bg-card text-text-secondary',
          }
          const isEditing = editingId === creator.id
          const isLoading = actionLoading === creator.id

          return (
            <div key={creator.id} className="p-4">
              {/* Header row: avatar + name + status */}
              <div className="flex items-center gap-3">
                {creator.profile_image_url ? (
                  <img
                    src={creator.profile_image_url}
                    alt={creator.display_name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                    {getInitial(creator.display_name)}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    {creator.display_name}
                  </p>
                  <p className="text-xs text-text-muted">
                    Joined{' '}
                    {new Date(creator.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusCfg.classes}`}
                >
                  {statusCfg.label}
                </span>
              </div>

              {/* Meta row */}
              <div className="mt-3 flex items-center gap-4 text-xs text-text-secondary">
                <span>
                  <span className="font-semibold text-text-primary">
                    {creator.track_count}
                  </span>{' '}
                  tracks
                </span>
                <span>
                  Revenue split:{' '}
                  {isEditing ? (
                    <span className="inline-flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-14 rounded-md border border-border-default bg-bg-card px-1.5 py-0.5 text-right text-xs text-text-primary outline-none focus:border-accent"
                        disabled={isLoading}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveSplit(creator.id)
                          if (e.key === 'Escape') cancelEditing()
                        }}
                      />
                      %
                      <button
                        onClick={() => saveSplit(creator.id)}
                        disabled={isLoading}
                        className="ml-1 rounded-md bg-accent px-2 py-0.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        disabled={isLoading}
                        className="rounded-md px-1.5 py-0.5 text-xs text-text-muted transition-colors hover:text-text-primary disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => startEditing(creator)}
                      className="font-semibold text-text-primary transition-colors hover:text-accent"
                    >
                      {(creator.revenue_split * 100).toFixed(0)}%
                    </button>
                  )}
                </span>
              </div>

              {/* Action buttons for pending */}
              {creator.status === 'pending' && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleApprove(creator.id)}
                    disabled={isLoading}
                    className="flex-1 rounded-md bg-success/20 py-2 text-xs font-semibold text-success transition-colors hover:bg-success/30 disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(creator.id)}
                    disabled={isLoading}
                    className="flex-1 rounded-md bg-error/20 py-2 text-xs font-semibold text-error transition-colors hover:bg-error/30 disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Reject'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
