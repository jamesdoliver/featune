'use client'

import { useState, useRef } from 'react'

interface HomepageSection {
  id: string
  section_type: 'featured' | 'genre'
  genre: string | null
  title: string
  display_order: number
  is_active: boolean
  pinned_count: number
}

interface SectionListProps {
  sections: HomepageSection[]
  onReorder: (sections: HomepageSection[]) => void
  onEdit: (section: HomepageSection) => void
  onDelete: (sectionId: string) => void
  onToggleActive: (section: HomepageSection) => void
}

export default function SectionList({
  sections,
  onReorder,
  onEdit,
  onDelete,
  onToggleActive,
}: SectionListProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const draggedItemRef = useRef<HomepageSection | null>(null)

  function handleDragStart(e: React.DragEvent, section: HomepageSection) {
    setDraggedId(section.id)
    draggedItemRef.current = section
    e.dataTransfer.effectAllowed = 'move'
    // Set transparent drag image
    const ghost = document.createElement('div')
    ghost.style.opacity = '0'
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 0, 0)
    setTimeout(() => document.body.removeChild(ghost), 0)
  }

  function handleDragOver(e: React.DragEvent, sectionId: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (sectionId !== draggedId) {
      setDragOverId(sectionId)
    }
  }

  function handleDragLeave() {
    setDragOverId(null)
  }

  function handleDrop(e: React.DragEvent, targetSection: HomepageSection) {
    e.preventDefault()
    if (!draggedItemRef.current || draggedItemRef.current.id === targetSection.id) {
      setDraggedId(null)
      setDragOverId(null)
      return
    }

    const draggedSection = draggedItemRef.current
    const newSections = [...sections]
    const draggedIdx = newSections.findIndex((s) => s.id === draggedSection.id)
    const targetIdx = newSections.findIndex((s) => s.id === targetSection.id)

    // Remove dragged item
    newSections.splice(draggedIdx, 1)
    // Insert at target position
    newSections.splice(targetIdx, 0, draggedSection)

    onReorder(newSections)
    setDraggedId(null)
    setDragOverId(null)
  }

  function handleDragEnd() {
    setDraggedId(null)
    setDragOverId(null)
    draggedItemRef.current = null
  }

  if (sections.length === 0) {
    return (
      <div className="rounded-lg border border-border-default bg-bg-card p-8 text-center text-text-muted">
        No sections configured. Add a genre section to get started.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sections.map((section) => (
        <div
          key={section.id}
          draggable
          onDragStart={(e) => handleDragStart(e, section)}
          onDragOver={(e) => handleDragOver(e, section.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, section)}
          onDragEnd={handleDragEnd}
          className={`flex items-center gap-4 rounded-lg border bg-bg-card p-4 transition-all ${
            draggedId === section.id
              ? 'opacity-50'
              : dragOverId === section.id
              ? 'border-accent bg-accent/5'
              : 'border-border-default hover:border-border-hover'
          }`}
        >
          {/* Drag handle */}
          <div className="cursor-grab text-text-muted active:cursor-grabbing">
            <DragHandleIcon className="h-5 w-5" />
          </div>

          {/* Section info */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-text-primary">{section.title}</span>
              {section.section_type === 'featured' && (
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                  Featured
                </span>
              )}
              {!section.is_active && (
                <span className="rounded-full bg-text-muted/10 px-2 py-0.5 text-xs font-medium text-text-muted">
                  Hidden
                </span>
              )}
            </div>
            <div className="mt-0.5 text-xs text-text-muted">
              {section.pinned_count}/4 pinned
              {section.section_type === 'genre' && section.genre && (
                <span className="ml-2">Genre: {section.genre}</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Toggle active */}
            <button
              onClick={() => onToggleActive(section)}
              className={`rounded-lg p-2 transition-colors ${
                section.is_active
                  ? 'text-green-500 hover:bg-green-500/10'
                  : 'text-text-muted hover:bg-bg-elevated hover:text-text-secondary'
              }`}
              title={section.is_active ? 'Hide section' : 'Show section'}
            >
              {section.is_active ? (
                <EyeIcon className="h-4 w-4" />
              ) : (
                <EyeOffIcon className="h-4 w-4" />
              )}
            </button>

            {/* Edit */}
            <button
              onClick={() => onEdit(section)}
              className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
              title="Edit pinned tracks"
            >
              <EditIcon className="h-4 w-4" />
            </button>

            {/* Delete (only for genre sections) */}
            {section.section_type === 'genre' ? (
              <button
                onClick={() => onDelete(section.id)}
                className="rounded-lg p-2 text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
                title="Delete section"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            ) : (
              <div className="w-8" /> // Spacer for alignment
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function DragHandleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="5" r="1.5" />
      <circle cx="15" cy="5" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="19" r="1.5" />
      <circle cx="15" cy="19" r="1.5" />
    </svg>
  )
}

function EyeIcon({ className }: { className?: string }) {
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
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon({ className }: { className?: string }) {
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
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function EditIcon({ className }: { className?: string }) {
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
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function TrashIcon({ className }: { className?: string }) {
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
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  )
}
