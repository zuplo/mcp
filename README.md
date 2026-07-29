# @zuplo/mcp

> [!WARNING]
> **This package is deprecated and is no longer maintained.**
>
> Please use the official Model Context Protocol TypeScript SDK instead: [`@modelcontextprotocol/sdk`](https://www.npmjs.com/package/@modelcontextprotocol/sdk) ([GitHub](https://github.com/modelcontextprotocol/typescript-sdk)).

`@zuplo/mcp` was a stateless, remote server first MCP SDK that aimed to be ["minimum common API" compliant as defined by the WinterTC](https://min-common-api.proposal.wintertc.org/).
It used the [`fetch` APIs](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) and was intended to work out of the box on Zuplo, Node, Deno, Workerd, etc.

The official [`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk) now covers these use cases and is the recommended path forward. New projects should adopt it directly, and existing users of `@zuplo/mcp` should migrate.

# 📝 Documentation

## Quickstart

1. Create an MCP server:

```ts
const server = new MCPServer({
  name: "Example Server",
  version: "1.0.0",
});
```

2. Add some tools:

```ts
server.addTool({
  name: "add",
  description: "Adds two numbers together and returns the result.",
  validator: new ZodValidator(
    z.object({
      a: z.number().describe("First number"),
      b: z.number().describe("Second number"),
    }),
  ),
  handler: async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }],
    isError: false,
  }),
});
```

3. Wire up your MCP server with a transport:

```ts
const transport = new HTTPStreamableTransport();
await transport.connect();

server.withTransport(transport);
```

4. Handle a `Request`:

```ts
const response = await transport.handleRequest(httpRequest);
```

# 🤝 Contributing

See the [`CONTRIBUTING.md`](./CONTRIBUTING.md) for further details.

**Attributions**

Inspired by, with MIT Licensed attributions to, the official [`modelcontextprotocol/typescript-sdk`](https://github.com/modelcontextprotocol/typescript-sdk)
