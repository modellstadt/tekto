/** A JSON-RPC reply from the MCP server. */
export interface McpReply { id: number; result?: any; error?: { code: number; message: string } }
/** Run tools/mcp.mjs against a stand-in relay; see mcp-session.mjs. */
export function mcpSession(
  messages: object[],
  respond: (op: string, args: any) => { result?: unknown; status?: number; error?: string },
): Promise<{ replies: McpReply[]; calls: { op: string; args: any }[] }>;
