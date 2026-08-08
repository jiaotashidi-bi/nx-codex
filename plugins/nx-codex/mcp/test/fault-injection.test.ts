import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { BridgeClient } from "../src/bridge-client.js";
import {
  BridgeProtocolError,
  BridgeUnavailableError,
} from "../src/errors.js";
import { MockBridge } from "../src/mock-bridge.js";
import {
  DeterministicFaultInjector,
  type DeterministicFault,
} from "../src/fault-injection.js";
import {
  BridgeResponseSchema,
  BridgeSessionSchema,
  createBridgeRequest,
} from "../src/protocol.js";
import { SessionLocator } from "../src/session-locator.js";

async function rawPipeExchange(
  pipeName: string,
  payload: string,
): Promise<ReturnType<typeof BridgeResponseSchema.parse>> {
  return await new Promise((resolve, reject) => {
    let settled = false;
    let buffered = "";
    const socket = net.createConnection(`\\\\.\\pipe\\${pipeName}`);
    const finish = (callback: () => void): void => {
      if (settled) return;
      settled = true;
      socket.destroy();
      callback();
    };
    socket.once("connect", () => socket.write(`${payload}\n`));
    socket.on("data", (chunk: Buffer) => {
      buffered += chunk.toString("utf8");
      const newline = buffered.indexOf("\n");
      if (newline < 0) return;
      try {
        const response = BridgeResponseSchema.parse(
          JSON.parse(buffered.slice(0, newline)),
        );
        finish(() => resolve(response));
      } catch (error) {
        finish(() => reject(error));
      }
    });
    socket.once("error", (error) => finish(() => reject(error)));
    socket.once("end", () => {
      if (!settled) {
        finish(() => reject(new Error("Pipe ended without a response.")));
      }
    });
  });
}

async function cleanupBridge(bridge: MockBridge): Promise<void> {
  await bridge.stop().catch(() => undefined);
}

test("strict fault plan blocks on a deterministic modal dialog", async (context) => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "nx-codex-fault-dialog-"));
  const sessionFile = path.join(tempDirectory, "session.json");
  const bridge = new MockBridge({
    sessionFile,
    faults: [
      {
        id: "dialog-before-state-read",
        kind: "modal_dialog",
        phase: "before_execution",
        operation: "get_session_state",
        delayMs: 1_100,
      },
    ],
  });
  await bridge.start();
  context.after(async () => {
    await cleanupBridge(bridge);
    await rm(tempDirectory, { recursive: true, force: true });
  });

  const client = new BridgeClient(new SessionLocator(sessionFile), 1_000);
  await assert.rejects(
    () => client.call("get_session_state"),
    (error: unknown) =>
      error instanceof BridgeUnavailableError &&
      error.message.includes("did not respond within 1000 ms"),
  );
  assert.deepEqual(
    bridge.faultEvents.map(({ id, kind, phase, operation }) => ({
      id,
      kind,
      phase,
      operation,
    })),
    [
      {
        id: "dialog-before-state-read",
        kind: "modal_dialog",
        phase: "before_execution",
        operation: "get_session_state",
      },
    ],
  );
  assert.deepEqual(bridge.remainingFaultRuleIds, []);
});

test("strict fault plan reports a pipe disconnect and then serves the next request", async (context) => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "nx-codex-fault-disconnect-"));
  const sessionFile = path.join(tempDirectory, "session.json");
  const bridge = new MockBridge({
    sessionFile,
    faults: [
      {
        id: "disconnect-before-health",
        kind: "disconnect",
        phase: "before_execution",
        operation: "health",
      },
    ],
  });
  await bridge.start();
  context.after(async () => {
    await cleanupBridge(bridge);
    await rm(tempDirectory, { recursive: true, force: true });
  });

  const client = new BridgeClient(new SessionLocator(sessionFile), 1_000);
  await assert.rejects(
    () => client.call("health"),
    (error: unknown) =>
      error instanceof BridgeUnavailableError ||
      error instanceof BridgeProtocolError,
  );
  const health = await client.call("health");
  assert.equal(health.connected, true);
  assert.equal(bridge.faultEvents[0]?.kind, "disconnect");
});

test("after-execution timeout leaves an unknown state and does not retry the mutation", async (context) => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "nx-codex-fault-unknown-"));
  const sessionFile = path.join(tempDirectory, "session.json");
  const bridge = new MockBridge({
    sessionFile,
    faults: [
      {
        id: "timeout-after-block-commit",
        kind: "timeout",
        phase: "after_execution",
        operation: "create_block",
        delayMs: 1_100,
      },
    ],
  });
  await bridge.start();
  context.after(async () => {
    await cleanupBridge(bridge);
    await rm(tempDirectory, { recursive: true, force: true });
  });

  const client = new BridgeClient(new SessionLocator(sessionFile), 1_000);
  await assert.rejects(
    () =>
      client.call("create_block", {
        length: 20,
        width: 10,
        height: 5,
      }),
    (error: unknown) =>
      error instanceof BridgeUnavailableError ||
      error instanceof BridgeProtocolError,
  );

  // The timeout is not evidence that NX did nothing. Inspect state before any
  // retry; the strict fake proves the block was committed exactly once.
  const state = await client.call("get_session_state");
  assert.equal(state.featureCount, 1);
  assert.equal(state.bodyCount, 1);
  assert.equal(bridge.faultEvents[0]?.phase, "after_execution");
  assert.deepEqual(bridge.remainingFaultRuleIds, []);
});

