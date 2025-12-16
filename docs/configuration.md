# Configuration Management Guide

This document describes how to configure and manage the A2A Strategy Agent across different environments and deployment scenarios.

## Overview

The A2A Strategy Agent uses a flexible configuration system that supports multiple deployment environments:

- **Local Development**: `.env` files
- **Production**: Platform-specific secret management
- **Testing**: Environment variables
- **Containerized**: Docker environment variables

## Environment Variables

### Required Configuration

You must configure the Tavily API key for research functionality:

```bash
TAVILY_API_KEY=your_tavily_api_key
```

### Optional Configuration

Additional configuration options include LangChain tracing and system behavior:

```bash
# LangSmith tracing (optional)
LANGCHAIN_TRACING_V2=true
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
LANGCHAIN_API_KEY=your_langchain_api_key
LANGCHAIN_PROJECT=a2a-strategy-agent

# System settings
LOG_LEVEL=INFO
CACHE_ENABLED=true
MAX_REVISIONS=3
QUALITY_THRESHOLD=7
```

## Configuration Files

### .env.example

The `.env.example` file in the project root provides a template for local configuration:

```bash
# Copy this file to .env and fill in your values
TAVILY_API_KEY=

# Optional - LangSmith tracing
LANGCHAIN_TRACING_V2=true
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
LANGCHAIN_API_KEY=
LANGCHAIN_PROJECT=a2a-strategy-agent
```

## Multi-Platform Support

### Local Development

For local development, create a `.env` file:

```bash
cp .env.example .env
# Edit .env with your API keys
```

### Docker Deployment

Environment variables can be passed to Docker:

```bash
docker run -e TAVILY_API_KEY=your_key a2a-strategy-agent
```

Or using a file:

```bash
docker run --env-file .env a2a-strategy-agent
```

### Cloud Platforms

#### Heroku

```bash
heroku config:set TAVILY_API_KEY=your_key
```

#### AWS ECS

```json
{
  "environment": [
    {
      "name": "TAVILY_API_KEY",
      "value": "your_key"
    }
  ]
}
```

#### Kubernetes

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: a2a-keys
type: Opaque
data:
  tavily-key: <base64_encoded_key>
---
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: agent
        env:
        - name: TAVILY_API_KEY
          valueFrom:
            secretKeyRef:
              name: a2a-keys
              key: tavily-key
```

## Provider Configuration

### Tavily (Research Data)

Primary provider for real-time web search and data gathering:

```bash
TAVILY_API_KEY=your_tavily_api_key
```

Tavily provides:
- Real-time web search capabilities
- Structured data extraction
- Content summarization
- Multiple search result formats

### LangChain (Observability)

Optional provider for workflow tracing and monitoring:

```bash
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langchain_api_key
LANGCHAIN_PROJECT=a2a-strategy-agent
```

LangChain provides:
- End-to-end workflow visualization
- Quality metrics tracking
- Revision history preservation
- Performance monitoring

## Configuration Validation

The system validates configuration at startup:

1. Checks for required Tavily API key
2. Verifies LangChain configuration if enabled
3. Ensures required environment variables are present

Example validation error:
```
ERROR: Missing required environment variable: TAVILY_API_KEY
```

## Security Best Practices

### API Key Management

1. **Never commit keys to version control**
   ```bash
   # Add to .gitignore
   .env
   *.key
   ```

2. **Use role-based access for production keys**
   - Limit permissions to only required resources
   - Rotate keys regularly
   - Monitor key usage

3. **Environment-specific keys**
   - Development: Limited quota keys
   - Staging: Separate account keys
   - Production: Dedicated account keys

### Secure Configuration Patterns

#### Using Docker Secrets

```dockerfile
# Dockerfile
COPY config.json /run/secrets/
ENV CONFIG_PATH=/run/secrets/config.json
```

#### Using Kubernetes Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: agent-config
stringData:
  config.json: |
    {
      "providers": {
        "tavily": {"key": "${TAVILY_API_KEY}"}
      }
    }
```

## Troubleshooting Configuration

### Common Issues

1. **Missing API Keys**
   ```
   RuntimeError: Missing required environment variable: TAVILY_API_KEY
   ```
   Solution: Set the required environment variable

2. **Invalid API Key**
   ```
   AuthenticationError: Invalid API key
   ```
   Solution: Verify API key is correct and has proper permissions

3. **LangChain Configuration Errors**
   ```
   ValueError: LANGCHAIN_TRACING_V2 enabled but LANGCHAIN_API_KEY missing
   ```
   Solution: Set LangChain API key or disable tracing

### Configuration Debugging

Enable debug mode to see detailed configuration information:

```bash
LOG_LEVEL=DEBUG streamlit run app.py
```

This will output:
```
DEBUG: Configuration loaded:
  Tavily: Configured
  LangChain: Configured (tracing enabled)
  Quality Threshold: 7
  Max Revisions: 3
```

## Migration Guide

### From Version 1.x to 2.x

Changes in configuration:

1. **Environment variable names standardized**
   - No changes required for existing variables

2. **New optional settings**
   ```bash
   CACHE_ENABLED=true  # Enable research data caching
   LOG_LEVEL=INFO      # Control logging verbosity
   ```

## Backup and Recovery

### Configuration Backup

```bash
# Backup environment configuration
cp .env .env.backup.$(date +%Y%m%d)
```

### Configuration Recovery

```bash
# Restore environment configuration
cp .env.backup.YYYYMMDD .env

# Verify configuration
streamlit run app.py --validate-config
```

## Advanced Configuration

### Custom Quality Settings

Adjust quality evaluation parameters:

```bash
# Quality threshold (1-10 scale)
QUALITY_THRESHOLD=8

# Maximum revision attempts
MAX_REVISIONS=5

# Enable/disable specific rubric categories
RUBRIC_COMPLETENESS_WEIGHT=0.30
RUBRIC_SPECIFICITY_WEIGHT=0.25
RUBRIC_RELEVANCE_WEIGHT=0.25
RUBRIC_DEPTH_WEIGHT=0.20
```

### Caching Configuration

Control research data caching behavior:

```bash
# Enable/disable caching
CACHE_ENABLED=true

# Cache expiration (hours)
CACHE_EXPIRATION_HOURS=24

# Cache directory
CACHE_DIR=./data/research_cache
```

### Provider-Specific Settings

Advanced provider configuration:

```bash
# Tavily-specific settings
TAVILY_SEARCH_LIMIT=5
TAVIFY_INCLUDE_IMAGES=false
TAVILY_INCLUDE_ANSWER=true

# LangChain-specific settings
LANGCHAIN_VERBOSE=true
LANGCHAIN_HANDLER=stdout
```

This configuration management approach ensures the A2A Strategy Agent can be deployed and operated securely across various environments while maintaining flexibility and ease of management.