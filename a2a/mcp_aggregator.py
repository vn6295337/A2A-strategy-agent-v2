"""
MCP Aggregator - Direct function imports from MCP servers.

This module imports fetcher functions directly from the MCP server modules
(bypassing subprocess calls) for efficient data aggregation.
"""

import asyncio
import importlib.util
import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

logger = logging.getLogger("mcp-aggregator")

# Project paths
PROJECT_ROOT = Path(__file__).parent.parent
MCP_SERVERS_PATH = PROJECT_ROOT / "mcp-servers"


def load_module_from_path(module_name: str, file_path: Path):
    """
    Dynamically load a Python module from file path.
    Needed because mcp-servers directories have hyphens.
    """
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot load module from {file_path}")

    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


# Lazy-loaded MCP server modules
_financials_module = None
_volatility_module = None
_macro_module = None
_valuation_module = None
_news_module = None
_sentiment_module = None


def _load_mcp_modules():
    """Load all MCP server modules."""
    global _financials_module, _volatility_module, _macro_module
    global _valuation_module, _news_module, _sentiment_module

    if _financials_module is None:
        _financials_module = load_module_from_path(
            "financials_basket_server",
            MCP_SERVERS_PATH / "financials-basket" / "server.py"
        )

    if _volatility_module is None:
        _volatility_module = load_module_from_path(
            "volatility_basket_server",
            MCP_SERVERS_PATH / "volatility-basket" / "server.py"
        )

    if _macro_module is None:
        _macro_module = load_module_from_path(
            "macro_basket_server",
            MCP_SERVERS_PATH / "macro-basket" / "server.py"
        )

    if _valuation_module is None:
        _valuation_module = load_module_from_path(
            "valuation_basket_server",
            MCP_SERVERS_PATH / "valuation-basket" / "server.py"
        )

    if _news_module is None:
        _news_module = load_module_from_path(
            "news_basket_server",
            MCP_SERVERS_PATH / "news-basket" / "server.py"
        )

    if _sentiment_module is None:
        _sentiment_module = load_module_from_path(
            "sentiment_basket_server",
            MCP_SERVERS_PATH / "sentiment-basket" / "server.py"
        )


async def fetch_financials(ticker: str) -> dict:
    """Fetch SEC fundamentals for a ticker."""
    _load_mcp_modules()
    try:
        result = await _financials_module.get_sec_fundamentals_basket(ticker)
        return result
    except Exception as e:
        logger.error(f"Financials fetch error for {ticker}: {e}")
        return {"error": str(e), "source": "financials"}


async def fetch_volatility(ticker: str) -> dict:
    """Fetch volatility metrics for a ticker."""
    _load_mcp_modules()
    try:
        result = await _volatility_module.get_full_volatility_basket(ticker)
        return result
    except Exception as e:
        logger.error(f"Volatility fetch error for {ticker}: {e}")
        return {"error": str(e), "source": "volatility"}


async def fetch_macro() -> dict:
    """Fetch macroeconomic indicators."""
    _load_mcp_modules()
    try:
        result = await _macro_module.get_full_macro_basket()
        return result
    except Exception as e:
        logger.error(f"Macro fetch error: {e}")
        return {"error": str(e), "source": "macro"}


async def fetch_valuation(ticker: str) -> dict:
    """Fetch valuation ratios for a ticker using direct import (no MCP SDK)."""
    try:
        # Direct import from fetchers.py to avoid MCP SDK dependency issues
        valuation_fetchers = load_module_from_path(
            "valuation_fetchers",
            MCP_SERVERS_PATH / "valuation-basket" / "fetchers.py"
        )
        result = await valuation_fetchers.get_full_valuation_basket(ticker)
        return result
    except Exception as e:
        logger.error(f"Valuation fetch error for {ticker}: {e}")
        return {"error": str(e), "source": "valuation"}


async def fetch_news(company_name: str, ticker: str = "") -> dict:
    """Fetch news for a company."""
    _load_mcp_modules()
    try:
        result = await _news_module.search_company_news(ticker, company_name)
        return result
    except Exception as e:
        logger.error(f"News fetch error for {company_name}: {e}")
        return {"error": str(e), "source": "news"}


async def fetch_sentiment(ticker: str, company_name: str = "") -> dict:
    """Fetch sentiment metrics for a ticker."""
    _load_mcp_modules()
    try:
        result = await _sentiment_module.get_full_sentiment_basket(ticker, company_name)
        return result
    except Exception as e:
        logger.error(f"Sentiment fetch error for {ticker}: {e}")
        return {"error": str(e), "source": "sentiment"}


async def fetch_all_research_data(ticker: str, company_name: str) -> dict:
    """
    Fetch data from all 6 MCP servers in parallel.

    Args:
        ticker: Stock ticker symbol
        company_name: Company name for news/sentiment search

    Returns:
        Aggregated dict with metrics from all sources and SWOT summary.
    """
    logger.info(f"Fetching research data for {company_name} ({ticker})...")

    # Call all MCP fetchers in parallel
    results = await asyncio.gather(
        fetch_financials(ticker),
        fetch_volatility(ticker),
        fetch_macro(),
        fetch_valuation(ticker),
        fetch_news(company_name, ticker),
        fetch_sentiment(ticker, company_name),
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
            logger.error(f"MCP {name} failed with exception: {result}")
        elif isinstance(result, dict) and "error" in result:
            sources_failed.append(name)
            metrics[name] = result
            logger.warning(f"MCP {name} returned error: {result.get('error')}")
        else:
            sources_available.append(name)
            metrics[name] = result

    # Aggregate SWOT summaries from all sources
    aggregated_swot = {
        "strengths": [],
        "weaknesses": [],
        "opportunities": [],
        "threats": []
    }

    for name in sources_available:
        swot = metrics[name].get("swot_summary", {})
        for category in aggregated_swot:
            items = swot.get(category, [])
            if items:
                aggregated_swot[category].extend(items)

    data = {
        "ticker": ticker.upper(),
        "company_name": company_name,
        "sources_available": sources_available,
        "sources_failed": sources_failed,
        "metrics": metrics,
        "aggregated_swot": aggregated_swot,
        "generated_at": datetime.now().isoformat()
    }

    logger.info(f"Research complete: {len(sources_available)} sources available, {len(sources_failed)} failed")

    return data
