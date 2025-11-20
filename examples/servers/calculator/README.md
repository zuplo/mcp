# Calculator server

This calculator has a few mathematical tools (like addition, division, sqrt, modulo, etc.)
and can be utilized by an MCP client to run calculations remotely.

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
    "method": "tools/call"
    "params":{
      "name": "add"
      "arguments":{
        "a": 1
        "b": 2
      }
    }
  }' \
  localhost:3000/mcp
```
