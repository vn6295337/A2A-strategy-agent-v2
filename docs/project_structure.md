# A2A Strategy Agent - Complete Directory Structure

This document provides a comprehensive overview of the A2A Strategy Agent project directory structure, showing all files and folders organized by their functional purpose.

## Root Directory

```
.
├── app.py                          # Main Streamlit application entry point
├── requirements.txt                # Production dependencies
├── Dockerfile                      # Containerization configuration
├── README.md                       # Project overview and getting started guide
├── LICENSE                         # MIT license file
├── .env.example                    # Environment variable template
├── .gitignore                      # Git ignore patterns
└── .github/                        # GitHub configurations
    └── workflows/                  # CI/CD workflows
        └── ci.yml                  # Continuous integration workflow
```

## Source Code (src/)

```
./src/
├── __init__.py                     # Package initialization
├── state.py                        # Application state management
├── tools.py                        # Shared tools and utilities
├── mcp_server.py                   # MCP server integration
├── graph_linear.py                 # Linear workflow graph
├── graph_cyclic.py                 # Cyclic workflow graph
├── demo_mcp_llm_integration.py     # MCP-LLM integration demo
├── test_simple_failure.py          # Simple failure test cases
├── test_direct_failure.py          # Direct failure test cases
├── test_force_failure.py           # Forced failure test cases
├── nodes/                          # Workflow node implementations
│   ├── __init__.py                 # Package initialization
│   ├── researcher.py               # Data gathering node
│   ├── analyst.py                  # SWOT analysis node
│   ├── critic.py                   # Quality evaluation node
│   └── editor.py                   # Revision improvement node
├── prompts/                        # LLM prompt templates
│   └── rubric.txt                  # Quality evaluation rubric
└── utils/                          # Utility functions
    ├── __init__.py                 # Package initialization
    ├── config.py                   # Configuration management
    ├── conditions.py               # Conditional logic
    └── init_db.py                  # Database initialization
```

## Documentation (docs/)

```
./docs/
├── project_structure.md            # This file - directory structure
├── project_summary.md              # High-level project summary
└── checklist.md                    # Implementation checklist
```

## Data Storage (data/)

```
./data/
├── research_cache/                 # Cached research data
└── analysis_results/               # Generated analysis results
```

## Testing (tests/)

```
./tests/
├── __init__.py                     # Package initialization
├── graph_test.py                   # Graph workflow tests
├── test_mcp.py                     # MCP integration tests
├── test_mcp_comprehensive.py       # Comprehensive MCP tests
└── test_streamlit.py               # Streamlit UI tests
```

## Key Organizational Principles

### 1. Separation of Concerns
- **src/**: Core application logic
- **docs/**: Documentation files
- **data/**: Data storage and caching
- **tests/**: Automated tests

### 2. MECE Compliance
Each directory has a distinct purpose with minimal overlap:
- **Source code** is separated from **documentation**
- **Documentation** is distinct from **source code**
- **Test files** are isolated from **production code**
- **Data files** are separate from **code files**

### 3. Standard Conventions
- All Python packages include `__init__.py` files
- Documentation follows consistent naming patterns
- Source code is organized by functional components
- Configuration files use standard formats

## Component Descriptions

### Core Components

1. **Workflow Nodes** (`src/nodes/`)
   - **Researcher**: Gathers real-time data using Tavily API
   - **Analyst**: Generates initial SWOT analysis
   - **Critic**: Evaluates quality with 1-10 scoring
   - **Editor**: Improves analysis based on critique

2. **Graph Workflows** (`src/graph_*.py`)
   - **Linear**: Sequential execution flow
   - **Cyclic**: Iterative self-correcting loop

3. **Utilities** (`src/utils/`)
   - Configuration management
   - Conditional logic handling
   - Database initialization

4. **Prompt Templates** (`src/prompts/`)
   - Quality evaluation rubric
   - Node-specific prompt templates

### Integration Points

1. **LangSmith Tracing** (`src/demo_mcp_llm_integration.py`)
   - Workflow visualization
   - Quality metrics tracking
   - Revision history preservation

2. **MCP Integration** (`src/mcp_server.py`)
   - Model Context Protocol support
   - LLM provider abstraction

3. **Streamlit UI** (`app.py`)
   - Web interface for user interaction
   - Visual quality indicators
   - Process explanation tabs

This structure follows MECE (Mutually Exclusive, Collectively Exhaustive) principles, ensuring each file and directory has a distinct purpose with minimal overlap.