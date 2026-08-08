import { MockBridge } from "./mock-bridge.js";

const explicitSessionFile = process.env.NX_CODEX_SESSION_FILE;
const bridge = new MockBridge(
  explicitSessionFile === undefined
    ? {}
    : { sessionFile: explicitSessionFile },
);

async function stop(): Promise<void> {
  await bridge.stop();
  process.exit(0);
}

process.once("SIGINT", () => void stop());
process.once("SIGTERM", () => void stop());

bridge
  .start()
  .then(() => {
    console.error(`Mock NX bridge session: ${bridge.descriptorPath}`);
  })
  .catch((error: unknown) => {
    console.error(
      `Mock NX bridge failed: ${
        error instanceof Error ? error.message : "unknown error"
      }`,
    );
    process.exit(1);
  });
