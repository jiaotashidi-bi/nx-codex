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

const expectedFields = [
  "adapterId",
  "applicationName",
  "available",
  "compatibilityStatus",
  "licensed",
  "unsupportedReason",
].sort();

try {
  await request("initialize", {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: {
      name: "nx-codex-live-stage5d-cae-readonly-smoke",
      version: "1.0.0",
    },
  });
  notify("notifications/initialized");

  const health = await tool("nx_health");
  const capabilities = await tool("nx_get_capabilities");
  const before = await tool("nx_get_session_state");
  const first = await tool("nx_get_cae_capability");
  const second = await tool("nx_get_cae_capability");
  const after = await tool("nx_get_session_state");

  assert.equal(health.connected, true);
  assert.equal(health.bridgeVersion, "1.0.0");
  assert.equal(health.nxOpenAssemblyVersion, "12.0.2.9");
  assert.equal(health.adapterId, "nx12.0.2.9");
  assert.equal(health.compatibilityStatus, "verified");
  assert.ok(
    capabilities.capabilities?.includes("get_cae_capability"),
    "The loaded bridge does not advertise get_cae_capability; reload the newly built bridge before live stage-five D validation.",
  );
  assert.deepEqual(Object.keys(first).sort(), expectedFields);
  assert.deepEqual(Object.keys(second).sort(), expectedFields);
  assert.equal(first.available, true);
  assert.equal(first.adapterId, "nx12.0.2.9");
  assert.equal(first.compatibilityStatus, "verified");
  assert.equal(typeof first.applicationName, "string");
  assert.equal(typeof first.licensed, "boolean");
  assert.equal(first.unsupportedReason, "");
  assert.deepEqual(second, first);
  assert.deepEqual(after, before, "The NX part/session state changed during CAE reads.");

  console.log(
    JSON.stringify(
      {
        status: "stage5d_cae_readonly_passed",
        nxOpenAssemblyVersion: health.nxOpenAssemblyVersion,
        adapterId: health.adapterId,
        compatibilityStatus: health.compatibilityStatus,
        applicationName: first.applicationName,
        available: first.available,
        licensed: first.licensed,
        unsupportedReason: first.unsupportedReason,
        stateUnchanged: true,
        consecutiveReadStable: true,
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
