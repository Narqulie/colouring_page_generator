# Colouring Page Generator

Full-stack app: **FastAPI** (Python) + **React/Vite/TypeScript**.

## Quick start

```bash
# Terminal 1 — Backend (FastAPI)
cd backend && pip install -r requirements.txt
uvicorn app:app --reload --port 8000

# Terminal 2 — Frontend (Vite)
cd frontend && npm install && npm run dev
```

Frontend `http://localhost:5173`, Backend `http://localhost:8000`.

## Setup

- **Python 3.11+**, **Node.js 20+**
- **`REPLICATE_API_TOKEN`** in `backend/.env` — copy from `backend/.env.example`
- **R2 storage** (optional): set all four `R2_*` env vars to persist images. Falls back to local filesystem when absent. R2 Secrets/Access Keys are **32-char** S3-compatible credentials (not Cloudflare API tokens).

## Key commands

| Scope | Command | What it does |
|---|---|---|
| Frontend dev | `npm run dev` | Vite (proxies `/api` → localhost:8000) |
| Frontend lint | `npm run lint` | ESLint |
| Frontend typecheck | `npx tsc -b` | TypeScript check (also runs inside `build`) |
| Frontend build | `npm run build` | `tsc -b && VITE_API_URL=/api vite build` |
| Frontend prod build | `npm run build:prod` | build + copy to `../backend/static/` |
| Backend dev | `uvicorn app:app --reload --port 8000` | Hot-reload |
| Backend prod | `uvicorn app:app --host 0.0.0.0 --port ${PORT:-10000}` | Production port |
| Docker build | `docker build -t app . --build-arg GIT_HASH=$(git rev-parse HEAD)` | Multi-stage |

## Architecture

```
backend/
  app.py                # FastAPI entrypoint — routes: /api/status, /api/generate, /api/images, /api/tags
  src/
    storage.py          # Abstract Storage → R2Storage / LocalStorage (auto-detected from env vars)
    generate_image.py   # Replicate API — async: start_prediction() → get_prediction()
    gallery.py          # list_images() + metadata filtering (tag, q params)
    helpers.py          # Thin wrappers delegating to storage
    version.py          # __version__ = "1.5.1" (+ git SHA from RENDER_GIT_COMMIT or build_info.json)
  images/               # Local PNGs (fallback only)
  static/               # Frontend build copied here by build:prod
  logs/                 # Loguru debug.log (gitignored)
  .env                  # Gitignored (see .env.example)
frontend/
  src/
    main.tsx            # React entry
    App.tsx             # Root: search state, tag state, image gallery, async prediction polling
    hooks/useHealthCheck.ts  # Fetches /api/status every 30s
    components/
      promptForm.tsx    # Input + ReactiveButton (no tag input — auto-tagged on backend)
      SearchBar.tsx     # Prompt search + tag filter chips
      imageGallery.tsx  # Grid of generated images
      ImageModal.tsx    # Full preview, save/print/reroll/delete, tag editing
      Footer.tsx        # Dynamic version display (frontend + API)
      TimeBasedGradient.tsx  # Sets CSS vars by hour (4 time bands)
render.yaml             # Render Docker deploy
Dockerfile              # Multi-stage, ARG GIT_HASH builds VITE_GIT_HASH into frontend
nginx.conf              # Not used in deployment (redundant)
```

## Gotchas

- **CORS**: dev locked to `localhost:5173` + `*.onrender.com`, prod is wildcard `["*"]`
- **No auth** on any endpoint — all public
- **No tests**, no Python lint/typecheck — only `tsc -b` for frontend
- **All styling is Tailwind CSS 4** in JSX className utilities + minimal `App.css` for pseudo-elements and keyframes. Theme colors defined via `@theme` in `index.css`. No CSS modules or preprocessors.
- **English-only** — Finnish translations and translations.ts deleted
- **Async generate flow**: `POST /api/generate` returns `{prediction_id}` immediately. Frontend polls `GET /api/generate/{id}` every 2s until complete. Backend downloads + saves image + writes metadata on success.
- **Image URLs**: backend returns `url: "/images/{filename}"`, frontend prepends `VITE_API_URL` (`/api`) → full URL `/api/images/{filename}`
- **Auto-tags**: `auto_tags()` extracts keywords from prompt (filters stop words, min 4 chars, max 8). No user-provided tag input on generate. Tags editable in modal.
- **Versioning**: backend `__version__` appends short SHA from `RENDER_GIT_COMMIT` (Render) or `build_info.json` (Docker). Frontend shows `v1.5.1-{sha}` when `VITE_GIT_HASH` is set during build, else `v1.5.1`.
- **Replicate model**: `black-forest-labs/flux-schnell` (default params: 4 inference steps, 3:4 aspect ratio, go_fast enabled)
- **Output**: 3:4 portrait PNG (768×1024), white background, no watermark
- **Print layout**: `@page { margin: 1cm }`, image centered via `margin: auto`, watermark at bottom (`flex-shrink: 0`)
- **SPA routing**: `/{full_path:path}` handler serves static files from `backend/static/`. No `app.mount("/", StaticFiles...)` — that was removed to fix routing conflicts.
- **`build:prod`** copies to `backend/static/` (not in `.gitignore`); `frontend/dist/` is gitignored
- **`.env.example`** at `backend/.env.example`, all other env setup via Render dashboard
- **`requirements.txt` version pins must be compatible**: `pydantic 2.x` requires specific `pydantic-core` subversion. When bumping pinned deps, check their declared dependencies — Pip's strict resolver will abort the Docker build on mismatches. On Render, this shows as "Exited with status 1 while building your code" with no frontend error.
- **Time-based gradient**: 4 bands (night/morning/afternoon/evening), stored as CSS vars, animates `background-position`
- **`frontend/src/api/`** is empty — was used by deleted translations module
