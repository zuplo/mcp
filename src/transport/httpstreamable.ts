import type {
  JSONRPCMessage,
  JSONRPCRequest,
  JSONRPCResponse,
} from "../jsonrpc2/types.ts";
import { isJSONRPCRequest, isJSONRPCResponse } from "../jsonrpc2/validation.js";
import type { MessageHandler, Transport, TransportOptions } from "./types.js";

/**
 * Handler for streaming responses
 */
export interface StreamProvider {
  getStream(): AsyncIterable<JSONRPCMessage>;
  cancel?(): void;
}

/**
 * Session information
 */
interface Session {
  id: string;
  createdAt: number;
  lastActivity: number;
  streams: Map<string, StreamInfo>;
  lastEventId?: string;
}

/**
 * Stream information for tracking server-sent events
 */
interface StreamInfo {
  id: string;
  writer: WritableStreamDefaultWriter<Uint8Array>;
  eventCounter: number;
  messages: JSONRPCMessage[];
  pendingRequests: Set<string | number>; // IDs of requests waiting for responses
}

/**
 * HTTP Streamable Transport implementation for Model Context Protocol
 * following the Streamable HTTP transport specification
 */
export class HTTPStreamableTransport implements Transport {
  messageHandler: MessageHandler | null = null;
  closeCallback: (() => void) | null = null;

  private options: TransportOptions;
  private connected = false;
  private enableStreaming = false;
  private sessions: Map<string, Session> = new Map();
  private streams: Map<string, StreamInfo> = new Map();

  constructor(options: TransportOptions = {}, streamable = false) {
    // Set defaults
    this.options = {
      timeout: 30 * 60 * 1000, // 30 minutes
      enableSessions: false,
      ...options,
    };

    // Start session cleanup timer if sessions are enabled
    if (streamable) {
      this.startSessionCleanup();
    }
  }

  onError(callback: (error: Error) => void): void {
    throw new Error("Method not implemented.");
  }

  getSessionId(): string | undefined {
    throw new Error("Method not implemented.");
  }

  setSessionId(sessionId: string | undefined): void {
    throw new Error("Method not implemented.");
  }

  /**
   * Initialize the transport with the server
   */
  public async connect(): Promise<void> {
    this.connected = true;
  }

  /**
   * Send a JSON RPC Message on the connected transport
   * This sends messages to connected SSE streams
   */
  public async send(message: JSONRPCMessage): Promise<void> {
    if (!this.connected) {
      throw new Error("Transport not connected");
    }

    // Determine target session and stream based on message
    if (isJSONRPCResponse(message)) {
      // Find stream waiting for this response
      for (const [sessionId, session] of this.sessions.entries()) {
        for (const [streamId, streamInfo] of session.streams.entries()) {
          if (streamInfo.pendingRequests.has(message.id)) {
            // Send response on this stream
            await this.sendToStream(streamInfo, message);
            streamInfo.pendingRequests.delete(message.id);

            // If this was the last pending request, close the stream
            if (streamInfo.pendingRequests.size === 0) {
              await this.closeStream(sessionId, streamId);
            }
            return;
          }
        }
      }
    } else {
      // For requests or notifications, send to all active sessions
      // (In practice, you might want a more sophisticated routing mechanism)
      for (const session of this.sessions.values()) {
        // Use the first available stream for this session
        const streamInfo = [...session.streams.values()][0];
        if (streamInfo) {
          await this.sendToStream(streamInfo, message);

          // If it's a request, track it for future response matching
          if (isJSONRPCRequest(message)) {
            streamInfo.pendingRequests.add(message.id);
          }
        }
      }
    }
  }

  /**
   * Set message handler callback
   */
  public onMessage(handler: MessageHandler): void {
    this.messageHandler = handler;
  }

  /**
   * Sets a callback for when the transport is closed
   */
  public onClose(callback: () => void): void {
    this.closeCallback = callback;
  }

