# context.ai — Design Spec

## Overview

A desktop application for building a structured AI context profile from a user's personal information. The user enters details about themselves and the people in their life, and the app synthesizes everything into a single context profile (written in second person) via the Anthropic API.

**Platform**: Windows desktop app (Electron)
**Stack**: Vite + React 18 + TypeScript + Electron + Anthropic JS SDK
**Persistence**: Local state only — React Context + localStorage. No auth, no database.
**Design language**: Inspired by the Flow app — dark sidebar, warm gradient hero banners, serif headings, clean card-based layout.

---

## Architecture

### Project Structure

```
context-ai/
├── electron/
│   ├── main.ts            # Electron main process (window creation, app lifecycle)
│   └── preload.ts         # Preload script for secure IPC if needed
├── src/
│   ├── main.tsx           # React entry point
│   ├── App.tsx            # Shell layout: sidebar + content area + routing
│   ├── context/
│   │   └── AppContext.tsx  # React Context provider, state shape, localStorage sync
│   ├── screens/
│   │   ├── AboutYou.tsx   # About You screen with tabbed input
│   │   ├── People.tsx     # People list + CRUD
│   │   └── Profile.tsx    # Generated profile output
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── HeroBanner.tsx
│   │   ├── TabBar.tsx
│   │   ├── PersonCard.tsx
│   │   ├── PersonForm.tsx
│   │   ├── SettingsModal.tsx
│   │   └── FileUpload.tsx
│   ├── styles/
│   │   ├── global.css
│   │   ├── sidebar.css
│   │   ├── hero.css
│   │   ├── forms.css
│   │   └── profile.css
│   ├── lib/
│   │   └── anthropic.ts   # API call wrapper
│   └── types.ts           # Shared TypeScript types
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── electron-builder.json
```

### State Management

A single React Context holds all app state. State is serialized to `localStorage` on every update via a `useEffect` in the provider. On app load, state is hydrated from `localStorage`.

No external state library — React Context + `useReducer` is sufficient for this scope.

---

## Data Model

```typescript
interface AppState {
  aboutYou: {
    freeText: string;
    uploadedText: string;
    form: {
      name: string;
      role: string;
      goals: string;
      communicationStyle: string;
      background: string;
      currentProjects: string;
    };
  };
  people: Person[];
  profile: {
    content: string;
    generatedAt: string | null;
  };
  settings: {
    apiKey: string;
  };
}

interface Person {
  id: string;        // UUID
  name: string;
  relationship: string;  // e.g. "boss", "partner", "friend", "client", "family", "mentor"
  personality: string;
  currentDynamic: string;
  whyTheyMatter: string;
}
```

---

## UI Design

### Shell Layout

- **Sidebar** (fixed left, ~220px wide):
  - Top: App name "context.ai" in white, with a small accent badge
  - Nav items with icons: "About You", "People", "Profile"
  - Bottom: "Settings" gear icon — opens a modal for API key
- **Content area** (remaining width):
  - Each screen starts with a warm gradient hero banner
  - Functional content below on white background

### Design Tokens

| Token | Value |
|-------|-------|
| Sidebar bg | `#1a1a2e` (dark charcoal) |
| Sidebar text (inactive) | `#b8b8cc` |
| Sidebar text (active) | `#ffffff` |
| Sidebar active indicator | 3px left border, accent color |
| Hero gradient | `linear-gradient(135deg, #8B6914, #5C3D0E, #2D1B06)` warm amber/brown |
| Hero text font | Georgia, serif |
| Hero text color | `#FFF5E6` (warm cream) |
| Body font | `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` |
| Card bg | `#FFFFFF` |
| Card border | `1px solid #E5E5E5` |
| Card border-radius | `8px` |
| Accent color | `#7C5CFC` (warm purple) |
| Button primary bg | `#7C5CFC` |
| Button primary text | `#FFFFFF` |
| Background | `#F8F7F4` (warm off-white) |

---

## Screen Specifications

### 1. About You

**Hero banner**: "Tell us about yourself" — warm gradient, serif font, subtitle: "Add your personal context through text, files, or guided questions."

