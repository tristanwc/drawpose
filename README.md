# DrawPose

A drawing practice (croquis) tool for artists. Load reference images from a Pinterest board, upload files, or paste from clipboard — then run timed sessions to practice gesture drawing.

## Features

- **Pinterest board import** — paste any public board URL to pull in reference images
- **Local upload & clipboard paste** — add images directly from your device or clipboard (Ctrl/Cmd+V)
- **Timed sessions** — cycle through selected images at 15s, 30s, 1m, 3m, 5m, or a custom interval
- **Theater mode** — fullscreen view with pause/resume, skip forward/back, and a progress bar

## Setup

```bash
npm install
npm run dev
```

This starts both the Vite dev server (port 5173) and the Express proxy (port 3001).

Pinterest board loading uses the board's public RSS feed — no API key required. If you need the Pinterest API in future, add your token to a `.env` file:

```
PINTEREST_ACCESS_TOKEN=your_token_here
```

## Commands

```bash
npm run dev          # Start client + server together
npm run build        # Production build
npm run lint         # ESLint
npm run preview      # Preview production build
```
