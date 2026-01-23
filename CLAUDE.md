# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the static website for NoCo Hackers, a cybersecurity community in Northern Colorado. The site is built with Hugo using the [hugo-theme-terminal](https://github.com/panr/hugo-theme-terminal) theme and hosted via GitHub Pages at nocohackers.com.

**Meeting Schedule:** Third Thursday of every month at 6:00 PM MST at Purpose Brewing in Fort Collins, CO.

## Commands

- `hugo server -D` - Start development server with drafts
- `hugo` - Build for production (outputs to `public/`)

## Deployment

The site deploys automatically via GitHub Actions on push to `main` branch (.github/workflows/deploy.yml):
- Uses Hugo Extended v0.140.2
- Builds with `--gc` and `--minify` flags
- Timezone set to America/Denver
- Deploys to GitHub Pages

## Architecture

**Hugo Structure**
```
content/
├── _index.md               # Landing page with next meetup info
├── about.md                # About page
├── events.md               # Upcoming events list
├── projects.md             # Community projects
└── game/
    └── index.md            # Bun Run game page (type: "game")

layouts/
├── game/single.html        # Custom layout for game page
└── partials/
    ├── header.html         # Custom header with theme toggle
    ├── extended_head.html  # Theme initialization script
    └── extended_footer.html # Theme toggle functionality

static/
├── style.css               # Custom color scheme overrides
├── favicon.*               # Various favicon formats
├── game/
│   ├── game.js             # Bun Run game logic
│   └── *.png               # Game sprites
└── bunbun.png              # Mascot image

themes/terminal/            # Hugo Terminal theme (git submodule)

hugo.toml                   # Hugo configuration
```

**Theme Customization**
- Based on [hugo-theme-terminal](https://github.com/panr/hugo-theme-terminal) by panr
- Custom dark/light theme toggle implemented via:
  - `layouts/partials/header.html` - Theme toggle button in header
  - `layouts/partials/extended_head.html` - Prevents flash of unstyled content
  - `layouts/partials/extended_footer.html` - Theme toggle logic with localStorage
- Custom color schemes defined in `static/style.css`:
  - Dark mode (default): Teal accent (#32858b), dark background (#1a170f)
  - Light mode: Orange accent (#DF7020), light background (#FFFBF7)
- Theme preference respects system preferences and persists to localStorage
- Terminal-style header with "noco_hackers" logo text
- Centered layout (centerTheme = true in hugo.toml)

**Menu Structure**
Defined in hugo.toml under `[languages.en.menu.main]`:
1. Events (internal)
2. Discord (external link)
3. Submit a Talk (Google Form)
4. Projects (internal)
5. About (internal)

**Custom Game Page**
- Located at `/game/` with custom layout type "game"
- Full custom HTML layout in `layouts/game/single.html`
- Canvas-based game with gradient background and responsive design
- Uses vanilla JavaScript for game logic (static/game/game.js)

**Content Guidelines**
- Hugo goldmark renderer with `unsafe = true` to allow raw HTML in markdown
- No syntax highlighting classes (`noClasses = false`)
- Table of contents disabled by default
- Reading time disabled
- Git info disabled
