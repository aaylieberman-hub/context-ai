import React, { useState, useRef } from 'react'
import { HeroBanner } from '../components/HeroBanner'
import { useApp } from '../context/AppContext'
import { TopicKey, UploadedFile, QuizQuestion } from '../types'
import { generateQuiz } from '../lib/anthropic'
import { v4 as uuid } from 'uuid'

const TOPICS: { key: TopicKey; label: string; prompt: string }[] = [
  { key: 'background', label: 'Background', prompt: 'my personal and professional background — where I come from, what shaped me' },
  { key: 'goals', label: 'Goals & Priorities', prompt: 'my current goals and what I\'m prioritizing in life right now' },
  { key: 'currentProjects', label: 'Current Projects', prompt: 'what I\'m actively working on right now — projects, initiatives, side hustles' },
  { key: 'communicationStyle', label: 'Communication', prompt: 'how I communicate — my style, preferences, what works and doesn\'t work for me' },
  { key: 'values', label: 'Values & Principles', prompt: 'my core values, what I believe in, what I won\'t compromise on' },
  { key: 'petPeeves', label: 'Pet Peeves', prompt: 'things that frustrate me, what I want an AI to avoid doing' },
  { key: 'tools', label: 'Tools & Platforms', prompt: 'the tools, apps, and platforms I use daily for work and life' },
  { key: 'availability', label: 'Schedule', prompt: 'my availability, when I work, time zone, boundaries around responsiveness' },
  { key: 'decisionStyle', label: 'Decision Making', prompt: 'how I make decisions — do I need data, go with gut, talk it through' },
]

interface AboutYouProps {
  section: 'freetext' | 'uploads' | 'topics'
}

export function AboutYou({ section }: AboutYouProps) {
  if (section === 'freetext') return <FreeTextSection />
  if (section === 'uploads') return <UploadsSection />
  return <TopicsSection />
}

