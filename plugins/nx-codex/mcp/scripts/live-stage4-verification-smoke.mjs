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
  `nx-codex-phase4-verified-block-${stamp}.prt`,
);
const screenshotPath = path.join(
  allowedRoot,
  `nx-codex-phase4-verified-block-${stamp}.png`,
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
    if (message.error) waiter.reject(new Error(JSON.stringify(message.error)));
    else waiter.resolve(message.result);
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

const transactions = [];
try {
  await request("initialize", {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: {
      name: "nx-codex-live-stage4-verification-smoke",
      version: "0.9.0",
    },
  });
  notify("notifications/initialized");

  const health = await tool("nx_health");
  const capabilities = await tool("nx_get_capabilities");
  assert.equal(health.bridgeVersion, "0.9.0");
  assert.equal(health.nxOpenAssemblyVersion, "12.0.2.9");
  assert.equal(health.adapterId, "nx12.0.2.9");
  assert.equal(health.compatibilityStatus, "verified");
  for (const capability of [
    "preflight_modeling",
    "get_feature_tree",
    "capture_screenshot",
    "create_block",
    "measure_work_part",
  ]) {
    assert.ok(
      capabilities.capabilities?.includes(capability),
      `Bridge did not advertise ${capability}.`,
    );
  }

  await mutation("nx_new_part", {
    filePath: modeledPath,
    units: "Millimeters",
  });
  const plan = {
    operation: "create_block",
    length: 50,
    width: 30,
    height: 10,
    origin: { x: -25, y: -15, z: 0 },
    name: `NX_CODEX_PHASE4_BLOCK_${stamp}`,
  };
  const preflight = await tool("nx_preflight_modeling", { plan });
  assert.equal(preflight.preflightPassed, true);
  assert.match(preflight.baseline.preflightId, /^PF-/);
  assert.match(preflight.baseline.featureTreeFingerprint, /^[a-f0-9]{64}$/i);

  const created = await mutation("nx_create_block", {
    length: plan.length,
    width: plan.width,
    height: plan.height,
    origin: plan.origin,
    name: plan.name,
  });
  transactions.push(created.transactionId);

  const verified = await tool("nx_verify_modeling_result", {
    operation: "create_block",
    baseline: preflight.baseline,
    transactionId: created.transactionId,
    featureJournalIdentifier: created.featureJournalIdentifier,
    screenshotFilePath: screenshotPath,
    linearTolerance: 0.0001,
    propertyRelativeTolerance: 0.00001,
    expected: {
      boundingBox: {
        minX: -25,
        minY: -15,
        minZ: 0,
        maxX: 25,
        maxY: 15,
        maxZ: 10,
        sizeX: 50,
        sizeY: 30,
        sizeZ: 10,
      },
      surfaceArea: 4_600,
      volume: 15_000,
      centroid: { x: 0, y: 0, z: 5 },
    },
  });
  assert.equal(verified.verificationPassed, true);
  assert.equal(verified.partSaved, false);
  assert.ok(existsSync(screenshotPath), "Stage 4 PNG was not written.");
  assert.match(verified.screenshot.screenshotSha256, /^[a-f0-9]{64}$/i);
  assert.ok(
    verified.featureTree.features.some(
      (feature) =>
        feature.journalIdentifier === created.featureJournalIdentifier &&
        feature.suppressed === false,
    ),
    "Created block was not present as an active feature-tree node.",
  );

  const saved = await mutation("nx_save_as", { filePath: modeledPath });
  assert.equal(saved.saved, true);
  transactions.splice(0);
  assert.ok(existsSync(modeledPath), "Stage 4 .prt was not written.");
  await mutation("nx_close_part");

  process.stdout.write(
    `${JSON.stringify(
      {
        status: "stage4_joint_verification_passed",
        modeledPath,
        screenshotPath,
        screenshotSha256: verified.screenshot.screenshotSha256,
        featureTreeFingerprint:
          verified.featureTree.featureTreeFingerprint,
        checks: verified.checks,
      },
      null,
      2,
    )}\n`,
  );
} catch (error) {
  const transactionId = transactions.at(-1);
  if (transactionId) {
    try {
      await mutation("nx_undo_transaction", { transactionId });
    } catch (undoError) {
      process.stderr.write(`Undo failed for ${transactionId}: ${undoError}\n`);
    }
  }
  process.stderr.write(`${error}\n${errors}`);
  process.exitCode = 1;
} finally {
  child.stdin.end();
  child.kill();
}
