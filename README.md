# @zuplo/mcp

> [!CAUTION]
> The package is deprecated and no longer supported. Use the [official SDK instead](https://github.com/modelcontextprotocol/typescript-sdk).

`@zuplo/mcp` is a stateless, remote server first MCP SDK that aims to be ["minimum common API" compliant as defined by the WinterTC](https://min-common-api.proposal.wintertc.org/).
It uses the [`fetch` APIs](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) and is intended to work out of the box on Zuplo, Node, Deno, Workerd, etc.

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
