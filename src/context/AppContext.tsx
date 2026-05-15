import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import { AppState, AppAction, StylesState, TopicKey, TopicEntry, FreeTextEntry } from '../types'
import { saveUserState } from '../lib/firestore'

const TOPIC_KEYS: TopicKey[] = [
  'background', 'goals', 'currentProjects', 'communicationStyle',
  'values', 'petPeeves', 'tools', 'availability', 'decisionStyle',
]

export const defaultState: AppState = {
  aboutYou: {
    freeTexts: [],
    uploads: [],
    form: {
      name: '',
      pronouns: '',
      location: '',
      age: '',
      role: '',
      goals: '',
      communicationStyle: '',
      background: '',
      currentProjects: '',
      values: '',
      petPeeves: '',
      tools: '',
      availability: '',
      decisionStyle: '',
    },
    topics: {
      background: [],
      goals: [],
      currentProjects: [],
      communicationStyle: [],
      values: [],
      petPeeves: [],
      tools: [],
      availability: [],
      decisionStyle: [],
    },
    quizPrompt: '',
    quizQuestions: [],
  },
  people: [],
  things: [],
  snippets: [],
  styles: {
    personal: { label: '', tone: '', examples: '', notes: '' },
    work: { label: '', tone: '', examples: '', notes: '' },
    email: { label: '', tone: '', examples: '', notes: '' },
    social: { label: '', tone: '', examples: '', notes: '' },
    other: { label: '', tone: '', examples: '', notes: '' },
  } as StylesState,
  profiles: [],
  settings: {
    apiKey: '',
  },
}

function migrateTopics(raw: any): Record<TopicKey, TopicEntry[]> {
  const result: Record<string, TopicEntry[]> = {}
  for (const key of TOPIC_KEYS) {
    const val = raw?.[key]
    if (Array.isArray(val)) {
      result[key] = val
    } else if (val && typeof val === 'object' && val.content?.trim()) {
      result[key] = [{
        id: `migrated-${key}`,
        label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase()).trim(),
        content: val.content,
        createdAt: val.completedAt || new Date().toISOString(),
      }]
    } else {
      result[key] = []
    }
  }
  return result as Record<TopicKey, TopicEntry[]>
}

function migratePeople(raw: any[]): any[] {
  return raw.map((p) => ({
    ...p,
    notes: p.notes || [],
    stylePreference: p.stylePreference || '',
  }))
}

