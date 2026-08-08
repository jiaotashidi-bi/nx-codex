import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test, { type TestContext } from "node:test";

import { BridgeClient } from "../src/bridge-client.js";
import { MockBridge } from "../src/mock-bridge.js";
import { SessionLocator } from "../src/session-locator.js";

const CAE_FIELDS = [
  "adapterId",
  "applicationName",
  "available",
  "compatibilityStatus",
  "licensed",
  "unsupportedReason",
].sort();

async function withCaeBridge(
  context: TestContext,
  options: ConstructorParameters<typeof MockBridge>[0] = {},
): Promise<BridgeClient> {
  const tempDirectory = await mkdtemp(
    path.join(os.tmpdir(), "nx-codex-cae-read-")
  );
  const sessionFile = path.join(tempDirectory, "session.json");
  const bridge = new MockBridge({
    sessionFile,
    application: "UG_APP_GATEWAY",
    ...options,
  });
  await bridge.start();
  context.after(async () => {
    await bridge.stop();
    await rm(tempDirectory, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 50,
    });
  });
  return new BridgeClient(new SessionLocator(sessionFile), 5_000);
}

function assertStrictCaeResult(result: Record<string, unknown>): void {
  assert.deepEqual(Object.keys(result).sort(), CAE_FIELDS);
  assert.equal(typeof result.available, "boolean");
  assert.equal(typeof result.licensed, "boolean");
  assert.equal(typeof result.applicationName, "string");
  assert.equal(typeof result.adapterId, "string");
  assert.equal(typeof result.compatibilityStatus, "string");
  assert.equal(typeof result.unsupportedReason, "string");
}

test("strict Fake returns stable six-field CAE capability without changing part state", async (context) => {
  const client = await withCaeBridge(context, {
    licensedModules: { cae: true },
  });
  const before = await client.call("get_session_state");
  const first = await client.call("get_cae_capability");
  const second = await client.call("get_cae_capability");
  const after = await client.call("get_session_state");

  assertStrictCaeResult(first as Record<string, unknown>);
  assertStrictCaeResult(second as Record<string, unknown>);
  assert.deepEqual(first, {
    available: true,
    licensed: true,
    applicationName: "UG_APP_GATEWAY",
    adapterId: "nx12.0.2.9",
    compatibilityStatus: "verified",
    unsupportedReason: "",
  });
  assert.deepEqual(second, first);
  assert.deepEqual(after, before);
});

test("strict Fake reports inactive CAE license without probing or mutating NX", async (context) => {
  const client = await withCaeBridge(context, {
    licensedModules: { cae: false },
  });
  const before = await client.call("get_session_state");
  const result = await client.call("get_cae_capability");
  const after = await client.call("get_session_state");

  assertStrictCaeResult(result as Record<string, unknown>);
  assert.equal(result.available, true);
  assert.equal(result.licensed, false);
  assert.equal(result.unsupportedReason, "");
  assert.deepEqual(after, before);
});

test("strict Fake fails closed for an unverified NX version", async (context) => {
  const client = await withCaeBridge(context, { nxVersion: "2412" });
  const result = await client.call("get_cae_capability");

  assertStrictCaeResult(result as Record<string, unknown>);
  assert.equal(result.available, false);
  assert.equal(result.licensed, false);
  assert.equal(result.applicationName, "UG_APP_GATEWAY");
  assert.equal(result.adapterId, "unsupported:2412");
  assert.equal(result.compatibilityStatus, "unsupported");
  assert.match(
    String(result.unsupportedReason),
    /no verified cae capability adapter/,
  );
});
