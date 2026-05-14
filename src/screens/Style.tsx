import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { HeroBanner } from '../components/HeroBanner'
import { StyleCategory, QuizQuestion } from '../types'
import { generateQuiz } from '../lib/anthropic'

const CATEGORIES: { value: StyleCategory; label: string; quizPrompt: string }[] = [
  { value: 'personal', label: 'Personal messages', quizPrompt: 'how I write personal messages to friends and family — my casual voice, tone, habits' },
  { value: 'work', label: 'Work messages', quizPrompt: 'how I write at work — emails to colleagues, Slack messages, meeting notes, my professional voice' },
  { value: 'email', label: 'Email', quizPrompt: 'my email writing style — how formal I am, how I structure emails, greetings and sign-offs I use' },
  { value: 'social', label: 'Social media', quizPrompt: 'how I write on social media — my posting style, tone, what I share and how' },
  { value: 'other', label: 'Other', quizPrompt: 'my writing style in other contexts' },
]

type StyleView = 'home' | { category: StyleCategory }

export function Style() {
  const { state, dispatch } = useApp()
  const [view, setView] = useState<StyleView>('home')
  const [saved, setSaved] = useState(false)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizError, setQuizError] = useState('')
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [showAddMenu, setShowAddMenu] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleStartQuiz(category: StyleCategory) {
    const cat = CATEGORIES.find((c) => c.value === category)
    if (!cat || !state.settings.apiKey.trim()) return
    setQuizLoading(true)
    setQuizError('')
    setQuizQuestions([])
    try {
      const questions = await generateQuiz(state.settings.apiKey, cat.quizPrompt)
      setQuizQuestions(questions)
    } catch (err: any) {
      setQuizError(err.message || 'Failed to generate quiz')
    } finally {
      setQuizLoading(false)
    }
  }

  function handleSaveQuizAnswers(category: StyleCategory) {
    const answered = quizQuestions.filter((q) => q.answer?.trim())
    const summary = answered.map((q) => `${q.question}: ${q.answer}`).join('\n')
    dispatch({ type: 'SET_STYLE_FIELD', payload: { category, field: 'tone', value: summary } })
    setQuizQuestions([])
    setView('home')
  }

  const currentCategory = typeof view === 'object' ? view.category : null
  const entry = currentCategory ? state.styles[currentCategory] : null
  const hasFilled = (cat: StyleCategory) => {
    const e = state.styles[cat]
    return !!(e.tone || e.examples || e.notes)
  }

  const [showCategoryPicker, setShowCategoryPicker] = useState(false)

  function handleAddClick() {
    setShowCategoryPicker((v) => !v)
  }

  function handlePickCategory(category: StyleCategory) {
    setShowCategoryPicker(false)
    setView({ category })
    setQuizQuestions([])
    setQuizError('')
  }

  return (
    <>
      <div className="screen-header">
        <h1>Style</h1>
      </div>
      <HeroBanner
        variant="rose"
        title="Make AI sound like you"
        subtitle="Define your writing style across different contexts."
      />
      <div className="screen-content">
        {view === 'home' && (
          <div className="topic-grid">
            <div className="topic-card add-card" onClick={handleAddClick} style={{ position: 'relative' }}>
              <span className="add-card-plus">+</span>
              {showCategoryPicker && (
                <div className="add-entry-menu" style={{ top: '50%', left: '50%', transform: 'translate(-50%, 8px)' }} onClick={(e) => e.stopPropagation()}>
                  {CATEGORIES.filter((c) => !hasFilled(c.value)).map((cat) => (
                    <button key={cat.value} onClick={() => handlePickCategory(cat.value)}>
                      {cat.label}
                    </button>
                  ))}
                  {CATEGORIES.every((c) => hasFilled(c.value)) && (
                    <button onClick={() => handlePickCategory('other')}>Other</button>
                  )}
                </div>
              )}
            </div>
            {CATEGORIES.map((cat) => {
              const filled = hasFilled(cat.value)
              return (
                <div
                  key={cat.value}
                  className={`topic-card ${filled ? 'completed' : ''}`}
                  onClick={() => { setView({ category: cat.value }); setQuizQuestions([]); setQuizError('') }}
                >
                  <span className="topic-label">{cat.label}</span>
                  <span className="topic-status">{filled ? 'Filled' : 'Not started'}</span>
                  {filled && <span className="topic-check">&#10003;</span>}
                </div>
              )
            })}
          </div>
        )}

        {currentCategory && entry && (
          <div>
            <button className="btn btn-secondary" style={{ marginBottom: '16px', fontSize: '12px' }} onClick={() => { setView('home'); setQuizQuestions([]); setShowAddMenu(false) }}>
              &larr; Back
            </button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px' }}>{CATEGORIES.find((c) => c.value === currentCategory)?.label}</h3>
              <div style={{ position: 'relative' }}>
                <button
                  className="add-entry-btn"
                  onClick={() => setShowAddMenu((v) => !v)}
                  title="Add style info"
                >
                  +
                </button>
                {showAddMenu && (
                  <div className="add-entry-menu">
                    <button onClick={() => { setShowAddMenu(false); handleStartQuiz(currentCategory) }} disabled={!state.settings.apiKey.trim() || quizLoading}>
                      Take a quiz
                    </button>
                  </div>
                )}
              </div>
            </div>

            {!state.settings.apiKey.trim() && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>Quiz requires an API key — go to Settings.</p>}

            {quizQuestions.length === 0 && !quizLoading && (
              <>
                {currentCategory === 'other' && (
                  <div className="form-group">
                    <label>What is this style for?</label>
                    <input
                      value={entry.label}
                      onChange={(e) => dispatch({ type: 'SET_STYLE_FIELD', payload: { category: currentCategory, field: 'label', value: e.target.value } })}
                      placeholder="e.g. Slack DMs, blog posts, cover letters..."
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Tone & Voice</label>
                  <textarea
                    value={entry.tone}
                    onChange={(e) => dispatch({ type: 'SET_STYLE_FIELD', payload: { category: currentCategory, field: 'tone', value: e.target.value } })}
                    placeholder="How do you sound in this context?"
                  />
                </div>
                <div className="form-group">
                  <label>Example Messages</label>
                  <textarea className="large"
                    value={entry.examples}
                    onChange={(e) => dispatch({ type: 'SET_STYLE_FIELD', payload: { category: currentCategory, field: 'examples', value: e.target.value } })}
                    placeholder="Paste some real messages..."
                  />
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={entry.notes}
                    onChange={(e) => dispatch({ type: 'SET_STYLE_FIELD', payload: { category: currentCategory, field: 'notes', value: e.target.value } })}
                    placeholder="Pet phrases, things you avoid..."
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button className="btn btn-primary" onClick={handleSave}>{saved ? 'Saved!' : 'Save'}</button>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Auto-saved as you type</span>
                </div>
              </>
            )}

            {quizLoading && (
              <div>
                <button className="btn btn-primary" disabled><span className="spinner" /> Generating quiz...</button>
                <div className="loading-shimmer" style={{ marginTop: '16px' }} />
              </div>
            )}

            {quizError && <div style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '13px' }}>{quizError}</div>}

            {quizQuestions.length > 0 && !quizLoading && (
              <div>
                {quizQuestions.map((q: any, i: number) => (
                  <div className="card" key={q.id} style={{ marginBottom: '12px', padding: '16px 20px' }}>
                    <label style={{ fontWeight: 500, marginBottom: '10px', display: 'block' }}>{i + 1}. {q.question}</label>
                    {q.type === 'multiple-choice' && q.options ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {q.options.map((opt: string) => (
                          <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${q.answer === opt ? 'var(--accent)' : 'var(--card-border)'}`, background: q.answer === opt ? 'var(--accent-light)' : 'transparent', cursor: 'pointer', fontSize: '13px' }}>
                            <input type="radio" name={q.id} checked={q.answer === opt} onChange={() => setQuizQuestions((prev) => prev.map((pq) => pq.id === q.id ? { ...pq, answer: opt } : pq))} style={{ accentColor: 'var(--accent)' }} />
                            {opt}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <textarea value={q.answer || ''} onChange={(e) => setQuizQuestions((prev) => prev.map((pq) => pq.id === q.id ? { ...pq, answer: e.target.value } : pq))} placeholder="Your answer..." />
                    )}
                  </div>
                ))}
                <button className="btn btn-primary" onClick={() => handleSaveQuizAnswers(currentCategory)}>Save Answers</button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
