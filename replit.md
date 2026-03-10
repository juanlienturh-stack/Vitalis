# Vitalis AI

Asistente personal de salud, fitness y estética con IA.

## Stack

- Static PWA (HTML/CSS/JS)
- Served with `serve` on port 5000
- Service Worker for offline support (`sw.js`)
- Chart.js (via CDN) for charts
- Font Awesome (via CDN) for icons

## Structure

```
index.html      - Main single-page app (all CSS/JS inline)
manifest.json   - PWA manifest (inline SVG icon)
sw.js           - Service Worker (caching strategies, push notifications)
serve.json      - serve configuration (cache headers)
package.json    - Node.js project (serve dependency)
.gitignore      - Excludes node_modules, .env, .DS_Store
```

## Running

```bash
npm start
```

Serves the static site at http://0.0.0.0:5000

## Features

- Dashboard with daily progress ring, macros, steps
- Weekly calorie bar chart
- AI Chat assistant (simulated responses)
- Workout tracker with exercise checklist
- Nutrition logger with macro breakdown
- Progress tracking with weight chart and PRs
- User profile with settings and localStorage persistence
- PWA installable (manifest + service worker)
- Dark theme, Spanish language

## Service Worker Caching

- HTML documents: Network First
- Static assets (JS, CSS, fonts): Cache First
- Images: Stale While Revalidate
- API calls: Network First
- Cache version managed via `CACHE_VERSION` in sw.js

## Deployment

Configured as a static deployment. Public directory: `.`

## GitHub

Target repo: `https://github.com/juanlienturh-stack/Vitalis`
Push via Replit's Git panel (Version Control tab).
