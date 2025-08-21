# Prompts Example Server

This example demonstrates how to use the Zuplo MCP SDK to create a server that exposes prompt templates.

## Running the Example

```bash
npm install
npm run build
npm start
```

The server will start on port 3001.

## Testing with curl

### List available prompts

```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "prompts/list",
    "params": {}
  }'
```

### Get a specific prompt

```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "prompts/get",
    "params": {
      "name": "greeting",
      "arguments": {
        "name": "Alice",
        "style": "casual"
      }
    }
  }'
```

## Prompt Types Demonstrated

- **Dynamic Generation**: The greeting prompt generates different messages based on style
- **Template Substitution**: The meeting summary uses `{{variable}}` replacement
- **Multi-Message**: The debug session returns multiple conversation messages
- **Validation**: All prompts use Zod validation for type safety
