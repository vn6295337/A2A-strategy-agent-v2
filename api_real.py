# FastAPI backend with real AI workflow integration
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import asyncio
import json
import traceback

# Import the actual AI workflow
from src.graph_cyclic import app as graph_app
from src.state import AgentState

app = FastAPI(title="A2A Strategy Agent API - Real Workflow")

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

def parse_swot_data(draft_report: str) -> Dict[str, Any]:
    """Parse SWOT data from the draft report"""
    if not draft_report:
        return {
            "strengths": [],
            "weaknesses": [],
            "opportunities": [],
            "threats": []
        }
    
    # Simple parsing - in production, use proper NLP parsing
    lines = draft_report.split('\n')
    
    strengths = []
    weaknesses = []
    opportunities = []
    threats = []
    
    current_section = None
    
    for line in lines:
        line = line.strip()
        if line.startswith('## Strengths'):
            current_section = 'strengths'
        elif line.startswith('## Weaknesses'):
            current_section = 'weaknesses'
        elif line.startswith('## Opportunities'):
            current_section = 'opportunities'
        elif line.startswith('## Threats'):
            current_section = 'threats'
        elif line.startswith('- ') and current_section:
            item = line[2:].strip()
            if current_section == 'strengths' and item:
                strengths.append(item)
            elif current_section == 'weaknesses' and item:
                weaknesses.append(item)
            elif current_section == 'opportunities' and item:
                opportunities.append(item)
            elif current_section == 'threats' and item:
                threats.append(item)
    
    return {
        "strengths": strengths,
        "weaknesses": weaknesses,
        "opportunities": opportunities,
        "threats": threats
    }

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
            # Execute the actual AI workflow
            print(f"Executing real AI workflow for: {state['company_name']}")
            
            # This is where the real magic happens!
            result = graph_app.invoke(state)
            
            print(f"AI workflow completed. Result keys: {list(result.keys())}")
            
            # Update state with results
            state.update({
                "draft_report": result.get("draft_report"),
                "critique": result.get("critique"),
                "score": result.get("score"),
                "revision_count": result.get("revision_count", 0),
                "raw_data": result.get("raw_data"),
                "messages": result.get("messages", [])
            })
            
            # Parse SWOT data for structured display
            if state.get("draft_report"):
                swot_data = parse_swot_data(state["draft_report"])
                state["swot_data"] = swot_data
            
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
        error_msg = f"Error in AI workflow: {str(e)}\n\n{traceback.format_exc()}"
        print(error_msg)
        workflow_data["status"] = "error"
        workflow_data["error"] = f"AI workflow error: {str(e)}"
        raise HTTPException(status_code=500, detail=f"AI workflow failed: {str(e)}")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "A2A Strategy Agent API with real AI workflow is running"}

@app.get("/api/swot/{workflow_id}")
async def get_swot_data(workflow_id: str):
    """Get structured SWOT data for a workflow"""
    if workflow_id not in workflow_states:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    workflow_data = workflow_states[workflow_id]
    state = workflow_data["state"]
    
    if "swot_data" not in state:
        if state.get("draft_report"):
            state["swot_data"] = parse_swot_data(state["draft_report"])
        else:
            state["swot_data"] = {
                "strengths": [],
                "weaknesses": [],
                "opportunities": [],
                "threats": []
            }
    
    return state["swot_data"]

if __name__ == "__main__":
    import uvicorn
    import os
    
    # Get port from environment or use default
    port = int(os.environ.get("PORT", 8002))
    host = os.environ.get("HOST", "0.0.0.0")
    
    print(f"🌐 Starting FastAPI server on {host}:{port}")
    uvicorn.run(app, host=host, port=port)