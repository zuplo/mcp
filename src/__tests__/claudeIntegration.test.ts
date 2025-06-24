import { config } from 'dotenv';
config();
import Anthropic from '@anthropic-ai/sdk';
import { spawn, execSync, ChildProcess } from 'child_process';
import path from 'path';
import { questions } from '../testdata/integrationQuestions.data.js';

// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="jest" />

describe('Claude API Integration with Ping Server', () => {
  let serverProcess: ChildProcess;
  const PING_SERVER_DIR = path.resolve(process.cwd(), 'examples/ping-server');

  beforeAll(() => {
    // Build the main project first
    execSync('npm run build', { cwd: process.cwd(), stdio: 'inherit' });

    // Install dependencies and build the ping server
    execSync('npm install', { cwd: PING_SERVER_DIR, stdio: 'inherit' });
    execSync('npm run build', { cwd: PING_SERVER_DIR, stdio: 'inherit' });
    
    // Start the server
    serverProcess = spawn('node', ['dist/index.js'], { cwd: PING_SERVER_DIR });

    serverProcess.stdout?.on('data', (data) => {
      console.log(`ping-server stdout: ${data}`);
    });

    serverProcess.stderr?.on('data', (data) => {
      console.error(`ping-server stderr: ${data}`);
    });
    
    // Give it a moment to start
    return new Promise(resolve => setTimeout(resolve, 3000));
  }, 60000); // 60s timeout for setup

  afterAll(() => {
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error('CLAUDE_API_KEY not set in .env');
  const client = new Anthropic({ apiKey });

  const mcpServer = process.env.MCP_SERVER_URL || 'http://localhost:3000/mcp';
  console.log(`MCP Server URL from .env: ${process.env.MCP_SERVER_URL}`);
  console.log(`MCP Server URL being used in test: ${mcpServer}`);

  questions.forEach((question: string) => {
    it(`should get a response for: ${question}`, async () => {
      console.log(`\nQUESTION: ${question}`);
      // With MCP server
      if (mcpServer) {
        console.log(`MCP DEBUG: Using MCP_SERVER_URL=${mcpServer}`);
        try {
          const mcp = await client.beta.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1024,
            messages: [{ role: 'user', content: question }],
            
            mcp_servers: [
              {
                type: 'url',
                url: mcpServer,
                name: 'mcp-server',
              },
            ],
            betas: ['mcp-client-2025-04-04'],
          } as any);
          console.log('MCP REQUEST ID:', mcp._request_id);
          expect(mcp.content).toBeTruthy();
          console.log(`MCP RESPONSE: ${typeof mcp.content === 'object' ? JSON.stringify(mcp.content, null, 2) : mcp.content}`);
        } catch (error: any) {
          // Try to log request ID if present in error response
          if (error && error.response && error.response.data && error.response.data.request_id) {
            console.error('MCP ERROR REQUEST ID:', error.response.data.request_id);
          }
          console.error('MCP ERROR:', error);
          throw error; // rethrow so the test still fails
        }
      }
    }, 30000);
  });
}); 