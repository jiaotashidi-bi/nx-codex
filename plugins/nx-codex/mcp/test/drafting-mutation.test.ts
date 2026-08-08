import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test, { type TestContext } from "node:test";

import { BridgeClient } from "../src/bridge-client.js";
import { BridgeOperationError } from "../src/errors.js";
import {
  MockBridge,
  type MockBridgeOptions,
} from "../src/mock-bridge.js";
import { SessionLocator } from "../src/session-locator.js";

async function withBridge(
  context: TestContext,
  options: MockBridgeOptions,
): Promise<{ client: BridgeClient; tempDirectory: string }> {
  const tempDirectory = await mkdtemp(
    path.join(os.tmpdir(), "nx-codex-drafting-create-"),
  );
  const sessionFile = path.join(tempDirectory, "session.json");
  const bridge = new MockBridge({
    ...options,
    sessionFile,
    allowedRoots: [tempDirectory],
  });
  await bridge.start();
  context.after(async () => {
    await bridge.stop();
    await rm(tempDirectory, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 50,
    });
  });
  return {
    client: new BridgeClient(new SessionLocator(sessionFile), 5_000),
    tempDirectory,
  };
}

test("strict fake creates and undoes exactly one protected test sheet and view", async (context) => {
  const { client, tempDirectory } = await withBridge(context, {
    application: "UG_APP_DRAFTING",
    licensedModules: { drafting: true },
  });
  const partPath = path.join(tempDirectory, "protected-test-copy.prt");
  await writeFile(partPath, "strict fake protected copy");
  await client.call("open_part", { filePath: partPath });

  const before = await client.call("get_session_state");
  const created = await client.call("create_test_drawing", {
    filePath: partPath,
  });

  assert.match(created.transactionId ?? "", /^TX-/);
  assert.equal(created.modified, true);
  assert.equal(created.sheetCount, 1);
  assert.equal(created.returnedSheetCount, 1);
  assert.equal(created.viewCount, 1);
  assert.equal(created.returnedViewCount, 1);
  assert.equal(created.sheets?.[0]?.name, "NX_CODEX_TEST_A4");
  assert.equal(created.sheets?.[0]?.length, 297);
  assert.equal(created.sheets?.[0]?.height, 210);
  assert.equal(created.sheets?.[0]?.projectionAngle, "ThirdAngle");
  assert.equal(Number.isFinite(created.views?.[0]?.scale), true);
  assert.ok((created.views?.[0]?.scale ?? 0) > 0);
  assert.equal(created.featureCount, before.featureCount);
  assert.equal(created.bodyCount, before.bodyCount);
  assert.equal(created.solidBodyCount, before.solidBodyCount);

  const first = await client.call("get_drafting_structure", {
    maxSheets: 1,
    maxViews: 1,
  });
  const second = await client.call("get_drafting_structure", {
    maxSheets: 1,
    maxViews: 1,
  });
  assert.equal(
    first.draftingStructureFingerprint,
    created.draftingStructureFingerprint,
  );
  assert.equal(
    second.draftingStructureFingerprint,
    first.draftingStructureFingerprint,
  );

  await client.call("undo_transaction", {
    transactionId: created.transactionId,
  });
  const afterUndo = await client.call("get_drafting_structure", {
    maxSheets: 1,
    maxViews: 1,
  });
  const stateAfterUndo = await client.call("get_session_state");
  assert.equal(afterUndo.sheetCount, 0);
  assert.equal(afterUndo.viewCount, 0);
  assert.equal(stateAfterUndo.modified, false);
  assert.equal(stateAfterUndo.featureCount, before.featureCount);
  assert.equal(stateAfterUndo.bodyCount, before.bodyCount);
  assert.equal(stateAfterUndo.solidBodyCount, before.solidBodyCount);
});

test("strict fake rejects protected test drawing without active license", async (context) => {
  const { client, tempDirectory } = await withBridge(context, {
    application: "UG_APP_DRAFTING",
    licensedModules: { drafting: false },
  });
  const partPath = path.join(tempDirectory, "unlicensed-copy.prt");
  await writeFile(partPath, "strict fake unlicensed copy");
  await client.call("open_part", { filePath: partPath });

  await assert.rejects(
    client.call("create_test_drawing", { filePath: partPath }),
    (error: unknown) =>
      error instanceof BridgeOperationError &&
      error.code === "DRAFTING_LICENSE_NOT_ACTIVE",
  );
  const after = await client.call("get_session_state");
  assert.equal(after.modified, false);
});

test("strict fake rejects protected test drawing over existing drafting content", async (context) => {
  const { client, tempDirectory } = await withBridge(context, {
    application: "UG_APP_DRAFTING",
    licensedModules: { drafting: true },
    draftingSheets: [
      {
        journalIdentifier: "DRAWING_SHEET(EXISTING)",
        name: "EXISTING",
        length: 297,
        height: 210,
        units: "Millimeters",
        projectionAngle: "ThirdAngle",
        scaleNumerator: 1,
        scaleDenominator: 1,
        isOutOfDate: false,
        views: [],
      },
    ],
  });
  const partPath = path.join(tempDirectory, "existing-drafting-copy.prt");
  await client.call("save_as", { filePath: partPath });

  await assert.rejects(
    client.call("create_test_drawing", { filePath: partPath }),
    (error: unknown) =>
      error instanceof BridgeOperationError &&
      error.code === "EXISTING_DRAFTING_CONTENT",
  );
  const structure = await client.call("get_drafting_structure", {
    maxSheets: 1,
    maxViews: 1,
  });
  assert.equal(structure.sheetCount, 1);
  assert.equal(structure.sheets?.[0]?.name, "EXISTING");
});
