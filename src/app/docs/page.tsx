'use client'
import { useState } from 'react'
import docsData from '@/data/docs.json'

type Doc = {
  id: string
  filename: string
  path: string
  date: string
  size: string
  category: string
  preview: string
}

const CATEGORY_COLORS: Record<string, string> = {
  'Sales': '#E53E3E',
  'Outreach': '#63B3ED',
  'Operations': '#9F7AEA',
  'Technical': '#48BB78',
  'Client Work': '#ECC94B',
}

export default function DocsPage() {
  const [search, setSearch] = useState('')
  const docs = docsData as Doc[]

  const filtered = docs.filter((doc) =>
    doc.filename.toLowerCase().includes(search.toLowerCase()) ||
    doc.preview.toLowerCase().includes(search.toLowerCase()) ||
    doc.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', gap: 20 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#F7FAFC' }}>Docs</h1>
          <p style={{ fontSize: 13, color: '#718096', marginTop: 4 }}>
            {docs.length} files in /builds/ — searchable knowledge base
          </p>
        </div>
        <input
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 240 }}
        />
      </div>

      {filtered.length === 0 && (
        <div style={{ fontSize: 14, color: '#4A5568', padding: '40px 0', textAlign: 'center' }}>
          No files match &ldquo;{search}&rdquo;
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((doc) => (
          <div key={doc.id} className="card" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <div style={{
              width: 40, height: 40, background: '#1A1A1A', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0
            }}>
              📄
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#F7FAFC', fontFamily: 'monospace' }}>
                  {doc.filename}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4,
                  background: (CATEGORY_COLORS[doc.category] || '#718096') + '22',
                  color: CATEGORY_COLORS[doc.category] || '#718096',
                  textTransform: 'uppercase', letterSpacing: '0.04em'
                }}>
                  {doc.category}
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#718096', marginBottom: 8, lineHeight: 1.5, maxWidth: 600 }}>
                {doc.preview}
              </div>
              <div style={{ display: 'flex', gap: 20, fontSize: 11, color: '#4A5568' }}>
                <span>{doc.path}</span>
                <span>{doc.size}</span>
                <span>{doc.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
