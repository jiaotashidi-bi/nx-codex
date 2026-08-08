import { runServer } from "./server.js";

runServer().catch((error: unknown) => {
  console.error(
    `NX Codex MCP failed: ${
      error instanceof Error ? error.message : "unknown error"
    }`,
  );
  process.exit(1);
});

