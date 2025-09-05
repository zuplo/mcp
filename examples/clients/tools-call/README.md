# MCP Client Tools Call Example

This example demonstrates how to use the MCP client to connect to and call tools.

## Prerequisites

Make sure the calculator server is running:

```bash
cd ../calculator
npm install
npm run dev
```

The server should be running on `http://localhost:3000`. Otherwise, use `BASE_URL` to set
the URL to a different MCP server.

Note!!! This example expects a server with an "add" and "divide" tool that accepts 2 arguments: `a` and `b`.

## Running the Example

```bash
npm install
npm run build
npm start
```