**Tab bar** below hero (styled like Flow's Dictionary tabs): three tabs — **Free Text** | **Upload** | **Form**. Active tab has underline accent.

#### Free Text tab
- Large textarea (min 200px tall, resizable)
- Placeholder: "Paste anything — your bio, goals, work situation, preferences, journal entries..."
- Auto-saves to `aboutYou.freeText`

#### Upload tab
- Drag-and-drop zone with dashed border and upload icon
- Accepts `.txt`, `.md`, `.doc`, `.docx` files
- On drop/select: reads file content via `FileReader` API, stores as plain text in `aboutYou.uploadedText`
- Shows filename and preview of extracted text below the drop zone
- For `.doc`/`.docx`: use `mammoth` library to extract text

#### Form tab
- Guided fields, each with a label and input:
  - **Name** — single-line text input
  - **Role** — single-line text input (e.g. "Senior PM at Acme Corp")
  - **Goals** — textarea
  - **Communication Style** — textarea (placeholder: "How do you prefer to communicate? Direct, diplomatic, detailed...")
  - **Background** — textarea
  - **Current Projects** — textarea
- All fields auto-save to `aboutYou.form`

### 2. People in My Life

**Hero banner**: "The people in your world" — warm gradient, subtitle: "Add the people who matter in your life to build richer context."

**Top right**: "Add new" button (styled like Flow's pill button — accent bg, white text)

**Content**: List of person cards. Each card shows:
- Name (bold) + relationship tag (pill badge)
- First line of personality or dynamic as preview text
- Edit and Delete icon buttons on hover

**Add/Edit**: Clicking "Add new" or "Edit" opens an inline expanded form (not a modal — stays in flow like an accordion):
- **Name** — text input
- **Relationship** — dropdown select: Boss, Partner, Friend, Client, Family, Mentor, Colleague, Therapist, Other
- **Personality / Communication Style** — textarea
- **Current Dynamic** — textarea (placeholder: "What's the current state of this relationship?")
- **Why They Matter** — textarea
- Save and Cancel buttons at the bottom of the form

**Delete**: Confirmation prompt before removing.

**Empty state**: Friendly message — "No people added yet. Add someone to build richer context."

### 3. Your Context Profile

**Hero banner**: "Your Context Profile" — warm gradient, subtitle: "A synthesized picture of who you are and your world."

**Primary action**: "Generate Profile" button (large, centered, accent color). Disabled if no API key is set (shows tooltip: "Set your API key in Settings").

**Loading state**: Button shows spinner + "Generating..." text. Content area shows a subtle skeleton/shimmer.

**Output area** (after generation):
- Rendered as formatted text in a large container with comfortable reading width (~700px max)
- Content is editable — rendered in a textarea or contenteditable div so the user can tweak it
- Action bar above the content:
  - **Copy** — copies to clipboard, shows "Copied!" feedback
  - **Regenerate** — re-calls the API, replaces content
  - **Clear** — clears the generated profile (with confirmation)
- Timestamp: "Generated on [date/time]"

### 4. Settings (Modal)

Triggered by clicking "Settings" in the sidebar. Opens a centered modal overlay:
- **API Key** field: password-masked input with show/hide toggle button
- **Status indicator**: Green dot + "Connected" if key is present, red dot + "No API key set" if empty
- Save and Close buttons
- Key is stored in `settings.apiKey` in localStorage

---

## API Integration

### Anthropic SDK Usage

The app uses `@anthropic-ai/sdk` to call the Claude API directly from the Electron renderer process (Node integration enabled).

```typescript
// lib/anthropic.ts
import Anthropic from '@anthropic-ai/sdk';

export async function generateProfile(state: AppState): Promise<string> {
  const client = new Anthropic({ apiKey: state.settings.apiKey });

  const userData = buildUserDataString(state);

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userData }],
  });

  return message.content[0].type === 'text' ? message.content[0].text : '';
}
```

### System Prompt

```
You are a context profile synthesizer. You receive raw information about a person — their background, goals, communication style, current projects, and the key people in their life.

Your job is to synthesize all of this into a single, coherent Context Profile written in the second person ("You are..."). This profile should read like a system prompt that could be given to an AI assistant to deeply understand this person.

Structure the profile with these sections:
- Who You Are (identity, role, background)
- Your Goals & Priorities
- How You Communicate
- Your Current World (projects, situations)
- Key People in Your Life (for each person: who they are, the dynamic, how to factor them in)

Be specific and concrete. Use the person's own words and details where possible. Don't add information that wasn't provided. Write in a warm but direct tone.
```

### User Data Assembly

Concatenate all non-empty fields from `aboutYou` (free text, uploaded text, form fields) and all people entries into a single structured string sent as the user message.

---

## Electron Configuration

- `nodeIntegration: true` in the renderer for Anthropic SDK access
- `contextIsolation: false` for simplicity (prototype — not security-hardened)
- Single window, fixed minimum size (900x600), starts at 1200x800
- Title bar: default OS chrome
- No menu bar customization needed for prototype

---

## Out of Scope

- Authentication / user accounts
- Cloud sync / database
- Multiple profiles
- Export to file formats beyond clipboard copy
- Auto-update mechanism
- macOS / Linux builds (Windows only for now)
- Rich text editing in the profile output
