import React, { useState } from 'react'
import { HeroBanner } from '../components/HeroBanner'
import { useApp } from '../context/AppContext'
import { Person, PersonForm as PersonFormData } from '../types'
import { v4 as uuid } from 'uuid'

const RELATIONSHIPS = ['Boss', 'Partner', 'Friend', 'Client', 'Family', 'Mentor', 'Colleague', 'Therapist', 'Other']
const STYLE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'None selected' },
  { value: 'personal', label: 'Personal messages' },
  { value: 'work', label: 'Work messages' },
  { value: 'email', label: 'Email' },
  { value: 'social', label: 'Social media' },
  { value: 'other', label: 'Other / Custom' },
]

export function People() {
  const { state, dispatch } = useApp()
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [noteText, setNoteText] = useState('')

  // Add form state
  const [addForm, setAddForm] = useState<PersonFormData>({
    name: '', relationship: 'Friend', personality: '', currentDynamic: '', whyTheyMatter: '',
  })

  function handleAddSave() {
    if (!addForm.name.trim()) return
    dispatch({
      type: 'ADD_PERSON',
      payload: { id: uuid(), ...addForm, notes: [], stylePreference: '' },
    })
    setAdding(false)
    setAddForm({ name: '', relationship: 'Friend', personality: '', currentDynamic: '', whyTheyMatter: '' })
  }

  function handleDelete(id: string) {
    if (window.confirm('Remove this person?')) {
      dispatch({ type: 'DELETE_PERSON', payload: id })
      if (viewingId === id) setViewingId(null)
    }
  }

  function handleFieldUpdate(person: Person, field: keyof PersonFormData, value: string) {
    dispatch({ type: 'UPDATE_PERSON', payload: { ...person, [field]: value } })
  }

  function handleAddNote(personId: string) {
    if (!noteText.trim()) return
    dispatch({
      type: 'ADD_PERSON_NOTE',
      payload: { personId, note: { id: uuid(), content: noteText.trim(), createdAt: new Date().toISOString() } },
    })
    setNoteText('')
  }

  function handleDeleteNote(personId: string, noteId: string) {
    if (window.confirm('Delete this note?')) {
      dispatch({ type: 'DELETE_PERSON_NOTE', payload: { personId, noteId } })
    }
  }

  function handleStyleChange(personId: string, value: string) {
    dispatch({ type: 'SET_PERSON_STYLE', payload: { personId, stylePreference: value } })
  }

  const viewingPerson = viewingId ? state.people.find((p) => p.id === viewingId) : null

  return (
    <>
      <div className="screen-header">
        <h1>People</h1>
      </div>
      <HeroBanner
        title="The people in your world"
        subtitle="Add the people who matter in your life to build richer context."
      />
      <div className="screen-content">
        {adding && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px' }}>Add a person</h3>
              <button className="btn btn-secondary" style={{ fontSize: '12px' }} onClick={() => setAdding(false)}>Cancel</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Name</label>
                    <input value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} placeholder="Their name" />
                  </div>
                  <div className="form-group" style={{ width: '180px', marginBottom: 0 }}>
                    <label>Relationship</label>
                    <select value={addForm.relationship} onChange={(e) => setAddForm((f) => ({ ...f, relationship: e.target.value }))}>
                      {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="card" style={{ padding: '16px 20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Personality / Communication Style</label>
                  <textarea value={addForm.personality} onChange={(e) => setAddForm((f) => ({ ...f, personality: e.target.value }))} placeholder="How would you describe their personality?" />
                </div>
              </div>
              <div className="card" style={{ padding: '16px 20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Current Dynamic</label>
                  <textarea value={addForm.currentDynamic} onChange={(e) => setAddForm((f) => ({ ...f, currentDynamic: e.target.value }))} placeholder="What's the current state of this relationship?" />
                </div>
              </div>
              <div className="card" style={{ padding: '16px 20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Why They Matter</label>
                  <textarea value={addForm.whyTheyMatter} onChange={(e) => setAddForm((f) => ({ ...f, whyTheyMatter: e.target.value }))} placeholder="Why is this person important in your life?" />
                </div>
              </div>
              <button className="btn btn-primary" onClick={handleAddSave} disabled={!addForm.name.trim()}>Save Person</button>
            </div>
          </div>
        )}

        {viewingPerson && (
          <div>
            <button className="btn btn-secondary" style={{ marginBottom: '16px', fontSize: '12px' }} onClick={() => setViewingId(null)}>
              &larr; Back
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div className="person-card-avatar" style={{ width: '48px', height: '48px', fontSize: '22px' }}>
                {viewingPerson.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontFamily: 'var(--font-serif)', fontWeight: 500 }}>{viewingPerson.name}</h3>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{viewingPerson.relationship}</span>
              </div>
              <button className="btn btn-danger" style={{ marginLeft: 'auto', fontSize: '12px' }} onClick={() => handleDelete(viewingPerson.id)}>Delete</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Name</label>
                    <input value={viewingPerson.name} onChange={(e) => handleFieldUpdate(viewingPerson, 'name', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ width: '180px', marginBottom: 0 }}>
                    <label>Relationship</label>
                    <select value={viewingPerson.relationship} onChange={(e) => handleFieldUpdate(viewingPerson, 'relationship', e.target.value)}>
                      {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: '16px 20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Personality / Communication Style</label>
                  <textarea value={viewingPerson.personality} onChange={(e) => handleFieldUpdate(viewingPerson, 'personality', e.target.value)} placeholder="How would you describe their personality?" />
                </div>
              </div>

              <div className="card" style={{ padding: '16px 20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Current Dynamic</label>
                  <textarea value={viewingPerson.currentDynamic} onChange={(e) => handleFieldUpdate(viewingPerson, 'currentDynamic', e.target.value)} placeholder="What's the current state of this relationship?" />
                </div>
              </div>

              <div className="card" style={{ padding: '16px 20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Why They Matter</label>
                  <textarea value={viewingPerson.whyTheyMatter} onChange={(e) => handleFieldUpdate(viewingPerson, 'whyTheyMatter', e.target.value)} placeholder="Why is this person important in your life?" />
                </div>
              </div>

              <div className="card" style={{ padding: '16px 20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Writing Style</label>
                  <select value={viewingPerson.stylePreference} onChange={(e) => handleStyleChange(viewingPerson.id, e.target.value)}>
                    {STYLE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    How do you write to this person? Choose a style from your Style section.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '28px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>Notes about {viewingPerson.name}</h4>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder={`Add a note about ${viewingPerson.name}...`}
                  style={{ flex: 1, minHeight: '60px' }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddNote(viewingPerson.id) }}
                />
              </div>
              <button className="btn btn-primary" onClick={() => handleAddNote(viewingPerson.id)} disabled={!noteText.trim()} style={{ marginBottom: '16px' }}>
                Add Note
              </button>

              {viewingPerson.notes.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {viewingPerson.notes.map((note) => (
                    <div key={note.id} className="card" style={{ padding: '16px 20px' }}>
                      <div style={{ whiteSpace: 'pre-wrap', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '8px' }}>
                        {note.content}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <button className="btn btn-danger" style={{ padding: '3px 10px', fontSize: '11px' }} onClick={() => handleDeleteNote(viewingPerson.id, note.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {!adding && !viewingPerson && (
          <div className="topic-grid">
            <div className="topic-card add-card" onClick={() => setAdding(true)}>
              <span className="add-card-plus">+</span>
            </div>
            {state.people.map((person) => (
              <div
                key={person.id}
                className="topic-card completed"
                onClick={() => { setViewingId(person.id); setNoteText('') }}
              >
                <div className="person-card-avatar">
                  {person.name.charAt(0).toUpperCase()}
                </div>
                <span className="topic-label">{person.name}</span>
                <span className="topic-status">{person.relationship}</span>
                <button
                  className="topic-delete"
                  onClick={(e) => { e.stopPropagation(); handleDelete(person.id) }}
                >x</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
