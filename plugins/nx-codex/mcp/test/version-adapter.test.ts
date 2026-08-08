import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { BridgeClient } from "../src/bridge-client.js";
import { BridgeOperationError } from "../src/errors.js";
import { MockBridge } from "../src/mock-bridge.js";
import { SessionLocator } from "../src/session-locator.js";
import { selectVersionProfile } from "../src/version-adapter.js";

test("version profile selects only the exact verified NX 12.0.2.9 baseline", () => {
  const baseline = selectVersionProfile("12.0.2.9");
  assert.equal(baseline.adapterId, "nx12.0.2.9");
  assert.equal(baseline.adapterContractId, "nx12.0.2.9-required-api-v1");
  assert.equal(baseline.compatibilityStatus, "verified");
  assert.ok(baseline.capabilities.includes("fillet_vertical_edges"));
  assert.ok(baseline.capabilities.includes("preflight_modeling"));
  assert.ok(baseline.capabilities.includes("get_feature_tree"));
  assert.ok(baseline.capabilities.includes("capture_screenshot"));
  assert.ok(baseline.capabilities.includes("get_assembly_capability"));
  assert.ok(baseline.capabilities.includes("get_assembly_structure"));
  assert.ok(baseline.capabilities.includes("get_drafting_capability"));
  assert.ok(baseline.capabilities.includes("get_drafting_structure"));
  assert.ok(baseline.capabilities.includes("create_test_drawing"));
  assert.ok(baseline.capabilities.includes("get_cae_capability"));
  assert.ok(baseline.capabilities.includes("get_cam_capability"));

  for (const candidate of ["12.0.2.10", "2306", "2312", "2412", "2512"]) {
    const profile = selectVersionProfile(candidate);
    assert.equal(profile.adapterId, `unsupported:${candidate}`);
    assert.equal(profile.adapterContractId, "none");
    assert.equal(profile.compatibilityStatus, "unsupported");
    assert.deepEqual(profile.capabilities, [
      "health",
      "get_capabilities",
      "get_session_state",
      "get_assembly_capability",
      "get_drafting_capability",
      "get_cae_capability",
      "get_cam_capability",
    ]);
    assert.equal(profile.capabilities.includes("get_assembly_structure"), false);
    assert.equal(profile.capabilities.includes("get_drafting_structure"), false);
    assert.equal(profile.capabilities.includes("create_test_drawing"), false);
  }
});

test("release matrix records real evidence and keeps 2306/2312/2412/2512 unverified", async () => {
  const matrix = JSON.parse(
    await readFile(
      new URL("../../bridge/api-index/version-matrix.json", import.meta.url),
      "utf8",
    ),
  ) as {
    entries: Array<{
      id: string;
      adapterExpectation: "verified" | "unsupported";
      verificationStatus: "verified" | "unverified";
      contractPath?: string;
      evidence: Record<string, boolean>;
    }>;
  };

  const byId = new Map(matrix.entries.map((entry) => [entry.id, entry]));
  const baseline = byId.get("nx12.0.2.9");
  assert.ok(baseline);
  assert.equal(baseline.adapterExpectation, "verified");
  assert.equal(baseline.verificationStatus, "verified");
  assert.equal(baseline.contractPath, "contracts/nx12.0.2.9-required-api.json");
  assert.equal(Object.values(baseline.evidence).every(Boolean), true);

  for (const release of ["nx2306", "nx2312", "nx2412", "nx2512"]) {
    const entry = byId.get(release);
    assert.ok(entry);
    assert.equal(entry.adapterExpectation, "unsupported");
    assert.equal(entry.verificationStatus, "unverified");
    assert.equal(entry.contractPath, undefined);
    assert.equal(entry.evidence.requiredApiContract, false);
    assert.equal(entry.evidence.typedRuntimeAdapter, false);
    assert.equal(entry.evidence.liveReadOnlyHandshake, false);
    assert.equal(entry.evidence.versionSpecificSmoke, false);
  }
});

test("strict fake exposes read-only handshake and rejects mutation on an unverified version", async (context) => {
  const tempDirectory = await mkdtemp(
    path.join(os.tmpdir(), "nx-codex-unverified-version-"),
  );
  const sessionFile = path.join(tempDirectory, "session.json");
  const bridge = new MockBridge({ sessionFile, nxVersion: "2412" });
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

  const client = new BridgeClient(new SessionLocator(sessionFile), 5_000);
  const health = await client.call("health");
  assert.equal(health.status, "compatibility-blocked");
  assert.equal(health.adapterId, "unsupported:2412");
  assert.equal(health.compatibilityStatus, "unsupported");
  const capabilities = await client.call("get_capabilities");
  assert.deepEqual(capabilities.capabilities, [
    "health",
    "get_capabilities",
    "get_session_state",
    "get_assembly_capability",
    "get_drafting_capability",
    "get_cae_capability",
    "get_cam_capability",
  ]);

  for (const moduleName of ["assembly", "drafting", "cae", "cam"] as const) {
    const detection = await client.call(`get_${moduleName}_capability`);
    assert.equal(detection.available, false);
    assert.equal(detection.licensed, false);
    assert.match(
      detection.unsupportedReason ?? "",
      new RegExp(`no verified ${moduleName} capability adapter`),
    );
  }

  await assert.rejects(
    () =>
      client.call("create_block", {
        length: 10,
        width: 10,
        height: 10,
      }),
    (error: unknown) =>
      error instanceof BridgeOperationError &&
      error.code === "NX_VERSION_NOT_SUPPORTED",
  );
});
