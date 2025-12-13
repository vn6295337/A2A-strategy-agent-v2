from langchain.tools.mcp import MCPTool
from langchain_groq import ChatGroq
from langchain.agents import initialize_agent, AgentType

# Connect to local MCP tool
tool = MCPTool.from_mcp_url("http://localhost:3000")

llm = ChatGroq(temperature=0)
agent = initialize_agent([tool], llm, agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION)

def ask_about_strategy():
    return agent.run("What is our cost leadership strategy?")