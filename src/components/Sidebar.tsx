import React from 'react'
import { BrandMark } from './BrandMark'
import '../styles/sidebar.css'

interface SidebarProps {
  activeScreen: string
  onNavigate: (screen: string) => void
  onOpenSettings: () => void
  accountName: string
  onLogout: () => void
}

const ABOUT_SUB_SCREENS = ['about-topics', 'about-uploads']

export function Sidebar({ activeScreen, onNavigate, onOpenSettings, accountName, onLogout }: SidebarProps) {
  const aboutExpanded = ABOUT_SUB_SCREENS.includes(activeScreen)

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon"><BrandMark size={26} /></span>
        <h1>context<span className="dot-ai">.ai</span></h1>
        <span className="badge">Beta</span>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`sidebar-nav-item ${activeScreen === 'chat' ? 'active' : ''}`}
          onClick={() => onNavigate('chat')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          AI Assistant
        </button>

        <button
          className={`sidebar-nav-item ${aboutExpanded ? 'active' : ''}`}
          onClick={() => onNavigate(aboutExpanded ? activeScreen : 'about-topics')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
          </svg>
          About You
        </button>

        {aboutExpanded && (
          <div className="sidebar-sub-items">
            <button
              className={`sidebar-sub-item ${activeScreen === 'about-topics' ? 'active' : ''}`}
              onClick={() => onNavigate('about-topics')}
            >
              Topics
            </button>
            <button
              className={`sidebar-sub-item ${activeScreen === 'about-uploads' ? 'active' : ''}`}
              onClick={() => onNavigate('about-uploads')}
            >
              Uploads
            </button>
          </div>
        )}

        <button
          className={`sidebar-nav-item ${activeScreen === 'people' ? 'active' : ''}`}
          onClick={() => onNavigate('people')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="8" r="4" />
            <path d="M2 21c0-4 3-6 7-6s7 2 7 6" />
            <circle cx="17" cy="6" r="3" />
            <path d="M22 19c0-3-2-5-5-5" />
          </svg>
          People
        </button>

        <button
          className={`sidebar-nav-item ${activeScreen === 'things' ? 'active' : ''}`}
          onClick={() => onNavigate('things')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          </svg>
          Things
        </button>

        <button
          className={`sidebar-nav-item ${activeScreen === 'style' ? 'active' : ''}`}
          onClick={() => onNavigate('style')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 5h10M9 5v14M5 19h8" />
            <path d="M16 9l-4 10" />
            <circle cx="18" cy="10" r="2" />
          </svg>
          Style
        </button>

        <button
          className={`sidebar-nav-item ${activeScreen === 'freetext' ? 'active' : ''}`}
          onClick={() => onNavigate('freetext')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
          </svg>
          Free Text
        </button>

        <button
          className={`sidebar-nav-item ${activeScreen === 'profile' ? 'active' : ''}`}
          onClick={() => onNavigate('profile')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          Profile
        </button>
      </nav>

      <div className="sidebar-bottom">
        <button className="sidebar-nav-item" onClick={onOpenSettings}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
          </svg>
          Settings
        </button>
        <div className="sidebar-account" onClick={onLogout}>
          <div className="sidebar-account-avatar">
            {accountName.charAt(0).toUpperCase()}
          </div>
          <span className="sidebar-account-name">{accountName}</span>
          <button className="sidebar-account-logout" onClick={onLogout} title="Switch profile">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
