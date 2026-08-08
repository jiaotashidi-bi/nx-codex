import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.resolve(scriptDirectory, "../dist/mcp/index.mjs");
const allowedRoot = path.resolve(scriptDirectory, "../../../../NXFiles");
const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
const modeledPath = path.join(
  allowedRoot,
  `nx-codex-phase2d-through-hole-${stamp}.prt`,
);

const child = spawn(process.execPath, [serverPath], {
  env: process.env,
  stdio: ["pipe", "pipe", "pipe"],
  windowsHide: true,
});
let nextId = 1;
let output = "";
let errors = "";
const pending = new Map();

child.stderr.setEncoding("utf8");
child.stderr.on("data", (chunk) => {
  errors += chunk;
});
child.stdout.setEncoding("utf8");
child.stdout.on("data", (chunk) => {
  output += chunk;
  let newline;
  while ((newline = output.indexOf("\n")) >= 0) {
    const line = output.slice(0, newline).trim();
    output = output.slice(newline + 1);
    if (!line) continue;
    const message = JSON.parse(line);
    const waiter = pending.get(message.id);
    if (!waiter) continue;
    pending.delete(message.id);
    clearTimeout(waiter.timer);
    if (message.error) {
      waiter.reject(new Error(JSON.stringify(message.error)));
    } else {
      waiter.resolve(message.result);
    }
  }
});

function request(method, params, timeoutMs = 45_000) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`${method} timed out after ${timeoutMs} ms.`));
    }, timeoutMs);
    pending.set(id, { resolve, reject, timer });
    child.stdin.write(
      `${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`,
    );
  });
}

function notify(method, params = {}) {
  child.stdin.write(
    `${JSON.stringify({ jsonrpc: "2.0", method, params })}\n`,
  );
}

async function tool(name, argumentsValue = {}) {
  const response = await request("tools/call", {
    name,
    arguments: argumentsValue,
  });
  if (response?.isError) {
    const message = response.content
      ?.filter((item) => item.type === "text")
      .map((item) => item.text)
      .join("\n");
    throw new Error(`${name}: ${message || "unknown error"}`);
  }
  return response.structuredContent;
}

async function mutation(name, argumentsValue = {}) {
  await tool("nx_get_session_state");
  const result = await tool(name, argumentsValue);
  await tool("nx_get_session_state");
  return result;
}

function closeTo(actual, expected, tolerance = 1e-5) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `Expected ${actual} to be within ${tolerance} of ${expected}.`,
  );
}

function verifyHoledMeasurement(measured) {
  const removedVolume = 500 * Math.PI;
  const remainingVolume = 48_000 - removedVolume;
  assert.equal(measured.measurementUnits, "Millimeters");
  assert.equal(measured.measuredBodyCount, 1);
  closeTo(measured.boundingBoxMinX, -30, 1e-4);
  closeTo(measured.boundingBoxMinY, -20, 1e-4);
  closeTo(measured.boundingBoxMinZ, 0, 1e-4);
  closeTo(measured.boundingBoxMaxX, 30, 1e-4);
  closeTo(measured.boundingBoxMaxY, 20, 1e-4);
  closeTo(measured.boundingBoxMaxZ, 20, 1e-4);
  closeTo(measured.surfaceArea, 8_800 + 150 * Math.PI, 0.1);
  closeTo(measured.volume, remainingVolume, 0.1);
  closeTo(measured.centroidX, (-10 * removedVolume) / remainingVolume, 1e-4);
  closeTo(measured.centroidY, (-5 * removedVolume) / remainingVolume, 1e-4);
  closeTo(measured.centroidZ, 10, 1e-4);
}

