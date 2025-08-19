# Prompts Example Server

This example demonstrates how to use the MCP SDK to create a server that exposes prompt templates.

## What This Example Shows

This server demonstrates several prompt patterns:

1. **Simple Greeting** - Basic prompt with argument substitution
2. **Code Review** - Dynamic prompt generation based on parameters
3. **Meeting Summary** - Template-based prompt using utility functions
4. **Debug Session** - Multi-message conversation starter

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

### Get code review prompt

```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "prompts/get",
    "params": {
      "name": "code_review",
      "arguments": {
        "code": "function add(a, b) { return a + b; }",
        "language": "javascript",
        "focus": "performance"
      }
    }
  }'
```

## Prompt Types Demonstrated

- **Dynamic Generation**: The greeting prompt generates different messages based on style
- **Template Substitution**: The meeting summary uses `{{variable}}` replacement
- **Multi-Message**: The debug session returns multiple conversation messages
- **Validation**: All prompts use Zod validation for type safety

## Integration Patterns

This example shows how prompts can be used in MCP clients:

1. **Slash Commands**: Prompts can be exposed as `/greeting Alice` commands
2. **Template Library**: Pre-built prompts for common use cases
3. **Context-Aware**: Prompts that adapt based on provided arguments
4. **Conversation Starters**: Multi-message prompts that begin conversations
