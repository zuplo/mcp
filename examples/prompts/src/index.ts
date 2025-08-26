import { serve } from '@hono/node-server'
import { Hono } from 'hono';
import { MCPServer } from "@zuplo/mcp/server";
import { HTTPStreamableTransport } from "@zuplo/mcp/transport/httpstreamable";
import { ConsoleLogger } from "@zuplo/mcp/logger";
import { z } from "zod/v4";
import { ZodValidator } from '@zuplo/mcp/tools/zod';
import { newTextPromptMessage, compileTemplateMessages } from "@zuplo/mcp/prompts";

// Hono app for routing and handling fetch API Request / Response
const app = new Hono();

// Create a logger instance
const logger = new ConsoleLogger();

// MCP server
const server = new MCPServer({
  name: "Prompts Example Server",
  version: "1.0.0",
  logger,
});

// Simple greeting prompt with template
server.addPrompt({
  name: "greeting",
  description: "Generate a personalized greeting message",
  validator: new ZodValidator(
    z.object({
      name: z.string().describe("The name of the person to greet"),
      style: z.enum(["formal", "casual", "friendly"]).optional().describe("The greeting style (formal, casual, friendly)")
    })
  ),
  generator: ({ name, style = "friendly" }) => {
    const greetings = {
      formal: `Good day, ${name}. I hope this message finds you well.`,
      casual: `Hey ${name}! How's it going?`,
      friendly: `Hello there, ${name}! It's wonderful to meet you!`
    };

    return [newTextPromptMessage("assistant", greetings[style])];
  }
});

// Code review prompt template
server.addPrompt({
  name: "code_review",
  description: "Generate a code review request with specific focus areas",
  validator: new ZodValidator(
    z.object({
      code: z.string().describe("The code to review"),
      language: z.string().optional().describe("Programming language (e.g., typescript, python)"),
      focus: z.string().optional().describe("Specific areas to focus on (e.g., performance, security, readability)")
    })
  ),
  generator: ({ code, language, focus }) => {
    let reviewText = "Please review this code";

    if (language) {
      reviewText += ` written in ${language}`;
    }

    if (focus) {
      reviewText += `, focusing specifically on ${focus}`;
    }

    reviewText += ":\n\n```";
    if (language) {
      reviewText += language;
    }
    reviewText += `\n${code}\n\`\`\`\n\nPlease provide feedback on:
- Code quality and readability
- Potential bugs or issues
- Performance considerations
- Best practices adherence`;

    if (focus) {
      reviewText += `\n- ${focus}`;
    }

    return [newTextPromptMessage("user", reviewText)];
  }
});

// Template-based prompt using the utility functions
server.addPrompt({
  name: "meeting_summary",
  description: "Generate a meeting summary template",
  validator: new ZodValidator(
    z.object({
      meeting_title: z.string().describe("Title of the meeting"),
      attendees: z.string().describe("Comma-separated list of attendees"),
      date: z.string().describe("Meeting date")
    })
  ),
  generator: (args) => {
    const templateMessages = [
      newTextPromptMessage("user", `Please help me create a summary for the meeting titled "{{meeting_title}}" that took place on {{date}} with attendees: {{attendees}}.

Please structure the summary with the following sections:
- Meeting Overview
- Key Discussion Points
- Action Items
- Next Steps
- Meeting Participants

Use a professional tone and be concise yet comprehensive.`)
    ];

    return compileTemplateMessages(templateMessages, args);
  }
});

// Multi-message conversation starter
server.addPrompt({
  name: "debug_session",
  description: "Start a debugging conversation for a specific issue",
  validator: new ZodValidator(
    z.object({
      error_message: z.string().describe("The error message or issue description"),
      technology: z.string().optional().describe("Technology stack (e.g., React, Node.js, Python)")
    })
  ),
  generator: ({ error_message, technology }) => {
    const messages = [
      newTextPromptMessage("user", `I'm encountering an issue${technology ? ` with ${technology}` : ""}: ${error_message}`),
      newTextPromptMessage("assistant", "I'd be happy to help you debug this issue! Let me start by asking a few questions to better understand the problem:"),
      newTextPromptMessage("assistant", `1. When does this error occur? (e.g., during startup, when calling a specific function, under certain conditions)
2. Can you provide the full error stack trace if available?
3. What steps have you already taken to troubleshoot this?
4. Are there any recent changes that might be related to this issue?

Please share any additional context that might be helpful for debugging.`)
    ];

    return messages;
  }
});

// HTTP Streamable Transport
const transport = new HTTPStreamableTransport({ logger });
await transport.connect();
server.withTransport(transport);

// Set up a POST route for MCP requests
app.post('/mcp', async (c) => {
  try {
    const request = c.req.raw;
    return transport.handleRequest(request);
  } catch (error) {
    logger.error('Error handling MCP request:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

logger.info("Prompts MCP server starting on port 3001");
serve({
  fetch: app.fetch,
  port: 3001
});
