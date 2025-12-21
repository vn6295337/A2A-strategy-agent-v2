# Dockerfile for A2A Strategy Agent - Static Space Version
# This serves the HTML frontend and runs the FastAPI backend

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application
COPY . .

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8002

# Expose ports
EXPOSE 8002

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
    CMD curl -f http://localhost:8002/api/health || exit 1

# Start the backend
CMD ["python", "api_real.py"]