const transactionIds = [];
try {
  const initialized = await request("initialize", {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: {
      name: "nx-codex-live-stage2d-hole-smoke",
      version: "0.9.0",
    },
  });
  notify("notifications/initialized");

  const listed = await request("tools/list", {});
  assert.ok(
    listed.tools.some(
      (entry) => entry.name === "nx_create_simple_through_hole",
    ),
    "The MCP server did not expose nx_create_simple_through_hole.",
  );

  const health = await tool("nx_health");
  const capabilities = await tool("nx_get_capabilities");
  assert.equal(health.bridgeVersion, "0.9.0");
  assert.equal(health.adapterId, "nx12.0.2.9");
  assert.equal(health.compatibilityStatus, "verified");
  for (const capability of [
    "create_block",
    "create_simple_through_hole",
    "measure_work_part",
    "undo_transaction",
  ]) {
    assert.ok(
      capabilities.capabilities?.includes(capability),
      `Bridge did not advertise ${capability}.`,
    );
  }

  const createdPart = await mutation("nx_new_part", {
    filePath: modeledPath,
    units: "Millimeters",
  });
  assert.equal(createdPart.opened, true);
  assert.equal(createdPart.saved, false);

  const block = await mutation("nx_create_block", {
    length: 60,
    width: 40,
    height: 20,
    origin: { x: -30, y: -20, z: 0 },
    name: `NX_CODEX_HOLE_BLOCK_${stamp}`,
  });
  transactionIds.push(block.transactionId);
  assert.equal(block.bodyCount, 1);

  const baseline = await tool("nx_measure_work_part");
  closeTo(baseline.surfaceArea, 8_800, 0.1);
  closeTo(baseline.volume, 48_000, 0.1);
  const beforeRejected = await tool("nx_get_session_state");
  let edgeHoleRejected = false;
  try {
    await mutation("nx_create_simple_through_hole", {
      diameter: 10,
      center: { x: 29, y: 0 },
    });
  } catch (error) {
    edgeHoleRejected = String(error).includes("HOLE_CLEARANCE_OUTSIDE_FACE");
  }
  assert.equal(edgeHoleRejected, true);
  const afterRejected = await tool("nx_get_session_state");
  assert.equal(afterRejected.featureCount, beforeRejected.featureCount);
  assert.equal(afterRejected.bodyCount, beforeRejected.bodyCount);

  const firstHole = await mutation("nx_create_simple_through_hole", {
    diameter: 10,
    center: { x: 10, y: 5 },
    name: `NX_CODEX_THROUGH_HOLE_UNDO_${stamp}`,
  });
  transactionIds.push(firstHole.transactionId);
  assert.equal(firstHole.bodyCount, 1);
  verifyHoledMeasurement(await tool("nx_measure_work_part"));

  const firstHoleTransactionId = transactionIds.pop();
  const undone = await mutation("nx_undo_transaction", {
    transactionId: firstHoleTransactionId,
  });
  assert.equal(undone.bodyCount, 1);
  const restored = await tool("nx_measure_work_part");
  closeTo(restored.surfaceArea, baseline.surfaceArea, 0.1);
  closeTo(restored.volume, baseline.volume, 0.1);
  closeTo(restored.centroidX, baseline.centroidX, 1e-4);
  closeTo(restored.centroidY, baseline.centroidY, 1e-4);
  closeTo(restored.centroidZ, baseline.centroidZ, 1e-4);

  const persistedHole = await mutation("nx_create_simple_through_hole", {
    diameter: 10,
    center: { x: 10, y: 5 },
    name: `NX_CODEX_THROUGH_HOLE_${stamp}`,
  });
  transactionIds.push(persistedHole.transactionId);
  const modeledMeasurement = await tool("nx_measure_work_part");
  verifyHoledMeasurement(modeledMeasurement);

  const saved = await mutation("nx_save_as", { filePath: modeledPath });
  transactionIds.splice(0);
  assert.equal(saved.saved, true);
  assert.ok(existsSync(modeledPath), "Stage 2D .prt was not written.");

  const closed = await mutation("nx_close_part");
  assert.equal(closed.closed, true);
  const reopened = await mutation("nx_open_part", { filePath: modeledPath });
  assert.equal(reopened.opened, true);
  assert.equal(reopened.modified, false);
  assert.equal(reopened.bodyCount, 1);
  const remeasured = await tool("nx_measure_work_part");
  assert.equal(remeasured.modified, false);
  verifyHoledMeasurement(remeasured);

  console.log(
    JSON.stringify(
      {
        status: "phase2d_simple_through_hole_passed",
        negotiatedProtocolVersion: initialized.protocolVersion,
        nxVersion: health.nxVersion,
        bridgeVersion: health.bridgeVersion,
        modeledPath,
        blockFeature: block.featureJournalIdentifier,
        holeFeature: persistedHole.featureJournalIdentifier,
        edgeClearanceRejectionVerified: true,
        undoRestorationVerified: true,
        saveCloseReopenVerified: true,
        measurement: remeasured,
      },
      null,
      2,
    ),
  );
} catch (error) {
  while (transactionIds.length > 0) {
    const transactionId = transactionIds.pop();
    try {
      await mutation("nx_undo_transaction", { transactionId });
      console.error(`Recovery Undo succeeded for ${transactionId}.`);
    } catch (undoError) {
      console.error(
        `CRITICAL: Recovery Undo failed for ${transactionId}: ${undoError}`,
      );
      break;
    }
  }
  console.error(error instanceof Error ? error.stack : String(error));
  if (errors.trim()) console.error(`MCP stderr: ${errors.trim()}`);
  process.exitCode = 1;
} finally {
  child.stdin.end();
  setTimeout(() => {
    if (child.exitCode === null) child.kill();
  }, 1_000).unref();
}
