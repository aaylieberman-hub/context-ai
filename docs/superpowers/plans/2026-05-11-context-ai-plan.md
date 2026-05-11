# context.ai Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Electron desktop app that lets users input personal context and generate an AI-synthesized context profile via the Anthropic API.

**Architecture:** Vite + React 18 + TypeScript frontend inside Electron. Single React Context with localStorage persistence. Three screens with sidebar navigation. Anthropic JS SDK for profile generation.

**Tech Stack:** Electron, Vite, React 18, TypeScript, @anthropic-ai/sdk, mammoth (docx parsing), uuid

---

## File Structure

| File | Responsibility |
|------|---------------|
| `package.json` | Dependencies, scripts (dev, build, electron) |
| `tsconfig.json` | TypeScript config for React + Electron |
| `tsconfig.node.json` | TypeScript config for Vite/Electron node files |
| `vite.config.ts` | Vite config with Electron plugin |
| `electron-builder.json` | Electron packaging config |
| `index.html` | HTML shell for Vite |
| `electron/main.ts` | Electron main process — window creation, lifecycle |
| `electron/preload.ts` | Preload script (minimal for prototype) |
| `src/main.tsx` | React DOM entry |
| `src/types.ts` | AppState, Person, action types |
| `src/context/AppContext.tsx` | React Context provider, useReducer, localStorage sync |
| `src/App.tsx` | Shell layout — sidebar + routed content area |
| `src/components/Sidebar.tsx` | Left nav with icons and active state |
| `src/components/HeroBanner.tsx` | Reusable warm gradient banner |
| `src/components/TabBar.tsx` | Tab switcher component |
| `src/components/FileUpload.tsx` | Drag-and-drop file upload zone |
| `src/components/PersonCard.tsx` | Collapsed person display card |
| `src/components/PersonForm.tsx` | Inline editable person form |
| `src/components/SettingsModal.tsx` | Modal overlay for API key |
| `src/screens/AboutYou.tsx` | About You screen with 3 tabs |
| `src/screens/People.tsx` | People list + CRUD orchestration |
| `src/screens/Profile.tsx` | Profile generation + display |
| `src/lib/anthropic.ts` | Anthropic SDK wrapper + data assembly |
| `src/styles/global.css` | Reset, body, typography, design tokens as CSS vars |
| `src/styles/sidebar.css` | Sidebar layout and nav styles |
| `src/styles/hero.css` | Hero banner gradient styles |
| `src/styles/forms.css` | Input, textarea, button, card, modal styles |
| `src/styles/profile.css` | Profile output area styles |

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `electron-builder.json`
- Create: `index.html`
- Create: `electron/main.ts`
- Create: `electron/preload.ts`
- Create: `src/main.tsx`
- Create: `.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "context-ai",
  "version": "0.1.0",
  "private": true,
  "main": "dist-electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "electron:dev": "vite --config vite.config.ts",
    "electron:build": "vite build && electron-builder"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.52.0",
    "mammoth": "^1.8.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "uuid": "^11.1.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@types/uuid": "^10.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "electron": "^33.3.1",
    "electron-builder": "^25.1.8",
    "typescript": "^5.7.3",
    "vite": "^6.0.7",
    "vite-plugin-electron": "^0.28.8",
    "vite-plugin-electron-renderer": "^0.14.6"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create tsconfig.node.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["vite.config.ts", "electron"]
}
```

