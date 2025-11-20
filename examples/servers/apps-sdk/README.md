# OpenAI Apps SDK

This small MCP server demonstrates how you can use the Zuplo MCP SDK for
OpenAI's Apps SDK. This example is adopted from: https://developers.openai.com/apps-sdk/quickstart

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
    "method": "tools/list",
    "params": {}
  }' \
  localhost:3000/mcp
```
