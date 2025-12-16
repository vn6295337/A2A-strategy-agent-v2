from langchain_groq import ChatGroq
from src.tools import get_strategy_context
from langsmith import traceable

@traceable(name="Analyst")
def analyst_node(state):
    llm = ChatGroq(temperature=0, model="llama-3.1-8b-instant")
    raw = state["raw_data"]
    strategy_focus = get_strategy_context("Cost Leadership")
    company = state["company_name"]

    prompt = f"""
Use the following data to draft a SWOT analysis of {company}.

Strategic Focus: {strategy_focus}

Data:
{raw}

Return only the SWOT in this format:
- Strengths:
- Weaknesses:
- Opportunities:
- Threats:
"""
    response = llm.invoke(prompt)
    state["draft_report"] = response.content
    
    # Add metadata about the analysis for better traceability
    state["analysis_metadata"] = {
        "company": company,
        "strategy_focus": "Cost Leadership",
        "report_length": len(response.content),
        "analysis_type": "SWOT"
    }
    
    return state