test("after-execution crash closes the bridge after the mutation committed", async (context) => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "nx-codex-fault-crash-"));
  const sessionFile = path.join(tempDirectory, "session.json");
  const bridge = new MockBridge({
    sessionFile,
    faults: [
      {
        id: "crash-after-block-commit",
        kind: "crash",
        phase: "after_execution",
        operation: "create_block",
      },
    ],
  });
  await bridge.start();
  context.after(async () => {
    await cleanupBridge(bridge);
    await rm(tempDirectory, { recursive: true, force: true });
  });

  const client = new BridgeClient(new SessionLocator(sessionFile), 1_000);
  await assert.rejects(
    () =>
      client.call("create_block", {
        length: 20,
        width: 10,
        height: 5,
      }),
    (error: unknown) =>
      error instanceof BridgeUnavailableError ||
      error instanceof BridgeProtocolError,
  );
  await new Promise<void>((resolve) => setTimeout(resolve, 25));
  await assert.rejects(
    () => client.call("health"),
    (error: unknown) => error instanceof BridgeUnavailableError,
  );
  assert.equal(bridge.faultEvents[0]?.kind, "crash");
});

test("client re-discovers a replacement Named Pipe after bridge restart", async (context) => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "nx-codex-pipe-reconnect-"));
  const sessionFile = path.join(tempDirectory, "session.json");
  const first = new MockBridge({ sessionFile });
  const second = new MockBridge({ sessionFile });
  await first.start();
  context.after(async () => {
    await cleanupBridge(first);
    await cleanupBridge(second);
    await rm(tempDirectory, { recursive: true, force: true });
  });

  const client = new BridgeClient(new SessionLocator(sessionFile), 1_000);
  assert.equal((await client.call("health")).connected, true);
  const firstSession = BridgeSessionSchema.parse(
    JSON.parse(await readFile(sessionFile, "utf8")),
  );
  await first.stop();

  await second.start();
  const secondSession = BridgeSessionSchema.parse(
    JSON.parse(await readFile(sessionFile, "utf8")),
  );
  assert.notEqual(firstSession.pipeName, secondSession.pipeName);
  assert.equal((await client.call("health")).connected, true);
});

test("duplicate request IDs are replay-protected and do not duplicate a mutation", async (context) => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "nx-codex-idempotency-"));
  const sessionFile = path.join(tempDirectory, "session.json");
  const bridge = new MockBridge({ sessionFile });
  await bridge.start();
  context.after(async () => {
    await cleanupBridge(bridge);
    await rm(tempDirectory, { recursive: true, force: true });
  });

  const session = BridgeSessionSchema.parse(
    JSON.parse(await readFile(sessionFile, "utf8")),
  );
  const request = createBridgeRequest(
    session,
    "create_block",
    { length: 20, width: 10, height: 5 },
    5_000,
  );
  const payload = JSON.stringify(request);
  const first = await rawPipeExchange(session.pipeName, payload);
  const replay = await rawPipeExchange(session.pipeName, payload);
  assert.equal(first.ok, true);
  assert.equal(replay.ok, false);
  assert.equal(replay.error?.code, "REPLAY_DETECTED");

  const client = new BridgeClient(new SessionLocator(sessionFile), 1_000);
  const state = await client.call("get_session_state");
  assert.equal(state.featureCount, 1);
  assert.equal(state.bodyCount, 1);
});

test("unknown bridge APIs fail at the strict protocol boundary", async (context) => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "nx-codex-unknown-api-"));
  const sessionFile = path.join(tempDirectory, "session.json");
  const bridge = new MockBridge({ sessionFile });
  await bridge.start();
  context.after(async () => {
    await cleanupBridge(bridge);
    await rm(tempDirectory, { recursive: true, force: true });
  });

  const session = BridgeSessionSchema.parse(
    JSON.parse(await readFile(sessionFile, "utf8")),
  );
  const valid = createBridgeRequest(session, "health", {}, 5_000);
  const response = await rawPipeExchange(
    session.pipeName,
    JSON.stringify({ ...valid, operation: "nx_nonexistent_api" }),
  );
  assert.equal(response.ok, false);
  assert.equal(response.error?.code, "INVALID_REQUEST");
  assert.equal(response.result, null);
  assert.equal(bridge.faultEvents.length, 0);
});

test("fault rules are strict about order and fail fast on duplicate rule IDs", () => {
  const injector = new DeterministicFaultInjector([
    {
      id: "only-block",
      kind: "timeout",
      phase: "before_execution",
      operation: "create_block",
    },
  ]);
  assert.equal(
    injector.take("before_execution", "health", "00000000-0000-0000-0000-000000000001"),
    undefined,
  );
  assert.deepEqual(injector.remainingRuleIds, ["only-block"]);
  assert.equal(
    injector.take(
      "before_execution",
      "create_block",
      "00000000-0000-0000-0000-000000000002",
    )?.id,
    "only-block",
  );
  assert.deepEqual(injector.remainingRuleIds, []);

  assert.throws(
    () =>
      new MockBridge({
        faults: [
          {
            id: "same",
            kind: "timeout",
            phase: "before_execution",
          },
          {
            id: "same",
            kind: "disconnect",
            phase: "before_execution",
          },
        ],
      }),
    /non-empty and unique/,
  );
  assert.throws(
    () =>
      new MockBridge({
        faults: [
          {
            id: "bad-delay",
            kind: "timeout",
            phase: "before_execution",
            delayMs: -1,
          },
        ],
      }),
    /non-negative integer/,
  );
  assert.throws(
    () =>
      new MockBridge({
        faults: [
          {
            id: "bad-kind",
            kind: "invented",
            phase: "before_execution",
          } as unknown as DeterministicFault,
        ],
      }),
    /kind is not supported/,
  );
});
