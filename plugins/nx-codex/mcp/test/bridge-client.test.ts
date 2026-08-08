import assert from "node:assert/strict";
import {
  mkdtemp,
  readFile,
  realpath,
  rm,
} from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { BridgeClient } from "../src/bridge-client.js";
import { BridgeOperationError } from "../src/errors.js";
import { MockBridge } from "../src/mock-bridge.js";
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
    let buffered = "";
    const socket = net.createConnection(`\\\\.\\pipe\\${pipeName}`);
    socket.once("connect", () => socket.write(`${payload}\n`));
    socket.on("data", (chunk: Buffer) => {
      buffered += chunk.toString("utf8");
      const newline = buffered.indexOf("\n");
      if (newline >= 0) {
        socket.destroy();
        resolve(
          BridgeResponseSchema.parse(
            JSON.parse(buffered.slice(0, newline)),
          ),
        );
      }
    });
    socket.once("error", reject);
  });
}

test("bridge client creates and undoes a transactional block", async (context) => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "nx-codex-test-"));
  const sessionFile = path.join(tempDirectory, "session.json");
  const bridge = new MockBridge({ sessionFile });
  await bridge.start();
  context.after(async () => bridge.stop());

  const client = new BridgeClient(new SessionLocator(sessionFile), 5_000);
  const health = await client.call("health");
  assert.equal(health.connected, true);
  assert.equal(health.nxOpenAssemblyVersion, "12.0.2.9");
  assert.equal(health.adapterId, "nx12.0.2.9");
  assert.equal(health.adapterContractId, "nx12.0.2.9-required-api-v1");
  assert.equal(health.compatibilityStatus, "verified");

  const created = await client.call("create_block", {
    length: 100,
    width: 60,
    height: 20,
    originX: 0,
    originY: 0,
    originZ: 0,
    name: "BASE_BLOCK",
  });
  assert.match(created.transactionId ?? "", /^TX-/);
  assert.equal(created.featureName, "BASE_BLOCK");

  const state = await client.call("get_session_state");
  assert.equal(state.featureCount, 1);
  assert.equal(state.bodyCount, 1);

  await client.call("undo_transaction", {
    transactionId: created.transactionId,
  });
  const undoneState = await client.call("get_session_state");
  assert.equal(undoneState.featureCount, 0);
});

test("strict fake creates, extrudes, measures, and rolls back a rectangle sketch", async (context) => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "nx-codex-model-"));
  const sessionFile = path.join(tempDirectory, "session.json");
  const bridge = new MockBridge({ sessionFile });
  await bridge.start();
  context.after(async () => {
    await bridge.stop();
    await rm(tempDirectory, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  });

  const client = new BridgeClient(new SessionLocator(sessionFile), 5_000);
  const sketch = await client.call("create_rectangle_sketch", {
    profileWidth: 70,
    profileHeight: 40,
    centerX: 0,
    centerY: 0,
    planeZ: 0,
    name: "BASE_PROFILE",
  });
  assert.equal(sketch.curveCount, 4);
  assert.equal(sketch.bodyCount, 0);

  await assert.rejects(
    () => client.call("measure_work_part"),
    (error: unknown) =>
      error instanceof BridgeOperationError &&
      error.code === "NO_SOLID_BODY",
  );

  const extrude = await client.call("extrude_sketch", {
    sketchFeatureJournalIdentifier: sketch.featureJournalIdentifier,
    distance: 15,
    name: "BASE_EXTRUDE",
  });
  assert.equal(extrude.bodyCount, 1);

  const measured = await client.call("measure_work_part");
  assert.equal(measured.measurementUnits, "Millimeters");
  assert.equal(measured.boundingBoxMinX, -35);
  assert.equal(measured.boundingBoxMaxX, 35);
  assert.equal(measured.boundingBoxSizeY, 40);
  assert.equal(measured.boundingBoxSizeZ, 15);
  assert.equal(measured.surfaceArea, 8_900);
  assert.equal(measured.volume, 42_000);
  assert.equal(measured.centroidZ, 7.5);

  await assert.rejects(
    () =>
      client.call("extrude_sketch", {
        sketchFeatureJournalIdentifier: "SKETCH(does-not-exist)",
        distance: 5,
      }),
    (error: unknown) =>
      error instanceof BridgeOperationError &&
      error.code === "SKETCH_NOT_FOUND",
  );

  await client.call("undo_transaction", {
    transactionId: extrude.transactionId,
  });
  const afterExtrudeUndo = await client.call("get_session_state");
  assert.equal(afterExtrudeUndo.featureCount, 1);
  assert.equal(afterExtrudeUndo.bodyCount, 0);

  await client.call("undo_transaction", {
    transactionId: sketch.transactionId,
  });
  const afterSketchUndo = await client.call("get_session_state");
  assert.equal(afterSketchUndo.featureCount, 0);
});

