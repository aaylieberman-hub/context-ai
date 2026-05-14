import React, { useState, useEffect } from 'react'
import { AppProvider } from './context/AppContext'
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
import { AccountProfile } from './types'
import { getAccounts, getActiveAccountId, setActiveAccount, clearActiveAccount, migrateOldData } from './lib/accounts'
import './styles/global.css'
import './styles/forms.css'

function AccountSync({ account }: { account: AccountProfile }) {
  const { state, dispatch } = useApp()
  useEffect(() => {
    if (!state.aboutYou.form.name && account.name) {
      dispatch({ type: 'SET_FORM_FIELD', payload: { field: 'name', value: account.name } })
    }
    if (!state.aboutYou.form.age && account.age) {
      dispatch({ type: 'SET_FORM_FIELD', payload: { field: 'age', value: account.age } })
    }
    const details = account.stageDetails || {}
    if (!state.aboutYou.form.role) {
      const role = details.position
        ? `${details.position}${details.company ? ` at ${details.company}` : ''}`
        : details.major
        ? `${details.major} student${details.school ? ` at ${details.school}` : ''}`
        : details.school
        ? `Student at ${details.school}`
        : ''
      if (role) dispatch({ type: 'SET_FORM_FIELD', payload: { field: 'role', value: role } })
    }
  }, [])
  return null
}

function MainApp({ account, onLogout }: { account: AccountProfile; onLogout: () => void }) {
  const [activeScreen, setActiveScreen] = useState('chat')
  const [showSettings, setShowSettings] = useState(false)

  return (
    <AppProvider accountId={account.id}>
      <AccountSync account={account} />
      <Sidebar
        activeScreen={activeScreen}
        onNavigate={setActiveScreen}
        onOpenSettings={() => setShowSettings(true)}
        accountName={account.name}
        onLogout={onLogout}
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
  const [account, setAccount] = useState<AccountProfile | null>(null)

  useEffect(() => {
    const migrated = migrateOldData()
    if (migrated) {
      setAccount(migrated)
      return
    }
    const activeId = getActiveAccountId()
    if (activeId) {
      const found = getAccounts().find((a) => a.id === activeId)
      if (found) setAccount(found)
    }
  }, [])

  function handleLogin(acc: AccountProfile) {
    setActiveAccount(acc.id)
    setAccount(acc)
  }

  function handleLogout() {
    clearActiveAccount()
    setAccount(null)
  }

  if (!account) {
    return <Login onLogin={handleLogin} />
  }

  return <MainApp key={account.id} account={account} onLogout={handleLogout} />
}
