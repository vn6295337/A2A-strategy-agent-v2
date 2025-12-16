from typing import Literal

def should_continue(state) -> Literal["exit", "retry"]:
    """
    Conditional routing function that determines whether to continue
    the self-correcting loop or exit.
    
    Exit conditions:
    - Score >= 7 (good quality)
    - Revision count >= 3 (max attempts reached)
    
    Otherwise, continue the loop (retry).
    """
    current_score = state.get("score", 0)
    revision_count = state.get("revision_count", 0)
    
    # Exit if quality is good enough or max revisions reached
    if current_score >= 7 or revision_count >= 3:
        return "exit"
    
    # Continue the loop for improvement
    return "retry"