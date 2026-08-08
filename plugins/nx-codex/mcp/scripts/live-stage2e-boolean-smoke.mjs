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
  `nx-codex-phase2e-boolean-${stamp}.prt`,
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

function verifyMeasurement(measured, expected) {
  assert.equal(measured.measurementUnits, "Millimeters");
  assert.equal(measured.measuredBodyCount, expected.bodyCount);
  closeTo(measured.boundingBoxMinX, expected.minX, 1e-4);
  closeTo(measured.boundingBoxMinY, expected.minY, 1e-4);
  closeTo(measured.boundingBoxMinZ, expected.minZ, 1e-4);
  closeTo(measured.boundingBoxMaxX, expected.maxX, 1e-4);
  closeTo(measured.boundingBoxMaxY, expected.maxY, 1e-4);
  closeTo(measured.boundingBoxMaxZ, expected.maxZ, 1e-4);
  closeTo(measured.surfaceArea, expected.surfaceArea, 0.1);
  closeTo(measured.volume, expected.volume, 0.1);
  closeTo(measured.centroidX, expected.centroidX, 1e-4);
  closeTo(measured.centroidY, expected.centroidY, 1e-4);
  closeTo(measured.centroidZ, expected.centroidZ, 1e-4);
}

const baselineExpected = {
  bodyCount: 2,
  minX: -30,
  minY: -20,
  minZ: -5,
  maxX: 30,
  maxY: 20,
  maxZ: 25,
  surfaceArea: 12_000,
  volume: 60_000,
  centroidX: 2,
  centroidY: 0,
  centroidZ: 10,
};
const scenarios = [
  {
    operation: "SUBTRACT",
    expected: {
      bodyCount: 1,
      minX: -30,
      minY: -20,
      minZ: 0,
      maxX: 30,
      maxY: 20,
      maxZ: 20,
      surfaceArea: 9_600,
      volume: 40_000,
      centroidX: -2,
      centroidY: 0,
      centroidZ: 10,
    },
  },
  {
    operation: "UNITE",
    expected: {
      bodyCount: 1,
      minX: -30,
      minY: -20,
      minZ: -5,
      maxX: 30,
      maxY: 20,
      maxZ: 25,
      surfaceArea: 9_600,
      volume: 52_000,
      centroidX: 40_000 / 52_000,
      centroidY: 0,
      centroidZ: 10,
    },
  },
  {
    operation: "INTERSECT",
    expected: {
      bodyCount: 1,
      minX: 0,
      minY: -10,
      minZ: 0,
      maxX: 20,
      maxY: 10,
      maxZ: 20,
      surfaceArea: 2_400,
      volume: 8_000,
      centroidX: 10,
      centroidY: 0,
      centroidZ: 10,
    },
  },
];

