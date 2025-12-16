# Operations Guide

## Prerequisites

- Python 3.11+
- Tavily API key
- LangChain API key (optional, for tracing)
- Virtual environment (recommended)

## Quick Start (5 minutes)

### 1. Setup

```bash
# Navigate to project
cd /home/vn6295337/A2A-strategy-agent

# Activate virtual environment
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure API keys
cp .env.example .env
# Edit .env with your keys
```

### 2. Run Single Analysis

```bash
streamlit run app.py
```

Then open your browser to http://localhost:8501 and enter a company name.

### 3. Run Tests

```bash
# Run all tests
python -m pytest tests/

# Run specific test
python -m pytest tests/test_mcp.py
```

## Configuration

### Environment Variables

```bash
# Required
TAVILY_API_KEY=your_tavily_api_key

# Optional - LangSmith tracing
LANGCHAIN_TRACING_V2=true
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
LANGCHAIN_API_KEY=your_langchain_api_key
LANGCHAIN_PROJECT=a2a-strategy-agent
```

### Provider Configuration

The system currently supports:
- **Tavily**: Primary research data provider
- **LangChain**: Optional tracing and observability

## Running Tests

### Unit Tests

```bash
# Run all tests
python -m pytest tests/

# Run with verbose output
python -m pytest tests/ -v

# Run specific test file
python -m pytest tests/graph_test.py
```

### Integration Tests

```bash
# Run MCP integration tests
python -m pytest tests/test_mcp_comprehensive.py

# Run Streamlit UI tests
python -m pytest tests/test_streamlit.py
```

### Test Coverage

```bash
# Run tests with coverage report
python -m pytest tests/ --cov=src/

# Generate HTML coverage report
python -m pytest tests/ --cov=src/ --cov-report=html
```

## Monitoring

### LangSmith Tracing

Enable tracing by setting environment variables:

```bash
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_key
LANGCHAIN_PROJECT=a2a-strategy-agent
```

View traces at: https://smith.langchain.com

### Log Levels

Control logging verbosity:

```bash
# Set log level via environment
export LOG_LEVEL=DEBUG
streamlit run app.py
```

Log levels:
- CRITICAL: Critical errors only
- ERROR: All errors
- WARNING: Warnings and errors
- INFO: General information (default)
- DEBUG: Detailed diagnostic information

## Troubleshooting

### Issue 1: "TAVILY_API_KEY not found"

**Symptom:** RuntimeError on startup

**Solution:**
```bash
# Check .env file exists
ls -la .env

# Verify key is set
grep TAVILY_API_KEY .env

# Source environment
source .env
```

### Issue 2: "429 Too Many Requests"

**Symptom:** Rate limit errors from Tavily API

**Solution:**
- Implement exponential backoff (already included)
- Check your Tavily plan limits
- Consider caching research results

### Issue 3: "Invalid API key"

**Symptom:** AuthenticationError

**Solution:**
```bash
# Verify API key is correct
echo $TAVILY_API_KEY

# Test key manually
curl -X GET "https://api.tavily.com/search" \
  -H "Content-Type: application/json" \
  -d '{"query":"test","api_key":"'$TAVILY_API_KEY'"}'
```

### Issue 4: "Quality scores inconsistent"

**Symptom:** Varying quality scores for same input

**Solution:**
- Check LLM provider consistency
- Review rubric.txt for clarity
- Validate evaluation prompts
- Consider setting temperature=0 for consistent scoring

### Issue 5: Streamlit import error

**Symptom:** ModuleNotFoundError: streamlit

**Solution:**
```bash
pip install streamlit
```

## Common Operations

### Add Custom Evaluation Criteria

1. Edit `src/prompts/rubric.txt`:
```
4. Innovation Focus (20% weight)
   - Assessment of company's innovation strategy
   - R&D investment analysis
   - Competitive differentiation
```

2. Update critic node evaluation logic in `src/nodes/critic.py`

### Change Quality Threshold

Edit the quality threshold in `src/graph_cyclic.py`:

```python
# Change from 7 to 8
QUALITY_THRESHOLD = 8
MAX_REVISIONS = 3
```

### Customize SWOT Categories

Modify the analyst node in `src/nodes/analyst.py`:

```python
swot_template = {
    "strengths": [],
    "weaknesses": [],
    "opportunities": [],
    "threats": [],
    "innovation_potential": [],  # New category
    "market_position": []        # New category
}
```

### Export Results

Results are automatically saved in JSON format:

```bash
# View latest result
cat data/analysis_results/latest.json | jq '.'

# View quality metrics
cat data/analysis_results/latest.json | jq '.quality_metrics'

# View revision history
cat data/analysis_results/latest.json | jq '.revisions'
```

