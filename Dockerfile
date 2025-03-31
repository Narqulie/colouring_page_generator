# Build stage for frontend
FROM node:20-alpine as frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Build stage for backend
FROM python:3.11-slim as backend-build
WORKDIR /app/backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .

# Final stage
FROM python:3.11-slim
WORKDIR /app

# Copy backend
COPY --from=backend-build /app/backend /app/backend

# Copy frontend build
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

# Install backend dependencies
WORKDIR /app/backend
RUN pip install --no-cache-dir -r requirements.txt

# Set environment variables
ENV PYTHONPATH=/app/backend
ENV PORT=8000

# Expose port
EXPOSE 8000

# Start the application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"] 