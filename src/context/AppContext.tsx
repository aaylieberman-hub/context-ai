import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { AppState, AppAction } from '../types'

const STORAGE_KEY = 'context-ai-state'

const defaultState: AppState = {
  aboutYou: {
    freeText: '',
    uploadedText: '',
    uploadedFileName: '',
    form: {
      name: '',
      role: '',
      goals: '',
      communicationStyle: '',
      background: '',
      currentProjects: '',
    },
  },
  people: [],
  profile: {
    content: '',
    generatedAt: null,
  },
  settings: {
    apiKey: '',
  },
}

function loadState(): AppState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...defaultState, ...JSON.parse(stored) }
    }
  } catch {
    // ignore parse errors
  }
  return defaultState
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_FREE_TEXT':
      return { ...state, aboutYou: { ...state.aboutYou, freeText: action.payload } }
    case 'SET_UPLOADED_TEXT':
      return {
        ...state,
        aboutYou: {
          ...state.aboutYou,
          uploadedText: action.payload.text,
          uploadedFileName: action.payload.fileName,
        },
      }
    case 'SET_FORM_FIELD':
      return {
        ...state,
        aboutYou: {
          ...state.aboutYou,
          form: { ...state.aboutYou.form, [action.payload.field]: action.payload.value },
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
    case 'SET_PROFILE':
      return { ...state, profile: action.payload }
    case 'CLEAR_PROFILE':
      return { ...state, profile: { content: '', generatedAt: null } }
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
