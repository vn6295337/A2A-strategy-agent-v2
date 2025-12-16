from tavily import TavilyClient
from langchain_groq import ChatGroq
from langsmith import traceable
import os

def get_tavily_client():
    """Get Tavily client with API key handling"""
    try:
        # Try to get API key from environment
        api_key = os.environ.get("TAVILY_API_KEY")
        if api_key:
            return TavilyClient(api_key=api_key)
        else:
            # Fallback to mock data for testing
            return None
    except Exception as e:
        print(f"Tavily client error: {e}")
        return None

def get_mock_research_data(company):
    """Generate mock research data for testing"""
    mock_data = {
        "NVIDIA": """
NVIDIA Corporation (NVDA) - Latest Financials and Product Updates

Financial Highlights (Q2 2024):
- Revenue: $22.1 billion (up 101% YoY)
- Net Income: $6.19 billion (up 843% YoY)
- Gross Margin: 71.2%
- Data Center revenue: $14.5 billion (up 141% YoY)
- Gaming revenue: $2.49 billion (up 9% YoY)

Product Updates:
- Launched Blackwell GPU architecture with significant performance improvements
- Announced GH200 Grace Hopper Superchip for AI workloads
- Expanded AI foundry services for enterprise customers
- Introduced new AI software and development tools
- Continued leadership in AI and accelerated computing markets

Market Position:
- Dominant player in AI chips and GPU market
- Strong partnerships with major cloud providers
- Expanding into enterprise AI solutions
- Facing increased competition but maintaining technological lead
""",
        "default": f"""
{company} - Latest Financials and Product Updates

Financial Highlights:
- Strong revenue growth in recent quarters
- Profitable with healthy margins
- Expanding market share in key segments

Product Updates:
- Recent product launches driving growth
- Innovation pipeline remains strong
- Customer adoption increasing

Market Position:
- Competitive position improving
- Strategic partnerships expanding
- Well-positioned for future growth
"""
    }
    return mock_data.get(company, mock_data["default"])

@traceable(name="Researcher")
def researcher_node(state):
    company = state["company_name"]
    
    # Try to use real Tavily client if available
    client = get_tavily_client()
    
    if client:
        try:
            # Fetch raw search results
            results = client.search(query=f"{company} financials product reviews", max_results=5)
            combined = "\n\n".join([r["content"] for r in results["results"]])
            
            # NEW: LLM Summarization for cleaner data and visibility in traces
            llm = ChatGroq(temperature=0, model="llama-3.1-8b-instant")
            summary = llm.invoke(f"Summarize this for strategy research:\n{combined}").content
            
            state["raw_data"] = summary
            
        except Exception as e:
            print(f"Tavily search failed, using mock data: {e}")
            state["raw_data"] = get_mock_research_data(company)
    else:
        # Use mock data for testing
        state["raw_data"] = get_mock_research_data(company)
    
    return state