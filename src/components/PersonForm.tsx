import React, { useState } from 'react'
import { Person, PersonForm as PersonFormData } from '../types'
import { v4 as uuidv4 } from 'uuid'

const RELATIONSHIPS = ['Boss', 'Partner', 'Friend', 'Client', 'Family', 'Mentor', 'Colleague', 'Therapist', 'Other']

interface PersonFormProps {
  initial?: Person
  onSave: (person: Person) => void
  onCancel: () => void
}

export function PersonForm({ initial, onSave, onCancel }: PersonFormProps) {
  const [form, setForm] = useState<PersonFormData>({
    name: initial?.name ?? '',
    relationship: initial?.relationship ?? 'Friend',
    personality: initial?.personality ?? '',
    currentDynamic: initial?.currentDynamic ?? '',
    whyTheyMatter: initial?.whyTheyMatter ?? '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    onSave({
      id: initial?.id ?? uuidv4(),
      ...form,
    })
  }

  function update(field: keyof PersonFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
          <label>Name</label>
          <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Their name" />
        </div>
        <div className="form-group" style={{ width: '180px', marginBottom: 0 }}>
          <label>Relationship</label>
          <select value={form.relationship} onChange={(e) => update('relationship', e.target.value)}>
            {RELATIONSHIPS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label>Personality / Communication Style</label>
        <textarea
          value={form.personality}
          onChange={(e) => update('personality', e.target.value)}
          placeholder="How would you describe their personality and communication style?"
        />
      </div>
      <div className="form-group">
        <label>Current Dynamic</label>
        <textarea
          value={form.currentDynamic}
          onChange={(e) => update('currentDynamic', e.target.value)}
          placeholder="What's the current state of this relationship?"
        />
      </div>
      <div className="form-group">
        <label>Why They Matter</label>
        <textarea
          value={form.whyTheyMatter}
          onChange={(e) => update('whyTheyMatter', e.target.value)}
          placeholder="Why is this person important in your life? How do they interact with you?"
        />
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={!form.name.trim()}>Save</button>
      </div>
    </form>
  )
}
