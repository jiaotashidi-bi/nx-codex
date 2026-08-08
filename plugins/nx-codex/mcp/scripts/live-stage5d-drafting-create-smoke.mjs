import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const expectedWorkPartPath = process.env.NX_CODEX_EXPECTED_WORK_PART;
if (!expectedWorkPartPath) {
  throw new Error(
    "NX_CODEX_EXPECTED_WORK_PART must name the exact saved protected .prt copy.",
  );
}

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.resolve(scriptDirectory, "../dist/mcp/index.mjs");
const child = spawn(process.execPath, [serverPath], {
  env: process.env,
  stdio: ["pipe", "pipe", "pipe"],
  windowsHide: true,
});
let nextId = 1;
let output = "";
let errors = "";
let createdTransactionId;
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

function request(method, params, timeoutMs = 20_000) {
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

try {
  await request("initialize", {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: {
      name: "nx-codex-live-stage5d-drafting-create-smoke",
      version: "1.0.0",
    },
  });
  notify("notifications/initialized");

  const health = await tool("nx_health");
  const capabilities = await tool("nx_get_capabilities");
  const before = await tool("nx_get_session_state");
  const draftingCapability = await tool("nx_get_drafting_capability");
  const emptyStructure = await tool("nx_get_drafting_structure", {
    maxSheets: 1,
    maxViews: 1,
  });

  assert.equal(health.connected, true);
  assert.equal(health.bridgeVersion, "1.0.0");
  assert.equal(health.nxOpenAssemblyVersion, "12.0.2.9");
  assert.equal(health.adapterId, "nx12.0.2.9");
  assert.equal(health.compatibilityStatus, "verified");
  assert.ok(
    capabilities.capabilities?.includes("create_test_drawing"),
    "Reload the Stage 5D bridge before running the live drafting mutation.",
  );
  assert.equal(before.workPart?.toLowerCase(), expectedWorkPartPath.toLowerCase());
  assert.equal(
    before.displayPart?.toLowerCase(),
    expectedWorkPartPath.toLowerCase(),
  );
  assert.equal(before.modified, false);
  assert.equal(before.units, "Millimeters");
  assert.match(before.application ?? "", /draft/i);
  assert.equal(draftingCapability.available, true);
  assert.equal(draftingCapability.licensed, true);
  assert.equal(emptyStructure.draftingReadAvailable, true);
  assert.equal(emptyStructure.sheetCount, 0);
  assert.equal(emptyStructure.viewCount, 0);

  const created = await tool("nx_create_test_drawing", {
    expectedWorkPartPath,
  });
  createdTransactionId = created.transactionId;
  assert.match(createdTransactionId ?? "", /^TX-/);
  assert.equal(created.modified, true);
  assert.equal(created.sheetCount, 1);
  assert.equal(created.returnedSheetCount, 1);
  assert.equal(created.viewCount, 1);
  assert.equal(created.returnedViewCount, 1);
  assert.equal(created.sheets?.[0]?.name, "NX_CODEX_TEST_A4");
  assert.deepEqual(
    [created.sheets?.[0]?.length, created.sheets?.[0]?.height].sort(
      (left, right) => left - right,
    ),
    [210, 297],
  );
  assert.equal(created.sheets?.[0]?.units, "Millimeters");
  assert.equal(created.sheets?.[0]?.projectionAngle, "ThirdAngle");
  assert.equal(Number.isFinite(created.views?.[0]?.scale), true);
  assert.ok(created.views[0].scale > 0);
  assert.equal(created.bodyCount, before.bodyCount);
  assert.equal(created.solidBodyCount, before.solidBodyCount);

  const first = await tool("nx_get_drafting_structure", {
    maxSheets: 1,
    maxViews: 1,
  });
  const second = await tool("nx_get_drafting_structure", {
    maxSheets: 1,
    maxViews: 1,
  });
  const after = await tool("nx_get_session_state");
  assert.equal(first.sheetCount, 1);
  assert.equal(first.viewCount, 1);
  assert.equal(
    first.draftingStructureFingerprint,
    created.draftingStructureFingerprint,
  );
  assert.equal(
    second.draftingStructureFingerprint,
    first.draftingStructureFingerprint,
  );
  assert.equal(after.modified, true);
  assert.equal(after.bodyCount, before.bodyCount);
  assert.equal(after.solidBodyCount, before.solidBodyCount);

  console.log(
    JSON.stringify(
      {
        status: "stage5d_protected_test_drawing_created",
        workPart: after.workPart,
        application: after.application,
        transactionId: createdTransactionId,
        saved: false,
        modified: after.modified,
        featureCountBefore: before.featureCount,
        featureCountAfter: after.featureCount,
        bodyCountUnchanged: true,
        solidBodyCountUnchanged: true,
        sheet: first.sheets?.[0],
        view: first.views?.[0],
        draftingStructureFingerprint: first.draftingStructureFingerprint,
        consecutiveReadFingerprintStable: true,
      },
      null,
      2,
    ),
  );
} catch (error) {
  if (createdTransactionId) {
    try {
      await tool("nx_undo_transaction", {
        transactionId: createdTransactionId,
      });
      console.error(
        `Post-create verification failed; transaction ${createdTransactionId} was undone.`,
      );
    } catch (rollbackError) {
      console.error(
        `Post-create verification failed and automatic undo also failed: ${String(rollbackError)}`,
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