- [ ] **Step 4: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
      },
      {
        entry: 'electron/preload.ts',
        onstart(args) {
          args.reload()
        },
      },
    ]),
    renderer(),
  ],
})
```

- [ ] **Step 5: Create electron/main.ts**

```typescript
import { app, BrowserWindow } from 'electron'
import path from 'node:path'

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(process.env.VITE_PUBLIC!, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(process.env.DIST!, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
```

- [ ] **Step 6: Create electron/preload.ts**

```typescript
// Preload script — minimal for prototype
// Node integration is enabled directly in the renderer
```

- [ ] **Step 7: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>context.ai</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Create src/main.tsx (placeholder React entry)**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div>context.ai loading...</div>
  </React.StrictMode>,
)
```

- [ ] **Step 9: Create .gitignore**

```
node_modules/
dist/
dist-electron/
.vite/
*.log
```

- [ ] **Step 10: Create electron-builder.json**

```json
{
  "appId": "com.context-ai.app",
  "productName": "context.ai",
  "directories": {
    "output": "release"
  },
  "files": [
    "dist/**/*",
    "dist-electron/**/*"
  ],
  "win": {
    "target": "nsis"
  }
}
```

- [ ] **Step 11: Install dependencies and verify dev server starts**

Run: `npm install`
Then: `npm run dev`
Expected: Vite dev server starts, Electron window opens showing "context.ai loading..."

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: scaffold Electron + Vite + React project"
```

---

### Task 2: Types + State Management

**Files:**
- Create: `src/types.ts`
- Create: `src/context/AppContext.tsx`

- [ ] **Step 1: Create src/types.ts**

```typescript
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
```

- [ ] **Step 2: Create src/context/AppContext.tsx**

```tsx
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
```

- [ ] **Step 3: Commit**

```bash
git add src/types.ts src/context/AppContext.tsx
git commit -m "feat: add types and state management with localStorage persistence"
```

---

### Task 3: Global Styles + Design Tokens

**Files:**
- Create: `src/styles/global.css`
- Create: `src/styles/sidebar.css`
- Create: `src/styles/hero.css`
- Create: `src/styles/forms.css`
- Create: `src/styles/profile.css`

- [ ] **Step 1: Create src/styles/global.css**

```css
:root {
  --sidebar-bg: #1a1a2e;
  --sidebar-text: #b8b8cc;
  --sidebar-text-active: #ffffff;
  --sidebar-width: 220px;

  --hero-gradient: linear-gradient(135deg, #8B6914 0%, #5C3D0E 50%, #2D1B06 100%);
  --hero-text: #FFF5E6;

  --bg: #F8F7F4;
  --card-bg: #FFFFFF;
  --card-border: #E5E5E5;
  --card-radius: 8px;

  --accent: #7C5CFC;
  --accent-hover: #6A4AE8;
  --accent-light: rgba(124, 92, 252, 0.1);

  --text-primary: #1a1a2e;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;

  --font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-serif: Georgia, 'Times New Roman', serif;

  --danger: #e53e3e;
  --danger-hover: #c53030;
  --success: #38a169;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-body);
  background: var(--bg);
  color: var(--text-primary);
  line-height: 1.6;
  overflow: hidden;
}

#root {
  display: flex;
  height: 100vh;
  width: 100vw;
}

button {
  cursor: pointer;
  font-family: var(--font-body);
}

input, textarea, select {
  font-family: var(--font-body);
}
```

- [ ] **Step 2: Create src/styles/sidebar.css**

```css
.sidebar {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  background: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 24px 0;
  user-select: none;
}

.sidebar-brand {
  padding: 0 20px 32px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sidebar-brand h1 {
  color: var(--sidebar-text-active);
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.3px;
}

.sidebar-brand .badge {
  background: var(--accent);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  color: var(--sidebar-text);
  font-size: 14px;
  font-weight: 500;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  transition: all 0.15s ease;
  border-left: 3px solid transparent;
}

.sidebar-nav-item:hover {
  color: var(--sidebar-text-active);
  background: rgba(255, 255, 255, 0.05);
}

.sidebar-nav-item.active {
  color: var(--sidebar-text-active);
  background: rgba(255, 255, 255, 0.08);
  border-left-color: var(--accent);
}

.sidebar-nav-item svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.sidebar-bottom {
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin-top: auto;
}
```

- [ ] **Step 3: Create src/styles/hero.css**

```css
.hero-banner {
  background: var(--hero-gradient);
  padding: 40px 48px;
  border-radius: 0;
  position: relative;
  overflow: hidden;
}

.hero-banner::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.08) 0%, transparent 60%);
  pointer-events: none;
}

.hero-banner h2 {
  font-family: var(--font-serif);
  font-size: 28px;
  font-weight: 400;
  color: var(--hero-text);
  margin-bottom: 8px;
  position: relative;
}

.hero-banner p {
  font-size: 14px;
  color: rgba(255, 245, 230, 0.7);
  max-width: 500px;
  position: relative;
}
```

- [ ] **Step 4: Create src/styles/forms.css**

```css
.content-area {
  flex: 1;
  overflow-y: auto;
  height: 100vh;
}

.screen-content {
  padding: 32px 48px;
  max-width: 900px;
}

.tab-bar {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--card-border);
  margin-bottom: 32px;
}

.tab-bar button {
  padding: 12px 20px;
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  border-bottom: 2px solid transparent;
  transition: all 0.15s ease;
}