export function hydrateState(parsed: any): AppState {
  if (!parsed) return defaultState
  const aboutYou = parsed.aboutYou || {}
  let freeTexts: FreeTextEntry[] = aboutYou.freeTexts || []
  if (freeTexts.length === 0 && aboutYou.freeText?.trim()) {
    freeTexts = [{ id: 'migrated-1', content: aboutYou.freeText, createdAt: new Date().toISOString() }]
  }
  return {
    ...defaultState,
    ...parsed,
    aboutYou: {
      ...defaultState.aboutYou,
      ...aboutYou,
      freeTexts,
      form: { ...defaultState.aboutYou.form, ...(aboutYou.form || {}) },
      topics: migrateTopics(aboutYou.topics),
      uploads: aboutYou.uploads || [],
    },
    people: migratePeople(parsed.people || []),
    styles: { ...defaultState.styles, ...(parsed.styles || {}) },
  }
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_FREE_TEXT':
      return { ...state, aboutYou: { ...state.aboutYou, freeTexts: [...state.aboutYou.freeTexts, action.payload] } }
    case 'UPDATE_FREE_TEXT':
      return { ...state, aboutYou: { ...state.aboutYou, freeTexts: state.aboutYou.freeTexts.map((ft) => ft.id === action.payload.id ? action.payload : ft) } }
    case 'DELETE_FREE_TEXT':
      return { ...state, aboutYou: { ...state.aboutYou, freeTexts: state.aboutYou.freeTexts.filter((ft) => ft.id !== action.payload) } }
    case 'ADD_UPLOAD':
      return { ...state, aboutYou: { ...state.aboutYou, uploads: [...state.aboutYou.uploads, action.payload] } }
    case 'DELETE_UPLOAD':
      return { ...state, aboutYou: { ...state.aboutYou, uploads: state.aboutYou.uploads.filter((u) => u.id !== action.payload) } }
    case 'SET_FORM_FIELD':
      return {
        ...state,
        aboutYou: {
          ...state.aboutYou,
          form: { ...state.aboutYou.form, [action.payload.field]: action.payload.value },
        },
      }
    case 'ADD_TOPIC_ENTRY': {
      const entries = state.aboutYou.topics[action.payload.key]
      return {
        ...state,
        aboutYou: {
          ...state.aboutYou,
          topics: { ...state.aboutYou.topics, [action.payload.key]: [...entries, action.payload.entry] },
        },
      }
    }
    case 'UPDATE_TOPIC_ENTRY': {
      const entries = state.aboutYou.topics[action.payload.key]
      return {
        ...state,
        aboutYou: {
          ...state.aboutYou,
          topics: {
            ...state.aboutYou.topics,
            [action.payload.key]: entries.map((e) => e.id === action.payload.entry.id ? action.payload.entry : e),
          },
        },
      }
    }
    case 'DELETE_TOPIC_ENTRY': {
      const entries = state.aboutYou.topics[action.payload.key]
      return {
        ...state,
        aboutYou: {
          ...state.aboutYou,
          topics: {
            ...state.aboutYou.topics,
            [action.payload.key]: entries.filter((e) => e.id !== action.payload.entryId),
          },
        },
      }
    }
    case 'SET_QUIZ_PROMPT':
      return { ...state, aboutYou: { ...state.aboutYou, quizPrompt: action.payload } }
    case 'SET_QUIZ_QUESTIONS':
      return { ...state, aboutYou: { ...state.aboutYou, quizQuestions: action.payload } }
    case 'SET_QUIZ_ANSWER':
      return {
        ...state,
        aboutYou: {
          ...state.aboutYou,
          quizQuestions: state.aboutYou.quizQuestions.map((q) =>
            q.id === action.payload.id ? { ...q, answer: action.payload.answer } : q
          ),
        },
      }
    case 'ADD_PERSON':
      return { ...state, people: [...state.people, action.payload] }
    case 'UPDATE_PERSON':
      return {
        ...state,
        people: state.people.map((p) => (p.id === action.payload.id ? action.payload : p)),
      }
    case 'DELETE_PERSON':
      return { ...state, people: state.people.filter((p) => p.id !== action.payload) }
    case 'ADD_PERSON_NOTE':
      return {
        ...state,
        people: state.people.map((p) =>
          p.id === action.payload.personId
            ? { ...p, notes: [...p.notes, action.payload.note] }
            : p
        ),
      }
    case 'DELETE_PERSON_NOTE':
      return {
        ...state,
        people: state.people.map((p) =>
          p.id === action.payload.personId
            ? { ...p, notes: p.notes.filter((n) => n.id !== action.payload.noteId) }
            : p
        ),
      }
    case 'SET_PERSON_STYLE':
      return {
        ...state,
        people: state.people.map((p) =>
          p.id === action.payload.personId
            ? { ...p, stylePreference: action.payload.stylePreference }
            : p
        ),
      }
    case 'ADD_THING':
      return { ...state, things: [...state.things, action.payload] }
    case 'UPDATE_THING':
      return {
        ...state,
        things: state.things.map((t) => (t.id === action.payload.id ? action.payload : t)),
      }
    case 'DELETE_THING':
      return { ...state, things: state.things.filter((t) => t.id !== action.payload) }
    case 'ADD_PROFILE':
      return { ...state, profiles: [action.payload, ...state.profiles] }
    case 'DELETE_PROFILE':
      return { ...state, profiles: state.profiles.filter((p) => p.id !== action.payload) }
    case 'ADD_SNIPPET':
      return { ...state, snippets: [...state.snippets, action.payload] }
    case 'UPDATE_SNIPPET':
      return {
        ...state,
        snippets: state.snippets.map((s) => (s.id === action.payload.id ? action.payload : s)),
      }
    case 'DELETE_SNIPPET':
      return { ...state, snippets: state.snippets.filter((s) => s.id !== action.payload) }
    case 'SET_STYLE_FIELD':
      return {
        ...state,
        styles: {
          ...state.styles,
          [action.payload.category]: {
            ...state.styles[action.payload.category],
            [action.payload.field]: action.payload.value,
          },
        },
      }
    case 'SET_API_KEY':
      return { ...state, settings: { ...state.settings, apiKey: action.payload } }
    default:
      return state
  }
}

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children, uid, initialState }: { children: React.ReactNode; uid: string; initialState: AppState }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveUserState(uid, state).catch(() => {})
    }, 1000)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [state, uid])

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
