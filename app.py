import streamlit as st
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from multiple locations
load_dotenv(Path.home() / ".env")  # Home directory first
load_dotenv()  # Then project .env (overrides if set)

# Check for required API keys
has_llm_key = any([
    os.getenv("GROQ_API_KEY"),
    os.getenv("GEMINI_API_KEY"),
    os.getenv("OPENROUTER_API_KEY")
])

st.set_page_config(layout="wide", page_title="A2A Strategy Agent")
st.title("A2A Strategy Agent")

# Sidebar with instructions
st.sidebar.header("Instructions")
st.sidebar.markdown("""
1. Enter a company name
2. Select a strategic lens
3. Click 'Generate SWOT'
4. The system automatically improves drafts until quality threshold is met
""")

# Show API status in sidebar
st.sidebar.markdown("---")
st.sidebar.subheader("API Status")
if os.getenv("GROQ_API_KEY"):
    st.sidebar.success("Groq: Connected")
elif os.getenv("GEMINI_API_KEY"):
    st.sidebar.success("Gemini: Connected")
elif os.getenv("OPENROUTER_API_KEY"):
    st.sidebar.success("OpenRouter: Connected")
else:
    st.sidebar.error("No LLM API configured")

if os.getenv("FRED_API_KEY"):
    st.sidebar.success("FRED: Connected")
else:
    st.sidebar.warning("FRED: Not configured")

if os.getenv("FINNHUB_API_KEY"):
    st.sidebar.success("Finnhub: Connected")
else:
    st.sidebar.warning("Finnhub: Not configured")

# Show A2A mode status
st.sidebar.markdown("---")
st.sidebar.subheader("Research Mode")
if os.getenv("USE_A2A_RESEARCHER", "false").lower() == "true":
    st.sidebar.info("A2A Protocol (decoupled)")
else:
    st.sidebar.info("Direct MCP (in-process)")

# Main content
st.header("Strategic SWOT Analysis with Self-Correcting AI")

if not has_llm_key:
    st.error("No LLM API key configured. Please set at least one of: GROQ_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY")
    st.stop()

company = st.text_input("Enter company name:", "Tesla")

strategy = st.selectbox(
    "Strategic lens:",
    ["Cost Leadership", "Differentiation", "Focus/Niche"],
    help="Choose the strategic framework for analysis"
)

run_button = st.button("Generate SWOT", type="primary")

if run_button:
    # Import here to avoid initialization errors when no API keys
    from src.graph_cyclic import app as graph_app

    with st.spinner("Analyzing..."):
        # Initialize state
        state = {
            "company_name": company,
            "strategy_focus": strategy,
            "raw_data": None,
            "draft_report": None,
            "critique": None,
            "revision_count": 0,
            "messages": [],
            "score": 0,
            "data_source": "live",
            "provider_used": None,
            "sources_failed": []
        }

        try:
            # Execute the workflow
            result = graph_app.invoke(state)
        except Exception as e:
            st.error(f"Analysis failed: {str(e)}")
            st.stop()

    # Show warning if some data sources failed
    if result.get("sources_failed"):
        st.warning(f"Some data sources failed: {', '.join(result.get('sources_failed', []))}")

    # Display results in tabs
    tab1, tab2, tab3 = st.tabs(["SWOT Analysis", "Quality Evaluation", "Process Details"])

    with tab1:
        st.subheader(f"SWOT Analysis for {company}")
        st.markdown(result["draft_report"])

    with tab2:
        st.subheader("Quality Evaluation")
        score = result.get("score", "N/A")
        revisions = result.get("revision_count", 0)
        critique = result.get("critique", "No critique available")

        # Score visualization
        if isinstance(score, (int, float)):
            st.progress(score / 10)
            if score >= 7:
                st.success(f"**Score:** {score}/10 - High Quality")
            elif score >= 5:
                st.warning(f"**Score:** {score}/10 - Acceptable")
            else:
                st.error(f"**Score:** {score}/10 - Needs Improvement")
        else:
            st.info(f"**Score:** {score}")

        st.metric("Revisions Made", revisions)
        st.text_area("Critique", critique, height=150)

    with tab3:
        st.subheader("Process Details")

        col1, col2 = st.columns(2)
        with col1:
            st.write(f"**Company:** {company}")
            st.write(f"**Strategy Focus:** {strategy}")
            st.write(f"**Report Length:** {len(result.get('draft_report', ''))} characters")

        with col2:
            provider = result.get("provider_used", "Unknown")
            data_source = result.get("data_source", "unknown")
            st.write(f"**LLM Provider:** {provider}")
            data_source_label = {
                "live": "Live MCP servers",
                "cached": "Cached (SQLite)",
                "a2a": "A2A Protocol (decoupled)"
            }.get(data_source, data_source)
            st.write(f"**Data Source:** {data_source_label}")
            st.write(f"**Revisions:** {result.get('revision_count', 0)}")

        st.info("""
**Self-Correcting Process:**
1. Researcher gathers data from 6 MCP servers (Financials, Volatility, Macro, Valuation, News, Sentiment)
2. Analyst creates initial SWOT draft using LLM
3. Critic evaluates quality (1-10 scale)
4. If score < 7, Editor improves the draft
5. Loop continues until quality >= 7 or revisions > 3
        """)

# Footer
st.markdown("---")
st.caption("A2A Strategy Agent | Agentic AI Demo | [GitHub](https://github.com/vn6295337/A2A-strategy-agent)")
