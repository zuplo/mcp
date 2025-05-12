import { MCPServer } from './index';
import { JSONRPCRequest } from '../jsonrpc2/types';
import { LATEST_PROTOCOL_VERSION } from '../mcp/versions';
import { InitializeResult } from '../mcp/20250326/types/types';

describe('MCPServer', () => {
  describe('handleRequest', () => {
    it('properly handles initialization request', async () => {
      const serverName = "example ping server";
      const serverVersion = "0.0.0";
      const server = new MCPServer({
        name: serverName,
        version: serverVersion,
      });

      const clientReq: JSONRPCRequest = {
        jsonrpc: '2.0',
        id: 0,
        method: 'initialize',
        params: {
          protocolVersion: '2025-03-26',
          capabilities: {
            sampling: {},
            roots: {
              listChanged: true
            }
          },
          clientInfo: {
            name: 'mcp-client',
            version: '0.0.0'
          }
        }
      };

      const response = await server.handleRequest(clientReq);

      expect(response).toBeDefined();
      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(0);

      // Check it's a response, not an error
      if ('result' in response) {
        const result = response.result as InitializeResult;

        // Verify protocol version matches the latest
        expect(result.protocolVersion).toBe(LATEST_PROTOCOL_VERSION);

        // Verify capabilities are correctly included
        expect(result.capabilities).toEqual({
          ping: true,
          tools: {
            supported: true,
            available: []
          }
        });

        // Verify server info is correctly included
        expect(result.serverInfo).toEqual({
          name: serverName,
          version: serverVersion
        });
      } else {
        // If this executes, the test will fail because we expect a result, not an error
        fail('Expected a result, got an error response');
      }
    });
  });
});