### Batch Processing

Create a batch processing script:

```python
# batch_process.py
import asyncio
from app import generate_swot_analysis

companies = ["Apple", "Microsoft", "Google", "Amazon"]

async def process_companies():
    for company in companies:
        try:
            result = await generate_swot_analysis(company)
            print(f"✓ Completed {company}")
        except Exception as e:
            print(f"✗ Failed {company}: {e}")

if __name__ == "__main__":
    asyncio.run(process_companies())
```

Run with:
```bash
python batch_process.py
```

## Performance Tuning

### Reduce Latency

- Use faster LLM providers
- Implement research data caching
- Reduce max_iterations if acceptable
- Optimize prompts for faster responses

### Increase Throughput

- Run multiple Streamlit instances
- Use batch mode instead of interactive
- Implement async processing
- Add Redis caching layer

### Caching Strategy

Enable research data caching:

```python
# In researcher.py
import hashlib
import json
from pathlib import Path

def get_cached_research(company: str):
    """Retrieve cached research data if available."""
    cache_key = hashlib.md5(company.encode()).hexdigest()
    cache_file = Path(f"data/research_cache/{cache_key}.json")
    if cache_file.exists():
        return json.loads(cache_file.read_text())
    return None
```

## Backup & Recovery

### Backup Configuration

```bash
# Backup environment configuration
cp .env .env.backup.$(date +%Y%m%d)

# Backup custom prompts
cp src/prompts/rubric.txt src/prompts/rubric.txt.backup
```

### Restore Configuration

```bash
cp .env.backup.YYYYMMDD .env
```

### Data Backup

```bash
# Backup analysis results
tar -czf analysis_backup_$(date +%Y%m%d).tar.gz data/analysis_results/

# Backup research cache
tar -czf research_cache_$(date +%Y%m%d).tar.gz data/research_cache/
```

## Production Deployment

### Recommended Setup

- **API Keys:** Use secrets manager (AWS Secrets Manager, HashiCorp Vault)
- **Persistence:** Add PostgreSQL for analysis history
- **Monitoring:** Add Prometheus metrics export
- **Scaling:** Deploy behind load balancer with multiple instances

### Health Check Endpoint

Add health check to `app.py`:

```python
@app.route('/health')
def health():
    return {"status": "healthy", "version": "1.0.0"}
```

### Container Orchestration

Docker Compose setup:

```yaml
version: '3.8'
services:
  a2a-agent:
    build: .
    ports:
      - "8501:8501"
    environment:
      - TAVILY_API_KEY=${TAVILY_API_KEY}
      - LANGCHAIN_API_KEY=${LANGCHAIN_API_KEY}
    volumes:
      - ./data:/app/data
```

## Security Best Practices

### API Key Management

1. Never commit keys to version control
2. Use platform-specific secret management
3. Rotate keys regularly
4. Monitor key usage and anomalies

### Input Validation

Always validate and sanitize user inputs:

```python
import re

def validate_company_name(company: str) -> bool:
    """Validate company name input."""
    if not company or len(company) > 100:
        return False
    # Allow alphanumeric, spaces, and common punctuation
    if not re.match(r'^[a-zA-Z0-9\s\-\.&]+$', company):
        return False
    return True
```

### Network Security

1. Use HTTPS for all external communications
2. Implement proper firewall rules
3. Regularly update dependencies
4. Scan for vulnerabilities

## Maintenance Procedures

### Regular Maintenance Tasks

1. **Weekly**
   - Review logs for error patterns
   - Update documentation based on user feedback
   - Check API provider status and limits

2. **Monthly**
   - Rotate API keys
   - Update dependencies
   - Review and optimize prompts
   - Performance benchmarking

3. **Quarterly**
   - Security audit
   - Architecture review
   - Training materials update
   - Backup and recovery testing

### Update Procedures

To update the system:

```bash
# Pull latest changes
git pull origin main

# Update dependencies
pip install -r requirements.txt

# Run tests to verify
python -m pytest tests/

# Restart services
pkill -f streamlit
streamlit run app.py
```

### Rollback Procedures

If issues occur after an update:

```bash
# Revert to previous commit
git reset --hard HEAD~1

# Restore dependencies
pip install -r requirements.txt

# Verify functionality
streamlit run app.py
```

## Support

- **GitHub Issues:** https://github.com/vn6295337/A2A-strategy-agent/issues
- **Documentation:** See docs/ directory
- **Logs:** Check application logs in data/logs/

This operations guide provides comprehensive instructions for running, maintaining, and troubleshooting the A2A Strategy Agent system in production environments.