test("strict fake fully revolves an offset rectangle and rolls it back", async (context) => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "nx-codex-revolve-"));
  const sessionFile = path.join(tempDirectory, "session.json");
  const bridge = new MockBridge({ sessionFile });
  await bridge.start();
  context.after(async () => {
    await bridge.stop();
    await rm(tempDirectory, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  });

  const client = new BridgeClient(new SessionLocator(sessionFile), 5_000);
  const sketch = await client.call("create_rectangle_sketch", {
    profileWidth: 10,
    profileHeight: 20,
    centerX: 15,
    centerY: 0,
    planeZ: 0,
    name: "REVOLVE_PROFILE",
  });
  const revolved = await client.call("revolve_sketch", {
    sketchFeatureJournalIdentifier: sketch.featureJournalIdentifier,
    axisDirection: "WCS_Y",
    axisOriginX: 0,
    axisOriginY: 0,
    axisOriginZ: 0,
    name: "FULL_REVOLVE",
  });
  assert.match(revolved.transactionId ?? "", /^TX-/);
  assert.equal(revolved.featureName, "FULL_REVOLVE");
  assert.equal(revolved.featureCount, 2);
  assert.equal(revolved.bodyCount, 1);

  const measured = await client.call("measure_work_part");
  assert.equal(measured.boundingBoxMinX, -20);
  assert.equal(measured.boundingBoxMaxX, 20);
  assert.equal(measured.boundingBoxMinY, -10);
  assert.equal(measured.boundingBoxMaxY, 10);
  assert.equal(measured.boundingBoxMinZ, -20);
  assert.equal(measured.boundingBoxMaxZ, 20);
  assert.ok(Math.abs((measured.volume ?? 0) - 6_000 * Math.PI) < 1e-9);
  assert.ok(
    Math.abs((measured.surfaceArea ?? 0) - 1_800 * Math.PI) < 1e-9,
  );
  assert.equal(measured.centroidX, 0);
  assert.equal(measured.centroidY, 0);
  assert.equal(measured.centroidZ, 0);

  await assert.rejects(
    () =>
      client.call("revolve_sketch", {
        sketchFeatureJournalIdentifier: sketch.featureJournalIdentifier,
        axisDirection: "WCS_Y",
        axisOriginX: 15,
        axisOriginY: 0,
        axisOriginZ: 0,
      }),
    (error: unknown) =>
      error instanceof BridgeOperationError &&
      error.code === "PROFILE_CROSSES_AXIS",
  );
  await assert.rejects(
    () =>
      client.call("revolve_sketch", {
        sketchFeatureJournalIdentifier: sketch.featureJournalIdentifier,
        axisDirection: "WCS_Y",
        axisOriginX: 0,
        axisOriginY: 0,
        axisOriginZ: 1,
      }),
    (error: unknown) =>
      error instanceof BridgeOperationError &&
      error.code === "AXIS_NOT_IN_SKETCH_PLANE",
  );

  await client.call("undo_transaction", {
    transactionId: revolved.transactionId,
  });
  const afterRevolveUndo = await client.call("get_session_state");
  assert.equal(afterRevolveUndo.featureCount, 1);
  assert.equal(afterRevolveUndo.bodyCount, 0);

  await client.call("undo_transaction", {
    transactionId: sketch.transactionId,
  });
  const afterSketchUndo = await client.call("get_session_state");
  assert.equal(afterSketchUndo.featureCount, 0);
});

