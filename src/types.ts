export interface PersonForm {
  name: string
  relationship: string
  personality: string
  currentDynamic: string
  whyTheyMatter: string
}

export interface Person extends PersonForm {
  id: string
}

export interface AboutYouForm {
  name: string
  role: string
  goals: string
  communicationStyle: string
  background: string
  currentProjects: string
}

export interface AppState {
  aboutYou: {
    freeText: string
    uploadedText: string
    uploadedFileName: string
    form: AboutYouForm
  }
  people: Person[]
  profile: {
    content: string
    generatedAt: string | null
  }
  settings: {
    apiKey: string
  }
}

export type AppAction =
  | { type: 'SET_FREE_TEXT'; payload: string }
  | { type: 'SET_UPLOADED_TEXT'; payload: { text: string; fileName: string } }
  | { type: 'SET_FORM_FIELD'; payload: { field: keyof AboutYouForm; value: string } }
  | { type: 'ADD_PERSON'; payload: Person }
  | { type: 'UPDATE_PERSON'; payload: Person }
  | { type: 'DELETE_PERSON'; payload: string }
  | { type: 'SET_PROFILE'; payload: { content: string; generatedAt: string } }
  | { type: 'CLEAR_PROFILE' }
  | { type: 'SET_API_KEY'; payload: string }