.tab-bar button:hover {
  color: var(--text-primary);
}

.tab-bar button.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--card-border);
  border-radius: 6px;
  font-size: 14px;
  color: var(--text-primary);
  background: var(--card-bg);
  transition: border-color 0.15s ease;
  outline: none;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
  line-height: 1.6;
}

.form-group textarea.large {
  min-height: 200px;
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: var(--text-muted);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  transition: all 0.15s ease;
}

.btn-primary {
  background: var(--accent);
  color: white;
}

.btn-primary:hover {
  background: var(--accent-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--card-border);
}

.btn-secondary:hover {
  background: var(--bg);
  color: var(--text-primary);
}

.btn-danger {
  background: transparent;
  color: var(--danger);
  border: 1px solid var(--danger);
}

.btn-danger:hover {
  background: var(--danger);
  color: white;
}

.btn-large {
  padding: 12px 32px;
  font-size: 16px;
  border-radius: 8px;
}

.card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  padding: 20px;
  transition: box-shadow 0.15s ease;
}

.card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.file-upload-zone {
  border: 2px dashed var(--card-border);
  border-radius: var(--card-radius);
  padding: 48px 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s ease;
  background: var(--card-bg);
}

.file-upload-zone:hover,
.file-upload-zone.dragover {
  border-color: var(--accent);
  background: var(--accent-light);
}

.file-upload-zone svg {
  width: 40px;
  height: 40px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.file-upload-zone p {
  color: var(--text-secondary);
  font-size: 14px;
}

.file-upload-zone .accepted {
  color: var(--text-muted);
  font-size: 12px;
  margin-top: 4px;
}

.pill {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: var(--accent-light);
  color: var(--accent);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 32px;
  width: 480px;
  max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal h3 {
  font-size: 18px;
  margin-bottom: 20px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.empty-state p {
  font-size: 15px;
  margin-bottom: 16px;
}
```

- [ ] **Step 5: Create src/styles/profile.css**

```css
.profile-output {
  max-width: 700px;
}

.profile-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  align-items: center;
}

.profile-actions .timestamp {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-muted);
}

.profile-content {
  width: 100%;
  min-height: 400px;
  padding: 24px;
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  font-size: 14px;
  line-height: 1.8;
  resize: vertical;
  background: var(--card-bg);
  color: var(--text-primary);
  font-family: var(--font-body);
  outline: none;
}

.profile-content:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
}

.generate-container {
  text-align: center;
  padding: 60px 20px;
}

