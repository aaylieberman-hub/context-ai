import React, { useState } from 'react'
import { useApp } from '../context/AppContext'

interface SettingsModalProps {
  onClose: () => void
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { state, dispatch } = useApp()
  const [key, setKey] = useState(state.settings.apiKey)
  const [showKey, setShowKey] = useState(false)

  function handleSave() {
    dispatch({ type: 'SET_API_KEY', payload: key })
    onClose()
  }

  const hasKey = key.trim().length > 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Settings</h3>
        <div className="form-group">
          <label>Anthropic API Key</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-ant-..."
              style={{ paddingRight: '60px' }}
            />
            <button
              onClick={() => setShowKey(!showKey)}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: hasKey ? 'var(--success)' : 'var(--danger)',
              display: 'inline-block',
            }}
          />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {hasKey ? 'API key set' : 'No API key set'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}