test("strict fake creates, measures, rejects, and rolls back a simple through hole", async (context) => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "nx-codex-hole-"));
  const sessionFile = path.join(tempDirectory, "session.json");
  const bridge = new MockBridge({ sessionFile });
  await bridge.start();
  context.after(async () => {
    await bridge.stop();
    await rm(tempDirectory, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  });

  const client = new BridgeClient(new SessionLocator(sessionFile), 5_000);
  const block = await client.call("create_block", {
    length: 60,
    width: 40,
    height: 20,
    originX: -30,
    originY: -20,
    originZ: 0,
    name: "HOLE_TEST_BLOCK",
  });
  const baseline = await client.call("measure_work_part");
  assert.equal(baseline.volume, 48_000);
  assert.equal(baseline.surfaceArea, 8_800);

  await assert.rejects(
    () =>
      client.call("create_simple_through_hole", {
        holeCenterX: 29,
        holeCenterY: 0,
        holeDiameter: 10,
      }),
    (error: unknown) =>
      error instanceof BridgeOperationError &&
      error.code === "HOLE_CLEARANCE_OUTSIDE_FACE",
  );
  const afterRejected = await client.call("get_session_state");
  assert.equal(afterRejected.featureCount, 1);
  assert.equal(afterRejected.bodyCount, 1);

  const hole = await client.call("create_simple_through_hole", {
    holeCenterX: 10,
    holeCenterY: 5,
    holeDiameter: 10,
    name: "THROUGH_HOLE",
  });
  assert.match(hole.transactionId ?? "", /^TX-/);
  assert.equal(hole.featureName, "THROUGH_HOLE");
  assert.equal(hole.featureCount, 2);
  assert.equal(hole.bodyCount, 1);

  const measured = await client.call("measure_work_part");
  const removedVolume = 500 * Math.PI;
  const remainingVolume = 48_000 - removedVolume;
  assert.equal(measured.boundingBoxSizeX, 60);
  assert.equal(measured.boundingBoxSizeY, 40);
  assert.equal(measured.boundingBoxSizeZ, 20);
  assert.ok(Math.abs((measured.volume ?? 0) - remainingVolume) < 1e-9);
  assert.ok(
    Math.abs((measured.surfaceArea ?? 0) - (8_800 + 150 * Math.PI)) <
      1e-9,
  );
  assert.ok(
    Math.abs(
      (measured.centroidX ?? 0) - (-10 * removedVolume) / remainingVolume,
    ) < 1e-9,
  );
  assert.ok(
    Math.abs(
      (measured.centroidY ?? 0) - (-5 * removedVolume) / remainingVolume,
    ) < 1e-9,
  );
  assert.equal(measured.centroidZ, 10);

  await assert.rejects(
    () =>
      client.call("create_simple_through_hole", {
        holeCenterX: 12,
        holeCenterY: 5,
        holeDiameter: 4,
      }),
    (error: unknown) =>
      error instanceof BridgeOperationError &&
      error.code === "HOLE_INTERSECTS_EXISTING_HOLE",
  );

  await client.call("undo_transaction", {
    transactionId: hole.transactionId,
  });
  const restored = await client.call("measure_work_part");
  assert.equal(restored.volume, baseline.volume);
  assert.equal(restored.surfaceArea, baseline.surfaceArea);
  assert.equal(restored.centroidX, baseline.centroidX);
  assert.equal(restored.centroidY, baseline.centroidY);
  assert.equal(restored.centroidZ, baseline.centroidZ);

  await client.call("undo_transaction", {
    transactionId: block.transactionId,
  });
  const finalState = await client.call("get_session_state");
  assert.equal(finalState.featureCount, 0);
  assert.equal(finalState.bodyCount, 0);
});

