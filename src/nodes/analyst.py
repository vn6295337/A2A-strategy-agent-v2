from src.tools import get_strategy_context
from src.llm_client import get_llm_client
from langsmith import traceable

@traceable(name="Analyst")
def analyst_node(state, workflow_id=None, progress_store=None):
    # Update progress if tracking is enabled
    if workflow_id and progress_store:
        progress_store[workflow_id].update({
            "current_step": "Analyst",
            "revision_count": state.get("revision_count", 0),
            "score": state.get("score", 0)
        })

    llm = get_llm_client()
    raw = state["raw_data"]
    strategy_name = state.get("strategy_focus", "Cost Leadership")
    strategy_context = get_strategy_context(strategy_name)
    company = state["company_name"]

    prompt = f"""
Use the following data to draft a SWOT analysis of {company}.

Strategic Focus: {strategy_name}
Context: {strategy_context}

Data:
{raw}

Return only the SWOT in this format:
- Strengths:
- Weaknesses:
- Opportunities:
- Threats:
"""
    response, provider, error = llm.query(prompt, temperature=0)

    if error:
        state["draft_report"] = f"Error generating analysis: {error}"
        state["provider_used"] = None
    else:
        state["draft_report"] = response
        state["provider_used"] = provider

    return state
