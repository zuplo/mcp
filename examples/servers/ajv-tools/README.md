# Custom Ajv validator

This demonstrates using Ajv with the `CustomValidator` to in an advanced use case to:

1. Build a custom schema validator function based on a concrete type / schema using `ajv.compile`
2. Build a hand rolled, "bring your own validator" with `CustomValidator<T>`
3. Provide the custom validator when bootstrapping a tool

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
      "arguments": {
        "a": 1
        "b": 2
      }
    }
  }' \
  localhost:3000/mcp
```
