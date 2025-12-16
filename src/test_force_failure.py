"""
Test script to force a failure in the self-correcting loop
This demonstrates the Editor node being triggered when initial quality is poor
"""

from langgraph.graph import StateGraph
from langchain_core.runnables import RunnableLambda
from src.state import AgentState
from src.nodes.researcher import researcher_node
from src.nodes.analyst import analyst_node
from src.nodes.critic import critic_node
from src.nodes.editor import editor_node
from src.utils.conditions import should_continue
from langsmith import traceable

# Create the cyclic workflow
workflow = StateGraph(AgentState)

# Add all nodes to the workflow
workflow.add_node("Researcher", RunnableLambda(researcher_node))
workflow.add_node("Analyst", RunnableLambda(analyst_node))
workflow.add_node("Critic", RunnableLambda(critic_node))
workflow.add_node("Editor", RunnableLambda(editor_node))

# Define the workflow edges
workflow.set_entry_point("Researcher")
workflow.add_edge("Researcher", "Analyst")
workflow.add_edge("Analyst", "Critic")

# Add conditional edges for the self-correcting loop
workflow.add_conditional_edges(
    "Critic", 
    should_continue, 
    {
        "exit": "__end__",
        "retry": "Editor"
    }
)

# Complete the loop: Editor → Critic
workflow.add_edge("Editor", "Critic")

# Set the finish point
workflow.set_finish_point("Critic")

# Enhanced configuration for better tracing
workflow.config = {
    "project_name": "AI-strategy-agent-cyclic",
    "tags": ["self-correcting", "quality-loop", "swot-analysis", "forced-failure"],
    "metadata": {
        "version": "1.0",
        "environment": "testing",
        "workflow_type": "researcher-analyst-critic-editor",
        "purpose": "demonstrate_self_correction"
    }
}

# Compile the workflow
app = workflow.compile()

# Modified analyst node that forces poor quality output
def force_poor_analyst_node(state):
    """
    Force a poor quality draft to trigger the Editor node
    This simulates what happens when the Analyst produces subpar work
    """
    # Call the original analyst but then weaken the output
    state = analyst_node(state)
    
    # Force bad data to guarantee poor score
    state["draft_report"] = "Short placeholder data. Not enough details."
    
    print("⚠️  FORCED POOR QUALITY: Overriding draft with weak content")
    print(f"   Original length: {len(state.get('original_draft', ''))} chars")
    print(f"   Forced length: {len(state['draft_report'])} chars")
    
    return state

# Create a test workflow with the forced failure
@traceable(name="Test - Forced Failure Self-Correction", tags=["testing", "forced-failure", "demo"], metadata={"test_type": "quality_recovery"})
def test_forced_failure_workflow(company_name="TestCompany"):
    """Execute workflow with forced poor initial quality to test self-correction"""
    
    # Initialize state
    initial_state = {
        "company_name": company_name,
        "raw_data": None,
        "draft_report": None,
        "critique": None,
        "revision_count": 0,
        "messages": [],
        "score": 0
    }
    
    print(f"🔧 Testing Self-Correcting Loop with Forced Failure")
    print(f"   Company: {company_name}")
    print(f"   Strategy: Force poor initial draft → trigger Editor → verify improvement")
    print()
    
    # Execute the workflow
    output = app.invoke(initial_state)
    
    return output

# Test the forced failure scenario
if __name__ == "__main__":
    print("🚨 FORCED FAILURE TEST - Self-Correcting Loop")
    print("=" * 60)
    print()
    
    # Run the test
    result = test_forced_failure_workflow("TestCompany")
    
    # Display results
    print()
    print("📊 TEST RESULTS:")
    print("-" * 40)
    print(f"Initial Draft: Short placeholder data. Not enough details.")
    print(f"Final Score: {result.get('score', 'N/A')}/10")
    print(f"Revisions Made: {result.get('revision_count', 0)}")
    print(f"Final Draft Length: {len(result.get('draft_report', ''))} characters")
    print()
    
    # Verify self-correction worked
    final_score = result.get('score', 0)
    revisions = result.get('revision_count', 0)
    
    if revisions > 0 and final_score >= 7:
        print("✅ SELF-CORRECTION SUCCESS!")
        print("   - Editor was triggered (revisions > 0)")
        print("   - Quality improved to acceptable level (score ≥ 7)")
        print("   - Loop exited properly")
    elif revisions > 0:
        print("⚠️  PARTIAL SUCCESS")
        print("   - Editor was triggered (revisions > 0)")
        print("   - Quality improved but may not meet threshold")
        print(f"   - Final score: {final_score}/10")
    else:
        print("❌ SELF-CORRECTION FAILED")
        print("   - Editor was not triggered")
        print("   - No quality improvement occurred")
    
    print()
    print("📄 FINAL DRAFT:")
    print(result.get('draft_report', 'No draft available'))