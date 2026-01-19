# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the static website for NoCo Hackers, a cybersecurity community in Northern Colorado. The site is built with Hugo using the [hugo-theme-terminal](https://github.com/panr/hugo-theme-terminal) theme and hosted via GitHub Pages at nocohackers.com.

## Commands

- `hugo server -D` - Start development server with drafts
- `hugo` - Build for production (outputs to `public/`)

## Deployment

The site deploys via GitHub Pages on push to `main` branch. The workflow installs Hugo, builds the site, and deploys to GitHub Pages.

## Architecture

**Hugo Structure**
```
content/
├── _index.md               # Landing page content
└── about.md                # About page

layouts/                    # Custom layout overrides (if needed)

static/
├── style.css               # Custom color scheme overrides
├── favicon.ico             # Favicon
└── favicon.svg             # SVG favicon

themes/terminal/            # Hugo Terminal theme (git submodule)

hugo.toml                   # Hugo configuration
```

**Theme**
- Based on [hugo-theme-terminal](https://github.com/panr/hugo-theme-terminal) by panr
- Custom teal accent color (#32858b) with dark background (#1a170f)
- Fira Code monospace font
- Terminal-style header with logo
- Centered layout with max-width container

**Color Scheme**
The site uses a custom color scheme defined in `static/style.css`:
- Background: #1a170f (dark brown)
- Foreground: #eceae5 (light beige)
- Accent: #32858b (teal)
