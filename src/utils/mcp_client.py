"""
MCP Client - Generic client for calling MCP servers via subprocess stdio.
"""

import asyncio
import json
import os
from pathlib import Path
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Base path for MCP servers
MCP_SERVERS_PATH = Path(__file__).parent.parent.parent / "mcp-servers"


async def call_mcp_server(
    server_name: str,
    tool_name: str,
    arguments: dict,
    timeout: float = 30.0
) -> dict:
    """
    Call an MCP server tool via subprocess stdio.

    Args:
        server_name: Name of the MCP server directory (e.g., 'financials-basket')
        tool_name: Name of the tool to call (e.g., 'get_sec_fundamentals')
        arguments: Dict of arguments to pass to the tool
        timeout: Timeout in seconds

    Returns:
        Dict with tool result or error
    """
    server_path = MCP_SERVERS_PATH / server_name / "server.py"

    if not server_path.exists():
        return {"error": f"MCP server not found: {server_name}"}

    # JSON-RPC 2.0 request for tool call
    request = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": arguments
        }
    }

    try:
        # Start the MCP server process
        process = await asyncio.create_subprocess_exec(
            "python3", str(server_path),
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=str(server_path.parent),
            env={**os.environ}
        )

        # Send the request
        request_bytes = json.dumps(request).encode() + b"\n"

        try:
            stdout, stderr = await asyncio.wait_for(
                process.communicate(input=request_bytes),
                timeout=timeout
            )
        except asyncio.TimeoutError:
            process.kill()
            return {"error": f"Timeout calling {server_name}/{tool_name}"}

        if process.returncode != 0:
            error_msg = stderr.decode().strip() if stderr else "Unknown error"
            logger.error(f"MCP server {server_name} failed: {error_msg}")
            return {"error": error_msg}

        # Parse response
        response_text = stdout.decode().strip()
        if not response_text:
            return {"error": "Empty response from MCP server"}

        # Find the JSON response (skip any initialization messages)
        for line in response_text.split("\n"):
            line = line.strip()
            if line.startswith("{"):
                try:
                    response = json.loads(line)
                    if "result" in response:
                        # Extract text content from MCP response
                        result = response["result"]
                        if isinstance(result, list) and len(result) > 0:
                            content = result[0]
                            if isinstance(content, dict) and content.get("type") == "text":
                                return json.loads(content.get("text", "{}"))
                        return result
                    elif "error" in response:
                        return {"error": response["error"]}
                except json.JSONDecodeError:
                    continue

        return {"error": "Could not parse MCP response"}

    except Exception as e:
        logger.error(f"Error calling MCP server {server_name}: {e}")
        return {"error": str(e)}


async def call_financials_mcp(ticker: str) -> dict:
    """Fetch SEC fundamentals for a ticker."""
    return await call_mcp_server(
        "financials-basket",
        "get_sec_fundamentals",
        {"ticker": ticker}
    )


async def call_volatility_mcp(ticker: str) -> dict:
    """Fetch volatility metrics for a ticker."""
    return await call_mcp_server(
        "volatility-basket",
        "get_volatility_basket",
        {"ticker": ticker}
    )


async def call_macro_mcp() -> dict:
    """Fetch macroeconomic indicators."""
    return await call_mcp_server(
        "macro-basket",
        "get_macro_basket",
        {}
    )


async def call_valuation_mcp(ticker: str) -> dict:
    """Fetch valuation ratios for a ticker."""
    return await call_mcp_server(
        "valuation-basket",
        "get_valuation_basket",
        {"ticker": ticker}
    )


async def call_news_mcp(company: str) -> dict:
    """Fetch news for a company."""
    return await call_mcp_server(
        "news-basket",
        "search_company_news",
        {"company": company}
    )


async def call_sentiment_mcp(ticker: str, company_name: str = "") -> dict:
    """Fetch sentiment metrics for a ticker."""
    return await call_mcp_server(
        "sentiment-basket",
        "get_sentiment_basket",
        {"ticker": ticker, "company_name": company_name}
    )


async def fetch_all_mcp_data(ticker: str, company_name: str, use_cache: bool = True) -> dict:
    """
    Fetch data from all 6 MCP servers in parallel.

    Args:
        ticker: Stock ticker symbol
        company_name: Company name
        use_cache: Whether to check cache first (default True)

    Returns aggregated results with sources_available and sources_failed lists.
    """
    from datetime import datetime
    from src.utils.mcp_cache import get_cached_data, set_cached_data

    # Check cache first
    if use_cache:
        cached = get_cached_data(ticker)
        if cached:
            logger.info(f"Cache hit for {ticker}")
            return cached

    logger.info(f"Cache miss for {ticker}, fetching from MCP servers...")

    # Call all MCPs in parallel
    results = await asyncio.gather(
        call_financials_mcp(ticker),
        call_volatility_mcp(ticker),
        call_macro_mcp(),
        call_valuation_mcp(ticker),
        call_news_mcp(company_name),
        call_sentiment_mcp(ticker, company_name),
        return_exceptions=True
    )

    mcp_names = ["financials", "volatility", "macro", "valuation", "news", "sentiment"]

    metrics = {}
    sources_available = []
    sources_failed = []

    for name, result in zip(mcp_names, results):
        if isinstance(result, Exception):
            sources_failed.append(name)
            metrics[name] = {"error": str(result)}
        elif isinstance(result, dict) and "error" in result:
            sources_failed.append(name)
            metrics[name] = result
        else:
            sources_available.append(name)
            metrics[name] = result

    data = {
        "ticker": ticker,
        "company_name": company_name,
        "sources_available": sources_available,
        "sources_failed": sources_failed,
        "metrics": metrics,
        "generated_at": datetime.now().isoformat()
    }

    # Cache the results if we got any valid data
    if sources_available:
        set_cached_data(ticker, company_name, data)
        logger.info(f"Cached data for {ticker}")

    return data
