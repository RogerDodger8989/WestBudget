# ==========================================
# Stage 1: Build Frontend (Node.js)
# ==========================================
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package.json and package-lock.json first to leverage caching
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend source code
COPY frontend/ .

# Build the frontend (creates /app/frontend/dist)
RUN npm run build

# ==========================================
# Stage 2: Setup Backend (Python)
# ==========================================
FROM python:3.11-slim

WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_ENV=production \
    # Set APPDATA to /app so uploads go to /app/WestBudget/uploads
    APPDATA=/app \
    FRONTEND_DIST=/app/frontend/dist

# Install system dependencies needed for some Python packages (like psycopg)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the built frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Copy the backend code
# (We copy the rest of the current directory, excluding what's in .dockerignore)
COPY . .

# Expose the port
EXPOSE 5000

# Create a volume mount point for uploads to ensure persistence
VOLUME ["/app/WestBudget/uploads"]

# Command to run the application using Gunicorn
# 4 workers is a good starting point. 
# We target 'docker_entrypoint:app' which wraps the main app with static file serving.
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--access-logfile", "-", "--error-logfile", "-", "docker_entrypoint:app"]
