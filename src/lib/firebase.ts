import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyA9ZRoqbkDg8FTJg0F86ei1yGnPujljMo4",
  authDomain: "context-ai-4aa9e.firebaseapp.com",
  projectId: "context-ai-4aa9e",
  storageBucket: "context-ai-4aa9e.firebasestorage.app",
  messagingSenderId: "356999066686",
  appId: "1:356999066686:web:1d65cb24f03983e0eb0d6f",
  measurementId: "G-DXCL95F4P9",
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
