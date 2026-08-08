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
  `nx-codex-phase2c-revolve-${stamp}.prt`,
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

function closeTo(actual, expected, tolerance = 1e-5) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `Expected ${actual} to be within ${tolerance} of ${expected}.`,
  );
}

const transactionIds = [];
try {
  const initialized = await request("initialize", {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: {
      name: "nx-codex-live-stage2c-revolve-smoke",
      version: "0.9.0",
    },
  });
  notify("notifications/initialized");

  const listed = await request("tools/list", {});
  assert.ok(
    listed.tools.some((entry) => entry.name === "nx_revolve_sketch"),
    "The MCP server did not expose nx_revolve_sketch.",
  );

  const health = await tool("nx_health");
  const capabilities = await tool("nx_get_capabilities");
  assert.equal(health.bridgeVersion, "0.9.0");
  assert.equal(health.adapterId, "nx12.0.2.9");
  assert.equal(health.compatibilityStatus, "verified");
  for (const capability of [
    "create_rectangle_sketch",
    "revolve_sketch",
    "measure_work_part",
    "undo_transaction",
  ]) {
    assert.ok(
      capabilities.capabilities?.includes(capability),
      `Bridge did not advertise ${capability}.`,
    );
  }

  const createdPart = await tool("nx_new_part", {
    filePath: modeledPath,
    units: "Millimeters",
  });
  assert.equal(createdPart.opened, true);
  assert.equal(createdPart.saved, false);

  const profile = await tool("nx_create_rectangle_sketch", {
    width: 10,
    height: 20,
    center: { x: 15, y: 0 },
    planeZ: 0,
    name: `NX_CODEX_REVOLVE_PROFILE_${stamp}`,
  });
  transactionIds.push(profile.transactionId);
  assert.equal(profile.curveCount, 4);
  assert.equal(profile.bodyCount, 0);

  const revolve = await tool("nx_revolve_sketch", {
    sketchFeatureJournalIdentifier: profile.featureJournalIdentifier,
    axis: {
      direction: "WCS_Y",
      origin: { x: 0, y: 0, z: 0 },
    },
    name: `NX_CODEX_REVOLVE_${stamp}`,
  });
  transactionIds.push(revolve.transactionId);
  assert.equal(revolve.bodyCount, 1);

  const measured = await tool("nx_measure_work_part");
  assert.equal(measured.measurementUnits, "Millimeters");
  assert.equal(measured.measuredBodyCount, 1);
  closeTo(measured.boundingBoxMinX, -20, 1e-4);
  closeTo(measured.boundingBoxMinY, -10, 1e-4);
  closeTo(measured.boundingBoxMinZ, -20, 1e-4);
  closeTo(measured.boundingBoxMaxX, 20, 1e-4);
  closeTo(measured.boundingBoxMaxY, 10, 1e-4);
  closeTo(measured.boundingBoxMaxZ, 20, 1e-4);
  closeTo(measured.surfaceArea, 1_800 * Math.PI, 0.1);
  closeTo(measured.volume, 6_000 * Math.PI, 0.1);
  closeTo(measured.centroidX, 0, 1e-4);
  closeTo(measured.centroidY, 0, 1e-4);
  closeTo(measured.centroidZ, 0, 1e-4);

  const crossingProfile = await tool("nx_create_rectangle_sketch", {
    width: 10,
    height: 8,
    center: { x: 0, y: 0 },
    planeZ: 0,
    name: `NX_CODEX_REJECTED_PROFILE_${stamp}`,
  });
  transactionIds.push(crossingProfile.transactionId);

  const beforeRejectedRequest = await tool("nx_get_session_state");
  let crossingRejected = false;
  try {
    await tool("nx_revolve_sketch", {
      sketchFeatureJournalIdentifier:
        crossingProfile.featureJournalIdentifier,
      axis: {
        direction: "WCS_Y",
        origin: { x: 0, y: 0, z: 0 },
      },
    });
  } catch (error) {
    crossingRejected = String(error).includes("PROFILE_CROSSES_AXIS");
  }
  assert.equal(crossingRejected, true);
  const afterRejectedRequest = await tool("nx_get_session_state");
  assert.equal(
    afterRejectedRequest.featureCount,
    beforeRejectedRequest.featureCount,
  );
  assert.equal(
    afterRejectedRequest.bodyCount,
    beforeRejectedRequest.bodyCount,
  );

  const crossingTransactionId = transactionIds.pop();
  const undoneCrossing = await tool("nx_undo_transaction", {
    transactionId: crossingTransactionId,
  });
  assert.equal(undoneCrossing.bodyCount, 1);

  const saved = await tool("nx_save_as", { filePath: modeledPath });
  transactionIds.splice(0);
  assert.equal(saved.saved, true);
  assert.ok(existsSync(modeledPath), "Stage 2C .prt was not written.");

  const closed = await tool("nx_close_part");
  assert.equal(closed.closed, true);
  const reopened = await tool("nx_open_part", { filePath: modeledPath });
  assert.equal(reopened.opened, true);
  assert.equal(reopened.modified, false);
  assert.equal(reopened.bodyCount, 1);

  const remeasured = await tool("nx_measure_work_part");
  assert.equal(
    remeasured.modified,
    false,
    "Read-only measurement marked the reopened part as modified.",
  );
  closeTo(remeasured.boundingBoxSizeX, 40, 1e-4);
  closeTo(remeasured.boundingBoxSizeY, 20, 1e-4);
  closeTo(remeasured.boundingBoxSizeZ, 40, 1e-4);
  closeTo(remeasured.surfaceArea, measured.surfaceArea, 0.1);
  closeTo(remeasured.volume, measured.volume, 0.1);

  console.log(
    JSON.stringify(
      {
        status: "phase2c_revolve_passed",
        negotiatedProtocolVersion: initialized.protocolVersion,
        nxVersion: health.nxVersion,
        bridgeVersion: health.bridgeVersion,
        modeledPath,
        sketchFeature: profile.featureJournalIdentifier,
        revolveFeature: revolve.featureJournalIdentifier,
        rejectedCrossingProfileVerified: true,
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
      await tool("nx_undo_transaction", { transactionId });
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
