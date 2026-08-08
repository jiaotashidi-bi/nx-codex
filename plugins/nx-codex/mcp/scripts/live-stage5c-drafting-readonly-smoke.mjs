import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

function request(method, params, timeoutMs = 15_000) {
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
      name: "nx-codex-live-stage5c-drafting-readonly-smoke",
      version: "1.0.0",
    },
  });
  notify("notifications/initialized");

  const health = await tool("nx_health");
  const capabilities = await tool("nx_get_capabilities");
  const draftingCapability = await tool("nx_get_drafting_capability");
  assert.equal(health.connected, true);
  assert.equal(health.bridgeVersion, "1.0.0");
  assert.equal(health.nxOpenAssemblyVersion, "12.0.2.9");
  assert.equal(health.adapterId, "nx12.0.2.9");
  assert.equal(health.compatibilityStatus, "verified");
  assert.ok(
    capabilities.capabilities?.includes("get_drafting_structure"),
    "The loaded bridge does not advertise get_drafting_structure; reload the newly built bridge before live stage-five C validation.",
  );
  assert.equal(draftingCapability.adapterId, "nx12.0.2.9");
  assert.equal(typeof draftingCapability.unsupportedReason, "string");

  const before = await tool("nx_get_session_state");
  const first = await tool("nx_get_drafting_structure", {
    maxSheets: 32,
    maxViews: 128,
  });
  const second = await tool("nx_get_drafting_structure", {
    maxSheets: 32,
    maxViews: 128,
  });
  const after = await tool("nx_get_session_state");

  for (const field of [
    "workPart",
    "displayPart",
    "units",
    "modified",
    "featureCount",
    "bodyCount",
    "solidBodyCount",
  ]) {
    assert.deepEqual(after[field], before[field], `${field} changed during reads.`);
  }
  assert.equal(first.adapterId, "nx12.0.2.9");
  assert.equal(typeof first.unsupportedReason, "string");
  assert.ok((first.sheets?.length ?? 0) <= 32);
  assert.ok((first.views?.length ?? 0) <= 128);

  let status;
  if (draftingCapability.licensed !== true) {
    assert.equal(first.draftingReadAvailable, false);
    assert.equal(first.licensed, false);
    assert.match(first.unsupportedReason, /No drafting license is active/);
    assert.deepEqual(first.sheets, []);
    assert.deepEqual(first.views, []);
    assert.equal(first.draftingStructureFingerprint, undefined);
    status = "stage5c_drafting_license_inactive_failed_closed";
  } else {
    assert.equal(first.draftingReadAvailable, true);
    assert.equal(first.unsupportedReason, "");
    assert.equal(first.returnedSheetCount, first.sheets?.length ?? 0);
    assert.equal(first.returnedViewCount, first.views?.length ?? 0);
    assert.match(first.draftingStructureFingerprint, /^[a-f0-9]{64}$/i);
    assert.equal(
      second.draftingStructureFingerprint,
      first.draftingStructureFingerprint,
      "The bounded drafting structure changed between consecutive reads.",
    );
    status = "stage5c_drafting_readonly_passed";
  }

  console.log(
    JSON.stringify(
      {
        status,
        bridgeVersion: health.bridgeVersion,
        nxOpenAssemblyVersion: health.nxOpenAssemblyVersion,
        adapterId: health.adapterId,
        compatibilityStatus: health.compatibilityStatus,
        licensed: draftingCapability.licensed,
        unsupportedReason: first.unsupportedReason,
        stateUnchanged: true,
        structureUnchanged:
          first.draftingReadAvailable === true ? true : "not-read",
        hasDrawingSheets: first.hasDrawingSheets,
        sheetCount: first.sheetCount,
        returnedSheetCount: first.returnedSheetCount,
        viewCount: first.viewCount,
        returnedViewCount: first.returnedViewCount,
        draftingStructureTruncated: first.draftingStructureTruncated,
        draftingStructureFingerprint: first.draftingStructureFingerprint,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error instanceof Error ? error.stack : String(error));
  if (errors.trim()) console.error(`MCP stderr: ${errors.trim()}`);
  process.exitCode = 1;
} finally {
  child.stdin.end();
  setTimeout(() => {
    if (child.exitCode === null) child.kill();
  }, 1_000).unref();
}
