import streamlit as st
import os
import json
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv


# ============================================================
# FORMATTING HELPERS
# ============================================================

def format_currency(value):
    """Format large numbers as currency ($1.2B, $500M, $1.5K)."""
    if value is None:
        return "N/A"
    if isinstance(value, dict):
        value = value.get("value")
    if value is None:
        return "N/A"
    try:
        value = float(value)
        if abs(value) >= 1e12:
            return f"${value/1e12:.1f}T"
        elif abs(value) >= 1e9:
            return f"${value/1e9:.1f}B"
        elif abs(value) >= 1e6:
            return f"${value/1e6:.1f}M"
        elif abs(value) >= 1e3:
            return f"${value/1e3:.1f}K"
        else:
            return f"${value:.2f}"
    except (TypeError, ValueError):
        return "N/A"


def format_percent(value):
    """Format as percentage."""
    if value is None:
        return "N/A"
    try:
        return f"{float(value):.1f}%"
    except (TypeError, ValueError):
        return "N/A"


def format_ratio(value):
    """Format as ratio (2.1x)."""
    if value is None:
        return "N/A"
    try:
        return f"{float(value):.2f}x"
    except (TypeError, ValueError):
        return "N/A"


def format_number(value, decimals=2):
    """Format a number with specified decimals."""
    if value is None:
        return "N/A"
    try:
        return f"{float(value):.{decimals}f}"
    except (TypeError, ValueError):
        return "N/A"


def format_date(date_str):
    """Format date string to readable format (Dec 26, 2024)."""
    if not date_str:
        return ""
    try:
        # Try ISO format first
        if "T" in str(date_str):
            dt = datetime.fromisoformat(str(date_str).replace("Z", "+00:00"))
        else:
            # Try common date formats
            for fmt in ["%Y-%m-%d", "%Y/%m/%d", "%d-%m-%Y"]:
                try:
                    dt = datetime.strptime(str(date_str)[:10], fmt)
                    break
                except ValueError:
                    continue
            else:
                return str(date_str)[:10]
        return dt.strftime("%b %d, %Y")
    except Exception:
        return str(date_str)[:10] if date_str else ""


