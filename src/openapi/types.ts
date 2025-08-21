/**
 * OpenAPI MCP server metadata support via "x-mcp-server" extension.
 *
 * @example
 * ```json
 * {
 *   "paths": {
 *     "mcp": {
 *       "post: {
 *         "name": "my MCP server name",
 *         "version": "1.2.3",
 *         "tools": [
 *           {
 *             "name": "get_all_users",
 *             "description": "Tool for getting all users in the system"
 *           },
 *           {
 *             "name": "create_new_user",
 *             "description": "Tool for creating a new user",
 *             "inputSchema": { ... }
 *           }
 *         ]
 *       }
 *     }
 *   }
 * }
 * ```
 */
export interface ExtensionMcpServer {
  /**
   * The name of the MCP server itself: this is advertised during MCP initialization
   */
  name: string;

  /**
   * The version of the MCP server itself: this is advertised during MCP initialization
   */
  version: string;

  /**
   * Optional: array of tool metadata in the server
   */
  tools?: ExtensionMcpServerTool[];
}

/**
 * Individual tool metadata for a "x-mcp-server" tool list
 */
export interface ExtensionMcpServerTool {
  /**
   * The name of the MCP tool
   */
  name: string;

  /**
   * The description of the MCP tool
   */
  description: string;

  /**
   * JSON Schema for the tool's input parameters
   */
  inputSchema?: object;
}
