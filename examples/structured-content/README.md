# Structured content server

This simple MCP server has a tool that returns `structuredContent`: a useful way to
pass in well defined and structured JSON objects.

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
  -H 'Accept: application/json' \
  -d '{
    method: "tools/call"
    params:{
      name: "say_hello"
      arguments:{}
    }
  }' \
  localhost:3000/mcp
```
