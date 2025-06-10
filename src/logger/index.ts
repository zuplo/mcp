import type { Logger } from "./types.js";

/**
 * Default logger implementation that outputs to console
 * Can be used as a fallback or for development
 */
export class ConsoleLogger implements Logger {
  debug(message: string, ...args: unknown[]): void {
    console.debug(message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    console.info(message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(message, ...args);
  }
}

/**
 * No-op logger that discards all log messages
 * Useful for production environments where logging is not desired
 */
export class NoOpLogger implements Logger {
  debug(): void {
    // No-op
  }

  info(): void {
    // No-op
  }

  warn(): void {
    // No-op
  }

  error(): void {
    // No-op
  }
}

/**
 * Creates a default logger instance.
 * Uses ConsoleLogger in development, NoOpLogger in production.
 */
export function createDefaultLogger(): Logger {
  const isDevelopment = process.env.NODE_ENV === "development";
  return isDevelopment ? new ConsoleLogger() : new NoOpLogger();
}
