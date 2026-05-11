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
    <div className="card" style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <strong style={{ fontSize: '15px' }}>{person.name}</strong>
          <span className="pill">{person.relationship}</span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '12px' }}
            onClick={onEdit}
          >
            Edit
          </button>
          <button
            className="btn btn-danger"
            style={{ padding: '4px 10px', fontSize: '12px' }}
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      </div>
      {preview && (
        <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          {preview.length > 120 ? preview.slice(0, 120) + '...' : preview}
        </p>
      )}
    </div>
  )
}
