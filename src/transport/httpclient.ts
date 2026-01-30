import type { EventSourceMessage } from "eventsource-parser";
import { EventSourceParserStream } from "eventsource-parser/stream";
import type { JSONRPCMessage } from "../jsonrpc2/types.js";
import { createDefaultLogger } from "../logger/index.js";
import type { Logger } from "../logger/types.js";
import type { MessageHandler, Transport, TransportOptions } from "./types.js";

export interface HTTPClientTransportOptions extends TransportOptions {
  url: string;
}

/**
 * HTTP Client Transport for MCP clients to communicate with MCP servers
 *
 * Makes HTTP POST requests to send JSON-RPC messages and handles responses.
 * Designed specifically for client-side usage.
 */
export class HTTPClientTransport implements Transport {
  private url: string;
  private timeout: number;
  private headers: Record<string, string>;
  private fetch: typeof fetch;
  private logger: Logger;
  private sessionId?: string;
  private messageHandler?: MessageHandler;
  private errorCallback?: (error: Error) => void;
  private closeCallback?: () => void;
  private isConnected = false;

  constructor(options: HTTPClientTransportOptions) {
    this.url = options.url;
    this.timeout = options.timeout || 30000;
    this.headers = {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      ...options.headers,
    };
    this.fetch = options.fetch || globalThis.fetch;
    this.logger = options.logger || createDefaultLogger();

    if (options.enableSessions) {
      this.logger.debug(
        "Session support not yet implemented for HTTP client transport"
      );
    }
  }

  setHeaders(headers: Record<string, string>): void {
    this.headers = { ...this.headers, ...headers };
  }

  async connect(): Promise<void> {
    try {
      new URL(this.url);
      this.isConnected = true;
      this.logger.info("HTTP Client Transport connected to:", this.url);
    } catch (error) {
      const err = new Error(`Invalid URL: ${this.url}`);
      if (this.errorCallback) {
        this.errorCallback(err);
      }
      throw err;
    }
  }

  async send(message: JSONRPCMessage): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Transport not connected. Call connect() first.");
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const requestHeaders = {
        ...this.headers,
        ...(this.sessionId && { "Mcp-Session-Id": this.sessionId }),
      };

      const response = await this.fetch(this.url, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(message),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Capture session ID from response headers if present 
      // (https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#session-management)
      const responseSessionId = response.headers.get("Mcp-Session-Id");
      if (responseSessionId && !this.sessionId) {
        this.sessionId = responseSessionId;
      }

      // Check content type to determine response format
      const contentType = response.headers.get("Content-Type") || "";

      if (contentType.includes("text/event-stream")) {
        // Handle SSE response with abort signal for timeout
        await this.handleSSEResponse(response, controller.signal);
      } else {
        // Handle JSON response
        await this.handleJSONResponse(response);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        if (this.errorCallback) {
          this.errorCallback(error);
        }
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }

      const unknownError = new Error(`A client error occurred: ${error}`);
      if (this.errorCallback) {
        this.errorCallback(unknownError);
      }
      throw unknownError;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  onMessage(handler: MessageHandler): void {
    this.messageHandler = handler;
  }

  async close(): Promise<void> {
    this.logger.debug("Closing HTTP Client Transport");
    this.isConnected = false;
    this.messageHandler = undefined;

    if (this.closeCallback) {
      this.closeCallback();
    }

    this.logger.info("HTTP Client Transport closed");
  }

  onClose(callback: () => void): void {
    this.closeCallback = callback;
  }

  onError(callback: (error: Error) => void): void {
    this.errorCallback = callback;
  }

  getSessionId(): string | undefined {
    return this.sessionId;
  }

  setSessionId(sessionId: string | undefined): void {
    this.sessionId = sessionId;
    this.logger.debug("Session ID set:", sessionId ? "***" : "undefined");
  }

  /**
   * Handle JSON response from server
   */
  private async handleJSONResponse(response: Response): Promise<void> {
    const responseText = await response.text();
    if (!responseText.trim()) {
      this.logger.debug("Received empty response");
      return;
    }

    let responseMessage: JSONRPCMessage;
    try {
      responseMessage = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    this.logger.debug("Received JSON-RPC response:", responseMessage);

    // Call the message handler with the response
    if (this.messageHandler) {
      await this.messageHandler(responseMessage);
    }
  }

  /**
   * Handle SSE response from server
   */
  private async handleSSEResponse(
    response: Response,
    signal?: AbortSignal
  ): Promise<void> {
    if (!response.body) {
      throw new Error("SSE response has no body");
    }

    this.logger.debug("Handling SSE response");
    const onEvent = (event: EventSourceMessage) => {
      // Only process "message" events, ignore others like "ping" or comments
      if (!event.event || event.event === "message") {
        try {
          const message: JSONRPCMessage = JSON.parse(event.data);
          this.logger.debug("Received SSE message:", message);

          if (this.messageHandler) {
            this.messageHandler(message);
          }
        } catch (parseError) {
          this.logger.warn(
            "Failed to parse SSE message data:",
            event.data,
            parseError
          );
        }
      }
    };

    const eventStream = response.body
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new EventSourceParserStream())
      .getReader();

    try {
      while (true) {
        // Check if the abort signal has been triggered
        if (signal?.aborted) {
          await eventStream.cancel();
          return;
        }

        const { done, value } = await eventStream.read();
        if (done) {
          return;
        }

        onEvent(value);
      }
    } catch (streamError) {
      // Handle abort errors gracefully - these are expected when timeout fires
      if (streamError instanceof Error && streamError.name === "AbortError") {
        this.logger.debug("SSE stream aborted");
        return;
      }
      this.logger.error("Error processing SSE stream:", streamError);
      throw new Error(`SSE stream error: ${streamError}`);
    }
  }
}
