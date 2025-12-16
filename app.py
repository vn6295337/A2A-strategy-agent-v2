import streamlit as st
from src.graph_cyclic import app as graph_app

st.set_page_config(layout="wide")
st.title("🧠 A2A Strategy Agent")

# Sidebar with instructions
st.sidebar.header("Instructions")
st.sidebar.markdown("""
1. Enter a company name
2. Click 'Generate SWOT'
3. View the analysis and quality score
4. The system automatically improves poor drafts
""")

# Main content
st.header("Strategic SWOT Analysis with Self-Correcting AI")

company = st.text_input("Enter company name:", "Tesla")
run_button = st.button("Generate SWOT")

if run_button:
    with st.spinner("🤖 Thinking..."):
        # Initialize state
        state = {
            "company_name": company,
            "raw_data": None,
            "draft_report": None,
            "critique": None,
            "revision_count": 0,
            "messages": [],
            "score": 0
        }
        
        # Execute the workflow
        result = graph_app.invoke(state)
    
    # Display results in tabs
    tab1, tab2, tab3 = st.tabs(["📊 SWOT Analysis", "🔍 Quality Evaluation", "📈 Process Details"])
    
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
                st.success(f"**Score:** {score}/10 - ✅ High Quality")
            elif score >= 5:
                st.warning(f"**Score:** {score}/10 - ⚠️ Acceptable")
            else:
                st.error(f"**Score:** {score}/10 - ❌ Needs Improvement")
        else:
            st.info(f"**Score:** {score}")
        
        st.metric("Revisions Made", revisions)
        st.text_area("Critique", critique, height=150)
    
    with tab3:
        st.subheader("Process Details")
        st.write(f"**Company:** {company}")
        st.write(f"**Strategy Focus:** Cost Leadership")
        st.write(f"**Report Length:** {len(result['draft_report'])} characters")
        st.write(f"**Workflow:** Researcher → Analyst → Critic → Editor (loop)")
        
        st.info("""
🔄 **Self-Correcting Process:**
1. Researcher gathers data
2. Analyst creates initial SWOT draft
3. Critic evaluates quality (1-10 scale)
4. If score < 7, Editor improves the draft
5. Loop continues until quality ≥ 7 or max 3 revisions
        """)

# Footer
st.markdown("---")
st.markdown("""
**About A2A Strategy Agent**
- 🤖 AI-powered strategic analysis
- 🔄 Automatic quality improvement
- 📊 Data-driven insights
- 🎯 Focused on Cost Leadership strategy

**How it works:** The system automatically detects poor quality drafts and improves them through iterative revision, ensuring you always get high-quality strategic analysis.
""")