def _render_research_sidebar(metrics: dict):
    """Render research data in the left sidebar with expanders."""
    if not metrics:
        return

    st.sidebar.markdown("---")

    # 1. FINANCIALS
    fin = metrics.get("financials", {})
    fin_data = fin.get("financials", {})
    fin_date = fin_data.get("revenue", {}).get("end_date", "") if isinstance(fin_data, dict) else ""
    fin_label = f"📊 Financials ({format_date(fin_date)})" if fin_date else "📊 Financials"

    with st.sidebar.expander(fin_label, expanded=False):
        if "error" in fin:
            st.warning(f"Failed: {fin.get('error', 'Unknown error')[:50]}")
        else:
            revenue = fin_data.get("revenue") if isinstance(fin_data, dict) else None
            st.write(f"**Revenue:** {format_currency(revenue)}")
            st.write(f"**Net Margin:** {format_percent(fin_data.get('net_margin_pct'))}")
            st.write(f"**Gross Margin:** {format_percent(fin_data.get('gross_margin_pct'))}")

            debt = fin.get("debt", {})
            st.write(f"**Debt/Equity:** {format_ratio(debt.get('debt_to_equity'))}")
            st.write(f"**Total Debt:** {format_currency(debt.get('total_debt'))}")

            cf = fin.get("cash_flow", {})
            st.write(f"**Free Cash Flow:** {format_currency(cf.get('free_cash_flow'))}")

    # 2. VALUATION
    val = metrics.get("valuation", {})
    val_date = val.get("generated_at", "")
    val_label = f"💰 Valuation ({format_date(val_date)})" if val_date else "💰 Valuation"

    with st.sidebar.expander(val_label, expanded=False):
        if "error" in val:
            st.warning(f"Failed: {val.get('error', 'Unknown error')[:50]}")
        else:
            val_metrics = val.get("metrics", {})
            pe = val_metrics.get("pe_ratio", {})
            st.write(f"**P/E (Trailing):** {format_number(pe.get('trailing'))}")
            st.write(f"**P/E (Forward):** {format_number(pe.get('forward'))}")
            st.write(f"**P/S:** {format_number(val_metrics.get('ps_ratio'))}")
            st.write(f"**P/B:** {format_number(val_metrics.get('pb_ratio'))}")
            st.write(f"**EV/EBITDA:** {format_number(val_metrics.get('ev_ebitda'))}")

            peg = val_metrics.get("peg_ratio", {})
            st.write(f"**PEG (Trailing):** {format_number(peg.get('trailing'))}")
            st.write(f"**Market Cap:** {format_currency(val_metrics.get('market_cap'))}")

    # 3. VOLATILITY
    vol = metrics.get("volatility", {})
    vol_date = vol.get("generated_at", "")
    vol_label = f"📈 Volatility ({format_date(vol_date)})" if vol_date else "📈 Volatility"

    with st.sidebar.expander(vol_label, expanded=False):
        if "error" in vol:
            st.warning(f"Failed: {vol.get('error', 'Unknown error')[:50]}")
        else:
            vol_metrics = vol.get("metrics", {})
            vix = vol_metrics.get("vix", {})
            st.write(f"**VIX:** {format_number(vix.get('value'))} ({vix.get('interpretation', 'N/A')})")

            beta = vol_metrics.get("beta", {})
            st.write(f"**Beta:** {format_number(beta.get('value'))} ({beta.get('interpretation', 'N/A')})")

            hist_vol = vol_metrics.get("historical_volatility", {})
            st.write(f"**Hist. Vol:** {format_percent(hist_vol.get('value'))}")

    # 4. MACRO
    macro = metrics.get("macro", {})
    macro_metrics = macro.get("metrics", {})
    macro_date = macro_metrics.get("gdp_growth", {}).get("date", "") if isinstance(macro_metrics, dict) else ""
    macro_label = f"🌍 Macro ({format_date(macro_date)})" if macro_date else "🌍 Macro"

    with st.sidebar.expander(macro_label, expanded=False):
        if "error" in macro:
            st.warning(f"Failed: {macro.get('error', 'Unknown error')[:50]}")
        else:
            gdp = macro_metrics.get("gdp_growth", {})
            st.write(f"**GDP Growth:** {format_percent(gdp.get('value'))}")

            ir = macro_metrics.get("interest_rate", {})
            st.write(f"**Fed Rate:** {format_percent(ir.get('value'))} ({ir.get('trend', 'N/A')})")

            cpi = macro_metrics.get("cpi_inflation", {})
            st.write(f"**CPI/Inflation:** {format_percent(cpi.get('value'))}")

            unemp = macro_metrics.get("unemployment", {})
            st.write(f"**Unemployment:** {format_percent(unemp.get('value'))}")

    # 5. NEWS
    news = metrics.get("news", {})
    news_count = len(news.get("results", []))
    news_label = f"📰 News ({news_count} articles)" if news_count else "📰 News"

    with st.sidebar.expander(news_label, expanded=False):
        if "error" in news:
            st.warning(f"Failed: {news.get('error', 'Unknown error')[:50]}")
        else:
            # Show AI summary if available
            if news.get("answer"):
                st.markdown(f"*{news['answer'][:150]}...*")
                st.markdown("---")

            # Show article headlines with dates
            for article in news.get("results", [])[:5]:
                title = article.get("title", "Untitled")[:50]
                url = article.get("url", "#")
                pub_date = format_date(article.get("published_date", ""))
                date_str = f" ({pub_date})" if pub_date else ""
                st.markdown(f"• [{title}...]({url}){date_str}")

    # 6. SENTIMENT
    sent = metrics.get("sentiment", {})
    sent_date = sent.get("generated_at", "") or sent.get("metrics", {}).get("finnhub", {}).get("as_of", "")
    sent_label = f"💬 Sentiment ({format_date(sent_date)})" if sent_date else "💬 Sentiment"

    with st.sidebar.expander(sent_label, expanded=False):
        if "error" in sent:
            st.warning(f"Failed: {sent.get('error', 'Unknown error')[:50]}")
        else:
            composite = sent.get("composite_score")
            interpretation = sent.get("overall_interpretation", "")
            if composite is not None:
                st.write(f"**Overall:** {format_number(composite, 0)}/100 ({interpretation})")

            sent_metrics = sent.get("metrics", {})

            # Finnhub
            fh = sent_metrics.get("finnhub", {})
            if fh and "error" not in fh:
                fh_score = fh.get("score")
                fh_articles = fh.get("articles_analyzed", 0)
                st.write(f"**Finnhub:** {format_number(fh_score, 0)}/100 ({fh_articles} articles)")

            # Reddit
            reddit = sent_metrics.get("reddit", {})
            if reddit and "error" not in reddit:
                r_score = reddit.get("score")
                r_posts = reddit.get("posts_analyzed", 0)
                st.write(f"**Reddit:** {format_number(r_score, 0)}/100 ({r_posts} posts)")


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

# Sidebar header
st.sidebar.header("Research Data")
st.sidebar.caption("Data shown after analysis completes")

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

    # Parse raw_data for sidebar research panel
    raw_data = {}
    if result.get("raw_data"):
        try:
            raw_data = json.loads(result["raw_data"])
        except json.JSONDecodeError:
            raw_data = {}
    metrics = raw_data.get("metrics", {})

    # ============================================================
    # LEFT SIDEBAR: Research Data Panel
    # ============================================================
    _render_research_sidebar(metrics)

    # ============================================================
    # MAIN CONTENT: SWOT Analysis, Quality, Details
    # ============================================================
    tab1, tab2, tab3 = st.tabs(["SWOT Analysis", "Quality Evaluation", "Process Details"])

    with tab1:
        st.subheader(f"SWOT Analysis for {company}")
        st.markdown(result["draft_report"])

    with tab2:
        st.subheader("Quality Evaluation")
        score = result.get("score", "N/A")
        revisions = result.get("revision_count", 0)
        critique = result.get("critique", "No critique available")

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
        pcol1, pcol2 = st.columns(2)
        with pcol1:
            st.write(f"**Company:** {company}")
            st.write(f"**Strategy Focus:** {strategy}")
            st.write(f"**Report Length:** {len(result.get('draft_report', ''))} chars")
        with pcol2:
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


# Footer
st.markdown("---")
st.caption("A2A Strategy Agent | Agentic AI Demo | [GitHub](https://github.com/vn6295337/A2A-strategy-agent)")
