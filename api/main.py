"""
FastAPI backend for A2A Strategy Agent React frontend.
Provides async workflow execution with real-time progress tracking.
"""

import sys
import os
import threading
import uuid
import re
from typing import Optional

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv

from src.stock_listings import get_us_stock_listings, search_stocks

# Load environment variables
load_dotenv()

app = FastAPI(
    title="A2A Strategy Agent API",
    description="Multi-agent SWOT analysis with self-correcting quality control",
    version="2.0.0"
)

# CORS configuration for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:3000",
        "https://huggingface.co",
        "https://*.hf.space",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory workflow storage
WORKFLOWS: dict = {}

# Stock listings cache (loaded once at startup)
STOCK_LISTINGS: list = []


@app.on_event("startup")
async def load_stock_listings():
    """Load stock listings on startup."""
    global STOCK_LISTINGS
    try:
        STOCK_LISTINGS = get_us_stock_listings()
        print(f"Loaded {len(STOCK_LISTINGS)} US stock listings")
    except Exception as e:
        print(f"Warning: Could not load stock listings: {e}")


# Request/Response Models
class AnalysisRequest(BaseModel):
    name: str
    ticker: str = ""
    strategy_focus: str = "Competitive Position"


class StockSearchResult(BaseModel):
    symbol: str
    name: str
    exchange: str
    match_type: str


class WorkflowStartResponse(BaseModel):
    workflow_id: str


class WorkflowStatus(BaseModel):
    status: str  # 'running', 'completed', 'error'
    current_step: str  # 'starting', 'Researcher', 'Analyst', 'Critic', 'Editor'
    revision_count: int
    score: int


class SwotData(BaseModel):
    strengths: list[str]
    weaknesses: list[str]
    opportunities: list[str]
    threats: list[str]


class AnalysisResult(BaseModel):
    company_name: str
    score: int
    revision_count: int
    report_length: int
    critique: str
    swot_data: SwotData


def parse_swot_text(text: str) -> dict:
    """Parse SWOT text into structured sections."""
    sections = {
        "strengths": [],
        "weaknesses": [],
        "opportunities": [],
        "threats": []
    }

    current_section = None
    lines = text.split('\n')

    for line in lines:
        line = line.strip()
        if not line:
            continue

        lower_line = line.lower()
        if 'strength' in lower_line:
            current_section = 'strengths'
        elif 'weakness' in lower_line:
            current_section = 'weaknesses'
        elif 'opportunit' in lower_line:
            current_section = 'opportunities'
        elif 'threat' in lower_line:
            current_section = 'threats'
        elif current_section and line.startswith('-'):
            # Remove leading dash and whitespace
            item = line.lstrip('- ').strip()
            if item:
                sections[current_section].append(item)

    return sections


def add_activity_log(workflow_id: str, step: str, message: str):
    """Add an entry to the workflow activity log."""
    if workflow_id in WORKFLOWS:
        if "activity_log" not in WORKFLOWS[workflow_id]:
            WORKFLOWS[workflow_id]["activity_log"] = []
        WORKFLOWS[workflow_id]["activity_log"].append({
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "step": step,
            "message": message
        })


def run_workflow_background(workflow_id: str, company_name: str, ticker: str, strategy_focus: str):
    """Execute workflow in background thread with progress tracking."""
    try:
        # Import here to avoid circular imports and init issues
        from src.graph_cyclic import app as graph_app

        # Update status to running
        WORKFLOWS[workflow_id]["status"] = "running"
        WORKFLOWS[workflow_id]["current_step"] = "researcher"
        add_activity_log(workflow_id, "input", f"Starting analysis for {company_name} ({ticker})")

        # Initialize MCP status
        WORKFLOWS[workflow_id]["mcp_status"] = {
            "financials": "idle",
            "valuation": "idle",
            "volatility": "idle",
            "macro": "idle",
            "news": "idle",
            "sentiment": "idle"
        }

        # Initialize state
        state = {
            "company_name": company_name,
            "ticker": ticker,
            "strategy_focus": strategy_focus,
            "raw_data": None,
            "draft_report": None,
            "critique": None,
            "revision_count": 0,
            "messages": [],
            "score": 0,
            "data_source": "live",
            "provider_used": None,
            "workflow_id": workflow_id,
            "progress_store": WORKFLOWS
        }

        # Execute workflow
        result = graph_app.invoke(state)

        # Parse SWOT from draft report
        swot_data = parse_swot_text(result.get("draft_report", ""))

        # Update with final result
        WORKFLOWS[workflow_id].update({
            "status": "completed",
            "current_step": "completed",
            "revision_count": result.get("revision_count", 0),
            "score": result.get("score", 0),
            "result": {
                "company_name": company_name,
                "score": result.get("score", 0),
                "revision_count": result.get("revision_count", 0),
                "report_length": len(result.get("draft_report", "")),
                "critique": result.get("critique", ""),
                "swot_data": swot_data,
                "raw_report": result.get("draft_report", ""),
                "data_source": result.get("data_source", "unknown"),
                "provider_used": result.get("provider_used", "unknown")
            }
        })

    except Exception as e:
        WORKFLOWS[workflow_id].update({
            "status": "error",
            "error": str(e)
        })


