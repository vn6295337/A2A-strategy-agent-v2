from langchain_groq import ChatGroq
from langsmith import traceable

@traceable(name="Editor")
def editor_node(state):
    """
    Editor node that revises the SWOT draft based on critique feedback.
    Increments the revision count and returns the improved draft.
    """
    llm = ChatGroq(temperature=0, model="llama-3.1-8b-instant")
    
    # Prepare the revision prompt
    prompt = f"""
Revise this SWOT draft based on the following critique:

Draft:
{state['draft_report']}

Critique:
{state['critique']}

Strategic Focus: Cost Leadership

Please improve the draft by:
1. Adding specific facts and numbers if missing
2. Ensuring all 4 SWOT sections are present and complete
3. Making sure strengths/opportunities are distinct from weaknesses/threats
4. Aligning with the Cost Leadership strategic focus

Return only the improved SWOT analysis in the same format.
"""
    
    # Get the revised draft from LLM
    response = llm.invoke(prompt)
    
    # Update the state with revised draft and increment revision count
    state["draft_report"] = response.content
    state["revision_count"] = state.get("revision_count", 0) + 1
    
    return state