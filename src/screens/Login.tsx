import React, { useState } from 'react'
import { AccountProfile, LifeStage } from '../types'
import { getAccounts, createAccount, deleteAccount } from '../lib/accounts'
import '../styles/login.css'

interface LoginProps {
  onLogin: (account: AccountProfile) => void
}

const LIFE_STAGES: { value: LifeStage; label: string }[] = [
  { value: 'high-school', label: 'High School' },
  { value: 'college', label: 'College / University' },
  { value: 'working', label: 'Working' },
  { value: 'retired', label: 'Retired' },
  { value: 'unemployed', label: 'Between jobs' },
  { value: 'homemaker', label: 'Stay-at-home parent' },
  { value: 'other', label: 'Other' },
]

export function Login({ onLogin }: LoginProps) {
  const [accounts, setAccounts] = useState(getAccounts)
  const [creating, setCreating] = useState(accounts.length === 0)
  const [step, setStep] = useState(1)

  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [lifeStage, setLifeStage] = useState<LifeStage | null>(null)
  const [school, setSchool] = useState('')
  const [major, setMajor] = useState('')
  const [gradeYear, setGradeYear] = useState('')
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [otherDetail, setOtherDetail] = useState('')

  function handleCreate() {
    if (!name.trim() || !lifeStage) return
    const account = createAccount({
      name: name.trim(),
      age: age.trim(),
      lifeStage,
      stageDetails: {
        school: school.trim() || undefined,
        major: major.trim() || undefined,
        gradeYear: gradeYear.trim() || undefined,
        company: company.trim() || undefined,
        position: position.trim() || undefined,
        other: otherDetail.trim() || undefined,
      },
    })
    onLogin(account)
  }

  function handleSelect(account: AccountProfile) {
    onLogin(account)
  }

  function handleDelete(id: string) {
    if (!window.confirm('Delete this profile and all its data?')) return
    deleteAccount(id)
    const updated = getAccounts()
    setAccounts(updated)
    if (updated.length === 0) setCreating(true)
  }

  function startCreating() {
    setCreating(true)
    setStep(1)
    setName('')
    setAge('')
    setLifeStage(null)
    setSchool('')
    setMajor('')
    setGradeYear('')
    setCompany('')
    setPosition('')
    setOtherDetail('')
  }

  function canProceedStep1() {
    return name.trim().length > 0
  }

  function canProceedStep2() {
    return lifeStage !== null
  }

  function renderStageDetails() {
    if (!lifeStage) return null

    switch (lifeStage) {
      case 'high-school':
        return (
          <>
            <div className="form-group">
              <label>What school?</label>
              <input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="School name" autoFocus />
            </div>
            <div className="form-group">
              <label>What year?</label>
              <div className="login-choice-grid">
                {['Freshman', 'Sophomore', 'Junior', 'Senior'].map((yr) => (
                  <button key={yr} className={`login-choice-card ${gradeYear === yr ? 'selected' : ''}`} onClick={() => setGradeYear(yr)}>
                    {yr}
                  </button>
                ))}
              </div>
            </div>
          </>
        )
      case 'college':
        return (
          <>
            <div className="form-group">
              <label>What school?</label>
              <input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="University name" autoFocus />
            </div>
            <div className="form-group">
              <label>What's your major?</label>
              <input value={major} onChange={(e) => setMajor(e.target.value)} placeholder="e.g. Computer Science, Business..." />
            </div>
            <div className="form-group">
              <label>What year?</label>
              <div className="login-choice-grid">
                {['Freshman', 'Sophomore', 'Junior', 'Senior', 'Grad Student'].map((yr) => (
                  <button key={yr} className={`login-choice-card ${gradeYear === yr ? 'selected' : ''}`} onClick={() => setGradeYear(yr)}>
                    {yr}
                  </button>
                ))}
              </div>
            </div>
          </>
        )
      case 'working':
        return (
          <>
            <div className="form-group">
              <label>Where do you work?</label>
              <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" autoFocus />
            </div>
            <div className="form-group">
              <label>What's your role?</label>
              <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g. Product Manager, Engineer, Designer..." />
            </div>
          </>
        )
      case 'retired':
        return (
          <div className="form-group">
            <label>What did you do before? <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <input value={otherDetail} onChange={(e) => setOtherDetail(e.target.value)} placeholder="e.g. Teacher for 30 years" autoFocus />
          </div>
        )
      case 'unemployed':
        return (
          <div className="form-group">
            <label>What are you looking for? <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <input value={otherDetail} onChange={(e) => setOtherDetail(e.target.value)} placeholder="e.g. Software engineering roles" autoFocus />
          </div>
        )
      case 'homemaker':
        return (
          <div className="form-group">
            <label>Anything you'd like to add? <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <input value={otherDetail} onChange={(e) => setOtherDetail(e.target.value)} placeholder="e.g. Two kids, homeschooling" autoFocus />
          </div>
        )
      case 'other':
        return (
          <div className="form-group">
            <label>Tell us a bit more</label>
            <input value={otherDetail} onChange={(e) => setOtherDetail(e.target.value)} placeholder="What are you up to these days?" autoFocus />
          </div>
        )
    }
  }

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="login-brand">
          <svg className="login-brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <h1>context.ai</h1>
          <p>Your personal context builder</p>
        </div>

        {!creating && accounts.length > 0 && (
          <div className="login-section">
            <h2>Welcome back</h2>
            <p className="login-subtitle">Pick a profile to continue, or create a new one.</p>
            <div className="login-profiles">
              {accounts.map((account) => (
                <div key={account.id} className="login-profile-card" onClick={() => handleSelect(account)}>
                  <div className="login-profile-avatar">
                    {account.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="login-profile-info">
                    <span className="login-profile-name">{account.name}</span>
                    <span className="login-profile-role">
                      {account.lifeStage === 'working' && account.stageDetails?.position
                        ? `${account.stageDetails.position}${account.stageDetails.company ? ` at ${account.stageDetails.company}` : ''}`
                        : account.lifeStage === 'college' && account.stageDetails?.school
                        ? `${account.stageDetails.major || 'Student'} at ${account.stageDetails.school}`
                        : account.lifeStage === 'high-school' && account.stageDetails?.school
                        ? account.stageDetails.school
                        : LIFE_STAGES.find((s) => s.value === account.lifeStage)?.label || ''}
                    </span>
                  </div>
                  <button
                    className="login-profile-delete"
                    onClick={(e) => { e.stopPropagation(); handleDelete(account.id) }}
                    title="Delete profile"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <button className="btn btn-secondary" style={{ width: '100%', marginTop: '12px' }} onClick={startCreating}>
              Create new profile
            </button>
          </div>
        )}

        {creating && (
          <div className="login-section">
            {step === 1 && (
              <>
                <h2>Let's get started</h2>
                <p className="login-subtitle">First, the basics.</p>
                <div className="form-group">
                  <label>What's your name?</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && canProceedStep1() && setStep(2)}
                  />
                </div>
                <div className="form-group">
                  <label>How old are you? <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                  <input
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 25"
                    onKeyDown={(e) => e.key === 'Enter' && canProceedStep1() && setStep(2)}
                  />
                </div>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: '4px' }} onClick={() => setStep(2)} disabled={!canProceedStep1()}>
                  Continue
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <h2>Where are you at in life?</h2>
                <p className="login-subtitle">This helps us ask you the right questions.</p>
                <div className="login-stage-grid">
                  {LIFE_STAGES.map((stage) => (
                    <button
                      key={stage.value}
                      className={`login-stage-card ${lifeStage === stage.value ? 'selected' : ''}`}
                      onClick={() => { setLifeStage(stage.value); setStep(3) }}
                    >
                      <span className="login-stage-label">{stage.label}</span>
                    </button>
                  ))}
                </div>
                <button className="btn btn-secondary" style={{ width: '100%', marginTop: '8px' }} onClick={() => setStep(1)}>
                  Back
                </button>
              </>
            )}

            {step === 3 && lifeStage && (
              <>
                <h2>A few more details</h2>
                <p className="login-subtitle">You can always update these later.</p>
                {renderStageDetails()}
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(2)}>
                    Back
                  </button>
                  <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleCreate}>
                    Create profile
                  </button>
                </div>
              </>
            )}

            {accounts.length > 0 && step === 1 && (
              <button className="btn btn-secondary" style={{ width: '100%', marginTop: '8px' }} onClick={() => setCreating(false)}>
                Back to profiles
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
