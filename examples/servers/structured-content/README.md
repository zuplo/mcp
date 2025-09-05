# Structured content server

This example shows how `structuredContent` can be used alongside the `content.text`
field to output both JSON structured objects alongside their "stringy" representation.
For backwards compatiblity, it's a good practice to fill in _both_ `structuredContent`
and `content.text`.

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
