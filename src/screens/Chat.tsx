import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { sendChatMessage, buildChatSystemPrompt, ChatMessage } from '../lib/chat'
import { v4 as uuid } from 'uuid'
import '../styles/chat.css'

export function Chat() {
  const { state, dispatch } = useApp()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [apiMessages, setApiMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const hasApiKey = state.settings.apiKey.trim().length > 0

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function executeTool(name: string, toolInput: any): string {
    switch (name) {
      case 'add_free_text':
        dispatch({
          type: 'ADD_FREE_TEXT',
          payload: { id: uuid(), content: toolInput.content, createdAt: new Date().toISOString() },
        })
        return 'Free text entry added.'

      case 'add_person':
        dispatch({
          type: 'ADD_PERSON',
          payload: {
            id: uuid(),
            name: toolInput.name,
            relationship: toolInput.relationship,
            personality: toolInput.personality || '',
            currentDynamic: toolInput.currentDynamic || '',
            whyTheyMatter: toolInput.whyTheyMatter || '',
            notes: [],
            stylePreference: '',
          },
        })
        return `Person "${toolInput.name}" added.`

      case 'add_thing':
        dispatch({
          type: 'ADD_THING',
          payload: {
            id: uuid(),
            name: toolInput.name,
            category: toolInput.category,
            description: toolInput.description || '',
            currentDynamic: toolInput.currentDynamic || '',
            whyItMatters: toolInput.whyItMatters || '',
          },
        })
        return `Thing "${toolInput.name}" added.`

      case 'add_topic_entry':
        dispatch({
          type: 'ADD_TOPIC_ENTRY',
          payload: {
            key: toolInput.topic,
            entry: { id: uuid(), label: toolInput.label || 'Note', content: toolInput.content, createdAt: new Date().toISOString() },
          },
        })
        return `Entry added to topic "${toolInput.topic}".`

      case 'set_style': {
        const cat = toolInput.category
        if (toolInput.tone)
          dispatch({ type: 'SET_STYLE_FIELD', payload: { category: cat, field: 'tone', value: toolInput.tone } })
        if (toolInput.examples)
          dispatch({ type: 'SET_STYLE_FIELD', payload: { category: cat, field: 'examples', value: toolInput.examples } })
        if (toolInput.notes)
          dispatch({ type: 'SET_STYLE_FIELD', payload: { category: cat, field: 'notes', value: toolInput.notes } })
        return `Style "${cat}" updated.`
      }

      default:
        return `Unknown tool: ${name}`
    }
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || loading || !hasApiKey) return

    setInput('')
    setError('')

    const userMsg: ChatMessage = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])

    const newApiMessages = [...apiMessages, { role: 'user', content: text }]
    setLoading(true)

    try {
      const systemPrompt = buildChatSystemPrompt(state)
      const result = await sendChatMessage(state.settings.apiKey, systemPrompt, newApiMessages, executeTool)
      setApiMessages(result.newApiMessages)
      if (result.text) {
        setMessages((prev) => [...prev, { role: 'assistant', content: result.text }])
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="chat-screen">
      <div className="screen-header">
        <h1>AI Assistant</h1>
        {messages.length > 0 && (
          <button
            className="btn btn-secondary"
            onClick={() => {
              setMessages([])
              setApiMessages([])
              setError('')
            }}
          >
            Clear chat
          </button>
        )}
      </div>

      <div className="chat-messages">
        {messages.length === 0 && !loading && (
          <div className="chat-welcome">
            <h2>Talk to me about yourself</h2>
            <p>
              Tell me about your life, work, relationships, goals — anything at all. I'll organize it into your profile
              automatically.
            </p>
            <div className="chat-suggestions">
              <button
                onClick={() => {
                  setInput('I just started a new job as a ')
                  inputRef.current?.focus()
                }}
              >
                Tell me about your job
              </button>
              <button
                onClick={() => {
                  setInput('I met someone interesting recently — ')
                  inputRef.current?.focus()
                }}
              >
                Add a person
              </button>
              <button
                onClick={() => {
                  setInput('My main goals right now are ')
                  inputRef.current?.focus()
                }}
              >
                Share your goals
              </button>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`chat-message chat-message-${msg.role}`}>
            {msg.content}
          </div>
        ))}

        {loading && (
          <div className="chat-message chat-message-assistant chat-message-loading">
            <span className="chat-typing">
              <span />
              <span />
              <span />
            </span>
          </div>
        )}

        {error && <div className="chat-error">{error}</div>}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        {!hasApiKey ? (
          <div className="chat-no-key">Set your Anthropic API key in Settings to use the AI assistant.</div>
        ) : (
          <>
            <textarea
              ref={inputRef}
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Tell me about yourself..."
              rows={1}
              disabled={loading}
            />
            <button className="btn btn-primary chat-send" onClick={handleSend} disabled={!input.trim() || loading}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
