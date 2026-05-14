import React, { useState } from 'react'
import { HeroBanner } from '../components/HeroBanner'
import { useApp } from '../context/AppContext'
import { generateProfile } from '../lib/anthropic'
import { v4 as uuid } from 'uuid'
import '../styles/profile.css'

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hup]|<li|<ul)(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '')
}

export function Profile() {
  const { state, dispatch } = useApp()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)

  const hasApiKey = state.settings.apiKey.trim().length > 0
  const profiles = state.profiles || []

  async function handleGenerate() {
    if (!hasApiKey || loading) return
    setLoading(true)
    setError('')
    try {
      const content = await generateProfile(state)
      const profile = {
        id: uuid(),
        content,
        generatedAt: new Date().toLocaleString(),
      }
      dispatch({ type: 'ADD_PROFILE', payload: profile })
      setViewingId(profile.id)
    } catch (err: any) {
      setError(err.message || 'Failed to generate profile')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy(content: string, id: string) {
    await navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function handleDelete(id: string, e?: React.MouseEvent) {
    if (e) e.stopPropagation()
    if (window.confirm('Delete this profile?')) {
      dispatch({ type: 'DELETE_PROFILE', payload: id })
      if (viewingId === id) setViewingId(null)
    }
  }

  const viewingProfile = viewingId ? profiles.find((p) => p.id === viewingId) : null

  return (
    <>
      <div className="screen-header">
        <h1>Profile</h1>
      </div>
      <HeroBanner
        variant="navy"
        title="Your Context Profile"
        subtitle="A synthesized picture of who you are and your world. Generate it from the information you've provided."
      />
      <div className="screen-content">
        {error && (
          <div style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '13px' }}>{error}</div>
        )}

        {loading && (
          <div className="loading-shimmer" style={{ marginBottom: '20px' }} />
        )}

        {!viewingProfile && !loading && (
          <div className="topic-grid">
            <div
              className="topic-card add-card"
              onClick={handleGenerate}
              style={!hasApiKey ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            >
              <span className="add-card-plus">+</span>
            </div>
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="topic-card completed"
                onClick={() => setViewingId(profile.id)}
              >
                <span className="topic-label">Context Profile</span>
                <span className="topic-status">{profile.generatedAt}</span>
                <button
                  className="topic-delete"
                  onClick={(e) => handleDelete(profile.id, e)}
                >x</button>
              </div>
            ))}
          </div>
        )}

        {viewingProfile && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
              <button className="btn btn-secondary" style={{ fontSize: '12px' }} onClick={() => setViewingId(null)}>
                &larr; Back
              </button>
              <button className="btn btn-secondary" style={{ fontSize: '12px' }} onClick={() => handleCopy(viewingProfile.content, viewingProfile.id)}>
                {copiedId === viewingProfile.id ? 'Copied!' : 'Copy'}
              </button>
              <button className="btn btn-danger" style={{ fontSize: '12px' }} onClick={() => handleDelete(viewingProfile.id)}>
                Delete
              </button>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto' }}>{viewingProfile.generatedAt}</span>
            </div>
            <div className="profile-card">
              <div className="profile-card-body" style={{ padding: '24px' }} dangerouslySetInnerHTML={{ __html: renderMarkdown(viewingProfile.content) }} />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
