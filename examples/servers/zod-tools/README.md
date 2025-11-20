# Echo server with Zod validator

This implements a simple echo tool using the `ZodValidator` for schema validation.

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
    "params":{
      "name": "echo"
      "arguments": {
        "input": "hello"
      }
    }
  }' \
  localhost:3000/mcp
```
