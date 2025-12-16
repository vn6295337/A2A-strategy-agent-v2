"""
Direct test of self-correcting loop by forcing a low critic score
"""

from src.graph_cyclic import run_self_correcting_workflow

# Monkey patch the critic to force a low score
def force_low_score_critic(state):
    """Force a low score to trigger Editor"""
    # Force a low score that will trigger the Editor
    state["score"] = 3  # Low score to force revision
    state["critique"] = "Forced low score for testing self-correction loop"
    print("⚠️  FORCED LOW SCORE: 3/10 to trigger Editor")
    
    return state

# Temporarily replace critic in the workflow
import src.nodes.critic
original_critic = src.nodes.critic.critic_node
src.nodes.critic.critic_node = force_low_score_critic

try:
    print("🚨 Testing Self-Correcting Loop with Forced Low Score")
    print("=" * 55)
    
    # Run workflow - should trigger Editor due to low score
    result = run_self_correcting_workflow("TestCompany")
    
    print(f"\n📊 RESULTS:")
    print(f"Final Score: {result.get('score', 'N/A')}/10")
    print(f"Revisions Made: {result.get('revision_count', 0)}")
    print(f"Final Draft Length: {len(result.get('draft_report', ''))} chars")
    
    # Verify self-correction
    score = result.get('score', 0)
    revisions = result.get('revision_count', 0)
    
    if revisions > 0:
        print("✅ SUCCESS: Editor was triggered!")
        if score >= 7:
            print("   Quality improved to acceptable level")
        else:
            print(f"   Quality improved but final score: {score}/10")
    else:
        print("❌ FAILED: No self-correction occurred")
    
    print(f"\n📄 Final Draft:\n{result.get('draft_report', 'N/A')[:500]}...")
    
finally:
    # Restore original critic
    src.nodes.critic.critic_node = original_critic