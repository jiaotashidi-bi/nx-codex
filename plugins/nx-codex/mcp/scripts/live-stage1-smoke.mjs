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

let nextRequestId = 1;
let stdoutBuffer = "";
let stderrBuffer = "";
const pending = new Map();

child.stderr.setEncoding("utf8");
child.stderr.on("data", (chunk) => {
  stderrBuffer += chunk;
});

child.stdout.setEncoding("utf8");
child.stdout.on("data", (chunk) => {
  stdoutBuffer += chunk;
  while (true) {
    const newline = stdoutBuffer.indexOf("\n");
    if (newline < 0) {
      break;
    }
    const line = stdoutBuffer.slice(0, newline).trim();
    stdoutBuffer = stdoutBuffer.slice(newline + 1);
    if (!line) {
      continue;
    }
    let message;
    try {
      message = JSON.parse(line);
    } catch (error) {
      for (const entry of pending.values()) {
        entry.reject(
          new Error(`MCP emitted invalid JSON: ${error.message}`),
        );
      }
      pending.clear();
      continue;
    }
    if (message.id === undefined) {
      continue;
    }
    const entry = pending.get(message.id);
    if (!entry) {
      continue;
    }
    pending.delete(message.id);
    clearTimeout(entry.timer);
    if (message.error) {
      entry.reject(
        new Error(
          `MCP ${entry.method} failed: ${JSON.stringify(message.error)}`,
        ),
      );
    } else {
      entry.resolve(message.result);
    }
  }
});

child.once("exit", (code, signal) => {
  const suffix = stderrBuffer.trim()
    ? ` stderr: ${stderrBuffer.trim()}`
    : "";
  for (const entry of pending.values()) {
    clearTimeout(entry.timer);
    entry.reject(
      new Error(
        `MCP server exited before replying (code=${code}, signal=${signal}).${suffix}`,
      ),
    );
  }
  pending.clear();
});

function request(method, params, timeoutMs = 25_000) {
  const id = nextRequestId++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`MCP ${method} timed out after ${timeoutMs} ms.`));
    }, timeoutMs);
    pending.set(id, { method, resolve, reject, timer });
    child.stdin.write(
      `${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`,
      "utf8",
    );
  });
}

function notify(method, params = {}) {
  child.stdin.write(
    `${JSON.stringify({ jsonrpc: "2.0", method, params })}\n`,
    "utf8",
  );
}

async function callTool(name, args = {}) {
  const response = await request("tools/call", {
    name,
    arguments: args,
  });
  if (response?.isError) {
    const message = Array.isArray(response.content)
      ? response.content
          .filter((item) => item?.type === "text")
          .map((item) => item.text)
          .join("\n")
      : "";
    throw new Error(`${name} failed: ${message || "unknown MCP error"}`);
  }
  if (!response?.structuredContent) {
    throw new Error(`${name} returned no structured content.`);
  }
  return response.structuredContent;
}

let transactionId = null;
let undoAttempted = false;

