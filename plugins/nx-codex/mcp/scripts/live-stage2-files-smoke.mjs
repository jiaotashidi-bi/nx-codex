import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.resolve(scriptDirectory, "../dist/mcp/index.mjs");
const allowedRoot = path.resolve(scriptDirectory, "../../../../NXFiles");
const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
const baselinePath = path.join(
  allowedRoot,
  `nx-codex-phase2-baseline-${stamp}.prt`,
);
const modeledPath = path.join(
  allowedRoot,
  `nx-codex-phase2-block-${stamp}.prt`,
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

function request(method, params, timeoutMs = 30_000) {
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
    const text = response.content
      ?.filter((item) => item.type === "text")
      .map((item) => item.text)
      .join("\n");
    throw new Error(`${name}: ${text || "unknown error"}`);
  }
  return response.structuredContent;
}

let pendingTransaction = null;
try {
  const initialized = await request("initialize", {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: {
      name: "nx-codex-live-stage2-files-smoke",
      version: "0.9.0",
    },
  });
  notify("notifications/initialized");

  const tools = await request("tools/list", {});
  const names = tools.tools.map((entry) => entry.name).sort();
  assert.deepEqual(names, [
    "nx_boolean_bodies",
    "nx_close_part",
    "nx_create_block",
    "nx_create_rectangle_sketch",
    "nx_create_simple_through_hole",
    "nx_export_step",
    "nx_extrude_sketch",
    "nx_fillet_vertical_edges",
    "nx_get_capabilities",
    "nx_get_session_state",
    "nx_health",
    "nx_measure_work_part",
    "nx_new_part",
    "nx_open_part",
    "nx_revolve_sketch",
    "nx_save_as",
    "nx_undo_transaction",
  ]);

  const health = await tool("nx_health");
  const capabilities = await tool("nx_get_capabilities");
  assert.equal(health.bridgeVersion, "0.9.0");
  assert.equal(health.adapterId, "nx12.0.2.9");
  assert.equal(health.compatibilityStatus, "verified");
  assert.ok(
    capabilities.allowedRoots?.some(
      (root) => root.toLowerCase() === allowedRoot.toLowerCase(),
    ),
    `Expected ${allowedRoot} in the bridge file policy.`,
  );

  const initial = await tool("nx_get_session_state");
  if (
    initial.workPart &&
    (initial.units !== "Millimeters" ||
      initial.bodyCount !== 0 ||
      initial.featureCount > 1)
  ) {
    throw new Error(
      "Stage-two smoke refuses a nonblank or non-millimeter work part.",
    );
  }

  let baseline = null;
  if (initial.workPart) {
    baseline = await tool("nx_save_as", { filePath: baselinePath });
    assert.equal(baseline.saved, true);
    assert.ok(existsSync(baselinePath), "Baseline .prt was not written.");
  }

  const newPart = await tool("nx_new_part", {
    filePath: modeledPath,
    units: "Millimeters",
  });
  assert.equal(newPart.opened, true);
  assert.equal(newPart.saved, false);

  const block = await tool("nx_create_block", {
    length: 80,
    width: 50,
    height: 12,
    origin: { x: -40, y: -25, z: 0 },
    name: `NX_CODEX_PHASE2_${stamp}`,
  });
  pendingTransaction = block.transactionId;
  assert.match(pendingTransaction ?? "", /^TX-/);

  const saved = await tool("nx_save_as", { filePath: modeledPath });
  pendingTransaction = null;
  assert.equal(saved.saved, true);
  assert.ok(existsSync(modeledPath), "Modeled .prt was not written.");
  assert.ok(saved.bodyCount >= 1, "Saved part has no body.");

  let overwriteRejected = false;
  try {
    await tool("nx_save_as", { filePath: modeledPath });
  } catch (error) {
    overwriteRejected = String(error).includes("TARGET_EXISTS");
  }
  assert.equal(overwriteRejected, true, "Existing target was not rejected.");

  const closed = await tool("nx_close_part");
  assert.equal(closed.closed, true);
  const reopened = await tool("nx_open_part", { filePath: modeledPath });
  assert.equal(reopened.opened, true);
  assert.ok(reopened.bodyCount >= 1, "Reopened part has no body.");
  assert.equal(reopened.modified, false);

  console.log(
    JSON.stringify(
      {
        status: "phase2_file_lifecycle_passed",
        negotiatedProtocolVersion: initialized.protocolVersion,
        nxVersion: health.nxVersion,
        bridgeVersion: health.bridgeVersion,
        allowedRoot,
        baselinePath: baseline?.filePath ?? null,
        modeledPath,
        noOverwriteVerified: true,
        closeVerified: true,
        reopenVerified: true,
        featureCount: reopened.featureCount,
        bodyCount: reopened.bodyCount,
      },
      null,
      2,
    ),
  );
} catch (error) {
  if (pendingTransaction) {
    try {
      await tool("nx_undo_transaction", {
        transactionId: pendingTransaction,
      });
      console.error(`Recovery Undo succeeded for ${pendingTransaction}.`);
    } catch (undoError) {
      console.error(
        `CRITICAL: Recovery Undo failed for ${pendingTransaction}: ${undoError}`,
      );
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
