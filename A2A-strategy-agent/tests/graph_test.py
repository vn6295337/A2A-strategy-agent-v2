import sys
import os

# Add project root to Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from dotenv import load_dotenv
load_dotenv('/home/vn6295337/.env')

from src.state import AgentState
from langgraph.graph import StateGraph
from langsmith import traceable
from langchain_core.runnables import RunnableLambda
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate

@traceable(name="NodeA")
def node_a(state: AgentState) -> AgentState:
    print("Running Node A")
    # Add meaningful LLM call to ensure LangSmith tracing
    llm = ChatGroq(temperature=0, model="llama-3.1-8b-instant")
    prompt = PromptTemplate.from_template("Tell me a fun fact about {company}")
    runnable = prompt | llm
    response = runnable.invoke({"company": state["company_name"]})
    state["messages"].append(response.content)
    return state

@traceable(name="NodeB")
def node_b(state: AgentState) -> AgentState:
    print("Running Node B")
    # Add meaningful LLM call to ensure LangSmith tracing
    llm = ChatGroq(temperature=0, model="llama-3.1-8b-instant")
    prompt = PromptTemplate.from_template("What's an interesting insight about {company}?")
    runnable = prompt | llm
    response = runnable.invoke({"company": state["company_name"]})
    state["messages"].append(response.content)
    return state

workflow = StateGraph(AgentState)
workflow.config = {"project_name": "A2A Strategy Agent"}
workflow.add_node("A", RunnableLambda(node_a))
workflow.add_node("B", RunnableLambda(node_b))
workflow.set_entry_point("A")
workflow.add_edge("A", "B")
workflow.set_finish_point("B")
app = workflow.compile()

output = app.invoke({
    "company_name": "TestCo",
    "raw_data": None,
    "draft_report": None,
    "critique": None,
    "revision_count": 0,
    "messages": []
})

print(output)
