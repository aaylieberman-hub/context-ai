import React from 'react'

interface SettingsModalProps {
  onClose: () => void
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Settings</h3>
        <p>Settings — coming soon</p>
        <button className="btn btn-secondary" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
