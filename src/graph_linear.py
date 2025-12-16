from langgraph.graph import StateGraph
from langchain_core.runnables import RunnableLambda
from src.state import AgentState
from src.nodes.researcher import researcher_node
from src.nodes.analyst import analyst_node
from langsmith import traceable

# Create workflow with enhanced configuration
workflow = StateGraph(AgentState)
workflow.add_node("Researcher", RunnableLambda(researcher_node))
workflow.add_node("Analyst", RunnableLambda(analyst_node))

workflow.set_entry_point("Researcher")
workflow.add_edge("Researcher", "Analyst")
workflow.set_finish_point("Analyst")

# Enhanced configuration with tags and metadata
workflow.config = {
    "project_name": "AI-strategy-agent",
    "tags": ["draft-run", "linear-flow", "swot-analysis"],
    "metadata": {
        "version": "1.0",
        "environment": "development",
        "workflow_type": "researcher-analyst"
    }
}

app = workflow.compile()

# Wrapped execution with metadata for better trace organization
@traceable(name="Run - SWOT Analysis Workflow", tags=["linear", "production", "demo"], metadata={"purpose": "strategic_analysis"})
def run_swot_workflow(company_name="NVIDIA"):
    """Execute the complete SWOT analysis workflow with enhanced tracing"""
    
    output = app.invoke({
        "company_name": company_name,
        "raw_data": None,
        "draft_report": None,
        "critique": None,
        "revision_count": 0,
        "messages": []
    })
    
    return output

# Execute the workflow with the company name as a parameter
if __name__ == "__main__":
    # You can change this to any company you want to analyze
    target_company = "NVIDIA"
    
    print(f"🔍 Running SWOT Analysis for {target_company}...")
    result = run_swot_workflow(target_company)
    
    print(f"\n📊 SWOT Analysis Results for {target_company}:")
    print(result["draft_report"])
    
    # Add some metadata about the run
    print(f"\n✅ Analysis completed successfully!")
    print(f"   - Company: {target_company}")
    print(f"   - Report length: {len(result['draft_report'])} characters")
    print(f"   - Workflow: Researcher → Analyst")
    print(f"   - Tracing: Enhanced LangSmith traces available")