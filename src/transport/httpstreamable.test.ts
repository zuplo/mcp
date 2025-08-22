import { ErrorCode, JSONRPC_VERSION } from "../jsonrpc2/consts.js";
import { newJSONRPCRequest } from "../jsonrpc2/types.js";
import { MCPServer } from "../server/index.js";
import { HTTPStreamableTransport } from "./httpstreamable.js";

describe("HTTPStreamableTransport Accept header validation", () => {
  let server: MCPServer;
  let transport: HTTPStreamableTransport;

  beforeEach(() => {
    server = new MCPServer({ name: "test", version: "0.0.0" });
    transport = new HTTPStreamableTransport();
    transport.connect();
    server.withTransport(transport);
  });

  // Helper function to create requests with different Accept headers
  const createRequestWithAccept = (acceptHeader?: string): Request => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (acceptHeader !== undefined) {
      headers.Accept = acceptHeader;
    }

    return new Request("http://example.com/mcp", {
      method: "POST",
      headers,
      body: JSON.stringify(
        newJSONRPCRequest({
          id: 1,
          method: "ping",
        })
      ),
    });
  };

  it("rejects requests with no Accept header", async () => {
    const request = createRequestWithAccept(undefined);
    const response = await transport.handleRequest(request);

    expect(response.status).toBe(406);

    const responseBody = await response.json();
    expect(responseBody.jsonrpc).toBe(JSONRPC_VERSION);
    expect(responseBody.error.code).toBe(ErrorCode.InvalidRequest);
    expect(responseBody.error.message).toContain("Not Acceptable");
    expect(responseBody.id).toBeNull();
  });

  it("rejects requests with empty Accept header", async () => {
    const request = createRequestWithAccept("");
    const response = await transport.handleRequest(request);

    expect(response.status).toBe(406);
    const responseBody = await response.json();
    expect(responseBody.error.code).toBe(ErrorCode.InvalidRequest);
  });

  it("rejects requests with incompatible Accept header", async () => {
    const request = createRequestWithAccept("application/xml");
    const response = await transport.handleRequest(request);

    expect(response.status).toBe(406);
    const responseBody = await response.json();
    expect(responseBody.error.code).toBe(ErrorCode.InvalidRequest);
  });

  it("accepts requests with application/json Accept header", async () => {
    const request = createRequestWithAccept("application/json");
    const response = await transport.handleRequest(request);

    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody.result).toEqual({});
  });
});
