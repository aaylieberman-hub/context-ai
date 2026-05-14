# context.ai — Redesign Drop-In

This folder contains everything you need to swap your app's frontend over to the new aesthetic. **It is not a full new codebase** — only the files that change. All your screens, your `AppContext`, your `lib/` code, your `App.tsx`, and your `main.tsx` keep working **untouched**.

## What changed

**New files (1):**
- `src/components/BrandMark.tsx` — the new concentric-arcs logo

**Replaced files (8):**
- `src/components/Sidebar.tsx` — same nav items, new visual layout
- `src/components/HeroBanner.tsx` — supports an italic accent word; warm + dark variants
- `src/styles/global.css` — design tokens (palette, type, radii)
- `src/styles/sidebar.css`
- `src/styles/hero.css`
- `src/styles/forms.css` — buttons, cards, tabs, topic grid, modal, list items
- `src/styles/chat.css`
- `src/styles/profile.css`
- `src/styles/login.css`

**Untouched** (keep yours as-is): `App.tsx`, `main.tsx`, `AppContext.tsx`, `types.ts`, all of `lib/`, all screens in `src/screens/`, `SettingsModal.tsx`, `PersonCard.tsx`, `PersonForm.tsx`, `FileUpload.tsx`, `TabBar.tsx`. They all use the same class names so the new CSS just restyles them.

## How to install

1. **Copy all files** from this `src/` into your project's `src/` (overwrite the same paths).

2. **Add Google Fonts** to your `index.html` `<head>`:

   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com" />
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
   <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Inter:wght@400;450;500;550;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
   ```

3. **Run it:** `npm run dev` — that's it.

## Two tiny optional touch-ups

These won't break anything, but the inline `rgba(108, 71, 255, ...)` calls in two files reference the OLD accent (purple). Find-and-replace if you want them to match the new aubergine accent:

- `src/screens/AboutYou.tsx` — search `rgba(108,71,255,0.06)` → replace with `rgba(91,42,111,0.06)` (1 occurrence)
- `src/screens/Style.tsx` — same replace (1 occurrence)

Both sites are the selected-state background for quiz radio buttons.

## Optional: add italic accents to screen headers

To get italics in screen titles (like *"About **you**"*) instead of plain text, change a screen's header from:

```tsx
<h1>About You</h1>
```

to:

```tsx
<h1>About <em>You</em></h1>
```

The `<em>` is already styled in `forms.css` to render in italic serif accent color. Same trick works for any `<h1>` in `.screen-header` and any `<h2>` inside a `.hero-banner`.

## To use the italic hero accent

`HeroBanner` now takes an optional `italicWord` prop:

```tsx
<HeroBanner
  title="Make context sound like"
  italicWord="you"
  subtitle="Set up different writing styles for different apps."
/>
```

Old call sites that only pass `title` and `subtitle` keep working as before.

You can also pass `variant="dark"` to get the aubergine-purple variant instead of the warm-brown one.

## What was removed vs. the prototype

The standalone prototype I built earlier had Insights, Dictionary, Transforms, Scratchpad, a trial card, invite/free-month buttons, and a window-chrome title bar. None of that is in this drop-in — only your real screens, with the new look. If you ever want any of those, ask.

## Color reference

| Token              | Value     | Use                            |
|--------------------|-----------|--------------------------------|
| `--bg`             | `#F4EFE6` | main canvas                    |
| `--bg-secondary`   | `#FAF6EE` | sidebar, soft surfaces         |
| `--card-bg`        | `#FFFFFF` | cards, inputs                  |
| `--card-border`    | `#E0D8C5` | dividers, borders              |
| `--text-primary`   | `#1A1814` | body text, buttons             |
| `--text-muted`     | `#6E6557` | sub-labels                     |
| `--accent`         | `#5B2A6F` | aubergine accent               |
| `--sage`           | `#C8D4B0` | beta badge                     |
| `--warm`           | `#E8B560` | keycap / hero highlight        |
| `--font-serif`     | Fraunces  | titles, italic accents         |
| `--font-body`      | Inter     | UI body                        |
