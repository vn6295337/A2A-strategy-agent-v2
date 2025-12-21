# FastAPI backend for A2A Strategy Agent
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import asyncio
import json

# Import the existing workflow
from src.graph_cyclic import app as graph_app
from src.state import AgentState

app = FastAPI(title="A2A Strategy Agent API")

# CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisRequest(BaseModel):
    company_name: str

class AnalysisResponse(BaseModel):
    company_name: str
    draft_report: Optional[str] = None
    critique: Optional[str] = None
    score: Optional[float] = None
    revision_count: int = 0
    report_length: int = 0
    status: str = "pending"
    current_step: str = "initializing"
    progress: float = 0.0
    error: Optional[str] = None

# Global state for tracking workflows
workflow_states: Dict[str, Dict[str, Any]] = {}

def get_workflow_id(request: AnalysisRequest) -> str:
    """Generate a unique workflow ID based on company name"""
    return f"{request.company_name.lower().replace(' ', '_')}_workflow"

@app.post("/api/analyze", response_model=AnalysisResponse)
async def start_analysis(request: AnalysisRequest):
    """Start a new analysis workflow"""
    workflow_id = get_workflow_id(request)
    
    # Initialize state
    state: AgentState = {
        "company_name": request.company_name,
        "raw_data": None,
        "draft_report": None,
        "critique": None,
        "revision_count": 0,
        "messages": []
    }
    
    # Store initial state
    workflow_states[workflow_id] = {
        "state": state,
        "status": "processing",
        "current_step": "initializing",
        "progress": 0.0
    }
    
    return AnalysisResponse(
        company_name=request.company_name,
        status="processing",
        current_step="initializing",
        progress=0.0
    )

@app.get("/api/status/{workflow_id}", response_model=AnalysisResponse)
async def get_status(workflow_id: str):
    """Get the current status of a workflow"""
    if workflow_id not in workflow_states:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    workflow_data = workflow_states[workflow_id]
    state = workflow_data["state"]
    
    # Calculate report length
    report_length = len(state.get("draft_report", "")) if state.get("draft_report") else 0
    
    return AnalysisResponse(
        company_name=state["company_name"],
        draft_report=state.get("draft_report"),
        critique=state.get("critique"),
        score=state.get("score"),
        revision_count=state.get("revision_count", 0),
        report_length=report_length,
        status=workflow_data["status"],
        current_step=workflow_data["current_step"],
        progress=workflow_data["progress"]
    )

@app.post("/api/process/{workflow_id}", response_model=AnalysisResponse)
async def process_workflow(workflow_id: str):
    """Process the workflow step by step"""
    if workflow_id not in workflow_states:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    workflow_data = workflow_states[workflow_id]
    state = workflow_data["state"]
    
    try:
        # Update progress based on current step
        steps = [
            "initializing",
            "gathering_data", 
            "analyzing_position",
            "generating_draft",
            "evaluating_quality",
            "refining_analysis",
            "completed"
        ]
        
        current_step_index = steps.index(workflow_data["current_step"])
        
        if workflow_data["current_step"] == "initializing":
            workflow_data["current_step"] = "gathering_data"
            workflow_data["progress"] = 10.0
        elif workflow_data["current_step"] == "gathering_data":
            workflow_data["current_step"] = "analyzing_position"
            workflow_data["progress"] = 25.0
        elif workflow_data["current_step"] == "analyzing_position":
            workflow_data["current_step"] = "generating_draft"
            workflow_data["progress"] = 40.0
        elif workflow_data["current_step"] == "generating_draft":
            # Execute the actual workflow
            result = graph_app.invoke(state)
            
            # Update state with results
            state.update({
                "draft_report": result.get("draft_report"),
                "critique": result.get("critique"),
                "score": result.get("score"),
                "revision_count": result.get("revision_count", 0)
            })
            
            workflow_data["current_step"] = "evaluating_quality"
            workflow_data["progress"] = 70.0
        elif workflow_data["current_step"] == "evaluating_quality":
            workflow_data["current_step"] = "refining_analysis"
            workflow_data["progress"] = 85.0
        elif workflow_data["current_step"] == "refining_analysis":
            workflow_data["current_step"] = "completed"
            workflow_data["progress"] = 100.0
            workflow_data["status"] = "completed"
        
        # Calculate report length
        report_length = len(state.get("draft_report", "")) if state.get("draft_report") else 0
        
        return AnalysisResponse(
            company_name=state["company_name"],
            draft_report=state.get("draft_report"),
            critique=state.get("critique"),
            score=state.get("score"),
            revision_count=state.get("revision_count", 0),
            report_length=report_length,
            status=workflow_data["status"],
            current_step=workflow_data["current_step"],
            progress=workflow_data["progress"]
        )
    
    except Exception as e:
        workflow_data["status"] = "error"
        workflow_data["error"] = str(e)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "A2A Strategy Agent API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)