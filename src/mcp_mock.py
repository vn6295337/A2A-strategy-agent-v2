"""
Mock MCP implementation to allow the code to run without the actual MCP package.
This provides the basic functionality needed for the A2A Strategy Agent.
"""

class FastMCP:
    """Mock implementation of FastMCP for local development and testing."""
    
    def __init__(self, name="default"):
        self.name = name
        self.tools = {}
        
    def tool(self, name=None):
        """Decorator to register a tool function."""
        def decorator(func):
            tool_name = name or func.__name__
            self.tools[tool_name] = func
            return func
        return decorator
    
    def run(self, host="0.0.0.0", port=8000):
        """Mock run method - in a real implementation this would start a server."""
        print(f"🚀 Mock MCP server '{self.name}' would start on {host}:{port}")
        print(f"   Available tools: {list(self.tools.keys())}")
        print("   (This is a mock implementation - no actual server is running)")
        
    def __call__(self, tool_name, *args, **kwargs):
        """Call a registered tool function."""
        if tool_name in self.tools:
            return self.tools[tool_name](*args, **kwargs)
        else:
            raise ValueError(f"Tool '{tool_name}' not found")

# Create a mock server instance for compatibility
server = FastMCP()