try {
  const initialized = await request("initialize", {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: {
      name: "nx-codex-live-stage1-smoke",
      version: "0.1.0",
    },
  });
  notify("notifications/initialized");

  const tools = await request("tools/list", {});
  const toolNames = tools.tools.map((tool) => tool.name).sort();
  assert.deepEqual(toolNames, [
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

  const health = await callTool("nx_health");
  const capabilities = await callTool("nx_get_capabilities");
  const before = await callTool("nx_get_session_state");
  assert.equal(health.bridgeVersion, "0.9.0");
  assert.equal(health.adapterId, "nx12.0.2.9");
  assert.equal(health.compatibilityStatus, "verified");

  const report = {
    status: "connectivity_passed",
    negotiatedProtocolVersion: initialized.protocolVersion,
    nxVersion: health.nxVersion,
    bridgeVersion: health.bridgeVersion,
    dispatcher: health.dispatcher,
    capabilities: capabilities.capabilities,
    workPart: before.workPart,
    units: before.units,
    beforeFeatureCount: before.featureCount,
    beforeBodyCount: before.bodyCount,
    modificationAttempted: false,
  };

  if (!before.workPart) {
    report.status = "needs_blank_work_part";
    console.log(JSON.stringify(report, null, 2));
  } else if (before.units !== "Millimeters") {
    report.status = "needs_millimeter_work_part";
    console.log(JSON.stringify(report, null, 2));
  } else if (before.bodyCount !== 0 || before.featureCount > 1) {
    report.status = "refused_nonempty_work_part";
    console.log(JSON.stringify(report, null, 2));
  } else {
    report.modificationAttempted = true;
    const created = await callTool("nx_create_block", {
      length: 100,
      width: 60,
      height: 20,
      origin: { x: 0, y: 0, z: 0 },
      name: `NX_CODEX_STAGE1_${Date.now()}`,
    });
    transactionId = created.transactionId;
    assert.match(transactionId ?? "", /^TX-/);

    const afterCreate = await callTool("nx_get_session_state");
    assert.ok(
      afterCreate.featureCount >= before.featureCount + 1,
      "Feature count did not increase after block creation.",
    );
    assert.ok(
      afterCreate.bodyCount >= before.bodyCount + 1,
      "Body count did not increase after block creation.",
    );

    await callTool("nx_undo_transaction", { transactionId });
    undoAttempted = true;
    transactionId = null;

    const afterUndo = await callTool("nx_get_session_state");
    assert.equal(
      afterUndo.featureCount,
      before.featureCount,
      "Feature count did not return to baseline after Undo.",
    );
    assert.equal(
      afterUndo.bodyCount,
      before.bodyCount,
      "Body count did not return to baseline after Undo.",
    );

    let rollbackFailureMessage = null;
    try {
      const unexpectedlyCreated = await callTool("nx_create_block", {
        length: 1e-12,
        width: 60,
        height: 20,
        origin: { x: 0, y: 0, z: 0 },
        name: `NX_CODEX_ROLLBACK_PROBE_${Date.now()}`,
      });
      transactionId = unexpectedlyCreated.transactionId;
      await callTool("nx_undo_transaction", { transactionId });
      transactionId = null;
    } catch (error) {
      rollbackFailureMessage =
        error instanceof Error ? error.message : String(error);
    }
    if (!rollbackFailureMessage) {
      throw new Error(
        "NX unexpectedly accepted the below-tolerance rollback probe; it was safely undone, but failure rollback was not verified.",
      );
    }

    const afterRollback = await callTool("nx_get_session_state");
    assert.equal(
      afterRollback.featureCount,
      before.featureCount,
      "Feature count changed after the failed operation rollback.",
    );
    assert.equal(
      afterRollback.bodyCount,
      before.bodyCount,
      "Body count changed after the failed operation rollback.",
    );

    Object.assign(report, {
      status: "modeling_and_undo_passed",
      transactionId: created.transactionId,
      featureName: created.featureName,
      afterCreateFeatureCount: afterCreate.featureCount,
      afterCreateBodyCount: afterCreate.bodyCount,
      afterUndoFeatureCount: afterUndo.featureCount,
      afterUndoBodyCount: afterUndo.bodyCount,
      undoVerified: true,
      rollbackVerified: true,
      rollbackFailure: rollbackFailureMessage,
      afterRollbackFeatureCount: afterRollback.featureCount,
      afterRollbackBodyCount: afterRollback.bodyCount,
    });
    console.log(JSON.stringify(report, null, 2));
  }
} catch (error) {
  if (transactionId && !undoAttempted) {
    undoAttempted = true;
    try {
      await callTool("nx_undo_transaction", { transactionId });
      console.error(`Recovery Undo succeeded for ${transactionId}.`);
      transactionId = null;
    } catch (undoError) {
      console.error(
        `CRITICAL: Recovery Undo failed for ${transactionId}: ${undoError.message}`,
      );
    }
  }
  console.error(error instanceof Error ? error.stack : String(error));
  if (stderrBuffer.trim()) {
    console.error(`MCP stderr: ${stderrBuffer.trim()}`);
  }
  process.exitCode = 1;
} finally {
  child.stdin.end();
  setTimeout(() => {
    if (child.exitCode === null) {
      child.kill();
    }
  }, 1_000).unref();
}
