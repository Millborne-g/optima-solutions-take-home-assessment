---
name: tailwind-theme-and-dark-mode
description: >-
  Maintains the Tailwind v4 Sage Green + Warm White design system and light/dark
  mode. Use when editing styles, theme tokens, ThemeToggle, dark mode, contrast,
  Tiptap prose CSS, or visual polish in Docsync.
---

# Tailwind Theme and Dark Mode

## Workflow

1. **Confirm stack**: `tailwindcss` and `@tailwindcss/vite` in `package.json`; plugin in `vite.config.ts`; tokens in `src/app/index.css`.
2. **Edit tokens centrally** in `@theme` (light) and `.dark` (dark). Prefer semantic utilities (`bg-primary`, `text-muted`, `border-border`, etc.).
3. **Keep themes coordinated** — every light token that affects UI should have a dark counterpart where needed.
4. **Theme switching**: `ThemeProvider` / `useTheme` (`src/app/theme.tsx`), `localStorage` key `theme`, anti-flash script in `index.html`, `ThemeToggle` for UI.
5. **States**: hover, focus, disabled, empty — use existing patterns (`Button`, `Input`, etc.) and `cn()`.
6. **Tiptap**: keep `.ProseMirror` and `.editor-canvas` in global CSS under `@layer components`; do not force prose into utility-only classes.
7. **Avoid** CSS Modules, duplicate design systems, or a second styling library.
8. **Verify** light and dark after changes (toggle + spot-check auth, dashboard, editor, dialogs).

## Report

List token/file changes, theme impact, and any contrast or editor issues left open.
