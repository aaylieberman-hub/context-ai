import React, { useState, useEffect } from 'react'
import { onAuthStateChanged, User, signOut } from 'firebase/auth'
import { auth } from './lib/firebase'
import { loadUserState } from './lib/firestore'
import { AppProvider, defaultState, hydrateState } from './context/AppContext'
import { useApp } from './context/AppContext'
import { Sidebar } from './components/Sidebar'
import { SettingsModal } from './components/SettingsModal'
import { AboutYou } from './screens/AboutYou'
import { People } from './screens/People'
import { Things } from './screens/Things'
import { Profile } from './screens/Profile'
import { Style } from './screens/Style'
import { Login } from './screens/Login'
import { Chat } from './screens/Chat'
import { AppState } from './types'
import './styles/global.css'
import './styles/forms.css'

function MainApp({ user, initialState }: { user: User; initialState: AppState }) {
  const [activeScreen, setActiveScreen] = useState('chat')
  const [showSettings, setShowSettings] = useState(false)

  function handleLogout() {
    signOut(auth)
  }

  const displayName = user.displayName || user.email || 'User'

  return (
    <AppProvider uid={user.uid} initialState={initialState}>
      <Sidebar
        activeScreen={activeScreen}
        onNavigate={setActiveScreen}
        onOpenSettings={() => setShowSettings(true)}
        accountName={displayName}
        onLogout={handleLogout}
      />
      <div className="content-area">
        {activeScreen === 'chat' && <Chat />}
        {activeScreen === 'about-topics' && <AboutYou section="topics" />}
        {activeScreen === 'about-uploads' && <AboutYou section="uploads" />}
        {activeScreen === 'people' && <People />}
        {activeScreen === 'things' && <Things />}
        {activeScreen === 'style' && <Style />}
        {activeScreen === 'freetext' && <AboutYou section="freetext" />}
        {activeScreen === 'profile' && <Profile />}
      </div>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </AppProvider>
  )
}

export function App() {
  const [user, setUser] = useState<User | null>(null)
  const [initialState, setInitialState] = useState<AppState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const saved = await loadUserState(firebaseUser.uid)
        setInitialState(saved ? hydrateState(saved) : defaultState)
        setUser(firebaseUser)
      } else {
        setUser(null)
        setInitialState(null)
      }
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)', fontSize: '14px' }}>
        Loading...
      </div>
    )
  }

  if (!user || !initialState) {
    return <Login />
  }

  return <MainApp key={user.uid} user={user} initialState={initialState} />
}
