# Accept API token as build argument
ARG REPLICATE_API_TOKEN

# Frontend build stage
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Backend build stage
FROM python:3.11-slim AS backend-builder
WORKDIR /app
COPY backend/requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /wheels -r requirements.txt

# Final stage
FROM python:3.11-slim

# Create non-root user for security
RUN useradd -m -u 1000 appuser

# Set working directory
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx libglib2.0-0 nginx && \
    rm -rf /var/lib/apt/lists/*

# Copy backend wheels and install Python packages
COPY --from=backend-builder /wheels /wheels
COPY --from=backend-builder /app/requirements.txt .
RUN pip install --no-cache /wheels/*

# Copy backend application code
COPY --chown=appuser:appuser backend/ ./backend/

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist /var/www/html

# Create necessary directories with correct permissions
RUN mkdir -p backend/logs backend/images && \
    chown -R appuser:appuser /app

# Configure nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Set environment variables
ENV REPLICATE_API_TOKEN=${REPLICATE_API_TOKEN}
ENV PYTHONUNBUFFERED=1

# Create startup script
RUN echo '#!/bin/bash\n\
nginx\n\
cd /app/backend\n\
uvicorn app:app --host 0.0.0.0 --port 10000 --workers 2\n\
' > /app/start.sh && chmod +x /app/start.sh

# Switch to non-root user
USER appuser

# Expose ports
EXPOSE 80 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s \
  CMD curl -f http://localhost:8000/health || exit 1

# Start both services
CMD ["/app/start.sh"] 