import React, { useState } from 'react'
import { Thing, ThingForm as ThingFormData } from '../types'
import { v4 as uuidv4 } from 'uuid'

const CATEGORIES = ['Company', 'Organization', 'School', 'Product', 'Community', 'Place', 'Other']

interface ThingFormProps {
  initial?: Thing
  onSave: (thing: Thing) => void
  onCancel: () => void
}

export function ThingForm({ initial, onSave, onCancel }: ThingFormProps) {
  const [form, setForm] = useState<ThingFormData>({
    name: initial?.name ?? '',
    category: initial?.category ?? 'Company',
    description: initial?.description ?? '',
    currentDynamic: initial?.currentDynamic ?? '',
    whyItMatters: initial?.whyItMatters ?? '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    onSave({
      id: initial?.id ?? uuidv4(),
      ...form,
    })
  }

  function update(field: keyof ThingFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ marginBottom: '12px', padding: '16px 20px' }}>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
          <label>Name</label>
          <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Google, MIT, Figma..." />
        </div>
        <div className="form-group" style={{ width: '180px', marginBottom: 0 }}>
          <label>Category</label>
          <select value={form.category} onChange={(e) => update('category', e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label>Description</label>
        <textarea
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="What is this? What do they do?"
        />
      </div>
      <div className="form-group">
        <label>Current Dynamic</label>
        <textarea
          value={form.currentDynamic}
          onChange={(e) => update('currentDynamic', e.target.value)}
          placeholder="What's your current relationship or situation with this?"
        />
      </div>
      <div className="form-group">
        <label>Why It Matters</label>
        <textarea
          value={form.whyItMatters}
          onChange={(e) => update('whyItMatters', e.target.value)}
          placeholder="Why is this important in your life or work?"
        />
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={!form.name.trim()}>Save</button>
      </div>
    </form>
  )
}
