import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const target = process.argv[2];
if (!target) {
  throw new Error("Usage: node verify-clean-cache.mjs <absolute-mcp-entry>");
}

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [target],
});
const client = new Client({
  name: "nx-codex-clean-cache-task",
  version: "1.0.0-rc.1",
});

await client.connect(transport);
const listed = await client.listTools();
const names = listed.tools.map((tool) => tool.name);
for (const required of [
  "nx_health",
  "nx_get_capabilities",
  "nx_get_session_state",
]) {
  if (!names.includes(required)) {
    throw new Error(`Missing required tool from clean cache: ${required}`);
  }
}

const health = await client.callTool({
  name: "nx_health",
  arguments: {},
});
const capabilities = await client.callTool({
  name: "nx_get_capabilities",
  arguments: {},
});

console.log(
  JSON.stringify(
    {
      task: "nx-codex-clean-cache-task",
      cacheTarget: target,
      toolCount: names.length,
      hasHealth: names.includes("nx_health"),
      hasCapabilities: names.includes("nx_get_capabilities"),
      health: health.structuredContent ?? {},
      capabilities: capabilities.structuredContent ?? {},
    },
    null,
    2,
  ),
);

await transport.close();