  /**
   * Close the transport
   */
  public async close(): Promise<void> {
    this.connected = false;

    // Close all streams
    for (const session of this.sessions.values()) {
      for (const [streamId, streamInfo] of session.streams.entries()) {
        try {
          await streamInfo.writer.close();
        } catch (error) {
          console.warn("Error closing stream:", error);
        }
      }
      session.streams.clear();
    }

    // Clear all sessions
    this.sessions.clear();

    if (this.closeCallback) {
      this.closeCallback();
    }
  }

  /**
   * Handle HTTP request (follows the WinterTC standard)
   */
  public async handleRequest(request: Request): Promise<Response> {
    if (!this.connected) {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Transport not connected",
          },
          id: null,
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!this.messageHandler) {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "No message handler registered",
          },
          id: null,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Process based on HTTP method
    const method = request.method.toUpperCase();

    try {
      // Validate origin as recommended by protocol:
      // "Servers MUST validate the Origin header on all incoming connections to
      // prevent DNS rebinding attacks"
      this.validateOrigin(request);

      // Extract session ID if present
      const sessionId = request.headers.get("Mcp-Session-Id");
      let session: Session | undefined;

      if (sessionId) {
        session = this.sessions.get(sessionId);
        if (!session && method !== "DELETE") {
          // Session not found or expired
          return new Response(null, { status: 404 });
        }
      }

      switch (method) {
        case "POST":
          return await this.handlePostRequest(request, session);

        case "GET":
          return await this.handleGetRequest(request, session);

        case "DELETE":
          return await this.handleDeleteRequest(request, session?.id);

        default:
          return new Response(null, {
            status: 405,
            headers: { Allow: "POST, GET, DELETE" },
          });
      }
    } catch (error) {
      console.error("Error handling request:", error);

      // Determine appropriate status code
      const status = 400;

      const errorResponse = {
        jsonrpc: "2.0",
        error: {
          code: -32603, // Internal error
          message: error || "Server error",
        },
        id: null,
      };

      return new Response(JSON.stringify(errorResponse), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  /**
   * Handle POST requests (sending messages to server)
   */
  private async handlePostRequest(
    request: Request,
    session?: Session
  ): Promise<Response> {
    // Check Accept header as required by the spec
    const acceptHeader = request.headers.get("Accept") || "";
    if (
      !acceptHeader.includes("application/json") &&
      !acceptHeader.includes("text/event-stream")
    ) {
      /**
       * Not Acceptable.
       * HTTP Streamable clients must be able to accept HTTP JSON (typically in
       * a stateless mode) and through the legacy SSE streams.
       */
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32600,
            message:
              "Not Acceptable: Client must accept application/json and text/event-stream",
          },
          id: null,
        }),
        {
          status: 406,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Extract JSON-RPC message(s) from request
    const messages = await this.extractJSONRPC(request);
    if (!messages || (Array.isArray(messages) && messages.length === 0)) {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32700, message: "Parse error" },
          id: null,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Normalize to array of messages
    const messageArray = Array.isArray(messages) ? messages : [messages];

    // Check if this contains any requests
    const hasRequests = messageArray.some((msg) => this.isRequest(msg));

    // Handle session initialization
    let currentSession = session;
    if (
      this.options.enableSessions &&
      !currentSession &&
      messageArray.some(
        (msg) => this.isRequest(msg) && msg.method === "initialize"
      )
    ) {
      // Create new session
      const sessionId = this.generateFallbackUUID();
      currentSession = this.createSession(sessionId);
    }

    // Process messages
    try {
      // For messages that are only notifications or responses
      if (!hasRequests) {
        for (const message of messageArray) {
          await this.messageHandler?.(message);
        }
        return new Response(null, {
          status: 202,
          headers: currentSession
            ? { "Mcp-Session-Id": currentSession.id }
            : undefined,
        });
      }

      if (!this.enableStreaming) {
        const responses: JSONRPCResponse[] = [];

        for (const message of messageArray) {
          if (this.isRequest(message)) {
            // Process the request and get a direct response
            const response = (await this.messageHandler?.(
              message
            )) as JSONRPCResponse;
            if (response) {
              responses.push(response);
            }
          } else {
            // Process notification or response
            await this.messageHandler?.(message);
          }
        }

        // Return a direct JSON response
        const responseBody = responses.length === 1 ? responses[0] : responses;
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (currentSession) {
          headers["Mcp-Session-Id"] = currentSession.id;
        }

        return new Response(JSON.stringify(responseBody), {
          status: 200,
          headers,
        });
      }

      // Otherwise, use SSE for more complex cases (the existing code)
      const { stream, streamId } = this.createStream(currentSession);
      const responsePromises: Promise<JSONRPCResponse | undefined>[] = [];

      for (const message of messageArray) {
        if (this.isRequest(message)) {
          // Track this request ID in the stream
          this.streams.get(streamId)?.pendingRequests.add(message.id);

          // Process the request
          const responsePromise = this.messageHandler?.(
            message
          ) as Promise<JSONRPCResponse>;
          responsePromises.push(responsePromise);
        } else {
          // Process notification or response
          await this.messageHandler?.(message);
        }
      }

      const headers: Record<string, string> = {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      };

      if (currentSession) {
        headers["Mcp-Session-Id"] = currentSession.id;
      }

      // Let responses be handled by the message handler and sent to the stream
      return new Response(stream.readable, { headers });
    } catch (error) {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32603, message: error || "Internal error" },
          id: null,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  /**
   * Handle GET requests (listening for server messages)
   */
  private async handleGetRequest(
    request: Request,
    session?: Session
  ): Promise<Response> {
    // Check Accept header as required by the spec
    const acceptHeader = request.headers.get("Accept") || "";
    if (!acceptHeader.includes("text/event-stream")) {
      return new Response(null, {
        status: 406, // Not Acceptable
        headers: { "Content-Type": "application/json" },
      });
    }

    // If no session and sessions are required, reject
    if (this.options.enableSessions && !session) {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32000, message: "Session required" },
          id: null,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create a new stream for server-to-client communication
    const { stream, streamId } = this.createStream(session);

    // Check for Last-Event-ID for resumability
    const lastEventId = request.headers.get("Last-Event-ID");
    if (lastEventId && session) {
      // Replay messages if needed
      await this.replayMessages(session, streamId, lastEventId);
    }

    // Return the stream
    const headers: Record<string, string> = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    };

    if (session) {
      headers["Mcp-Session-Id"] = session.id;
    }

    return new Response(stream.readable, { headers });
  }

  /**
   * Handle DELETE requests (explicit session termination)
   */
  private async handleDeleteRequest(
    request: Request,
    sessionId?: string
  ): Promise<Response> {
    if (!sessionId) {
      return new Response(null, { status: 400 });
    }

    if (this.options.enableSessions && sessionId) {
      // Remove the session
      const session = this.sessions.get(sessionId);
      if (session) {
        // Close all streams
        for (const [streamId, streamInfo] of session.streams.entries()) {
          await this.closeStream(sessionId, streamId);
        }

        // Delete the session
        this.sessions.delete(sessionId);
        return new Response(null, { status: 204 });
      }
    }

    // Session not found
    return new Response(null, { status: 404 });
  }

  /**
   * Send message to a specific stream
   */
  private async sendToStream(
    streamInfo: StreamInfo,
    message: JSONRPCMessage
  ): Promise<void> {
    try {
      const eventId = String(++streamInfo.eventCounter);
      const eventData = JSON.stringify(message);

      // Store message for potential replay
      streamInfo.messages.push(message);

      // Keep message history manageable
      if (streamInfo.messages.length > 100) {
        // Arbitrary limit, adjust as needed
        streamInfo.messages.shift();
      }

      // Format as SSE event
      const event = `id: ${eventId}\ndata: ${eventData}\n\n`;
      await streamInfo.writer.write(new TextEncoder().encode(event));
    } catch (error) {
      console.warn("Error sending to stream:", error);
      // Stream might be closed, but we don't throw to avoid breaking the send loop
    }
  }

  /**
   * Close a specific stream
   */
  private async closeStream(
    sessionId: string,
    streamId: string
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const streamInfo = session.streams.get(streamId);
    if (!streamInfo) return;

    try {
      await streamInfo.writer.close();
    } catch (error) {
      console.warn("Error closing stream:", error);
    }

    session.streams.delete(streamId);
    this.streams.delete(streamId);
  }

  /**
   * Create a new session
   */
  private createSession(sessionId: string): Session {
    const session: Session = {
      id: sessionId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      streams: new Map(),
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Create a new stream for SSE communication
   */
  private createStream(session?: Session): {
    stream: TransformStream;
    streamId: string;
  } {
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const streamId = crypto.randomUUID?.() || this.generateFallbackUUID();

    const streamInfo: StreamInfo = {
      id: streamId,
      writer,
      eventCounter: 0,
      messages: [],
      pendingRequests: new Set(),
    };

    this.streams.set(streamId, streamInfo);

    if (session) {
      session.streams.set(streamId, streamInfo);
      session.lastActivity = Date.now();
    }

    return { stream, streamId };
  }

  /**
   * Replay messages on a stream from a given event ID
   */
  private async replayMessages(
    session: Session,
    streamId: string,
    lastEventId: string
  ): Promise<void> {
    // Find stream with matching last event ID
    for (const oldStreamInfo of session.streams.values()) {
      // Skip current stream
      if (oldStreamInfo.id === streamId) continue;

      // Find position in message history
      const lastEventIndex = Number.parseInt(lastEventId, 10);
      if (Number.isNaN(lastEventIndex)) continue;

      // Replay messages after the last received event
      const messagesToReplay = oldStreamInfo.messages.slice(lastEventIndex);
      const newStreamInfo = this.streams.get(streamId);

      if (newStreamInfo && messagesToReplay.length > 0) {
        for (const message of messagesToReplay) {
          await this.sendToStream(newStreamInfo, message);
        }
      }
    }
  }

  /**
   * Start periodic cleanup of expired sessions
   */
  private startSessionCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [sessionId, session] of this.sessions.entries()) {
        const timeout = this.options.timeout ?? 60000;
        if (now - session.lastActivity > timeout) {
          // Close all streams
          for (const [streamId, streamInfo] of session.streams.entries()) {
            try {
              streamInfo.writer
                .close()
                .catch((e) => console.warn("Error closing stream:", e));
            } catch (error) {
              console.warn("Error closing stream:", error);
            }
            this.streams.delete(streamId);
          }

          // Remove the session
          this.sessions.delete(sessionId);
        }
      }
    }, 60000); // Check every minute
  }

  /**
   * Extract JSON-RPC message(s) from HTTP request
   */
  private async extractJSONRPC(
    request: Request
  ): Promise<JSONRPCMessage | JSONRPCMessage[]> {
    // TODO - Check request size to ensure it's not surpassing the configured size

    // Parse request body as JSON
    try {
      // Clone the request to ensure we can read it
      const clonedRequest = request.clone();
      const text = await clonedRequest.text();

      if (!text) {
        throw new Error("Empty request body");
      }

      return JSON.parse(text);
    } catch (error) {
      throw new Error(`Failed to parse JSON-RPC message: ${error}`);
    }
  }

  /**
   * Validate origin header to prevent DNS rebinding attacks
   */
  private validateOrigin(request: Request): void {
    const origin = request.headers.get("Origin");

    if (origin && !this.isValidOrigin(origin)) {
      throw new Error("Invalid origin");
    }
  }

  /**
   * Check if an origin is valid
   */
  private isValidOrigin(origin: string): boolean {
    // TODO - enable users to provide a whitelist of allowed origins
    return true;
  }

  /**
   * Check if a message is a JSON-RPC request
   */
  private isRequest(message: JSONRPCMessage): message is JSONRPCRequest {
    return (
      message !== null &&
      typeof message === "object" &&
      "jsonrpc" in message &&
      message.jsonrpc === "2.0" &&
      "method" in message &&
      "id" in message &&
      message.id !== null &&
      message.id !== undefined
    );
  }

  /**
   * Generate a fallback UUID if crypto.randomUUID is not available
   */
  private generateFallbackUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
