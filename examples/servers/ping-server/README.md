# Simple ping server

The following is a very simple "ping" MCP server.

It has no tools, it has no
capabilities: it primarily only responds to `method.ping` requests after the initialization flow
[as defined in the MCP spec](https://modelcontextprotocol.io/specification/2025-03-26/basic/utilities/ping).

## 🏃 Build & run the server

```
npm i
npm run build
npm run start
```

## 🧠 Interact

Use the [Model Context Protocol Inspector](https://github.com/modelcontextprotocol/inspector)
and `localhost:3000/mcp`.

```sh
npx @modelcontextprotocol/inspector
```

or curl:

```sh
curl -X POST \
  -H "Accept: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "123",
    "method": "ping"
  }' \
  localhost:3000/mcp
```
