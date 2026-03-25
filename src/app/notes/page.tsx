'use client'

import React, { useState } from 'react'
import notesData from '@/data/notes.json'
import { Plus, Calendar, Tag, AlertCircle, CheckCircle2 } from 'lucide-react'

interface Note {
  id: string
  title: string
  content: string
  category: string
  client?: string
  priority: string
  createdAt: string
  dueBy?: string
  status: string
  tags: string[]
}

const PriorityBadge = ({ priority }: { priority: string }) => {
  const colors: Record<string, string> = {
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  }
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${colors[priority] || colors.medium}`}>
      {priority.toUpperCase()}
    </span>
  )
}

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'completed') return <CheckCircle2 className="w-4 h-4 text-emerald-400" />
  if (status === 'active') return <AlertCircle className="w-4 h-4 text-amber-400" />
  return <AlertCircle className="w-4 h-4 text-slate-400" />
}

export default function NotesPage() {
  const [notes] = useState<Note[]>(notesData as Note[])
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')

  const filteredNotes = notes.filter(note => {
    if (filter === 'active') return note.status === 'active' || note.status === 'inprogress'
    if (filter === 'completed') return note.status === 'completed'
    return true
  })

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#f5efe3] mb-1">Notes & Ideas</h1>
          <p className="text-[#d1c7b3] text-sm">Quick capture for client updates, ideas, and reminders</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#c9894b] hover:bg-[#b67a3f] text-[#05070c] font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          Add Note
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['all', 'active', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-[#c9894b] text-[#05070c]'
                : 'bg-[#091018] text-[#d1c7b3] hover:bg-[#0d1822]'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Notes Grid */}
      <div className="grid gap-4">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-12 bg-[#091018] rounded-xl border border-[#1a2330]">
            <p className="text-[#d1c7b3]">No notes yet. Add your first idea or reminder.</p>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-[#091018] rounded-xl border border-[#1a2330] p-5 hover:border-[#c9894b]/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <StatusIcon status={note.status} />
                  <h3 className="text-lg font-semibold text-[#f5efe3]">{note.title}</h3>
                </div>
                <PriorityBadge priority={note.priority} />
              </div>

              <p className="text-[#d1c7b3] mb-4 leading-relaxed">{note.content}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm">
                {note.category && (
                  <div className="flex items-center gap-1.5 text-[#d1c7b3]">
                    <Tag className="w-3.5 h-3.5" />
                    <span>{note.category}</span>
                  </div>
                )}
                
                {note.client && (
                  <div className="flex items-center gap-1.5 text-[#c9894b]">
                    <span className="font-medium">Client:</span>
                    <span>{note.client}</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-[#d1c7b3]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Created {formatDate(note.createdAt)}</span>
                </div>

                {note.dueBy && (
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Due by {formatDate(note.dueBy)}</span>
                  </div>
                )}
              </div>

              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs bg-[#0d1822] text-[#d1c7b3] rounded border border-[#1a2330]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Stats Footer */}
      <div className="mt-8 flex items-center justify-between text-sm text-[#d1c7b3]">
        <span>{filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''}</span>
        <span>Last updated: {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  )
}