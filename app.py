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
    """Render research data in the left sidebar."""
    if not metrics:
        return

    # 1. FINANCIALS
    fin = metrics.get("financials", {})
    fin_data = fin.get("financials", {})
    fin_date = fin_data.get("revenue", {}).get("end_date", "") if isinstance(fin_data, dict) else ""

    st.sidebar.subheader("Financials")
    if fin_date:
        st.sidebar.caption(f"As of {format_date(fin_date)}")
    if "error" in fin:
        st.sidebar.warning(f"Failed: {fin.get('error', 'Unknown error')[:50]}")
    else:
        revenue = fin_data.get("revenue") if isinstance(fin_data, dict) else None
        st.sidebar.markdown(f"Revenue: **{format_currency(revenue)}**")
        st.sidebar.markdown(f"Net Margin: **{format_percent(fin_data.get('net_margin_pct'))}**")
        st.sidebar.markdown(f"Gross Margin: **{format_percent(fin_data.get('gross_margin_pct'))}**")
        debt = fin.get("debt", {})
        st.sidebar.markdown(f"Debt/Equity: **{format_ratio(debt.get('debt_to_equity'))}**")
        st.sidebar.markdown(f"Total Debt: **{format_currency(debt.get('total_debt'))}**")
        cf = fin.get("cash_flow", {})
        st.sidebar.markdown(f"Free Cash Flow: **{format_currency(cf.get('free_cash_flow'))}**")

    st.sidebar.markdown("---")

    # 2. VALUATION
    val = metrics.get("valuation", {})
    val_date = val.get("generated_at", "")

    st.sidebar.subheader("Valuation")
    if val_date:
        st.sidebar.caption(f"As of {format_date(val_date)}")
    if "error" in val:
        st.sidebar.warning(f"Failed: {val.get('error', 'Unknown error')[:50]}")
    else:
        val_metrics = val.get("metrics", {})
        # Stock Price
        price = val_metrics.get("current_price")
        if price:
            st.sidebar.markdown(f"Stock Price: **${format_number(price)}**")
        st.sidebar.markdown(f"Market Cap: **{format_currency(val_metrics.get('market_cap'))}**")
        pe = val_metrics.get("pe_ratio", {})
        st.sidebar.markdown(f"P/E (T/F): **{format_number(pe.get('trailing'))} / {format_number(pe.get('forward'))}**")
        st.sidebar.markdown(f"P/S: **{format_number(val_metrics.get('ps_ratio'))}**")
        st.sidebar.markdown(f"P/B: **{format_number(val_metrics.get('pb_ratio'))}**")
        st.sidebar.markdown(f"EV/EBITDA: **{format_number(val_metrics.get('ev_ebitda'))}**")
        peg = val_metrics.get("peg_ratio", {})
        st.sidebar.markdown(f"PEG (Trailing): **{format_number(peg.get('trailing'))}**")

    st.sidebar.markdown("---")

    # 3. VOLATILITY
    vol = metrics.get("volatility", {})
    vol_date = vol.get("generated_at", "")

    st.sidebar.subheader("Volatility")
    if vol_date:
        st.sidebar.caption(f"As of {format_date(vol_date)}")
    if "error" in vol:
        st.sidebar.warning(f"Failed: {vol.get('error', 'Unknown error')[:50]}")
    else:
        vol_metrics = vol.get("metrics", {})
        vix = vol_metrics.get("vix", {})
        st.sidebar.markdown(f"VIX: **{format_number(vix.get('value'))}** ({vix.get('interpretation', 'N/A')})")
        beta = vol_metrics.get("beta", {})
        st.sidebar.markdown(f"Beta: **{format_number(beta.get('value'))}** ({beta.get('interpretation', 'N/A')})")
        hist_vol = vol_metrics.get("historical_volatility", {})
        st.sidebar.markdown(f"Hist. Vol: **{format_percent(hist_vol.get('value'))}**")

    st.sidebar.markdown("---")

    # 4. MACRO
    macro = metrics.get("macro", {})
    macro_metrics = macro.get("metrics", {})
    macro_date = macro_metrics.get("gdp_growth", {}).get("date", "") if isinstance(macro_metrics, dict) else ""

    st.sidebar.subheader("Macro")
    if macro_date:
        st.sidebar.caption(f"As of {format_date(macro_date)}")
    if "error" in macro:
        st.sidebar.warning(f"Failed: {macro.get('error', 'Unknown error')[:50]}")
    else:
        gdp = macro_metrics.get("gdp_growth", {})
        st.sidebar.markdown(f"GDP Growth: **{format_percent(gdp.get('value'))}**")
        ir = macro_metrics.get("interest_rate", {})
        st.sidebar.markdown(f"Fed Rate: **{format_percent(ir.get('value'))}** ({ir.get('trend', 'N/A')})")
        cpi = macro_metrics.get("cpi_inflation", {})
        st.sidebar.markdown(f"CPI/Inflation: **{format_percent(cpi.get('value'))}**")
        unemp = macro_metrics.get("unemployment", {})
        st.sidebar.markdown(f"Unemployment: **{format_percent(unemp.get('value'))}**")

    st.sidebar.markdown("---")

    # 5. NEWS
    news = metrics.get("news", {})
    news_count = len(news.get("results", []))

    st.sidebar.subheader(f"News ({news_count})")
    if "error" in news:
        st.sidebar.warning(f"Failed: {news.get('error', 'Unknown error')[:50]}")
    else:
        for article in news.get("results", [])[:5]:
            title = article.get("title", "Untitled")[:45]
            url = article.get("url", "#")
            pub_date = format_date(article.get("published_date", ""))
            st.sidebar.markdown(f"[{title}...]({url})")
            if pub_date:
                st.sidebar.caption(pub_date)

    st.sidebar.markdown("---")

    # 6. SENTIMENT
    sent = metrics.get("sentiment", {})
    sent_date = sent.get("generated_at", "") or sent.get("metrics", {}).get("finnhub", {}).get("as_of", "")

    st.sidebar.subheader("Sentiment")
    if sent_date:
        st.sidebar.caption(f"As of {format_date(sent_date)}")
    if "error" in sent:
        st.sidebar.warning(f"Failed: {sent.get('error', 'Unknown error')[:50]}")
    else:
        composite = sent.get("composite_score")
        interpretation = sent.get("overall_interpretation", "")
        if composite is not None:
            st.sidebar.markdown(f"Overall: **{format_number(composite, 0)}/100** ({interpretation})")

        sent_metrics = sent.get("metrics", {})
        fh = sent_metrics.get("finnhub", {})
        if fh and "error" not in fh:
            fh_score = fh.get("score")
            fh_articles = fh.get("articles_analyzed", 0)
            st.sidebar.markdown(f"Finnhub: **{format_number(fh_score, 0)}/100** ({fh_articles} articles)")

        reddit = sent_metrics.get("reddit", {})
        if reddit and "error" not in reddit:
            r_score = reddit.get("score")
            r_posts = reddit.get("posts_analyzed", 0)
            st.sidebar.markdown(f"Reddit: **{format_number(r_score, 0)}/100** ({r_posts} posts)")


def _render_api_status():
    """Render API connection status at bottom of sidebar."""
    st.sidebar.markdown("---")
    with st.sidebar.expander("API Status", expanded=False):
        if os.getenv("GROQ_API_KEY"):
            st.success("Groq: Connected")
        elif os.getenv("GEMINI_API_KEY"):
            st.success("Gemini: Connected")
        elif os.getenv("OPENROUTER_API_KEY"):
            st.success("OpenRouter: Connected")
        else:
            st.error("No LLM API configured")

        if os.getenv("FRED_API_KEY"):
            st.success("FRED: Connected")
        else:
            st.warning("FRED: Not configured")

        if os.getenv("FINNHUB_API_KEY"):
            st.success("Finnhub: Connected")
        else:
            st.warning("Finnhub: Not configured")


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

# Sidebar header - Research Data (populated after analysis)
st.sidebar.header("Research Data")
st.sidebar.caption("Run analysis to populate")
_render_api_status()

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
    _render_api_status()

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