function FreeTextSection() {
  const { state, dispatch } = useApp()
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  function handleAdd() {
    if (!draft.trim()) return
    dispatch({
      type: 'ADD_FREE_TEXT',
      payload: { id: uuid(), content: draft.trim(), createdAt: new Date().toISOString() },
    })
    setDraft('')
  }

  function handleSaveEdit() {
    if (!editingId || !editText.trim()) return
    const existing = state.aboutYou.freeTexts.find((ft) => ft.id === editingId)
    if (existing) {
      dispatch({ type: 'UPDATE_FREE_TEXT', payload: { ...existing, content: editText.trim() } })
    }
    setEditingId(null)
    setEditText('')
  }

  function handleDelete(id: string) {
    if (window.confirm('Delete this entry?')) {
      dispatch({ type: 'DELETE_FREE_TEXT', payload: id })
    }
  }

  return (
    <>
      <div className="screen-header">
        <h1>Free Text</h1>
      </div>
      <HeroBanner
        title="Write anything about yourself"
        subtitle="Add entries about who you are — your bio, goals, preferences, thoughts. Each entry is saved separately."
      />
      <div className="screen-content">
        <div className="form-group">
          <textarea
            className="large"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write something about yourself — your background, what you're working on, how you think..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAdd()
            }}
          />
        </div>
        <button
          className="btn btn-primary"
          onClick={handleAdd}
          disabled={!draft.trim()}
          style={{ marginBottom: '32px' }}
        >
          Add Entry
        </button>

        {state.aboutYou.freeTexts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {state.aboutYou.freeTexts.map((entry) => (
              <div key={entry.id} className="card" style={{ padding: '16px 20px' }}>
                {editingId === entry.id ? (
                  <>
                    <textarea
                      className="large"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      autoFocus
                      style={{ marginBottom: '8px' }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-primary" onClick={handleSaveEdit}>Save</button>
                      <button className="btn btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '10px' }}>
                      {entry.content}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-secondary" style={{ padding: '3px 10px', fontSize: '11px' }} onClick={() => { setEditingId(entry.id); setEditText(entry.content) }}>Edit</button>
                        <button className="btn btn-danger" style={{ padding: '3px 10px', fontSize: '11px' }} onClick={() => handleDelete(entry.id)}>Delete</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {state.aboutYou.freeTexts.length === 0 && (
          <div className="empty-state">
            <p>No entries yet. Write something above and click "Add Entry" to save it.</p>
          </div>
        )}
      </div>
    </>
  )
}

function UploadsSection() {
  const { state, dispatch } = useApp()
  const [uploadName, setUploadName] = useState('')
  const [uploadDocType, setUploadDocType] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleUploadSubmit() {
    if (!uploadFile || !uploadName.trim()) return
    setUploading(true)
    try {
      let content = ''
      const ext = uploadFile.name.split('.').pop()?.toLowerCase()
      if (ext === 'doc' || ext === 'docx') {
        const mammoth = await import('mammoth')
        const arrayBuffer = await uploadFile.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        content = result.value
      } else if (ext === 'pdf') {
        content = `[PDF file: ${uploadFile.name}]`
      } else {
        content = await uploadFile.text()
      }
      const upload: UploadedFile = {
        id: uuid(),
        name: uploadName.trim(),
        documentType: uploadDocType.trim(),
        description: uploadDescription.trim(),
        content,
        uploadedAt: new Date().toISOString(),
      }
      dispatch({ type: 'ADD_UPLOAD', payload: upload })
      setUploadName('')
      setUploadDocType('')
      setUploadDescription('')
      setUploadFile(null)
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <div className="screen-header">
        <h1>Uploads</h1>
      </div>
      <HeroBanner
        variant="teal"
        title="Your uploaded documents"
        subtitle="Upload files that tell your story — resumes, bios, journal entries, cover letters."
      />
      <div className="screen-content">
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: '20px', marginBottom: '28px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Upload a new file</h3>
          <div className="form-group">
            <label>Name this file *</label>
            <input value={uploadName} onChange={(e) => setUploadName(e.target.value)} placeholder="e.g. My resume, Journal entry, Cover letter..." />
          </div>
          <div className="form-group">
            <label>Document type <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <input value={uploadDocType} onChange={(e) => setUploadDocType(e.target.value)} placeholder="e.g. Resume, journal, bio, notes..." />
          </div>
          <div className="form-group">
            <label>Choose a file *</label>
            <div className={`file-upload-zone ${uploadFile ? 'has-file' : ''}`} onClick={() => fileInputRef.current?.click()}>
              {uploadFile ? (
                <p style={{ fontWeight: 500 }}>{uploadFile.name}</p>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p>Click to choose a file</p>
                  <p className="accepted">.txt, .md, .doc, .docx, .pdf</p>
                </>
              )}
              <input ref={fileInputRef} type="file" accept=".txt,.md,.doc,.docx,.pdf,.json,.csv,.rtf" onChange={(e) => { const file = e.target.files?.[0]; if (file) setUploadFile(file) }} style={{ display: 'none' }} />
            </div>
          </div>
          <div className="form-group">
            <label>Description <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <textarea value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)} placeholder="What is this document about?" />
          </div>
          <button className="btn btn-primary" onClick={handleUploadSubmit} disabled={!uploadFile || !uploadName.trim() || uploading}>
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>

        {state.aboutYou.uploads.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {state.aboutYou.uploads.map((upload) => {
              const isOpen = expandedId === upload.id
              return (
                <div
                  key={upload.id}
                  className="card"
                  style={{ padding: '16px 20px', cursor: 'pointer' }}
                  onClick={() => setExpandedId(isOpen ? null : upload.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{upload.name}</span>
                    {isOpen && (
                      <button className="btn btn-danger" style={{ padding: '3px 10px', fontSize: '11px' }} onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete this upload?')) dispatch({ type: 'DELETE_UPLOAD', payload: upload.id }) }}>Delete</button>
                    )}
                  </div>
                  {isOpen && (
                    <>
                      {upload.documentType && <span className="pill" style={{ marginTop: '8px' }}>{upload.documentType}</span>}
                      {upload.description && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>{upload.description}</p>}
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '8px' }}>
                        {new Date(upload.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {state.aboutYou.uploads.length === 0 && (
          <div className="empty-state">
            <p>No files uploaded yet. Use the form above to add your first document.</p>
          </div>
        )}
      </div>
    </>
  )
}

function TopicsSection() {
  const { state, dispatch } = useApp()
  const [activeTopic, setActiveTopic] = useState<TopicKey | null>(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizError, setQuizError] = useState('')
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [writing, setWriting] = useState(false)
  const [writeLabel, setWriteLabel] = useState('')
  const [writeText, setWriteText] = useState('')
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [showAddMenu, setShowAddMenu] = useState(false)

  async function handleStartQuiz(topicKey: TopicKey) {
    const topic = TOPICS.find((t) => t.key === topicKey)
    if (!topic || !state.settings.apiKey.trim()) return
    setQuizLoading(true)
    setQuizError('')
    setQuizQuestions([])
    try {
      const questions = await generateQuiz(state.settings.apiKey, topic.prompt)
      setQuizQuestions(questions)
    } catch (err: any) {
      setQuizError(err.message || 'Failed to generate quiz')
    } finally {
      setQuizLoading(false)
    }
  }

  function handleSaveQuiz(topicKey: TopicKey) {
    const answered = quizQuestions.filter((q) => q.answer?.trim())
    const summary = answered.map((q) => `${q.question}: ${q.answer}`).join('\n\n')
    dispatch({
      type: 'ADD_TOPIC_ENTRY',
      payload: {
        key: topicKey,
        entry: { id: uuid(), label: 'Quiz answers', content: summary, createdAt: new Date().toISOString() },
      },
    })
    setQuizQuestions([])
  }

  function handleSaveWrite(topicKey: TopicKey) {
    if (!writeText.trim()) return
    dispatch({
      type: 'ADD_TOPIC_ENTRY',
      payload: {
        key: topicKey,
        entry: { id: uuid(), label: writeLabel.trim() || 'Note', content: writeText.trim(), createdAt: new Date().toISOString() },
      },
    })
    setWriting(false)
    setWriteLabel('')
    setWriteText('')
  }

  function handleSaveEdit(topicKey: TopicKey) {
    if (!editingEntryId || !editText.trim()) return
    const entries = state.aboutYou.topics[topicKey]
    const entry = entries.find((e) => e.id === editingEntryId)
    if (entry) {
      dispatch({ type: 'UPDATE_TOPIC_ENTRY', payload: { key: topicKey, entry: { ...entry, content: editText.trim() } } })
    }
    setEditingEntryId(null)
    setEditText('')
  }

  function handleDeleteEntry(topicKey: TopicKey, entryId: string) {
    if (window.confirm('Delete this entry?')) {
      dispatch({ type: 'DELETE_TOPIC_ENTRY', payload: { key: topicKey, entryId } })
    }
  }

  function handleOpenTopic(topicKey: TopicKey) {
    setActiveTopic(topicKey)
    setQuizQuestions([])
    setWriting(false)
    setWriteLabel('')
    setWriteText('')
    setEditingEntryId(null)
    setQuizError('')
  }

  function handleAddClick() {
    const firstEmpty = TOPICS.find((t) => state.aboutYou.topics[t.key].length === 0)
    handleOpenTopic(firstEmpty ? firstEmpty.key : TOPICS[0].key)
  }

  return (
    <>
      <div className="screen-header">
        <h1>Topics</h1>
      </div>
      <HeroBanner
        variant="sage"
        title="Build your context"
        subtitle="Take a quick quiz or write your own answers for each topic. The more you fill in, the better your profile."
      />
      <div className="screen-content">
        {!activeTopic && (
          <div className="topic-grid">
            <div className="topic-card add-card" onClick={handleAddClick}>
              <span className="add-card-plus">+</span>
            </div>
            {TOPICS.map((topic) => {
              const entries = state.aboutYou.topics[topic.key]
              const done = entries.length > 0
              return (
                <div
                  key={topic.key}
                  className={`topic-card ${done ? 'completed' : ''}`}
                  onClick={() => handleOpenTopic(topic.key)}
                >
                  <span className="topic-label">{topic.label}</span>
                  <span className="topic-status">
                    {done ? `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}` : 'Not started'}
                  </span>
                  {done && <span className="topic-check">&#10003;</span>}
                </div>
              )
            })}
          </div>
        )}

        {activeTopic && (() => {
          const topic = TOPICS.find((t) => t.key === activeTopic)!
          const entries = state.aboutYou.topics[activeTopic]

          return (
            <div>
              <button className="btn btn-secondary" style={{ marginBottom: '16px', fontSize: '12px' }} onClick={() => setActiveTopic(null)}>
                &larr; Back
              </button>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px' }}>{topic.label}</h3>
                <div style={{ position: 'relative' }}>
                  <button
                    className="add-entry-btn"
                    onClick={() => setShowAddMenu((v) => !v)}
                    title="Add entry"
                  >
                    +
                  </button>
                  {showAddMenu && (
                    <div className="add-entry-menu">
                      <button onClick={() => { setShowAddMenu(false); setWriting(true); setWriteLabel(''); setWriteText('') }}>
                        Write it myself
                      </button>
                      <button
                        onClick={() => { setShowAddMenu(false); handleStartQuiz(activeTopic) }}
                        disabled={!state.settings.apiKey.trim() || quizLoading}
                      >
                        Take a quiz
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {!state.settings.apiKey.trim() && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>Quiz requires an API key — go to Settings.</p>}

              {writing && (
                <div className="card" style={{ padding: '16px 20px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label>Label</label>
                    <input value={writeLabel} onChange={(e) => setWriteLabel(e.target.value)} placeholder="Give this entry a name..." />
                  </div>
                  <div className="form-group">
                    <label>Content</label>
                    <textarea className="large" value={writeText} onChange={(e) => setWriteText(e.target.value)} placeholder="Write your thoughts..." autoFocus />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={() => setWriting(false)}>Cancel</button>
                    <button className="btn btn-primary" onClick={() => handleSaveWrite(activeTopic)} disabled={!writeText.trim()}>Save</button>
                  </div>
                </div>
              )}

              {quizLoading && (
                <div style={{ marginBottom: '16px' }}>
                  <button className="btn btn-primary" disabled><span className="spinner" /> Generating quiz...</button>
                  <div className="loading-shimmer" style={{ marginTop: '16px' }} />
                </div>
              )}

              {quizError && <div style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '13px' }}>{quizError}</div>}

              {quizQuestions.length > 0 && !quizLoading && (
                <div style={{ marginBottom: '16px' }}>
                  {quizQuestions.map((q, i) => (
                    <div className="card" key={q.id} style={{ marginBottom: '12px', padding: '16px 20px' }}>
                      <label style={{ fontWeight: 500, marginBottom: '10px', display: 'block' }}>{i + 1}. {q.question}</label>
                      {q.type === 'multiple-choice' && q.options ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {q.options.map((opt) => (
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
                  <button className="btn btn-primary" onClick={() => handleSaveQuiz(activeTopic)}>Save Answers</button>
                </div>
              )}

              {entries.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {entries.map((entry) => (
                    <div key={entry.id} className="card" style={{ padding: '16px 20px' }}>
                      {editingEntryId === entry.id ? (
                        <>
                          <textarea className="large" value={editText} onChange={(e) => setEditText(e.target.value)} autoFocus style={{ marginBottom: '8px' }} />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-primary" onClick={() => handleSaveEdit(activeTopic)}>Save</button>
                            <button className="btn btn-secondary" onClick={() => setEditingEntryId(null)}>Cancel</button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{entry.label}</span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button className="btn btn-secondary" style={{ padding: '3px 10px', fontSize: '11px' }} onClick={() => { setEditingEntryId(entry.id); setEditText(entry.content) }}>Edit</button>
                              <button className="btn btn-danger" style={{ padding: '3px 10px', fontSize: '11px' }} onClick={() => handleDeleteEntry(activeTopic, entry.id)}>Delete</button>
                            </div>
                          </div>
                          <div style={{ whiteSpace: 'pre-wrap', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            {entry.content}
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '8px' }}>
                            {new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {entries.length === 0 && !writing && quizQuestions.length === 0 && !quizLoading && (
                <div className="empty-state">
                  <p>No entries yet. Take a quiz or write your own to get started.</p>
                </div>
              )}
            </div>
          )
        })()}
      </div>
    </>
  )
}
