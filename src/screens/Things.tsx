import React, { useState } from 'react'
import { HeroBanner } from '../components/HeroBanner'
import { ThingForm } from '../components/ThingForm'
import { useApp } from '../context/AppContext'
import { Thing } from '../types'

export function Things() {
  const { state, dispatch } = useApp()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  function handleSave(thing: Thing) {
    if (editingId) {
      dispatch({ type: 'UPDATE_THING', payload: thing })
      setEditingId(null)
    } else {
      dispatch({ type: 'ADD_THING', payload: thing })
      setAdding(false)
    }
  }

  function handleDelete(id: string) {
    if (window.confirm('Remove this thing?')) {
      dispatch({ type: 'DELETE_THING', payload: id })
    }
  }

  return (
    <>
      <div className="screen-header">
        <h1>Things</h1>
      </div>
      <HeroBanner
        variant="dark"
        title="Companies, orgs, and things that matter"
        subtitle="Track the important entities in your life — workplaces, schools, tools, communities, and more."
      />
      <div className="screen-content">
        {(adding || editingId) && (
          <ThingForm
            initial={editingId ? state.things.find((t) => t.id === editingId) : undefined}
            onSave={handleSave}
            onCancel={() => { setAdding(false); setEditingId(null) }}
          />
        )}

        {!adding && !editingId && (
          <div className="topic-grid">
            <div className="topic-card add-card" onClick={() => setAdding(true)}>
              <span className="add-card-plus">+</span>
            </div>
            {state.things.map((thing) => (
              <div
                key={thing.id}
                className="topic-card completed"
                onClick={() => { setEditingId(thing.id); setAdding(false) }}
              >
                <div className="person-card-avatar">
                  {thing.name.charAt(0).toUpperCase()}
                </div>
                <span className="topic-label">{thing.name}</span>
                <span className="topic-status">{thing.category}</span>
                <button
                  className="topic-delete"
                  onClick={(e) => { e.stopPropagation(); handleDelete(thing.id) }}
                >x</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
