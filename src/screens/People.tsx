import React, { useState } from 'react'
import { HeroBanner } from '../components/HeroBanner'
import { PersonCard } from '../components/PersonCard'
import { PersonForm } from '../components/PersonForm'
import { useApp } from '../context/AppContext'
import { Person } from '../types'

export function People() {
  const { state, dispatch } = useApp()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  function handleSave(person: Person) {
    if (editingId) {
      dispatch({ type: 'UPDATE_PERSON', payload: person })
      setEditingId(null)
    } else {
      dispatch({ type: 'ADD_PERSON', payload: person })
      setAdding(false)
    }
  }

  function handleDelete(id: string) {
    if (window.confirm('Remove this person?')) {
      dispatch({ type: 'DELETE_PERSON', payload: id })
    }
  }

  return (
    <>
      <div className="screen-header">
        <h1>People</h1>
        <button
          className="btn btn-primary"
          onClick={() => { setAdding(true); setEditingId(null) }}
          disabled={adding}
        >
          Add new
        </button>
      </div>
      <HeroBanner
        title="The people in your world"
        subtitle="Add the people who matter in your life to build richer context. Include relationship dynamics, communication styles, and what makes each person important."
      />
      <div className="screen-content">
        {adding && (
          <PersonForm
            onSave={handleSave}
            onCancel={() => setAdding(false)}
          />
        )}

        {state.people.length === 0 && !adding && (
          <div className="empty-state">
            <p>No people added yet. Add someone to build richer context.</p>
            <button className="btn btn-primary" onClick={() => setAdding(true)}>Add your first person</button>
          </div>
        )}

        {state.people.map((person) =>
          editingId === person.id ? (
            <PersonForm
              key={person.id}
              initial={person}
              onSave={handleSave}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <PersonCard
              key={person.id}
              person={person}
              onEdit={() => { setEditingId(person.id); setAdding(false) }}
              onDelete={() => handleDelete(person.id)}
            />
          )
        )}
      </div>
    </>
  )
}
