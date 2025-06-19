# Zuplo MCP SDK Agent Guide

## Commands

- **Build**: `tsc` or `npm run build`
- **Test**: `NODE_OPTIONS="$NODE_OPTIONS --experimental-vm-modules" npx jest` or `npm test`
- **Test Single**: `npx jest path/to/test.test.ts` (Jest with ESM support)
- **Lint**: `npx @biomejs/biome check src/` or `npm run lint`
- **Lint Fix**: `npm run lint:fix` or `npm run lint:fix-unsafe`
- **Format**: `npm run format`

## Architecture

TypeScript ESM MCP (Model Context Protocol) SDK with fetch-based transport. Key modules:

- `src/server/` - MCPServer class, tool management, JSON-RPC handling
- `src/transport/` - HTTPStreamableTransport for HTTP/SSE communication
- `src/tools/` - Tool validators (Zod, custom) and utilities
- `src/jsonrpc2/` - JSON-RPC 2.0 types and validation
- `src/mcp/` - MCP protocol types and schemas
- `examples/` - Usage examples with different tool configurations

## Code Style (Biome)

- 2-space indentation, 80 char line width, double quotes, semicolons always
- Use `.js` extensions in imports (`import "./file.js"`)
- No explicit any (`"noExplicitAny": "error"`), use import extensions
- Organize imports enabled, prefer named exports over default