test("strict fake performs all typed Boolean modes and restores both bodies", async (context) => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "nx-codex-boolean-"));
  const sessionFile = path.join(tempDirectory, "session.json");
  const bridge = new MockBridge({ sessionFile });
  await bridge.start();
  context.after(async () => {
    await bridge.stop();
    await rm(tempDirectory, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  });

  const client = new BridgeClient(new SessionLocator(sessionFile), 5_000);
  const target = await client.call("create_block", {
    length: 60,
    width: 40,
    height: 20,
    originX: -30,
    originY: -20,
    originZ: 0,
    name: "BOOLEAN_TARGET",
  });
  const tool = await client.call("create_block", {
    length: 20,
    width: 20,
    height: 30,
    originX: 0,
    originY: -10,
    originZ: -5,
    name: "BOOLEAN_TOOL",
  });
  const baseline = await client.call("measure_work_part");
  assert.equal(baseline.measuredBodyCount, 2);
  assert.equal(baseline.volume, 60_000);
  assert.equal(baseline.surfaceArea, 12_000);

  await assert.rejects(
    () =>
      client.call("boolean_bodies", {
        booleanOperation: "SUBTRACT",
        targetFeatureJournalIdentifier: target.featureJournalIdentifier,
        toolFeatureJournalIdentifier: target.featureJournalIdentifier,
      }),
    (error: unknown) =>
      error instanceof BridgeOperationError &&
      error.code === "BOOLEAN_REQUIRES_DISTINCT_FEATURES",
  );

  const scenarios = [
    {
      operation: "SUBTRACT" as const,
      volume: 40_000,
      surfaceArea: 9_600,
      centroidX: -2,
      minZ: 0,
      maxZ: 20,
    },
    {
      operation: "UNITE" as const,
      volume: 52_000,
      surfaceArea: 9_600,
      centroidX: 40_000 / 52_000,
      minZ: -5,
      maxZ: 25,
    },
    {
      operation: "INTERSECT" as const,
      volume: 8_000,
      surfaceArea: 2_400,
      centroidX: 10,
      minZ: 0,
      maxZ: 20,
    },
  ];
  for (const scenario of scenarios) {
    const result = await client.call("boolean_bodies", {
      booleanOperation: scenario.operation,
      targetFeatureJournalIdentifier: target.featureJournalIdentifier,
      toolFeatureJournalIdentifier: tool.featureJournalIdentifier,
      name: `BOOLEAN_${scenario.operation}`,
    });
    assert.match(result.transactionId ?? "", /^TX-/);
    assert.equal(result.featureName, `BOOLEAN_${scenario.operation}`);
    assert.equal(result.featureCount, 3);
    assert.equal(result.bodyCount, 1);

    const measured = await client.call("measure_work_part");
    assert.equal(measured.measuredBodyCount, 1);
    assert.equal(measured.volume, scenario.volume);
    assert.equal(measured.surfaceArea, scenario.surfaceArea);
    assert.ok(
      Math.abs((measured.centroidX ?? 0) - scenario.centroidX) < 1e-9,
    );
    assert.equal(measured.centroidY, 0);
    assert.equal(measured.centroidZ, 10);
    assert.equal(measured.boundingBoxMinZ, scenario.minZ);
    assert.equal(measured.boundingBoxMaxZ, scenario.maxZ);

    await client.call("undo_transaction", {
      transactionId: result.transactionId,
    });
    const restored = await client.call("measure_work_part");
    assert.equal(restored.measuredBodyCount, 2);
    assert.equal(restored.volume, baseline.volume);
    assert.equal(restored.surfaceArea, baseline.surfaceArea);
  }

  await client.call("undo_transaction", {
    transactionId: tool.transactionId,
  });
  await client.call("undo_transaction", {
    transactionId: target.transactionId,
  });
  const finalState = await client.call("get_session_state");
  assert.equal(finalState.featureCount, 0);
  assert.equal(finalState.bodyCount, 0);
});

test("strict fake fillets four vertical block edges and restores exact mass properties", async (context) => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "nx-codex-fillet-"));
  const sessionFile = path.join(tempDirectory, "session.json");
  const bridge = new MockBridge({ sessionFile });
  await bridge.start();
  context.after(async () => {
    await bridge.stop();
    await rm(tempDirectory, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  });

  const client = new BridgeClient(new SessionLocator(sessionFile), 5_000);
  const block = await client.call("create_block", {
    length: 60,
    width: 40,
    height: 20,
    originX: -30,
    originY: -20,
    originZ: 0,
    name: "FILLET_TARGET",
  });
  const baseline = await client.call("measure_work_part");

  await assert.rejects(
    () =>
      client.call("fillet_vertical_edges", {
        bodyFeatureJournalIdentifier: block.featureJournalIdentifier,
        filletRadius: 20,
      }),
    (error: unknown) =>
      error instanceof BridgeOperationError &&
      error.code === "FILLET_RADIUS_TOO_LARGE",
  );

  const fillet = await client.call("fillet_vertical_edges", {
    bodyFeatureJournalIdentifier: block.featureJournalIdentifier,
    filletRadius: 5,
    name: "FOUR_VERTICAL_FILLETS",
  });
  assert.match(fillet.transactionId ?? "", /^TX-/);
  assert.equal(fillet.featureName, "FOUR_VERTICAL_FILLETS");
  assert.equal(fillet.featureCount, 2);
  assert.equal(fillet.bodyCount, 1);

  const measured = await client.call("measure_work_part");
  assert.ok(
    Math.abs((measured.volume ?? 0) - (48_000 - 500 * (4 - Math.PI))) <
      1e-9,
  );
  assert.ok(
    Math.abs((measured.surfaceArea ?? 0) - (8_800 - 250 * (4 - Math.PI))) <
      1e-9,
  );
  assert.equal(measured.boundingBoxMinX, -30);
  assert.equal(measured.boundingBoxMaxX, 30);
  assert.equal(measured.boundingBoxMinY, -20);
  assert.equal(measured.boundingBoxMaxY, 20);
  assert.equal(measured.boundingBoxMinZ, 0);
  assert.equal(measured.boundingBoxMaxZ, 20);
  assert.equal(measured.centroidX, 0);
  assert.equal(measured.centroidY, 0);
  assert.equal(measured.centroidZ, 10);

  await client.call("undo_transaction", {
    transactionId: fillet.transactionId,
  });
  const restored = await client.call("measure_work_part");
  assert.equal(restored.volume, baseline.volume);
  assert.equal(restored.surfaceArea, baseline.surfaceArea);
  assert.equal(restored.bodyCount, baseline.bodyCount);
});

