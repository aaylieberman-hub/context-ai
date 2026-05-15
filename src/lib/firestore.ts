import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { AppState } from '../types'

export async function loadUserState(uid: string): Promise<AppState | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (snap.exists()) {
    return snap.data() as AppState
  }
  return null
}

export async function saveUserState(uid: string, state: AppState): Promise<void> {
  const { settings, ...rest } = state
  await setDoc(doc(db, 'users', uid), JSON.parse(JSON.stringify(rest)))
}
