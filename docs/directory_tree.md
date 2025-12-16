# Directory Tree

This document provides a simplified tree view of the A2A Strategy Agent project directory structure.

```
A2A-strategy-agent/
├── app.py                          # Main Streamlit application entry point
├── requirements.txt                # Production dependencies
├── Dockerfile                      # Containerization configuration
├── README.md                       # Project overview and getting started guide
├── LICENSE                         # MIT license file
├── .env.example                    # Environment variable template
├── .gitignore                      # Git ignore patterns
├── .github/                        # GitHub configurations
│   └── workflows/                  # CI/CD workflows
│       └── ci.yml                  # Continuous integration workflow
├── data/                           # Data storage
│   ├── research_cache/             # Cached research data
│   └── analysis_results/           # Generated analysis results
├── demos/                          # Demo files and examples
├── docs/                           # Documentation files
│   ├── project_structure.md        # Detailed directory structure
│   ├── project_summary.md          # High-level project summary
│   └── checklist.md                # Implementation checklist
├── src/                            # Source code
│   ├── __init__.py                 # Package initialization
│   ├── state.py                    # Application state management
│   ├── tools.py                    # Shared tools and utilities
│   ├── mcp_server.py               # MCP server integration
│   ├── graph_linear.py             # Linear workflow graph
│   ├── graph_cyclic.py             # Cyclic workflow graph
│   ├── demo_mcp_llm_integration.py # MCP-LLM integration demo
│   ├── test_simple_failure.py      # Simple failure test cases
│   ├── test_direct_failure.py      # Direct failure test cases
│   ├── test_force_failure.py       # Forced failure test cases
│   ├── nodes/                      # Workflow node implementations
│   │   ├── __init__.py             # Package initialization
│   │   ├── researcher.py           # Data gathering node
│   │   ├── analyst.py              # SWOT analysis node
│   │   ├── critic.py               # Quality evaluation node
│   │   └── editor.py               # Revision improvement node
│   ├── prompts/                    # LLM prompt templates
│   │   └── rubric.txt              # Quality evaluation rubric
│   └── utils/                      # Utility functions
│       ├── __init__.py             # Package initialization
│       ├── config.py               # Configuration management
│       ├── conditions.py           # Conditional logic
│       └── init_db.py              # Database initialization
└── tests/                          # Test files
    ├── __init__.py                 # Package initialization
    ├── graph_test.py               # Graph workflow tests
    ├── test_mcp.py                 # MCP integration tests
    ├── test_mcp_comprehensive.py   # Comprehensive MCP tests
    └── test_streamlit.py           # Streamlit UI tests
```

## Key Directories

### src/ - Source Code
Contains all Python source code organized by functional components:
- `nodes/`: Workflow node implementations for each stage of the process
- `utils/`: Utility functions and helper modules
- `prompts/`: LLM prompt templates and evaluation rubrics

### docs/ - Documentation
Comprehensive documentation covering all aspects of the system:
- Project structure and organization
- High-level project summary
- Implementation checklist

### tests/ - Testing
Automated tests ensuring system reliability and correctness:
- Graph workflow tests
- MCP integration tests
- Streamlit UI tests

### data/ - Data Storage
Persistent data storage for cached research and analysis results.

## File Naming Conventions

- **Python files**: snake_case naming convention
- **Documentation**: kebab-case markdown files
- **Configuration**: dot-prefixed configuration files
- **Tests**: prefixed with `test_`

This structure follows MECE (Mutually Exclusive, Collectively Exhaustive) principles, ensuring each file and directory has a distinct purpose with minimal overlap.