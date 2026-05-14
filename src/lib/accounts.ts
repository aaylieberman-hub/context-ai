import { AccountProfile, LifeStage } from '../types'
import { v4 as uuid } from 'uuid'

const ACCOUNTS_KEY = 'context-ai-accounts'
const ACTIVE_KEY = 'context-ai-active-account'

export function getAccounts(): AccountProfile[] {
  try {
    const stored = localStorage.getItem(ACCOUNTS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function saveAccounts(accounts: AccountProfile[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}

export function createAccount(profile: Omit<AccountProfile, 'id' | 'createdAt'>): AccountProfile {
  const account: AccountProfile = {
    ...profile,
    id: uuid(),
    createdAt: new Date().toISOString(),
  }
  const accounts = getAccounts()
  accounts.push(account)
  saveAccounts(accounts)
  setActiveAccount(account.id)
  return account
}

export function deleteAccount(id: string) {
  const accounts = getAccounts().filter((a) => a.id !== id)
  saveAccounts(accounts)
  localStorage.removeItem(`context-ai-state-${id}`)
  if (getActiveAccountId() === id) {
    clearActiveAccount()
  }
}

export function getActiveAccountId(): string | null {
  return localStorage.getItem(ACTIVE_KEY)
}

export function setActiveAccount(id: string) {
  localStorage.setItem(ACTIVE_KEY, id)
}

export function clearActiveAccount() {
  localStorage.removeItem(ACTIVE_KEY)
}

export function getStorageKeyForAccount(id: string): string {
  return `context-ai-state-${id}`
}

export function migrateOldData(): AccountProfile | null {
  const OLD_KEY = 'context-ai-state'
  const oldData = localStorage.getItem(OLD_KEY)
  if (!oldData || getAccounts().length > 0) return null

  try {
    const parsed = JSON.parse(oldData)
    const name = parsed?.aboutYou?.form?.name || 'My Profile'
    const account = createAccount({
      name,
      age: parsed?.aboutYou?.form?.age || '',
      lifeStage: 'other' as LifeStage,
      stageDetails: { other: parsed?.aboutYou?.form?.role || '' },
    })
    localStorage.setItem(getStorageKeyForAccount(account.id), oldData)
    localStorage.removeItem(OLD_KEY)
    return account
  } catch {
    return null
  }
}
