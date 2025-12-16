# Implementation Guide

This guide provides detailed technical information about implementing and extending the A2A Strategy Agent system.

## System Architecture

The A2A Strategy Agent follows a node-based architecture with clearly separated concerns:

### Core Components

1. **Workflow Engine** (`src/graph_linear.py`, `src/graph_cyclic.py`)
   - Graph-based workflow orchestration
   - Linear and cyclic execution patterns
   - State management and iteration control

2. **Workflow Nodes** (`src/nodes/`)
   - Researcher: Data gathering and preprocessing
   - Analyst: SWOT analysis generation
   - Critic: Quality evaluation and scoring
   - Editor: Analysis revision and improvement

3. **Integration Layers** (`src/mcp_server.py`, `app.py`)
   - MCP server for standardized LLM interactions
   - Streamlit UI for user interface
   - LangSmith tracing for observability

4. **Utilities** (`src/utils/`)
   - Configuration management
   - Conditional logic handling
   - Database initialization

### Data Flow

The system implements a sophisticated 4-step process:

1. **Researcher** → Gathers real-time data about the company
2. **Analyst** → Creates initial SWOT analysis draft
3. **Critic** → Evaluates quality and provides score/critique
4. **Editor** → Improves draft if quality < 7/10 (loop)

The loop continues until quality ≥ 7/10 or maximum 3 revisions are reached.

## Implementation Details

### Node-Based Architecture

Each workflow node is implemented as a Python function with a consistent interface:

```python
def node_function(state: dict) -> dict:
    """
    Process input state and return updated state.
    
    Args:
        state: Current workflow state dictionary
        
    Returns:
        Updated state dictionary
    """
    # Implementation logic here
    return updated_state
```

### State Management

The system uses a shared state dictionary that flows through each node:

```python
state = {
    "company": "NVIDIA",
    "research_data": {...},
    "analysis_draft": {...},
    "quality_score": 0,
    "critique": "",
    "revision_count": 0,
    "iterations": []
}
```

### Quality Evaluation System

The critic node implements a rubric-based evaluation system:

1. **Completeness** (25% weight): All SWOT categories populated
2. **Specificity** (25% weight): Concrete, actionable insights
3. **Relevance** (25% weight): Directly related to company context
4. **Depth** (25% weight): Strategic sophistication and insight

Each category is scored 1-10, with weighted average producing final score.

### Self-Correcting Loop

The cyclic workflow implements intelligent iteration management:

```python
while quality_score < 7 and revision_count < 3:
    # Generate critique
    critique = critic.evaluate(analysis_draft)
    
    # Improve analysis
    analysis_draft = editor.improve(analysis_draft, critique)
    
    # Re-evaluate
    quality_score = critic.score(analysis_draft)
    
    # Track iteration
    revision_count += 1
```

## Extending the System

### Adding New Nodes

1. Create new node file in `src/nodes/`
2. Implement node function with state interface
3. Add node to workflow graph
4. Update documentation

Example node implementation:
```python
def competitor_analyst(state: dict) -> dict:
    """
    Analyze competitive landscape for the company.
    
    Args:
        state: Current workflow state
        
    Returns:
        Updated state with competitive analysis
    """
    # Implementation here
    state["competitive_analysis"] = analysis_result
    return state
```

### Customizing Evaluation Rubric

Modify `src/prompts/rubric.txt` to adjust evaluation criteria:

1. Update rubric categories and weights
2. Modify scoring guidelines
3. Adjust quality thresholds
4. Test with sample analyses

### Adding New Data Sources

Extend the researcher node to incorporate additional data sources:

1. Add new API client dependencies
2. Implement data gathering functions
3. Integrate with existing research pipeline
4. Update error handling and fallback logic

## Configuration Management

### Environment Variables

The system uses environment variables for configuration:

```bash
# Required
TAVILY_API_KEY=your_tavily_api_key

# Optional - LangSmith tracing
LANGCHAIN_TRACING_V2=true
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
LANGCHAIN_API_KEY=your_langchain_api_key
LANGCHAIN_PROJECT=a2a-strategy-agent
```

### Configuration Loading

Configuration is managed through `src/utils/config.py`:

