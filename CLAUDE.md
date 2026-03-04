# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # Type-check + production build (tsc -b && vite build)
npm run lint      # Run ESLint
npm run preview   # Preview production build
```

No test runner is configured yet.

## Stack

- **React 19** + **TypeScript 5** SPA, built with **Vite 7**
- Strict TypeScript: `noUnusedLocals`, `noUnusedParameters`, `noUncheckedSideEffectImports` all enabled
- ESLint flat config (`eslint.config.js`) with TypeScript, React Hooks, and React Refresh plugins

## Architecture

Currently a minimal starter — `src/main.tsx` → `src/App.tsx`. No routing, state management library, or backend yet.
