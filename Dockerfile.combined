# ---- Multi‑stage build: combine frontend and backend ----
# ---- Stage 1: build the React/Vite UI ----
FROM node:20-alpine AS ui_builder
WORKDIR /ui
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build   # produces /ui/dist

# ---- Stage 2: Python backend (FastAPI) ----
FROM python:3.12-slim AS backend_base
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./backend/
COPY compiled_app_schema.sql .
COPY .env .

# Copy built UI into backend static assets directory
COPY --from=ui_builder /ui/dist ./frontend_dist

# Expose port for Cloud Run (default 8080 for Cloud Run, but we’ll keep 8000)
EXPOSE 8000

# Entry point – FastAPI will serve API and static files
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
