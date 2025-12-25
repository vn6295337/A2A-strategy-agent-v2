from typing import TypedDict, Optional, List

class AgentState(TypedDict):
    company_name: str
    strategy_focus: str
    raw_data: Optional[str]
    draft_report: Optional[str]
    critique: Optional[str]
    revision_count: int
    score: int
    messages: List[str]
    # Provider tracking
    provider_used: Optional[str]
    data_source: str  # "live" or "mock"
    # MCP source tracking
    sources_failed: Optional[List[str]]  # List of MCP sources that failed
