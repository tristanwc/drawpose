# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start both Vite client (port 5173) and Express server (port 3001) concurrently
npm run dev:client   # Vite only
npm run dev:server   # Express proxy only (tsx watch)
npm run build        # tsc -b && vite build
npm run lint         # ESLint
```

No test runner is configured.

## Stack

- **React 19** + **TypeScript 5** SPA, built with **Vite 7**
- **Tailwind v4** via `@tailwindcss/vite` plugin — no `tailwind.config.js`, no PostCSS. CSS entry is `src/index.css` with `@import "tailwindcss"`.
- **framer-motion** for image transitions in theater mode; **lucide-react** for icons
- **Express 5** proxy server (`server/`) run alongside Vite via `concurrently`
- Strict TypeScript: `noUnusedLocals`, `noUnusedParameters`, `noUncheckedSideEffectImports`

## Architecture

The app has two modes controlled by `AppMode` in `App.tsx`:

- **`gallery`** — default view; user loads images then selects which to include
- **`session`** — fullscreen theater mode that cycles through selected images

### Data flow

`App.tsx` owns all state: `images`, `selectedIds`, `config` (interval settings). It passes callbacks down — there is no global state library.

Images come from three sources, all normalized to `ImageItem { id, url, alt }`:
1. **Pinterest RSS** — `BoardInput` → `GET /api/board?url=` → `server/pinterest.ts` parses the RSS feed at `pinterest.com/<user>/<board>.rss`, extracts `736x` pinimg URLs
2. **File upload** — hidden `<input type="file">` in `SessionConfig`, creates blob URLs via `URL.createObjectURL`
3. **Clipboard paste** — `document` paste listener in `App.tsx`, same blob URL approach

Uploaded/pasted images are auto-selected on add.

### Key files

- `src/types/index.ts` — shared types (`ImageItem`, `IntervalOption`, `SessionConfig`, `AppMode`)
- `src/hooks/useTimer.ts` — countdown timer with pause/resume/reset; fires a callback on expiry
- `src/components/TheaterMode.tsx` — fullscreen session view; `framer-motion` fade+slide between images, progress bar, HUD controls
- `server/pinterest.ts` — RSS fetch + XML parse (no Pinterest API key needed)

### Dev environment

Vite proxies `/api/*` → `http://localhost:3001`. The Express server reads `PINTEREST_ACCESS_TOKEN` from `.env` (see `.env.example`), though the current RSS approach doesn't require it.
