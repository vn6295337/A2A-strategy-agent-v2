# Simplified Dockerfile for A2A Strategy Agent - Single Stage Build
# This approach is more reliable for Hugging Face Spaces

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies including Node.js
RUN apt-get update && apt-get install -y \
    curl \
    git \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Install global Node.js tools
RUN npm install -g serve

# Copy the entire application
COPY . .

# Install frontend dependencies and build
WORKDIR /app/frontend
RUN npm install --legacy-peer-deps
RUN npm run build

# Go back to app directory
WORKDIR /app

# Expose ports
EXPOSE 8002
EXPOSE 3000

# Make startup script executable
RUN chmod +x start_space.sh

# Start both services
CMD ["./start_space.sh"]