```python
import os
from typing import Optional

def get_config(key: str, default: Optional[str] = None) -> Optional[str]:
    """Get configuration value from environment or default."""
    return os.getenv(key, default)
```

## Testing

### Unit Tests

Run unit tests with:

```bash
python -m pytest tests/
```

Tests cover:
- Individual node functionality
- Workflow graph execution
- Error handling scenarios
- Quality evaluation accuracy

### Integration Testing

For integration testing with live APIs:

1. Set up API keys in `.env`
2. Run sample companies through the system
3. Validate analysis quality and structure
4. Check LangSmith tracing output

### UI Testing

Test the Streamlit interface:

```bash
streamlit run app.py
```

Verify:
- Input handling and validation
- Analysis display formatting
- Quality visualization
- Error state handling

## Deployment Considerations

### Containerization

The system includes a Dockerfile for containerized deployment:

```bash
docker build -t a2a-strategy-agent .
docker run -p 8501:8501 a2a-strategy-agent
```

### Environment Configuration

Different deployment environments require:

1. **Development**: Local `.env` file
2. **Production**: Platform-specific secret management
3. **CI/CD**: Test environment variables

### Scaling Considerations

The system is designed for horizontal scaling:

- Stateless node implementations enable load balancing
- API rate limits should be monitored
- Caching strategies can be implemented for frequent queries
- Asynchronous processing can be added for batch operations

## Monitoring and Observability

### LangSmith Tracing

The system integrates with LangSmith for complete observability:

- End-to-end workflow visualization
- Quality metrics tracking
- Revision history preservation
- Performance monitoring

### Logging

The system uses Python's standard logging module:

- INFO level: Normal operation events
- WARNING level: Recoverable issues
- ERROR level: Unrecoverable problems
- DEBUG level: Detailed diagnostic information

### Metrics Collection

Key metrics to monitor:

- Analysis generation success rates
- Quality scores distribution
- Revision count statistics
- API response times

## Troubleshooting

### Common Issues

1. **API Key Errors**
   - Verify environment variables are set
   - Check API key validity with provider
   - Confirm provider account has sufficient credits

2. **Quality Scoring Inconsistencies**
   - Review rubric.txt for clarity
   - Check LLM provider consistency
   - Validate evaluation prompts

3. **Performance Problems**
   - Monitor API response times
   - Check for network connectivity issues
   - Review caching effectiveness

### Debugging Tips

1. Enable DEBUG logging level for detailed traces
2. Use LangSmith tracing to visualize workflow execution
3. Test individual nodes in isolation
4. Validate state transitions between nodes

## Performance Optimization

### Caching Strategies

Implement research data caching:

```python
import hashlib
import json
from pathlib import Path

def cache_research_data(company: str, data: dict):
    """Cache research data to avoid repeated API calls."""
    cache_key = hashlib.md5(company.encode()).hexdigest()
    cache_file = Path(f"data/research_cache/{cache_key}.json")
    cache_file.parent.mkdir(exist_ok=True)
    cache_file.write_text(json.dumps(data))
```

### Prompt Engineering

Optimize LLM prompts for:
- Reduced token usage
- Faster response times
- Consistent output quality
- Better instruction following

### Parallel Processing

Consider parallel execution for independent operations:

```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

async def parallel_research(companies: list):
    """Research multiple companies in parallel."""
    with ThreadPoolExecutor() as executor:
        futures = [
            executor.submit(research_company, company) 
            for company in companies
        ]
        results = [future.result() for future in futures]
    return results
```

## Security Considerations

### Input Sanitization

Always sanitize user inputs:

```python
import re

def sanitize_company_name(company: str) -> str:
    """Sanitize company name input."""
    # Remove potentially dangerous characters
    sanitized = re.sub(r'[<>"\'&]', '', company)
    # Limit length
    return sanitized[:100].strip()
```

### API Key Management

Best practices for API key handling:

1. Never commit keys to version control
2. Use platform-specific secret management
3. Rotate keys regularly
4. Monitor key usage and anomalies

### Dependency Security

Regular security practices:

1. Update dependencies regularly
2. Scan for known vulnerabilities
3. Pin dependency versions
4. Review third-party code

This implementation guide provides a comprehensive overview of the A2A Strategy Agent system, enabling developers to understand, extend, and maintain the system effectively.