import React, { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { SettingsModal } from './components/SettingsModal'
import { AboutYou } from './screens/AboutYou'
import { People } from './screens/People'
import { Profile } from './screens/Profile'
import './styles/global.css'
import './styles/forms.css'

export function App() {
  const [activeScreen, setActiveScreen] = useState('about')
  const [showSettings, setShowSettings] = useState(false)

  return (
    <>
      <Sidebar
        activeScreen={activeScreen}
        onNavigate={setActiveScreen}
        onOpenSettings={() => setShowSettings(true)}
      />
      <div className="content-area">
        {activeScreen === 'about' && <AboutYou />}
        {activeScreen === 'people' && <People />}
        {activeScreen === 'profile' && <Profile />}
      </div>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  )
}
