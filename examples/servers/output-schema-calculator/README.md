# Calculator server

This calculator meta-tool demonstrates how `outputSchema` and `structuredContent`
work together.

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
    "method": "tools/call"
    "params": {
      "name": "add"
      "arguments": {
        "a": 1
        "b": 2
      }
    }
  }' \
  localhost:3000/mcp
```
