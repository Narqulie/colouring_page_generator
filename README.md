# 🎨 Coloring Page Generator Full Stack

A full-stack application that generates coloring pages using AI, built with FastAPI and React.

## 🚀 Deployment on Render

This application is configured for deployment on Render as a full-stack service. Here's how to deploy it:

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the following settings:
   - Build Command: `docker build -t app .`
   - Start Command: `docker run -p 8000:8000 app`
   - Environment Variables:
     - `PORT=8000`

## 🛠️ Local Development

### Prerequisites
- Python 3.11+
- Node.js 20+
- Docker (optional)

### Running Locally

1. Start the backend:
```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload
```

2. Start the frontend:
```bash
cd frontend
npm install
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

## 📁 Project Structure

```
.
├── frontend/          # React/Vite frontend
├── backend/          # FastAPI backend
├── Dockerfile        # Multi-stage Dockerfile for production
└── README.md         # This file
```

## 🔧 Environment Variables

### Backend
- `PORT`: Port to run the backend server (default: 8000)
- `LOG_LEVEL`: Logging level (default: DEBUG)
- `THEME_TIMEZONE`: IANA timezone used by the shared time-based palette (default: `Europe/Helsinki`). The server is the sole theme authority for every client.

### Frontend
- `VITE_API_URL`: Backend API URL (default: http://localhost:8000)

### Shared theme API

`GET /api/theme` returns the active server-controlled period, its background colours, configured timezone, server time, and the next scheduled change. Clients should render this payload directly and refresh at `next_change_at`; no user settings or browser-local clock determines the theme.