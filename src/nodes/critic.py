from langchain_groq import ChatGroq
from langsmith import traceable
import json

@traceable(name="Critic")
def critic_node(state):
    """
    Critic node that evaluates the SWOT draft using a scoring rubric.
    Scores on a scale of 1-10 and provides reasoning for the score.
    """
    llm = ChatGroq(temperature=0, model="llama-3.1-8b-instant")
    
    # Load the evaluation rubric
    try:
        with open("src/prompts/rubric.txt", "r") as f:
            rubric = f.read()
    except FileNotFoundError:
        # Fallback rubric if file not found
        rubric = """
You are a strategy evaluator. Given a SWOT analysis, score it on a scale of 1 to 10.

Scoring Criteria:
- Does it cite at least 2 specific facts or numbers?
- Are all 4 SWOT sections present?
- Are strengths/opportunities clearly distinct from weaknesses/threats?
- Does it align with the given strategic focus?

Respond in this JSON format:
{
  "score": <int>,
  "reasoning": "<string>"
}
"""
    
    # Prepare the input for the LLM
    input_text = f"""
SWOT Draft:
{state['draft_report']}

Rubric:
{rubric}

Strategic Focus: Cost Leadership
"""
    
    # Get the evaluation from LLM
    response = llm.invoke(input_text)
    
    # Parse the JSON response
    try:
        parsed = json.loads(response.content)
        state["critique"] = parsed.get("reasoning", "No reasoning provided")
        state["score"] = parsed.get("score", 0)
        print(f"📊 Critic scored: {state['score']}/10")
        print(f"💬 Critique: {state['critique'][:100]}...")
    except (json.JSONDecodeError, AttributeError) as e:
        # Fallback if JSON parsing fails
        print(f"❌ JSON parsing error: {e}")
        print(f"🤖 Raw response: {response.content}")
        state["critique"] = "Evaluation failed - could not parse response"
        state["score"] = 5  # Default medium score
    
    return state