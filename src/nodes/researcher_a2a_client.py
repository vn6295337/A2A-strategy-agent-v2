"""
Researcher A2A Client

Client wrapper for calling the Researcher A2A Server via Google A2A protocol.
Used by the LangGraph orchestrator to fetch research data.
"""

import asyncio
import logging
import os
from typing import Optional

import httpx

logger = logging.getLogger("researcher-a2a-client")

# A2A Server configuration
A2A_RESEARCHER_URL = os.getenv("A2A_RESEARCHER_URL", "http://localhost:8003")
A2A_TIMEOUT = float(os.getenv("A2A_TIMEOUT", "60"))  # seconds
A2A_POLL_INTERVAL = float(os.getenv("A2A_POLL_INTERVAL", "1"))  # seconds


class A2AClientError(Exception):
    """Error communicating with A2A server."""
    pass


async def send_message(message_text: str) -> dict:
    """
    Send message/send request to start a research task.

    Args:
        message_text: Text message like "Research Tesla"

    Returns:
        Task info dict with task ID
    """
    async with httpx.AsyncClient() as client:
        request = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "message/send",
            "params": {
                "message": {
                    "parts": [{"type": "text", "text": message_text}]
                }
            }
        }

        try:
            response = await client.post(
                A2A_RESEARCHER_URL,
                json=request,
                timeout=10
            )
            data = response.json()

            if "error" in data:
                raise A2AClientError(f"A2A error: {data['error']}")

            return data.get("result", {})

        except httpx.RequestError as e:
            raise A2AClientError(f"Connection error: {e}")


async def get_task_status(task_id: str) -> dict:
    """
    Get task status via tasks/get request.

    Args:
        task_id: Task ID from message/send response

    Returns:
        Task status dict including artifacts if completed
    """
    async with httpx.AsyncClient() as client:
        request = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tasks/get",
            "params": {"taskId": task_id}
        }

        try:
            response = await client.post(
                A2A_RESEARCHER_URL,
                json=request,
                timeout=10
            )
            data = response.json()

            if "error" in data:
                raise A2AClientError(f"A2A error: {data['error']}")

            return data.get("result", {}).get("task", {})

        except httpx.RequestError as e:
            raise A2AClientError(f"Connection error: {e}")


async def wait_for_completion(task_id: str, timeout: float = None) -> dict:
    """
    Poll task status until completed or failed.

    Args:
        task_id: Task ID to poll
        timeout: Max seconds to wait (default: A2A_TIMEOUT)

    Returns:
        Completed task dict with artifacts
    """
    if timeout is None:
        timeout = A2A_TIMEOUT

    elapsed = 0

    while elapsed < timeout:
        task = await get_task_status(task_id)
        status = task.get("status")

        if status == "completed":
            return task
        elif status == "failed":
            error = task.get("error", {}).get("message", "Unknown error")
            raise A2AClientError(f"Task failed: {error}")
        elif status == "canceled":
            raise A2AClientError("Task was canceled")

        await asyncio.sleep(A2A_POLL_INTERVAL)
        elapsed += A2A_POLL_INTERVAL

    raise A2AClientError(f"Task timed out after {timeout} seconds")


async def call_researcher_a2a(company: str, ticker: str = "") -> dict:
    """
    High-level function to call Researcher A2A Server and get results.

    Args:
        company: Company name to research
        ticker: Optional ticker symbol

    Returns:
        Research data dict from the A2A server
    """
    # Format message
    if ticker:
        message = f"Research {ticker} {company}"
    else:
        message = f"Research {company}"

    logger.info(f"Calling Researcher A2A Server: {message}")

    # Send message to start task
    result = await send_message(message)
    task_id = result.get("task", {}).get("id")

    if not task_id:
        raise A2AClientError("No task ID returned from message/send")

    logger.info(f"Task created: {task_id}")

    # Wait for completion
    task = await wait_for_completion(task_id)

    # Extract data from artifacts
    artifacts = task.get("artifacts", [])
    if not artifacts:
        raise A2AClientError("No artifacts in completed task")

    # Find data artifact
    for artifact in artifacts:
        if artifact.get("type") == "data":
            return artifact.get("data", {})

    raise A2AClientError("No data artifact found in response")


async def check_researcher_health() -> bool:
    """
    Check if Researcher A2A Server is healthy.

    Returns:
        True if server is healthy, False otherwise
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{A2A_RESEARCHER_URL}/health",
                timeout=5
            )
            data = response.json()
            return data.get("status") == "healthy"
    except Exception:
        return False


async def get_agent_card() -> Optional[dict]:
    """
    Fetch the agent card from the A2A server.

    Returns:
        Agent card dict or None if unavailable
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{A2A_RESEARCHER_URL}/.well-known/agent.json",
                timeout=5
            )
            return response.json()
    except Exception:
        return None


# Synchronous wrapper for LangGraph node
def call_researcher_sync(company: str, ticker: str = "") -> dict:
    """
    Synchronous wrapper for call_researcher_a2a.

    Use this in LangGraph nodes that don't support async.
    """
    return asyncio.run(call_researcher_a2a(company, ticker))
