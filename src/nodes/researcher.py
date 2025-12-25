"""
Researcher Agent Node

Fetches data from all 6 MCP servers in parallel and aggregates
the results for the Analyst agent.

Supports two modes:
1. A2A Mode (USE_A2A_RESEARCHER=true): Calls external Researcher A2A Server
2. Direct Mode (default): Calls MCP servers directly via mcp_client
"""

import asyncio
import json
import os
from langsmith import traceable

from src.utils.ticker_lookup import get_ticker, normalize_company_name

# A2A mode toggle
USE_A2A_RESEARCHER = os.getenv("USE_A2A_RESEARCHER", "false").lower() == "true"


async def _fetch_mcp_data(company: str) -> dict:
    """Async helper to fetch all MCP data (direct mode via mcp_aggregator)."""
    from a2a.mcp_aggregator import fetch_all_research_data

    # Get ticker symbol from company name
    ticker = get_ticker(company)

    if not ticker:
        print(f"Could not determine ticker for '{company}', using company name as ticker")
        ticker = company.upper().replace(" ", "")[:5]

    # Normalize company name for display
    company_name = normalize_company_name(company)

    print(f"Fetching MCP data for {company_name} ({ticker})...")

    # Fetch from all MCP servers using direct function imports
    result = await fetch_all_research_data(ticker, company_name)

    return result


async def _fetch_via_a2a(company: str) -> dict:
    """Async helper to fetch data via A2A protocol."""
    from src.nodes.researcher_a2a_client import call_researcher_a2a

    # Get ticker symbol from company name
    ticker = get_ticker(company)

    if not ticker:
        print(f"Could not determine ticker for '{company}', using company name as ticker")
        ticker = company.upper().replace(" ", "")[:5]

    # Normalize company name for display
    company_name = normalize_company_name(company)

    print(f"Calling Researcher A2A Server for {company_name} ({ticker})...")

    # Call A2A server
    result = await call_researcher_a2a(company_name, ticker)

    return result


@traceable(name="Researcher")
def researcher_node(state, workflow_id=None, progress_store=None):
    """
    Researcher node that fetches data from all 6 MCP servers.

    Aggregates: Financials, Volatility, Macro, Valuation, News, Sentiment

    Modes:
    - A2A Mode (USE_A2A_RESEARCHER=true): Calls Researcher A2A Server
    - Direct Mode (default): Calls MCP servers via mcp_client
    """
    company = state["company_name"]

    # Update progress if tracking is enabled
    if workflow_id and progress_store:
        progress_store[workflow_id].update({
            "current_step": "Researcher",
            "revision_count": state.get("revision_count", 0),
            "score": state.get("score", 0)
        })

    try:
        # Choose fetch method based on mode
        if USE_A2A_RESEARCHER:
            print("[A2A Mode] Using Researcher A2A Server")
            result = asyncio.run(_fetch_via_a2a(company))
            state["data_source"] = "a2a"
        else:
            print("[Direct Mode] Using MCP client")
            result = asyncio.run(_fetch_mcp_data(company))

            # Check if this was from cache
            cache_info = result.get("_cache_info", {})
            if cache_info.get("cached"):
                state["data_source"] = "cached"
                print(f"MCP data loaded from cache (expires: {cache_info.get('expires_at')})")
            else:
                state["data_source"] = "live"
                print(f"MCP data fetched from live servers")

        # Check if we got any data
        if result.get("sources_available"):
            state["raw_data"] = json.dumps(result, indent=2, default=str)
            state["sources_failed"] = result.get("sources_failed", [])

            print(f"  - Sources available: {result['sources_available']}")
            if result.get("sources_failed"):
                print(f"  - Sources failed: {result['sources_failed']}")
        else:
            # All MCPs failed - raise error
            raise RuntimeError(f"All MCP servers failed for {company}. Check API configurations.")

    except Exception as e:
        print(f"Research failed: {e}")
        raise RuntimeError(f"Research failed for {company}: {str(e)}")

    return state
