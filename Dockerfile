# Dockerfile for A2A Strategy Agent with React Frontend and FastAPI Backend

# Stage 1: Build the React frontend
FROM node:18-alpine as frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY frontend/package.json ./

# Install dependencies
RUN npm install

# Copy frontend source
COPY frontend/src ./src
COPY frontend/public ./public
COPY frontend/vite.config.ts ./

# Build the frontend
RUN npm run build

# Stage 2: Build the Python backend
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Copy the built frontend from the builder stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Install serve to serve the frontend
RUN npm install -g serve

# Expose ports
EXPOSE 8002
EXPOSE 3000

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8002

# Copy and make startup script executable
COPY start_space.sh ./
RUN chmod +x start_space.sh

# Command to run the startup script
CMD ["./start_space.sh"]