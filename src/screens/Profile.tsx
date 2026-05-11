import React, { useState } from 'react'
import { HeroBanner } from '../components/HeroBanner'
import { useApp } from '../context/AppContext'
import { generateProfile } from '../lib/anthropic'
import '../styles/profile.css'

export function Profile() {
  const { state, dispatch } = useApp()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const hasApiKey = state.settings.apiKey.trim().length > 0
  const hasContent = state.profile.content.length > 0

  async function handleGenerate() {
    setLoading(true)
    setError('')
    try {
      const content = await generateProfile(state)
      dispatch({
        type: 'SET_PROFILE',
        payload: { content, generatedAt: new Date().toLocaleString() },
      })
    } catch (err: any) {
      setError(err.message || 'Failed to generate profile')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(state.profile.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleClear() {
    if (window.confirm('Clear the generated profile?')) {
      dispatch({ type: 'CLEAR_PROFILE' })
    }
  }

  return (
    <>
      <HeroBanner
        title="Your Context Profile"
        subtitle="A synthesized picture of who you are and your world."
      />
      <div className="screen-content">
        {!hasContent && !loading && (
          <div className="generate-container">
            <p>
              {hasApiKey
                ? "Ready to generate your context profile from the information you've provided."
                : 'Set your Anthropic API key in Settings to generate a profile.'}
            </p>
            <button
              className="btn btn-primary btn-large"
              onClick={handleGenerate}
              disabled={!hasApiKey || loading}
            >
              Generate Profile
            </button>
            {!hasApiKey && (
              <p className="api-key-notice">Go to Settings to add your API key.</p>
            )}
          </div>
        )}

        {loading && (
          <div>
            <button className="btn btn-primary btn-large" disabled>
              <span className="spinner" /> Generating...
            </button>
            <div className="loading-shimmer" style={{ marginTop: '24px' }} />
          </div>
        )}

        {error && (
          <div style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {hasContent && !loading && (
          <div className="profile-output">
            <div className="profile-actions">
              <button className="btn btn-secondary" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button className="btn btn-secondary" onClick={handleGenerate} disabled={!hasApiKey}>
                Regenerate
              </button>
              <button className="btn btn-danger" onClick={handleClear}>
                Clear
              </button>
              {state.profile.generatedAt && (
                <span className="timestamp">Generated on {state.profile.generatedAt}</span>
              )}
            </div>
            <textarea
              className="profile-content"
              value={state.profile.content}
              onChange={(e) =>
                dispatch({
                  type: 'SET_PROFILE',
                  payload: { content: e.target.value, generatedAt: state.profile.generatedAt || '' },
                })
              }
            />
          </div>
        )}
      </div>
    </>
  )
}