.generate-container p {
  color: var(--text-secondary);
  margin-bottom: 24px;
  font-size: 15px;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-shimmer {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--card-radius);
  height: 300px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.api-key-notice {
  color: var(--text-muted);
  font-size: 13px;
  margin-top: 8px;
}
```

- [ ] **Step 6: Commit**

```bash
git add src/styles/
git commit -m "feat: add global styles and design tokens (Flow-inspired)"
```

---

### Task 4: Sidebar + App Shell

**Files:**
- Create: `src/components/Sidebar.tsx`
- Create: `src/components/HeroBanner.tsx`
- Modify: `src/main.tsx`
- Create: `src/App.tsx`

- [ ] **Step 1: Create src/components/Sidebar.tsx**

```tsx
import React from 'react'
import '../styles/sidebar.css'

interface SidebarProps {
  activeScreen: string
  onNavigate: (screen: string) => void
  onOpenSettings: () => void
}

export function Sidebar({ activeScreen, onNavigate, onOpenSettings }: SidebarProps) {
  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <h1>context.ai</h1>
        <span className="badge">beta</span>
      </div>
      <nav className="sidebar-nav">
        <button
          className={`sidebar-nav-item ${activeScreen === 'about' ? 'active' : ''}`}
          onClick={() => onNavigate('about')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          About You
        </button>
        <button
          className={`sidebar-nav-item ${activeScreen === 'people' ? 'active' : ''}`}
          onClick={() => onNavigate('people')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          People
        </button>
        <button
          className={`sidebar-nav-item ${activeScreen === 'profile' ? 'active' : ''}`}
          onClick={() => onNavigate('profile')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          Profile
        </button>
      </nav>
      <div className="sidebar-bottom">
        <button className="sidebar-nav-item" onClick={onOpenSettings}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Settings
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create src/components/HeroBanner.tsx**

```tsx
import React from 'react'
import '../styles/hero.css'

interface HeroBannerProps {
  title: string
  subtitle: string
}

export function HeroBanner({ title, subtitle }: HeroBannerProps) {
  return (
    <div className="hero-banner">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  )
}
```

- [ ] **Step 3: Create src/App.tsx**

```tsx
import React, { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { SettingsModal } from './components/SettingsModal'
import { AboutYou } from './screens/AboutYou'
import { People } from './screens/People'
import { Profile } from './screens/Profile'
import './styles/global.css'
import './styles/forms.css'

export function App() {
  const [activeScreen, setActiveScreen] = useState('about')
  const [showSettings, setShowSettings] = useState(false)

  return (
    <>
      <Sidebar
        activeScreen={activeScreen}
        onNavigate={setActiveScreen}
        onOpenSettings={() => setShowSettings(true)}
      />
      <div className="content-area">
        {activeScreen === 'about' && <AboutYou />}
        {activeScreen === 'people' && <People />}
        {activeScreen === 'profile' && <Profile />}
      </div>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  )
}
```

- [ ] **Step 4: Update src/main.tsx**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppProvider } from './context/AppContext'
import { App } from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>,
)
```

Note: This won't compile yet — the screen and SettingsModal components don't exist. Create placeholder stubs so the app builds.

- [ ] **Step 5: Create placeholder screens (will be replaced in later tasks)**

Create `src/screens/AboutYou.tsx`:
```tsx
import React from 'react'
import { HeroBanner } from '../components/HeroBanner'

export function AboutYou() {
  return (
    <>
      <HeroBanner title="Tell us about yourself" subtitle="Add your personal context through text, files, or guided questions." />
      <div className="screen-content"><p>About You screen — coming soon</p></div>
    </>
  )
}
```

Create `src/screens/People.tsx`:
```tsx
import React from 'react'
import { HeroBanner } from '../components/HeroBanner'

export function People() {
  return (
    <>
      <HeroBanner title="The people in your world" subtitle="Add the people who matter in your life to build richer context." />
      <div className="screen-content"><p>People screen — coming soon</p></div>
    </>
  )
}
```

Create `src/screens/Profile.tsx`:
```tsx
import React from 'react'
import { HeroBanner } from '../components/HeroBanner'

export function Profile() {
  return (
    <>
      <HeroBanner title="Your Context Profile" subtitle="A synthesized picture of who you are and your world." />
      <div className="screen-content"><p>Profile screen — coming soon</p></div>
    </>
  )
}
```

Create `src/components/SettingsModal.tsx`:
```tsx
import React from 'react'

interface SettingsModalProps {
  onClose: () => void
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Settings</h3>
        <p>Settings — coming soon</p>
        <button className="btn btn-secondary" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Run dev server and verify sidebar + layout renders**

Run: `npm run dev`
Expected: Electron window opens. Dark sidebar on left with "context.ai beta" branding, three nav items, settings at bottom. Clicking nav items switches content area. Warm gradient banners on each screen.

- [ ] **Step 7: Commit**

```bash
git add src/
git commit -m "feat: add sidebar, app shell, hero banners, and screen placeholders"
```

---

### Task 5: Settings Modal

**Files:**
- Modify: `src/components/SettingsModal.tsx`

- [ ] **Step 1: Implement SettingsModal**

Replace the placeholder `src/components/SettingsModal.tsx`:

```tsx
import React, { useState } from 'react'
import { useApp } from '../context/AppContext'

interface SettingsModalProps {
  onClose: () => void
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { state, dispatch } = useApp()
  const [key, setKey] = useState(state.settings.apiKey)
  const [showKey, setShowKey] = useState(false)

  function handleSave() {
    dispatch({ type: 'SET_API_KEY', payload: key })
    onClose()
  }

  const hasKey = key.trim().length > 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Settings</h3>
        <div className="form-group">
          <label>Anthropic API Key</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-ant-..."
              style={{ paddingRight: '60px' }}
            />
            <button
              onClick={() => setShowKey(!showKey)}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: hasKey ? 'var(--success)' : 'var(--danger)',
              display: 'inline-block',
            }}
          />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {hasKey ? 'API key set' : 'No API key set'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run dev, open settings, enter a key, save, reopen — verify it persists**

Run: `npm run dev`
Expected: Click Settings in sidebar. Modal opens. Enter a key. Click Save. Reopen Settings — key is still there.

- [ ] **Step 3: Commit**

```bash
git add src/components/SettingsModal.tsx
git commit -m "feat: implement settings modal with API key management"
```

---

### Task 6: About You Screen — All Three Tabs

**Files:**
- Create: `src/components/TabBar.tsx`
- Create: `src/components/FileUpload.tsx`
- Modify: `src/screens/AboutYou.tsx`

- [ ] **Step 1: Create src/components/TabBar.tsx**

```tsx
import React from 'react'

interface TabBarProps {
  tabs: string[]
  activeTab: string
  onTabChange: (tab: string) => void
}

export function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={activeTab === tab ? 'active' : ''}
          onClick={() => onTabChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create src/components/FileUpload.tsx**

```tsx
import React, { useRef, useState, useCallback } from 'react'

interface FileUploadProps {
  onFileContent: (text: string, fileName: string) => void
  currentFileName: string
  currentPreview: string
}

export function FileUpload({ onFileContent, currentFileName, currentPreview }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragover, setDragover] = useState(false)

  const processFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()

    if (ext === 'doc' || ext === 'docx') {
      const mammoth = await import('mammoth')
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      onFileContent(result.value, file.name)
    } else {
      const text = await file.text()
      onFileContent(text, file.name)
    }
  }, [onFileContent])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragover(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  return (
    <div>
      <div
        className={`file-upload-zone ${dragover ? 'dragover' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragover(true) }}
        onDragLeave={() => setDragover(false)}
        onDrop={handleDrop}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p>Drop a file here or click to browse</p>
        <p className="accepted">.txt, .md, .doc, .docx</p>
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.md,.doc,.docx"
          onChange={handleChange}
          style={{ display: 'none' }}
        />
      </div>
      {currentFileName && (
        <div className="card" style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
            {currentFileName}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', maxHeight: '200px', overflow: 'auto' }}>
            {currentPreview.slice(0, 1000)}
            {currentPreview.length > 1000 && '...'}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Implement src/screens/AboutYou.tsx**

Replace the placeholder:

```tsx
import React, { useState } from 'react'
import { HeroBanner } from '../components/HeroBanner'
import { TabBar } from '../components/TabBar'
import { FileUpload } from '../components/FileUpload'
import { useApp } from '../context/AppContext'
import { AboutYouForm } from '../types'

const TABS = ['Free Text', 'Upload', 'Form']

const FORM_FIELDS: { key: keyof AboutYouForm; label: string; type: 'input' | 'textarea'; placeholder: string }[] = [
  { key: 'name', label: 'Name', type: 'input', placeholder: 'Your name' },
  { key: 'role', label: 'Role', type: 'input', placeholder: 'e.g. Senior PM at Acme Corp' },
  { key: 'goals', label: 'Goals', type: 'textarea', placeholder: 'What are you working toward?' },
  { key: 'communicationStyle', label: 'Communication Style', type: 'textarea', placeholder: 'How do you prefer to communicate? Direct, diplomatic, detailed...' },
  { key: 'background', label: 'Background', type: 'textarea', placeholder: 'Your professional and personal background' },
  { key: 'currentProjects', label: 'Current Projects', type: 'textarea', placeholder: 'What are you currently working on?' },
]

export function AboutYou() {
  const { state, dispatch } = useApp()
  const [activeTab, setActiveTab] = useState('Free Text')

  return (
    <>
      <HeroBanner
        title="Tell us about yourself"
        subtitle="Add your personal context through text, files, or guided questions."
      />
      <div className="screen-content">
        <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'Free Text' && (
          <div className="form-group">
            <textarea
              className="large"
              value={state.aboutYou.freeText}
              onChange={(e) => dispatch({ type: 'SET_FREE_TEXT', payload: e.target.value })}
              placeholder="Paste anything — your bio, goals, work situation, preferences, journal entries..."
            />
          </div>
        )}

        {activeTab === 'Upload' && (
          <FileUpload
            onFileContent={(text, fileName) =>
              dispatch({ type: 'SET_UPLOADED_TEXT', payload: { text, fileName } })
            }
            currentFileName={state.aboutYou.uploadedFileName}
            currentPreview={state.aboutYou.uploadedText}
          />
        )}

        {activeTab === 'Form' && (
          <div>
            {FORM_FIELDS.map(({ key, label, type, placeholder }) => (
              <div className="form-group" key={key}>
                <label>{label}</label>
                {type === 'input' ? (
                  <input
                    value={state.aboutYou.form[key]}
                    onChange={(e) =>
                      dispatch({ type: 'SET_FORM_FIELD', payload: { field: key, value: e.target.value } })
                    }
                    placeholder={placeholder}
                  />
                ) : (
                  <textarea
                    value={state.aboutYou.form[key]}
                    onChange={(e) =>
                      dispatch({ type: 'SET_FORM_FIELD', payload: { field: key, value: e.target.value } })
                    }
                    placeholder={placeholder}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
```

- [ ] **Step 4: Run dev, test all three tabs, type in each, verify persistence on tab switch and app restart**

Run: `npm run dev`
Expected: About You screen shows hero + tabs. Switching tabs preserves entered data. Close and reopen app — data persists.

- [ ] **Step 5: Commit**

```bash
git add src/components/TabBar.tsx src/components/FileUpload.tsx src/screens/AboutYou.tsx
git commit -m "feat: implement About You screen with free text, upload, and form tabs"
```

---

### Task 7: People Screen — Full CRUD

**Files:**
- Create: `src/components/PersonCard.tsx`
- Create: `src/components/PersonForm.tsx`
- Modify: `src/screens/People.tsx`

- [ ] **Step 1: Create src/components/PersonCard.tsx**

```tsx
import React from 'react'
import { Person } from '../types'

interface PersonCardProps {
  person: Person
  onEdit: () => void
  onDelete: () => void
}

export function PersonCard({ person, onEdit, onDelete }: PersonCardProps) {
  const preview = person.personality || person.currentDynamic || ''

  return (
    <div className="card" style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <strong style={{ fontSize: '15px' }}>{person.name}</strong>
          <span className="pill">{person.relationship}</span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '12px' }}
            onClick={onEdit}
          >
            Edit
          </button>
          <button
            className="btn btn-danger"
            style={{ padding: '4px 10px', fontSize: '12px' }}
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      </div>
      {preview && (
        <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          {preview.length > 120 ? preview.slice(0, 120) + '...' : preview}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create src/components/PersonForm.tsx**

```tsx
import React, { useState } from 'react'
import { Person, PersonForm as PersonFormData } from '../types'
import { v4 as uuidv4 } from 'uuid'

const RELATIONSHIPS = ['Boss', 'Partner', 'Friend', 'Client', 'Family', 'Mentor', 'Colleague', 'Therapist', 'Other']

interface PersonFormProps {
  initial?: Person
  onSave: (person: Person) => void
  onCancel: () => void
}

export function PersonForm({ initial, onSave, onCancel }: PersonFormProps) {
  const [form, setForm] = useState<PersonFormData>({
    name: initial?.name ?? '',
    relationship: initial?.relationship ?? 'Friend',
    personality: initial?.personality ?? '',
    currentDynamic: initial?.currentDynamic ?? '',
    whyTheyMatter: initial?.whyTheyMatter ?? '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    onSave({
      id: initial?.id ?? uuidv4(),
      ...form,
    })
  }

  function update(field: keyof PersonFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
          <label>Name</label>
          <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Their name" />
        </div>
        <div className="form-group" style={{ width: '180px', marginBottom: 0 }}>
          <label>Relationship</label>
          <select value={form.relationship} onChange={(e) => update('relationship', e.target.value)}>
            {RELATIONSHIPS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label>Personality / Communication Style</label>
        <textarea
          value={form.personality}
          onChange={(e) => update('personality', e.target.value)}
          placeholder="How would you describe their personality and communication style?"
        />
      </div>
      <div className="form-group">
        <label>Current Dynamic</label>
        <textarea
          value={form.currentDynamic}
          onChange={(e) => update('currentDynamic', e.target.value)}
          placeholder="What's the current state of this relationship?"
        />
      </div>
      <div className="form-group">
        <label>Why They Matter</label>
        <textarea
          value={form.whyTheyMatter}
          onChange={(e) => update('whyTheyMatter', e.target.value)}
          placeholder="Why is this person important in your life? How do they interact with you?"
        />
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={!form.name.trim()}>Save</button>
      </div>
    </form>
  )
}
```

- [ ] **Step 3: Implement src/screens/People.tsx**

Replace the placeholder:

```tsx
import React, { useState } from 'react'
import { HeroBanner } from '../components/HeroBanner'
import { PersonCard } from '../components/PersonCard'
import { PersonForm } from '../components/PersonForm'
import { useApp } from '../context/AppContext'
import { Person } from '../types'

export function People() {
  const { state, dispatch } = useApp()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  function handleSave(person: Person) {
    if (editingId) {
      dispatch({ type: 'UPDATE_PERSON', payload: person })
      setEditingId(null)
    } else {
      dispatch({ type: 'ADD_PERSON', payload: person })
      setAdding(false)
    }
  }

  function handleDelete(id: string) {
    if (window.confirm('Remove this person?')) {
      dispatch({ type: 'DELETE_PERSON', payload: id })
    }
  }

  return (
    <>
      <HeroBanner
        title="The people in your world"
        subtitle="Add the people who matter in your life to build richer context."
      />
      <div className="screen-content">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <button
            className="btn btn-primary"
            onClick={() => { setAdding(true); setEditingId(null) }}
            disabled={adding}
          >
            Add new
          </button>
        </div>

        {adding && (
          <PersonForm
            onSave={handleSave}
            onCancel={() => setAdding(false)}
          />
        )}

        {state.people.length === 0 && !adding && (
          <div className="empty-state">
            <p>No people added yet. Add someone to build richer context.</p>
            <button className="btn btn-primary" onClick={() => setAdding(true)}>Add your first person</button>
          </div>
        )}

        {state.people.map((person) =>
          editingId === person.id ? (
            <PersonForm
              key={person.id}
              initial={person}
              onSave={handleSave}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <PersonCard
              key={person.id}
              person={person}
              onEdit={() => { setEditingId(person.id); setAdding(false) }}
              onDelete={() => handleDelete(person.id)}
            />
          )
        )}
      </div>
    </>
  )
}
```

- [ ] **Step 4: Run dev, add a person, edit them, delete them. Verify persistence across app restart**

Run: `npm run dev`
Expected: Empty state shows. Add person — form appears. Fill in, save — card appears. Edit — form opens with data. Delete — confirmation, then removed. Close and reopen — people persist.

- [ ] **Step 5: Commit**

```bash
git add src/components/PersonCard.tsx src/components/PersonForm.tsx src/screens/People.tsx
git commit -m "feat: implement People screen with full CRUD"
```

---

### Task 8: API Integration + Profile Screen

**Files:**
- Create: `src/lib/anthropic.ts`
- Modify: `src/screens/Profile.tsx`

- [ ] **Step 1: Create src/lib/anthropic.ts**

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { AppState } from '../types'

const SYSTEM_PROMPT = `You are a context profile synthesizer. You receive raw information about a person — their background, goals, communication style, current projects, and the key people in their life.

Your job is to synthesize all of this into a single, coherent Context Profile written in the second person ("You are..."). This profile should read like a system prompt that could be given to an AI assistant to deeply understand this person.

Structure the profile with these sections:
- Who You Are (identity, role, background)
- Your Goals & Priorities
- How You Communicate
- Your Current World (projects, situations)
- Key People in Your Life (for each person: who they are, the dynamic, how to factor them in)

Be specific and concrete. Use the person's own words and details where possible. Don't add information that wasn't provided. Write in a warm but direct tone.`

function buildUserData(state: AppState): string {
  const sections: string[] = []

  const { freeText, uploadedText, form } = state.aboutYou

  if (form.name || form.role || form.goals || form.communicationStyle || form.background || form.currentProjects) {
    sections.push('## Structured Info')
    if (form.name) sections.push(`Name: ${form.name}`)
    if (form.role) sections.push(`Role: ${form.role}`)
    if (form.goals) sections.push(`Goals: ${form.goals}`)
    if (form.communicationStyle) sections.push(`Communication Style: ${form.communicationStyle}`)
    if (form.background) sections.push(`Background: ${form.background}`)
    if (form.currentProjects) sections.push(`Current Projects: ${form.currentProjects}`)
  }

  if (freeText.trim()) {
    sections.push(`## Free-form Text\n${freeText}`)
  }

  if (uploadedText.trim()) {
    sections.push(`## Uploaded Document Content\n${uploadedText}`)
  }

  if (state.people.length > 0) {
    sections.push('## Key People')
    for (const person of state.people) {
      const lines = [`### ${person.name} (${person.relationship})`]
      if (person.personality) lines.push(`Personality/Style: ${person.personality}`)
      if (person.currentDynamic) lines.push(`Current Dynamic: ${person.currentDynamic}`)
      if (person.whyTheyMatter) lines.push(`Why They Matter: ${person.whyTheyMatter}`)
      sections.push(lines.join('\n'))
    }
  }

  return sections.join('\n\n')
}

export async function generateProfile(state: AppState): Promise<string> {
  const client = new Anthropic({ apiKey: state.settings.apiKey })
  const userData = buildUserData(state)

  if (!userData.trim()) {
    throw new Error('No data to generate a profile from. Add some information about yourself first.')
  }

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userData }],
  })

  const textBlock = message.content.find((block) => block.type === 'text')
  return textBlock ? textBlock.text : ''
}
```

- [ ] **Step 2: Implement src/screens/Profile.tsx**

Replace the placeholder:

```tsx
import React, { useState } from 'react'
import { HeroBanner } from '../components/HeroBanner'
import { useApp } from '../context/AppContext'
import { generateProfile } from '../lib/anthropic'
import '../styles/profile.css'

export function Profile() {
  const { state, dispatch } = useApp()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const hasApiKey = state.settings.apiKey.trim().length > 0
  const hasContent = state.profile.content.length > 0

  async function handleGenerate() {
    setLoading(true)
    setError('')
    try {
      const content = await generateProfile(state)
      dispatch({
        type: 'SET_PROFILE',
        payload: { content, generatedAt: new Date().toLocaleString() },
      })
    } catch (err: any) {
      setError(err.message || 'Failed to generate profile')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(state.profile.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleClear() {
    if (window.confirm('Clear the generated profile?')) {
      dispatch({ type: 'CLEAR_PROFILE' })
    }
  }

  return (
    <>
      <HeroBanner
        title="Your Context Profile"
        subtitle="A synthesized picture of who you are and your world."
      />
      <div className="screen-content">
        {!hasContent && !loading && (
          <div className="generate-container">
            <p>
              {hasApiKey
                ? 'Ready to generate your context profile from the information you\'ve provided.'
                : 'Set your Anthropic API key in Settings to generate a profile.'}
            </p>
            <button
              className="btn btn-primary btn-large"
              onClick={handleGenerate}
              disabled={!hasApiKey || loading}
            >
              Generate Profile
            </button>
            {!hasApiKey && (
              <p className="api-key-notice">Go to Settings to add your API key.</p>
            )}
          </div>
        )}

        {loading && (
          <div>
            <button className="btn btn-primary btn-large" disabled>
              <span className="spinner" /> Generating...
            </button>
            <div className="loading-shimmer" style={{ marginTop: '24px' }} />
          </div>
        )}

        {error && (
          <div style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {hasContent && !loading && (
          <div className="profile-output">
            <div className="profile-actions">
              <button className="btn btn-secondary" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button className="btn btn-secondary" onClick={handleGenerate} disabled={!hasApiKey}>
                Regenerate
              </button>
              <button className="btn btn-danger" onClick={handleClear}>
                Clear
              </button>
              {state.profile.generatedAt && (
                <span className="timestamp">Generated on {state.profile.generatedAt}</span>
              )}
            </div>
            <textarea
              className="profile-content"
              value={state.profile.content}
              onChange={(e) =>
                dispatch({
                  type: 'SET_PROFILE',
                  payload: { content: e.target.value, generatedAt: state.profile.generatedAt || '' },
                })
              }
            />
          </div>
        )}
      </div>
    </>
  )
}
```

- [ ] **Step 3: Run dev, set an API key in settings, add some About You data, navigate to Profile, click Generate**

Run: `npm run dev`
Expected: Profile screen shows generate button. If no API key, shows notice. After generating, profile text appears in editable textarea. Copy, Regenerate, Clear buttons work.

- [ ] **Step 4: Commit**

```bash
git add src/lib/anthropic.ts src/screens/Profile.tsx
git commit -m "feat: implement profile generation with Anthropic API integration"
```

---

### Task 9: Final Polish + Full Integration Test

**Files:**
- Possibly minor tweaks to any existing files

- [ ] **Step 1: Run the full app end-to-end**

Run: `npm run dev`

Test the complete flow:
1. Open app — sidebar shows, About You screen loads
2. Fill in free text, switch to Form tab, fill in some fields
3. Navigate to People — add 2 people with full details
4. Navigate back to About You — data persists
5. Go to Settings — enter API key — save
6. Navigate to Profile — click Generate
7. Profile appears — edit it, copy it, regenerate it
8. Close app, reopen — all data persists

- [ ] **Step 2: Fix any issues found during testing**

Address any visual or functional issues found.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: context.ai v0.1 — complete prototype"
```
