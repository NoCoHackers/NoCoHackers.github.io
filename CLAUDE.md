# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static website for NoCo Hackers, a cybersecurity community in Northern Colorado. The site is built with Astro using the terminal theme (inspired by astro-theme-terminal) and hosted via AWS Amplify at nocohackers.com.

## Commands

- `npm run dev` - Start development server
- `npm run check` - Run type checking
- `npm run build` - Type check and build for production (outputs to `dist/`)
- `npm run preview` - Preview production build locally

## Deployment

The site deploys via AWS Amplify on push to `main` branch. Amplify runs `npm run build` and serves the `dist/` folder.

## Architecture

**Astro Structure**
```
src/
├── layouts/
│   └── BaseLayout.astro    # Base layout with header, nav, footer
├── pages/
│   ├── index.astro         # Landing page with ASCII art
│   └── game.astro          # Bun Run game (standalone)
└── styles/
    └── terminal.css        # Terminal theme with Solarized colors

public/
├── game/
│   ├── sprites/            # Game sprite images
│   └── game.js             # Game logic
└── docs/                   # PDF documents
```

**Theme**
- Based on [astro-theme-terminal](https://github.com/dennisklappe/astro-theme-terminal)
- Solarized color scheme with automatic dark/light mode via `prefers-color-scheme`
- Monospace typography (Fira Code, JetBrains Mono, Consolas)
- Terminal-style header with logo and navigation
- Responsive design (684px breakpoint)

**Landing Page (`src/pages/index.astro`)**
- ASCII art header with terminal-style shell prompts
- Links displayed as simulated `ls` and `cat` commands
- Responsive: different ASCII headers for desktop vs mobile

**Bun Run Game (`src/pages/game.astro` + `public/game/game.js`)**
- Canvas-based endless runner game at `/game`
- Player sprite states: idle, run, jump, crouch
- Obstacles: laptop, pc, server, drone (ground and air types)
- Matrix rain background effect
- High scores stored in browser cookies
- Controls: Space/Up to jump, Down to crouch; touch/click supported
