import { appendFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { BridgeOperation } from "./protocol.js";

function auditPath(): string {
  const localAppData =
    process.env.LOCALAPPDATA ??
    path.join(os.homedir(), "AppData", "Local");
  return path.join(localAppData, "NXCodex", "logs", "mcp-audit.ndjson");
}

export async function writeAuditEvent(event: {
  requestId: string;
  operation: BridgeOperation;
  ok: boolean;
  durationMs: number;
  bridgeProcessId?: number;
  errorCode?: string;
}): Promise<void> {
  try {
    const target = auditPath();
    await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
    await appendFile(
      target,
      `${JSON.stringify({
        timestampUtc: new Date().toISOString(),
        ...event,
      })}\n`,
      { encoding: "utf8", mode: 0o600 },
    );
  } catch {
    // Audit failure must not corrupt the stdio MCP protocol.
  }
}