test("bridge client uses the same-user discovery pipe for a DLP-encrypted descriptor", async (context) => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "nx-codex-dlp-"));
  const sessionFile = path.join(tempDirectory, `${process.pid}.json`);
  const bridge = new MockBridge({
    sessionFile,
    corruptSessionFile: true,
  });
  await bridge.start();
  context.after(async () => bridge.stop());

  const client = new BridgeClient(new SessionLocator(sessionFile), 5_000);
  const health = await client.call("health");
  assert.equal(health.connected, true);
  assert.equal(health.dispatcher, "mock-main-thread");
});

test("strict fake enforces safe new, save-as, close, open, and no-overwrite semantics", async (context) => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "nx-codex-files-"));
  const sessionFile = path.join(tempDirectory, "session.json");
  const bridge = new MockBridge({
    sessionFile,
    allowedRoots: [tempDirectory],
  });
  await bridge.start();
  context.after(async () => {
    await bridge.stop();
    await rm(tempDirectory, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  });

  const client = new BridgeClient(new SessionLocator(sessionFile), 5_000);
  const unsavedPath = path.join(tempDirectory, "new-unsaved.prt");
  const savedPath = path.join(tempDirectory, "saved.prt");

  const createdPart = await client.call("new_part", {
    filePath: unsavedPath,
    partUnits: "Millimeters",
  });
  assert.equal(createdPart.opened, true);
  assert.equal(createdPart.saved, false);

  await assert.rejects(
    () => client.call("close_part"),
    (error: unknown) =>
      error instanceof BridgeOperationError &&
      error.code === "UNSAVED_CHANGES",
  );

  const block = await client.call("create_block", {
    length: 20,
    width: 10,
    height: 5,
  });
  assert.match(block.transactionId ?? "", /^TX-/);

  const saved = await client.call("save_as", { filePath: savedPath });
  assert.equal(saved.saved, true);
  assert.equal(
    saved.filePath,
    path.join(await realpath(tempDirectory), "saved.prt"),
  );
  assert.equal(saved.featureCount, 1);

  await assert.rejects(
    () => client.call("save_as", { filePath: savedPath }),
    (error: unknown) =>
      error instanceof BridgeOperationError &&
      error.code === "TARGET_EXISTS",
  );

  const closed = await client.call("close_part");
  assert.equal(closed.closed, true);
  const opened = await client.call("open_part", { filePath: savedPath });
  assert.equal(opened.opened, true);
});

test("bridge rejects a duplicated request ID as a replay", async (context) => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "nx-codex-replay-"));
  const sessionFile = path.join(tempDirectory, "session.json");
  const bridge = new MockBridge({ sessionFile });
  await bridge.start();
  context.after(async () => {
    await bridge.stop();
    await rm(tempDirectory, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  });

  const session = BridgeSessionSchema.parse(
    JSON.parse(await readFile(sessionFile, "utf8")),
  );
  const request = createBridgeRequest(session, "health", {}, 5_000);
  const payload = JSON.stringify(request);
  const first = await rawPipeExchange(session.pipeName, payload);
  const replay = await rawPipeExchange(session.pipeName, payload);
  assert.equal(first.ok, true);
  assert.equal(replay.ok, false);
  assert.equal(replay.error?.code, "REPLAY_DETECTED");
});
