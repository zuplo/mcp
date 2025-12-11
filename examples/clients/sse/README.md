# MCP Client with SSE stream servers

This example demonstrates how to use the MCP client to connect to and work with
servers that serve their content in `data: ` streams (i.e., SSE).
This calls the GitHub MCP server `get_me` tool to demonstrate this.

## Running the Example

```bash
npm install
npm run build

# Provide a GitHub token in the env for the Auth header
# to the GitHub MCP server
AUTH_TOKEN="ghp_..." npm start
```

## Supported env

```env
AUTH_TOKEN="ghp_..."
```
