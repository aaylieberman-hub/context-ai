export type LifeStage = 'high-school' | 'college' | 'working' | 'retired' | 'unemployed' | 'homemaker' | 'other'

export interface AccountProfile {
  id: string
  name: string
  age: string
  lifeStage: LifeStage
  stageDetails: {
    school?: string
    major?: string
    gradeYear?: string
    company?: string
    position?: string
    other?: string
  }
  createdAt: string
}

export interface TopicEntry {
  id: string
  label: string
  content: string
  createdAt: string
}

export type TopicKey = 'background' | 'goals' | 'currentProjects' | 'communicationStyle' | 'values' | 'petPeeves' | 'tools' | 'availability' | 'decisionStyle'

export interface PersonNote {
  id: string
  content: string
  createdAt: string
}

export interface PersonForm {
  name: string
  relationship: string
  personality: string
  currentDynamic: string
  whyTheyMatter: string
}

export interface Person extends PersonForm {
  id: string
  notes: PersonNote[]
  stylePreference: string
}

export interface ThingForm {
  name: string
  category: string
  description: string
  currentDynamic: string
  whyItMatters: string
}

export interface Thing extends ThingForm {
  id: string
}

export interface AboutYouForm {
  name: string
  pronouns: string
  location: string
  age: string
  role: string
  goals: string
  communicationStyle: string
  background: string
  currentProjects: string
  values: string
  petPeeves: string
  tools: string
  availability: string
  decisionStyle: string
}

export interface QuizQuestion {
  id: string
  question: string
  type: 'multiple-choice' | 'free-text'
  options?: string[]
  answer: string
}

export interface Snippet {
  id: string
  trigger: string
  body: string
}

export type StyleCategory = 'personal' | 'work' | 'email' | 'social' | 'other'

export interface StyleEntry {
  label: string
  tone: string
  examples: string
  notes: string
}

export type StylesState = Record<StyleCategory, StyleEntry>

export interface SavedProfile {
  id: string
  content: string
  generatedAt: string
}

export interface UploadedFile {
  id: string
  name: string
  documentType: string
  description: string
  content: string
  uploadedAt: string
}

export interface FreeTextEntry {
  id: string
  content: string
  createdAt: string
}

export interface AppState {
  aboutYou: {
    freeTexts: FreeTextEntry[]
    uploads: UploadedFile[]
    form: AboutYouForm
    topics: Record<TopicKey, TopicEntry[]>
    quizPrompt: string
    quizQuestions: QuizQuestion[]
  }
  people: Person[]
  things: Thing[]
  snippets: Snippet[]
  styles: StylesState
  profiles: SavedProfile[]
  settings: {
    apiKey: string
  }
}

export type AppAction =
  | { type: 'ADD_FREE_TEXT'; payload: FreeTextEntry }
  | { type: 'UPDATE_FREE_TEXT'; payload: FreeTextEntry }
  | { type: 'DELETE_FREE_TEXT'; payload: string }
  | { type: 'ADD_UPLOAD'; payload: UploadedFile }
  | { type: 'DELETE_UPLOAD'; payload: string }
  | { type: 'SET_FORM_FIELD'; payload: { field: keyof AboutYouForm; value: string } }
  | { type: 'ADD_TOPIC_ENTRY'; payload: { key: TopicKey; entry: TopicEntry } }
  | { type: 'UPDATE_TOPIC_ENTRY'; payload: { key: TopicKey; entry: TopicEntry } }
  | { type: 'DELETE_TOPIC_ENTRY'; payload: { key: TopicKey; entryId: string } }
  | { type: 'SET_QUIZ_PROMPT'; payload: string }
  | { type: 'SET_QUIZ_QUESTIONS'; payload: QuizQuestion[] }
  | { type: 'SET_QUIZ_ANSWER'; payload: { id: string; answer: string } }
  | { type: 'ADD_PERSON'; payload: Person }
  | { type: 'UPDATE_PERSON'; payload: Person }
  | { type: 'DELETE_PERSON'; payload: string }
  | { type: 'ADD_PERSON_NOTE'; payload: { personId: string; note: PersonNote } }
  | { type: 'DELETE_PERSON_NOTE'; payload: { personId: string; noteId: string } }
  | { type: 'SET_PERSON_STYLE'; payload: { personId: string; stylePreference: string } }
  | { type: 'ADD_THING'; payload: Thing }
  | { type: 'UPDATE_THING'; payload: Thing }
  | { type: 'DELETE_THING'; payload: string }
  | { type: 'ADD_SNIPPET'; payload: Snippet }
  | { type: 'UPDATE_SNIPPET'; payload: Snippet }
  | { type: 'DELETE_SNIPPET'; payload: string }
  | { type: 'SET_STYLE_FIELD'; payload: { category: StyleCategory; field: keyof StyleEntry; value: string } }
  | { type: 'ADD_PROFILE'; payload: SavedProfile }
  | { type: 'DELETE_PROFILE'; payload: string }
  | { type: 'SET_API_KEY'; payload: string }
