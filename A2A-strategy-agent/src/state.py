from typing import TypedDict, Optional, List

class AgentState(TypedDict):
    company_name: str
    raw_data: Optional[str]
    draft_report: Optional[str]
    critique: Optional[str]
    revision_count: int
    messages: List[str]
