# Frontend build stage
FROM node:20-slim AS frontend-builder
ARG GIT_HASH=unknown
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN VITE_GIT_HASH=$GIT_HASH npm run build

# Backend stage
FROM python:3.11-slim
ARG GIT_HASH=unknown
WORKDIR /app

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist /app/static

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Write build info (used by src/version.py at import time)
RUN echo "{\"git_hash\": \"$GIT_HASH\"}" > build_info.json

# Create necessary directories
RUN mkdir -p logs images && \
    chmod -R 777 logs images

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Start command
CMD uvicorn app:app --host 0.0.0.0 --port ${PORT:-10000}
