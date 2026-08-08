import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test, { type TestContext } from "node:test";

import { BridgeClient } from "../src/bridge-client.js";
import {
  MockBridge,
  type MockDraftingSheet,
} from "../src/mock-bridge.js";
import { SessionLocator } from "../src/session-locator.js";

const draftingFixture: MockDraftingSheet[] = [
  {
    journalIdentifier: "DRAWING_SHEET(1)",
    name: "SHEET 1",
    length: 420,
    height: 297,
    units: "Millimeters",
    projectionAngle: "FirstAngle",
    scaleNumerator: 1,
    scaleDenominator: 2,
    isOutOfDate: false,
    views: [
      {
        journalIdentifier: "DRAFTING_VIEW(1)",
        name: "FRONT@1",
        scale: 0.5,
        originX: 105,
        originY: 148.5,
        originZ: 0,
        isOutOfDate: false,
        isBroken: false,
        isDecoration: false,
        isSlave: false,
      },
      {
        journalIdentifier: "DRAFTING_VIEW(2)",
        name: "TOP@2",
        scale: 0.5,
        originX: 250,
        originY: 148.5,
        originZ: 0,
        isOutOfDate: true,
        isBroken: false,
        isDecoration: false,
        isSlave: true,
      },
    ],
  },
  {
    journalIdentifier: "DRAWING_SHEET(2)",
    name: "SHEET 2",
    length: 11,
    height: 8.5,
    units: "Inches",
    projectionAngle: "ThirdAngle",
    scaleNumerator: 1,
    scaleDenominator: 1,
    isOutOfDate: true,
    views: [
      {
        journalIdentifier: "DRAFTING_VIEW(3)",
        name: "DETAIL A@3",
        scale: 2,
        originX: 5.5,
        originY: 4.25,
        originZ: 0,
        isOutOfDate: false,
        isBroken: true,
        isDecoration: true,
        isSlave: false,
      },
    ],
  },
];

async function withDraftingBridge(
  context: TestContext,
  licensed: boolean,
): Promise<BridgeClient> {
  const tempDirectory = await mkdtemp(
    path.join(os.tmpdir(), "nx-codex-drafting-read-"),
  );
  const sessionFile = path.join(tempDirectory, "session.json");
  const bridge = new MockBridge({
    sessionFile,
    licensedModules: { drafting: licensed },
    draftingSheets: draftingFixture,
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
  return new BridgeClient(new SessionLocator(sessionFile), 5_000);
}

test("strict fake returns stable read-only drafting sheets and views", async (context) => {
  const client = await withDraftingBridge(context, true);
  const before = await client.call("get_session_state");
  const first = await client.call("get_drafting_structure", {
    maxSheets: 32,
    maxViews: 128,
  });
  const second = await client.call("get_drafting_structure", {
    maxSheets: 32,
    maxViews: 128,
  });
  const after = await client.call("get_session_state");

  assert.equal(first.adapterId, "nx12.0.2.9");
  assert.equal(first.unsupportedReason, "");
  assert.equal(first.draftingReadAvailable, true);
  assert.equal(first.hasDrawingSheets, true);
  assert.equal(first.sheetCount, 2);
  assert.equal(first.returnedSheetCount, 2);
  assert.equal(first.sheetCountComplete, true);
  assert.equal(first.viewCount, 3);
  assert.equal(first.returnedViewCount, 3);
  assert.equal(first.viewCountComplete, true);
  assert.equal(first.draftingStructureTruncated, false);
  assert.deepEqual(
    first.sheets?.map((sheet) => ({
      name: sheet.name,
      units: sheet.units,
      projectionAngle: sheet.projectionAngle,
      viewCount: sheet.viewCount,
    })),
    [
      {
        name: "SHEET 1",
        units: "Millimeters",
        projectionAngle: "FirstAngle",
        viewCount: 2,
      },
      {
        name: "SHEET 2",
        units: "Inches",
        projectionAngle: "ThirdAngle",
        viewCount: 1,
      },
    ],
  );
  assert.deepEqual(
    first.views?.map((view) => ({
      sheetIndex: view.sheetIndex,
      name: view.name,
      scale: view.scale,
      isOutOfDate: view.isOutOfDate,
      isBroken: view.isBroken,
    })),
    [
      {
        sheetIndex: 0,
        name: "FRONT@1",
        scale: 0.5,
        isOutOfDate: false,
        isBroken: false,
      },
      {
        sheetIndex: 0,
        name: "TOP@2",
        scale: 0.5,
        isOutOfDate: true,
        isBroken: false,
      },
      {
        sheetIndex: 1,
        name: "DETAIL A@3",
        scale: 2,
        isOutOfDate: false,
        isBroken: true,
      },
    ],
  );
  assert.match(first.draftingStructureFingerprint ?? "", /^[a-f0-9]{64}$/);
  assert.equal(
    second.draftingStructureFingerprint,
    first.draftingStructureFingerprint,
  );
  assert.deepEqual(
    {
      modified: after.modified,
      featureCount: after.featureCount,
      bodyCount: after.bodyCount,
      solidBodyCount: after.solidBodyCount,
    },
    {
      modified: before.modified,
      featureCount: before.featureCount,
      bodyCount: before.bodyCount,
      solidBodyCount: before.solidBodyCount,
    },
  );
});

test("strict fake bounds returned drafting sheets and views", async (context) => {
  const client = await withDraftingBridge(context, true);

  const sheetLimited = await client.call("get_drafting_structure", {
    maxSheets: 1,
    maxViews: 128,
  });
  assert.equal(sheetLimited.sheetCount, 2);
  assert.equal(sheetLimited.returnedSheetCount, 1);
  assert.equal(sheetLimited.sheetCountComplete, true);
  assert.equal(sheetLimited.viewCount, 2);
  assert.equal(sheetLimited.viewCountComplete, false);
  assert.equal(sheetLimited.sheetLimitTruncated, true);
  assert.equal(sheetLimited.draftingStructureTruncated, true);

  const viewLimited = await client.call("get_drafting_structure", {
    maxSheets: 32,
    maxViews: 1,
  });
  assert.equal(viewLimited.returnedSheetCount, 2);
  assert.equal(viewLimited.viewCount, 3);
  assert.equal(viewLimited.viewCountComplete, true);
  assert.equal(viewLimited.returnedViewCount, 1);
  assert.equal(viewLimited.viewLimitTruncated, true);
  assert.equal(viewLimited.views?.length, 1);
  assert.equal(viewLimited.sheets?.[0]?.viewsTruncated, true);
});

test("strict fake fails closed when no drafting license is active", async (context) => {
  const client = await withDraftingBridge(context, false);
  const before = await client.call("get_session_state");
  const result = await client.call("get_drafting_structure", {
    maxSheets: 32,
    maxViews: 128,
  });
  const after = await client.call("get_session_state");

  assert.equal(result.adapterId, "nx12.0.2.9");
  assert.equal(result.draftingReadAvailable, false);
  assert.equal(result.licensed, false);
  assert.match(result.unsupportedReason ?? "", /No drafting license is active/);
  assert.deepEqual(result.sheets, []);
  assert.deepEqual(result.views, []);
  assert.equal(result.draftingStructureFingerprint, undefined);
  assert.deepEqual(
    {
      modified: after.modified,
      featureCount: after.featureCount,
      bodyCount: after.bodyCount,
      solidBodyCount: after.solidBodyCount,
    },
    {
      modified: before.modified,
      featureCount: before.featureCount,
      bodyCount: before.bodyCount,
      solidBodyCount: before.solidBodyCount,
    },
  );
});