@app.post("/analyze", response_model=WorkflowStartResponse)
async def start_analysis(request: AnalysisRequest):
    """Start a new SWOT analysis workflow."""
    workflow_id = str(uuid.uuid4())

    # Initialize workflow state
    WORKFLOWS[workflow_id] = {
        "status": "starting",
        "current_step": "input",
        "revision_count": 0,
        "score": 0,
        "company_name": request.name,
        "ticker": request.ticker,
        "strategy_focus": request.strategy_focus,
        "activity_log": [],
        "mcp_status": {
            "financials": "idle",
            "valuation": "idle",
            "volatility": "idle",
            "macro": "idle",
            "news": "idle",
            "sentiment": "idle"
        }
    }

    # Start workflow in background thread
    thread = threading.Thread(
        target=run_workflow_background,
        args=(workflow_id, request.name, request.ticker, request.strategy_focus),
        daemon=True
    )
    thread.start()

    return {"workflow_id": workflow_id}


@app.get("/workflow/{workflow_id}/status")
async def get_workflow_status(workflow_id: str):
    """Get current status of a workflow."""
    if workflow_id not in WORKFLOWS:
        raise HTTPException(status_code=404, detail="Workflow not found")

    workflow = WORKFLOWS[workflow_id]
    return {
        "status": workflow.get("status", "unknown"),
        "current_step": workflow.get("current_step", "unknown"),
        "revision_count": workflow.get("revision_count", 0),
        "score": workflow.get("score", 0),
        "activity_log": workflow.get("activity_log", []),
        "mcp_status": workflow.get("mcp_status", {}),
        "provider_used": workflow.get("provider_used"),
        "data_source": workflow.get("data_source")
    }


@app.get("/workflow/{workflow_id}/result")
async def get_workflow_result(workflow_id: str):
    """Get final result of a completed workflow."""
    if workflow_id not in WORKFLOWS:
        raise HTTPException(status_code=404, detail="Workflow not found")

    workflow = WORKFLOWS[workflow_id]

    if workflow.get("status") != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Workflow not completed. Status: {workflow.get('status')}"
        )

    return workflow.get("result", {})


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "active_workflows": len(WORKFLOWS)
    }


@app.get("/api/stocks/search")
async def search_stocks_endpoint(q: str = Query(..., min_length=1, max_length=50)):
    """Search US stock listings by symbol or company name."""
    if not STOCK_LISTINGS:
        # Fallback: try loading if not already loaded
        try:
            listings = get_us_stock_listings()
        except Exception:
            raise HTTPException(status_code=503, detail="Stock listings not available")
    else:
        listings = STOCK_LISTINGS

    results = search_stocks(q, listings, max_results=10)

    return {
        "query": q,
        "results": [
            {
                "symbol": r["symbol"],
                "name": r["name"],
                "exchange": r["exchange"],
                "match_type": r.get("match_type", "unknown")
            }
            for r in results
        ]
    }


@app.get("/api")
async def api_info():
    """API info endpoint."""
    return {
        "name": "A2A Strategy Agent API",
        "version": "2.0.0",
        "endpoints": [
            "POST /analyze - Start SWOT analysis",
            "GET /workflow/{id}/status - Get workflow progress",
            "GET /workflow/{id}/result - Get final result",
            "GET /api/stocks/search - Search US stocks",
            "GET /health - Health check"
        ]
    }


# Serve React frontend static files (for Docker/HF Spaces deployment)
STATIC_DIR = Path(__file__).parent.parent / "static"
if STATIC_DIR.exists():
    from fastapi.responses import FileResponse

    # Mount static assets FIRST (before catch-all routes)
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")

    @app.get("/")
    async def serve_index():
        return FileResponse(STATIC_DIR / "index.html")

    # Serve vite.svg and other root static files
    @app.get("/vite.svg")
    async def serve_vite_svg():
        return FileResponse(STATIC_DIR / "vite.svg")

    # Fallback for SPA routing - exclude API and asset paths
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't intercept API routes or assets
        if full_path.startswith(("api/", "assets/", "analyze", "workflow", "health")):
            return {"error": "Not found"}
        file_path = STATIC_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(STATIC_DIR / "index.html")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