const transactionIds = [];
try {
  const initialized = await request("initialize", {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: {
      name: "nx-codex-live-stage2e-boolean-smoke",
      version: "0.9.0",
    },
  });
  notify("notifications/initialized");

  const listed = await request("tools/list", {});
  assert.ok(
    listed.tools.some((entry) => entry.name === "nx_boolean_bodies"),
    "The MCP server did not expose nx_boolean_bodies.",
  );
  const health = await tool("nx_health");
  const capabilities = await tool("nx_get_capabilities");
  assert.equal(health.bridgeVersion, "0.9.0");
  assert.equal(health.adapterId, "nx12.0.2.9");
  assert.equal(health.compatibilityStatus, "verified");
  for (const capability of [
    "create_block",
    "boolean_bodies",
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

  const target = await mutation("nx_create_block", {
    length: 60,
    width: 40,
    height: 20,
    origin: { x: -30, y: -20, z: 0 },
    name: `NX_CODEX_BOOLEAN_TARGET_${stamp}`,
  });
  transactionIds.push(target.transactionId);
  const booleanTool = await mutation("nx_create_block", {
    length: 20,
    width: 20,
    height: 30,
    origin: { x: 0, y: -10, z: -5 },
    name: `NX_CODEX_BOOLEAN_TOOL_${stamp}`,
  });
  transactionIds.push(booleanTool.transactionId);
  verifyMeasurement(await tool("nx_measure_work_part"), baselineExpected);

  const beforeRejected = await tool("nx_get_session_state");
  let sameFeatureRejected = false;
  try {
    await mutation("nx_boolean_bodies", {
      operation: "SUBTRACT",
      targetFeatureJournalIdentifier: target.featureJournalIdentifier,
      toolFeatureJournalIdentifier: target.featureJournalIdentifier,
    });
  } catch (error) {
    sameFeatureRejected = String(error).includes(
      "BOOLEAN_REQUIRES_DISTINCT_FEATURES",
    );
  }
  assert.equal(sameFeatureRejected, true);
  const afterRejected = await tool("nx_get_session_state");
  assert.equal(afterRejected.featureCount, beforeRejected.featureCount);
  assert.equal(afterRejected.bodyCount, beforeRejected.bodyCount);

  const operationFeatures = {};
  for (const scenario of scenarios) {
    const booleanResult = await mutation("nx_boolean_bodies", {
      operation: scenario.operation,
      targetFeatureJournalIdentifier: target.featureJournalIdentifier,
      toolFeatureJournalIdentifier: booleanTool.featureJournalIdentifier,
      name: `NX_CODEX_${scenario.operation}_${stamp}`,
    });
    transactionIds.push(booleanResult.transactionId);
    assert.equal(booleanResult.bodyCount, 1);
    operationFeatures[scenario.operation] =
      booleanResult.featureJournalIdentifier;
    verifyMeasurement(
      await tool("nx_measure_work_part"),
      scenario.expected,
    );

    const booleanTransactionId = transactionIds.pop();
    const undone = await mutation("nx_undo_transaction", {
      transactionId: booleanTransactionId,
    });
    assert.equal(undone.bodyCount, 2);
    verifyMeasurement(await tool("nx_measure_work_part"), baselineExpected);
  }

  const persisted = await mutation("nx_boolean_bodies", {
    operation: "SUBTRACT",
    targetFeatureJournalIdentifier: target.featureJournalIdentifier,
    toolFeatureJournalIdentifier: booleanTool.featureJournalIdentifier,
    name: `NX_CODEX_SUBTRACT_PERSISTED_${stamp}`,
  });
  transactionIds.push(persisted.transactionId);
  const modeledMeasurement = await tool("nx_measure_work_part");
  verifyMeasurement(modeledMeasurement, scenarios[0].expected);

  const saved = await mutation("nx_save_as", { filePath: modeledPath });
  transactionIds.splice(0);
  assert.equal(saved.saved, true);
  assert.ok(existsSync(modeledPath), "Stage 2E .prt was not written.");
  const closed = await mutation("nx_close_part");
  assert.equal(closed.closed, true);
  const reopened = await mutation("nx_open_part", { filePath: modeledPath });
  assert.equal(reopened.opened, true);
  assert.equal(reopened.modified, false);
  assert.equal(reopened.bodyCount, 1);
  const remeasured = await tool("nx_measure_work_part");
  assert.equal(remeasured.modified, false);
  verifyMeasurement(remeasured, scenarios[0].expected);

  console.log(
    JSON.stringify(
      {
        status: "phase2e_boolean_passed",
        negotiatedProtocolVersion: initialized.protocolVersion,
        nxVersion: health.nxVersion,
        bridgeVersion: health.bridgeVersion,
        modeledPath,
        targetFeature: target.featureJournalIdentifier,
        toolFeature: booleanTool.featureJournalIdentifier,
        operationFeatures,
        persistedFeature: persisted.featureJournalIdentifier,
        sameFeatureRejectionVerified: true,
        allModesUndoVerified: true,
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
