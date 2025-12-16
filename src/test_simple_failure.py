"""
Simple test to force failure and verify self-correcting loop
"""

from src.graph_cyclic import run_self_correcting_workflow

# Monkey patch the analyst node to force poor quality
def force_poor_analyst(state):
    """Force a poor quality draft to trigger Editor"""
    # Force extremely bad data that will definitely get low score
    state["draft_report"] = "Bad analysis. No details. Incomplete."
    print("⚠️  FORCED POOR QUALITY: Overriding with very weak content")
    
    return state

# Temporarily replace analyst in the workflow
import src.nodes.analyst
original_analyst = src.nodes.analyst.analyst_node
src.nodes.analyst.analyst_node = force_poor_analyst

try:
    print("🚨 Testing Self-Correcting Loop with Forced Failure")
    print("=" * 50)
    
    # Run workflow - should trigger Editor due to poor quality
    result = run_self_correcting_workflow("TestCompany")
    
    print(f"\n📊 RESULTS:")
    print(f"Score: {result.get('score', 'N/A')}/10")
    print(f"Revisions: {result.get('revision_count', 0)}")
    print(f"Final Length: {len(result.get('draft_report', ''))} chars")
    
    # Verify self-correction
    score = result.get('score', 0)
    revisions = result.get('revision_count', 0)
    
    if revisions > 0 and score >= 7:
        print("✅ SUCCESS: Editor triggered and quality improved!")
    elif revisions > 0:
        print("⚠️  PARTIAL: Editor triggered but score still low")
    else:
        print("❌ FAILED: No self-correction occurred")
    
    print(f"\n📄 Final Draft:\n{result.get('draft_report', 'N/A')}")
    
finally:
    # Restore original analyst
    src.nodes.analyst.analyst_node = original_analyst