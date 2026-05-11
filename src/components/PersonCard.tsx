import React from 'react'
import { Person } from '../types'

interface PersonCardProps {
  person: Person
  onEdit: () => void
  onDelete: () => void
}

export function PersonCard({ person, onEdit, onDelete }: PersonCardProps) {
  const preview = person.personality || person.currentDynamic || ''

  return (
    <div className="list-item" style={{ cursor: 'pointer' }} onClick={onEdit}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: preview ? '4px' : 0 }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{person.name}</span>
          <span className="pill">{person.relationship}</span>
        </div>
        {preview && (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {preview}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', gap: '4px', flexShrink: 0, marginLeft: '12px' }}>
        <button
          className="btn btn-secondary"
          style={{ padding: '3px 10px', fontSize: '11px' }}
          onClick={(e) => { e.stopPropagation(); onEdit() }}
        >
          Edit
        </button>
        <button
          className="btn btn-danger"
          style={{ padding: '3px 10px', fontSize: '11px' }}
          onClick={(e) => { e.stopPropagation(); onDelete() }}
        >
          Delete
        </button>
      </div>
    </div>
  )
}
