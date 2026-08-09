# DIGITAL FORGE — Portfolio Risky Pratama (Iky)

High-end 3D personal portfolio.

**Concept:** The Digital Forge — a digital workspace where ideas become software.

## Stack

- HTML5 / CSS3 / Vanilla JS (ES Modules)
- Three.js (CDN + import map)
- GSAP + ScrollTrigger
- Space Grotesk + Inter

## Run locally

```bash
cd portfolio
python3 -m http.server 4173
# open http://localhost:4173
```

Or with any static server (Vite, serve, live-server, etc.).

## Features

- Interactive Three.js intro (Forge Core)
- Cinematic hero with persistent 3D
- Editorial layouts (asymmetric projects)
- Dark / Light theme (localStorage)
- Custom cursor (desktop)
- Project detail modal
- Full Bahasa Indonesia UI
- Responsive (320px → 1920px)
- prefers-reduced-motion support
- Accessible focus states & keyboard intro

## Structure

```
portfolio/
├── index.html
├── css/main.css
├── js/main.js
├── assets/Risky-Pratama-CV.pdf
└── README.md
```

## Notes

- Intro state is remembered via `sessionStorage` (`forge-intro`)
- Theme preference via `localStorage` (`forge-theme`)
- Contact form uses `mailto:`
- CV button points to `assets/Risky-Pratama-CV.pdf` — replace with real CV

© 2026 Risky Pratama
