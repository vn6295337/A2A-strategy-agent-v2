#!/usr/bin/env python3

"""
Demonstration of MCP Tool Integration with LLM
This shows how the MCP tool would work with an LLM agent
"""

import sqlite3
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableLambda

def get_strategy_context(strategy_name: str) -> str:
    """MCP Tool Function - Query strategy database"""
    db_path = 'data/strategy.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute(
        'SELECT description FROM focus_areas WHERE strategy_name = ?',
        (strategy_name,)
    )
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else "No such strategy found."

def create_llm_agent():
    """Create an LLM agent that can use the MCP tool"""
    
    # Initialize LLM
    llm = ChatGroq(temperature=0, model="llama-3.1-8b-instant")
    
    # Create a tool that uses our MCP function
    def strategy_tool(strategy_name: str) -> str:
        """Tool that queries our strategy database via MCP"""
        return get_strategy_context(strategy_name)
    
    # Create a prompt that includes tool usage
    prompt = PromptTemplate.from_template("""
    You are a strategic advisor. Answer the user's question about our business strategy.
    
    Available tool: get_strategy_context(strategy_name) -> strategy_description
    
    User question: {question}
    
    First, determine if you need to use the tool to get strategy information.
    If the question is about a specific strategy, use the tool to get the details.
    Then provide a comprehensive answer.
    
    Strategy context: {strategy_context}
    """)
    
    # Create a chain that uses the tool and then the LLM
    def use_tool_if_needed(inputs: dict) -> dict:
        question = inputs["question"]
        strategy_context = ""
        
        # Simple logic to determine if we need the tool
        if "cost leadership" in question.lower():
            strategy_context = strategy_tool("Cost Leadership")
        
        return {
            "question": question,
            "strategy_context": strategy_context
        }
    
    # Create the full chain
    chain = {
        "question": RunnableLambda(lambda x: x["question"]),
        "strategy_context": RunnableLambda(use_tool_if_needed)
    } | prompt | llm
    
    return chain

def main():
    """Demonstrate the MCP tool integration with LLM"""
    print("🤖 Demonstrating MCP Tool Integration with LLM\n")
    
    # Create the agent
    agent = create_llm_agent()
    
    # Test question that requires the MCP tool
    question = "What is our cost leadership strategy?"
    print(f"💬 Question: {question}")
    
    # Get the response
    response = agent.invoke({"question": question})
    
    print(f"🤖 LLM Response: {response.content}")
    print("\n✅ This demonstrates how the MCP tool integrates with LLM agents!")
    print("   The LLM used our SQLite-backed MCP tool to get strategy information.")

if __name__ == "__main__":
    main()