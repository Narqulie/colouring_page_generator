# Colouring Page Generator

Full-stack app: **FastAPI** (Python) + **React/Vite/TypeScript/Tailwind**.
AI-generated coloring pages via Replicate's Flux model.

## Quick start

```bash
# Both servers must run simultaneously:

# Terminal 1 — Backend (FastAPI)
cd backend
pip install -r requirements.txt
uvicorn app:app --reload --port 8000

# Terminal 2 — Frontend (Vite)
cd frontend
npm install
npm run dev

# Frontend:  http://localhost:5173
# Backend:   http://localhost:8000
```

## Setup requirements

- **Python 3.11+**, **Node.js 20+**
- **`REPLICATE_API_TOKEN`** in `backend/.env` — copy from `backend/.env.example`
- Backend stores images in `backend/images/` and metadata in `backend/image_metadata.json` (no database)

## Commands

| Scope | Command | What it does |
|---|---|---|
| Frontend dev | `npm run dev` | Vite dev server (proxies `/api` → localhost:8000) |
| Frontend lint | `npm run lint` | ESLint on frontend |
| Frontend check | `npx tsc -b` | TypeScript type-check (also runs inside `build`) |
| Frontend build | `npm run build` | `tsc -b && vite build` with `VITE_API_URL=/api` |
| Frontend prod build | `npm run build:prod` | build + copy to `../backend/static/` |
| Backend dev | `uvicorn app:app --reload --port 8000` | Hot-reload server |
| Backend prod | `uvicorn app:app --host 0.0.0.0 --port 10000` | Production port (matches Dockerfile) |
| Docker build | `docker build -t app .` | Multi-stage: builds frontend, deploys with backend |
| Full-stack deploy | Render via `render.yaml` | Docker-based, `REPLICATE_API_TOKEN` set in dashboard |

**No tests, no Python lint/typecheck** — none exist anywhere in the repo.

**Versioning**: Backend `src/version.py` reads `build_info.json` (written at Docker build with `--build-arg GIT_HASH=$SOURCE_VERSION`) and appends the short SHA. Locally outputs `1.5.1`, deployed outputs `1.5.1-abc1234`. Frontend footer gets `VITE_GIT_HASH` injected at build time and displays commit alongside API version from `/health` endpoint.

## Architecture

```
./
├── backend/
│   ├── app.py               # FastAPI entrypoint (module: app:app)
│   ├── src/
│   │   ├── generate_image.py # Replicate API calls (sdxl-coloringbook LoRA)
│   │   ├── gallery.py        # List/serve images
│   │   ├── helpers.py        # JSON metadata read/write
│   │   └── version.py        # __version__ = "1.5.1"
│   ├── images/              # Generated PNGs (git ignored, keep .gitkeep)
│   ├── static/              # Frontend build copied here by `build:prod`
│   ├── logs/                # Loguru debug.log (git ignored)
│   └── .env                 # REPLICATE_API_TOKEN required
├── frontend/
│   ├── src/
│   │   ├── main.tsx         # React entrypoint
│   │   ├── App.tsx          # Root component
│   │   ├── api/index.ts     # API client (fetch)
│   │   ├── hooks/           # useHealthCheck
│   │   ├── components/      # promptForm, imageGallery, ImageModal, etc.
│   │   └── translations.ts  # English UI strings
│   └── vite.config.ts       # Proxy /api and /health → localhost:8000
├── Dockerfile               # Multi-stage, CMD: uvicorn port 10000
├── nginx.conf               # Reverse proxy (not used in Dockerfile)
└── render.yaml               # Render Docker deployment config
```

## Key gotchas

- **`.env.example`** exists at `backend/.env.example`
- **`build:prod` copies to `backend/static/`** — this is not in `.gitignore` but `frontend/dist/` is
- **No tests, no typecheck for Python** — only `tsc -b` for frontend
- **Production port is 10000** (matching Dockerfile), dev port is 8000
- **Vite proxy in dev** means `/api` requests go to FastAPI without CORS issues; in production FastAPI serves everything
- **CORS** is wide-open (`["*"]`) in production, restricted to known origins in dev
- **No auth** on any endpoint — all public
- **CORS** is wide-open (`["*"]`) in production, restricted to known origins + Render subdomain regex in dev
- **No auth** on any endpoint — all public
- **Generated images are 3:4 portrait** (print-friendly) as PNG, stored in `backend/images/`
- **Frontend is English-only** — Finnish translation was removed
