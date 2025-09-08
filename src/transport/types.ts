import type { JSONRPCMessage } from "../jsonrpc2/types.js";
import type { Logger } from "../logger/types.js";

/**
 * MessageHandler is a JSON RPC handler for processing messages on the transport
 *
 * @param message - The received JSON-RPC message
 * @returns - A promise that resolves to a response JSON RPC message or void (for notifications)
 */
export type MessageHandler = (
  message: JSONRPCMessage
) => Promise<JSONRPCMessage | null>;

export interface TransportOptions {
  timeout?: number;
  headers?: Record<string, string>;
  enableSessions?: boolean;
  fetch?: typeof fetch;
  logger?: Logger;
}

/**
 * Describes the minimal contract for a MCP transport that a client or server can communicate over.
 */
export interface Transport {
  /**
   * Connects and starts receiving messages.
   */
  connect(): Promise<void>;

  /**
   * Send a JSON RPC Message on the connected transport
   */
  send(message: JSONRPCMessage): Promise<void>;

  /**
   * Handler for received messages
   */
  onMessage(handler: MessageHandler): void;

  /**
   * Closes the connection.
   */
  close(): Promise<void>;

  /**
   * Sets a callback for when the transport is closed
   */
  onClose?: (callback: () => void) => void;

  /**
   * Sets a callback for transport errors
   */
  onError(callback: (error: Error) => void): void;

  /**
   * Get the current session ID if one exists
   */
  getSessionId(): string | undefined;

  /**
   * Set a session ID for subsequent requests
   */
  setSessionId(sessionId: string | undefined): void;

  /**
   * Set custom headers for requests
   */
  setHeaders(headers: Record<string, string>): void;
}
