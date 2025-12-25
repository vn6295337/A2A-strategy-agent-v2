# A2A Researcher Agent Architecture

## Overview

The Researcher agent is being promoted from an in-process LangGraph node to a standalone A2A (Agent-to-Agent) server. This enables:

- **Parallel data fetching** without blocking other agents
- **Independent scaling** (Researcher is I/O heavy, others are LLM heavy)
- **Reusable** across different workflows
- **Better fault isolation**

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│  Main Orchestrator (LangGraph on port 8002)             │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │              A2A Client                          │   │
│  │  (researcher_a2a_client.py)                      │   │
│  └──────────────────────────────────────────────────┘   │
│       │                                                 │
│       │ JSON-RPC 2.0 over HTTP                          │
│       │ POST http://localhost:8003/                     │
│       ↓                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ Analyst  │→ │  Critic  │→ │  Editor  │               │
│  └──────────┘  └──────────┘  └──────────┘               │
└─────────────────────────────────────────────────────────┘

        ↑ Research data (raw_data in AgentState)
        │
┌───────┴─────────────────────────────────────────────────┐
│  Researcher A2A Server (port 8003)                      │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │              A2A Server                          │   │
│  │  (researcher_server.py using google-a2a SDK)     │   │
│  │                                                  │   │
│  │  Endpoints:                                      │   │
│  │  - GET  /.well-known/agent.json  (Agent Card)    │   │
│  │  - POST /  (JSON-RPC: message/send, tasks/get)   │   │
│  └──────────────────────────────────────────────────┘   │
│       │                                                 │
│       │ MCP Protocol (stdio)                            │
│       ↓                                                 │
│  ┌─────────────┐ ┌─────────────┐                        │
│  │  Sentiment  │ │    News     │   (Phase 1)            │
│  │  MCP Server │ │  MCP Server │                        │
│  └─────────────┘ └─────────────┘                        │
│                                                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │  Financials │ │  Volatility │ │    Macro    │ (P2)   │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
└─────────────────────────────────────────────────────────┘
```

## A2A Protocol

### What is A2A?

A2A (Agent-to-Agent) is Google's open protocol for agent interoperability. It enables:
- **Agent Discovery**: Agents expose capabilities via Agent Cards
- **Task Management**: Async task submission with status tracking
- **Structured Communication**: JSON-RPC 2.0 over HTTP

Reference: https://github.com/google-a2a/A2A

### Agent Card

Served at `/.well-known/agent.json`:

```json
{
  "name": "swot-researcher",
  "version": "1.0.0",
  "description": "Financial research agent that aggregates data from MCP baskets for SWOT analysis",
  "protocolVersion": "0.3",
  "capabilities": {
    "streaming": false,
    "pushNotifications": false
  },
  "skills": [
    {
      "id": "research-company",
      "name": "Company Research",
      "description": "Aggregate financial data from Sentiment and News baskets",
      "inputModes": ["text"],
      "outputModes": ["text", "data"]
    }
  ],
  "url": "http://localhost:8003"
}
```

### JSON-RPC Methods

| Method | Description | Request | Response |
|--------|-------------|---------|----------|
| `message/send` | Submit research task | `{message: {role, parts}}` | `{task: {id, status}}` |
| `tasks/get` | Get task status/results | `{taskId}` | `{task: {id, status, artifacts}}` |
| `tasks/cancel` | Cancel running task | `{taskId}` | `{cancelled: bool}` |

### Task Lifecycle

```
SUBMITTED → WORKING → COMPLETED
                   ↘ FAILED
```

## File Structure

```
a2a/
├── __init__.py
├── researcher_server.py      # A2A server (FastAPI + google-a2a SDK)
├── agent_card.json           # Agent capabilities metadata
├── mcp_aggregator.py         # Calls Sentiment + News MCP servers
└── requirements.txt          # google-a2a, httpx, etc.

src/nodes/
├── researcher.py             # MODIFIED: Toggles between in-process and A2A
└── researcher_a2a_client.py  # A2A client wrapper
```

## MCP Basket Integration

### Phase 1 (Minimal Viable)

| Basket | MCP Server | Tool | Output |
|--------|------------|------|--------|
| Sentiment | `mcp-servers/sentiment-basket/` | `get_sentiment_basket` | Finnhub + Reddit scores |
| News | `mcp-servers/news-basket/` | `search_company_news` | Tavily news articles |

### Phase 2 (Future Expansion)

| Basket | MCP Server | Tool | Output |
|--------|------------|------|--------|
| Financials | `mcp-servers/financials-basket/` | `get_sec_fundamentals` | SEC EDGAR data |
| Volatility | `mcp-servers/volatility-basket/` | `get_volatility_basket` | VIX, Beta, HV, IV |
| Macro | `mcp-servers/macro-basket/` | `get_macro_basket` | GDP, rates, CPI |
| Valuation | `mcp-servers/valuation-basket/` | `get_valuation_basket` | P/E, P/B, EV/EBITDA |

## Configuration

### Environment Variables

```bash
# Enable A2A Researcher (default: false, uses in-process Tavily mode)
USE_A2A_RESEARCHER=true

# A2A Researcher server URL
A2A_RESEARCHER_URL=http://localhost:8003
```

### Running the A2A Server

```bash
# Terminal 1: Start A2A Researcher
cd a2a
python researcher_server.py
# Server running on http://localhost:8003

# Terminal 2: Start main orchestrator
cd ..
python app.py  # or uvicorn api.main:app
```

## Fallback Strategy

If A2A server is unavailable, the orchestrator falls back to in-process mode:

```python
try:
    result = _research_via_a2a(state, company)
except (ConnectionError, Timeout):
    logger.warning("A2A unavailable, falling back to in-process")
    result = _research_in_process(state, company)  # Existing Tavily-only mode
```

## Data Flow

### Request Flow

1. User submits company name via Streamlit/API
2. Orchestrator's Researcher node detects `USE_A2A_RESEARCHER=true`
3. A2A client sends `message/send` with research request
4. A2A server creates task, returns task ID
5. A2A server spawns MCP aggregator in background
6. MCP aggregator calls Sentiment + News baskets concurrently
7. Results aggregated, LLM synthesizes summary
8. Task marked COMPLETED with artifacts
9. A2A client polls `tasks/get` until complete
10. Research data passed to Analyst node

### Response Structure

```json
{
  "task": {
    "id": "uuid-here",
    "status": "completed",
    "artifacts": [
      {
        "name": "research_data",
        "parts": [
          {
            "type": "data",
            "data": {
              "sentiment": {"score": 52.89, "finnhub": {...}, "reddit": {...}},
              "news": {"articles": [...], "summary": "..."}
            }
          },
          {
            "type": "text",
            "text": "Research summary for SWOT analysis..."
          }
        ]
      }
    ]
  }
}
```

## Benefits

| Aspect | In-Process Mode | A2A Mode |
|--------|-----------------|----------|
| Data Sources | Tavily only | 6 MCP baskets |
| Latency | Blocking | Async |
| Scaling | Coupled | Independent |
| Fault Isolation | Shared process | Separate process |
| Reusability | Single workflow | Any A2A client |
