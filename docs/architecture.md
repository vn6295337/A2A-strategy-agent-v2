# Architecture Documentation

## System Overview

The A2A Strategy Agent is an AI-powered strategic analysis system that generates comprehensive SWOT analyses for companies with automatic quality improvement through a self-correcting loop. The system combines real-time data gathering, strategic analysis, quality evaluation, and iterative improvement to deliver high-quality business insights.

## High-Level Architecture

```
User Input (Company Name)
         ↓
    Streamlit UI
         ↓
   Workflow Engine
    ↙    ↓    ↘
Linear  Cyclic  MCP
         ↓
   Node Orchestration
   ↙  ↓  ↓  ↓  ↘
Researcher → Analyst → Critic → Editor → Quality Check
     ↘_________↗  ↘________↗
         ↓
    LangSmith Tracing
         ↓
   Final SWOT Analysis
```

## Core Components

### 1. Workflow Engine

The system implements two types of workflow graphs:

#### Linear Workflow (`graph_linear.py`)
- Sequential execution of nodes: Researcher → Analyst → Critic → Editor
- Single-pass processing without quality iteration
- Used for baseline processing and testing

#### Cyclic Workflow (`graph_cyclic.py`)
- Iterative self-correcting loop implementation
- Quality-driven revision process with maximum 3 iterations
- Continues until quality ≥ 7/10 or maximum revisions reached

### 2. Workflow Nodes

Each node represents a specific stage in the strategic analysis process:

#### Researcher Node (`src/nodes/researcher.py`)
**Responsibilities:**
- Real-time web search using Tavily API
- Data gathering and summarization
- Structured data preparation for analysis

**Key Features:**
- Tavily API integration for current information
- Mock data fallback for testing environments
- Error handling and graceful degradation

#### Analyst Node (`src/nodes/analyst.py`)
**Responsibilities:**
- SWOT analysis generation using LLM
- Focus on Cost Leadership strategy
- Structured output formatting

**Key Features:**
- Context-aware analysis generation
- Comprehensive business insights
- Consistent output structure

#### Critic Node (`src/nodes/critic.py`)
**Responsibilities:**
- Quality evaluation with 1-10 scoring
- Detailed critique generation
- Objective assessment based on rubric

**Key Features:**
- Rubric-based evaluation system
- Transparent scoring methodology
- Constructive feedback generation

#### Editor Node (`src/nodes/editor.py`)
**Responsibilities:**
- Analysis improvement based on critique
- Revision iteration management
- Quality threshold checking

**Key Features:**
- Intelligent revision suggestions
- Iteration limit enforcement
- Quality progression tracking

### 3. Integration Layers

#### LangSmith Tracing
**Purpose:** Complete workflow observability and debugging
- End-to-end process visualization
- Quality metrics tracking
- Revision history preservation
- Performance monitoring

#### MCP Integration (`src/mcp_server.py`)
**Purpose:** Model Context Protocol support for standardized LLM interactions
- Provider abstraction layer
- Context management
- Tool calling standardization

#### Streamlit UI (`app.py`)
**Purpose:** User-friendly web interface
- Company input collection
- SWOT analysis display
- Quality evaluation visualization
- Process explanation tabs

## Data Flow

1. **Input Phase**
   - User enters company name in Streamlit UI
   - Request routed to workflow engine

2. **Research Phase**
   - Researcher node gathers real-time data
   - Tavily API calls for current information
   - Data structured for analysis

3. **Analysis Phase**
   - Analyst node generates initial SWOT
   - LLM-powered strategic insights
   - Cost Leadership focused recommendations

4. **Evaluation Phase**
   - Critic node assesses quality (1-10)
   - Rubric-based objective scoring
   - Detailed critique generation

5. **Improvement Phase**
   - Editor node revises based on critique
   - Quality threshold checking (≥7/10)
   - Iteration management (max 3)

6. **Output Phase**
   - Final analysis delivered to UI
   - Quality metrics displayed
   - Process explanation provided

## Configuration Management

### Environment Variables
- `TAVILY_API_KEY`: Tavily search API key
- `LANGCHAIN_TRACING_V2`: Enable/disable LangSmith tracing
- `LANGCHAIN_ENDPOINT`: LangSmith endpoint URL
- `LANGCHAIN_API_KEY`: LangSmith API key
- `LANGCHAIN_PROJECT`: LangSmith project name

### Configuration Files
- `.env.example`: Template for environment variables
- `src/utils/config.py`: Configuration loading and validation

## Error Handling and Resilience

### Graceful Degradation
- Mock data fallback when APIs unavailable
- Error-tolerant processing pipelines
- Clear error messaging to users

### Retry Logic
- Exponential backoff for API calls
- Maximum retry attempts per operation
- Circuit breaker pattern for failed services

### Quality Assurance
- Automated testing suite
- Integration testing with real APIs
- UI testing for user experience

## Scalability Considerations

### Horizontal Scaling
- Stateless node implementations
- Cacheable research results
- Session-based state management

### Performance Optimization
- Research data caching
- Efficient prompt engineering
- Selective LangSmith tracing

### Resource Management
- API rate limit awareness
- Memory-efficient data processing
- Cleanup of temporary resources

## Security Considerations

### Data Protection
- Environment-based secret management
- No sensitive data persistence
- Secure API key handling

### Input Validation
- Company name sanitization
- Output content filtering
- Safe prompt construction

### Network Security
- HTTPS-only API communications
- Certificate validation
- Secure dependency management

This architecture enables the A2A Strategy Agent to deliver high-quality strategic analyses while maintaining reliability, observability, and user experience.