# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static website for NoCo Hackers, a cybersecurity community in Northern Colorado. The site is built with Astro and hosted on GitHub Pages at nocohackers.com.

## Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production (outputs to `dist/`)
- `npm run preview` - Preview production build locally

## Deployment

The site auto-deploys via GitHub Actions on push to `main` branch. The workflow builds the Astro site and deploys the `dist/` folder.

## Architecture

**Astro Structure**
```
src/
├── layouts/
│   └── BaseLayout.astro    # Base layout with terminal styling
├── pages/
│   ├── index.astro         # Landing page
│   └── game.astro          # Bun Run game page
└── styles/
    └── terminal.css        # Solarized color scheme, terminal styling

public/
├── game/
│   ├── sprites/            # Game sprite images
│   └── game.js             # Game logic
└── docs/                   # PDF documents
```

**Landing Page (`src/pages/index.astro`)**
- ASCII art header with terminal-style navigation
- Links displayed as simulated shell commands
- Solarized color scheme with light/dark mode support via `prefers-color-scheme`
- Responsive: different ASCII headers for desktop vs mobile (768px breakpoint)

**Bun Run Game (`src/pages/game.astro` + `public/game/game.js`)**
- Canvas-based endless runner game at `/game`
- Player sprite states: idle, run, jump, crouch
- Obstacles: laptop, pc, server, drone (ground and air types)
- Matrix rain background effect rendered on separate canvas
- High scores stored in browser cookies
- Controls: Space/Up to jump, Down to crouch; touch/click supported (top half = jump, bottom half = crouch)
- Difficulty scales with score: obstacle variety increases, game speed increases over time
