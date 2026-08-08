import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

import { MockBridge } from "../src/mock-bridge.js";

function cleanEnvironment(extra: Record<string, string>): Record<string, string> {
  return {
    ...Object.fromEntries(
      Object.entries(process.env).filter(
        (entry): entry is [string, string] => entry[1] !== undefined,
      ),
    ),
    ...extra,
  };
}

test("stdio MCP exposes safe tools and reaches the mock bridge", async (context) => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "nx-codex-mcp-"));
  const sessionFile = path.join(tempDirectory, "session.json");
  const policyFile = path.join(tempDirectory, "policy.json");
  await writeFile(
    policyFile,
    JSON.stringify({ version: 1, allowedRoots: [tempDirectory] }),
  );
  const bridge = new MockBridge({
    sessionFile,
    licensedModules: {
      assembly: true,
      drafting: true,
      cae: true,
      cam: false,
    },
    assemblyRoot: {
      instanceName: "ROOT",
      displayName: "mock-assembly",
      prototypePartIdentifier: "mock-assembly.prt",
      suppressed: false,
      loadState: "loaded",
      representationMode: "Exact",
      children: [
        {
          instanceName: "SUB_A",
          displayName: "sub-a",
          prototypePartIdentifier: "sub-a.prt",
          suppressed: false,
          loadState: "loaded",
          representationMode: "Exact",
          children: [
            {
              instanceName: "PIN_1",
              displayName: "pin",
              prototypePartIdentifier: "pin.prt",
              suppressed: false,
              loadState: "loaded",
              representationMode: "Lightweight",
            },
          ],
        },
        {
          instanceName: "PLATE_B",
          displayName: "plate",
          prototypePartIdentifier: "plate.prt",
          suppressed: true,
          loadState: "unloaded",
          representationMode: "None",
        },
      ],
    },
    draftingSheets: [
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
            originX: 100,
            originY: 140,
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
            originY: 140,
            originZ: 0,
            isOutOfDate: true,
            isBroken: false,
            isDecoration: false,
            isSlave: true,
          },
        ],
      },
    ],
  });
  await bridge.start();
  context.after(async () => bridge.stop());

  const client = new Client({ name: "nx-codex-test", version: "0.1.0" });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.resolve("dist/mcp/index.mjs")],
    env: cleanEnvironment({
      NX_CODEX_SESSION_FILE: sessionFile,
      NX_CODEX_POLICY_FILE: policyFile,
    }),
    stderr: "pipe",
  });
  let childStderr = "";
  transport.stderr?.on("data", (chunk: Buffer) => {
    childStderr += chunk.toString("utf8");
  });
  try {
    await client.connect(transport);
  } catch (error) {
    throw new Error(
      `MCP start failed. stderr: ${childStderr || "<empty>"}`,
      { cause: error },
    );
  }
  context.after(async () => client.close());

  const listed = await client.listTools();
  const names = listed.tools.map((tool) => tool.name).sort();
  assert.deepEqual(names, [
    "nx_boolean_bodies",
    "nx_capture_screenshot",
    "nx_close_part",
    "nx_create_block",
    "nx_create_rectangle_sketch",
    "nx_create_simple_through_hole",
    "nx_create_test_drawing",
    "nx_export_step",
    "nx_extrude_sketch",
    "nx_fillet_vertical_edges",
    "nx_get_assembly_capability",
    "nx_get_assembly_structure",
    "nx_get_cae_capability",
    "nx_get_cam_capability",
    "nx_get_capabilities",
    "nx_get_drafting_capability",
    "nx_get_drafting_structure",
    "nx_get_feature_tree",
    "nx_get_session_state",
    "nx_health",
    "nx_measure_work_part",
    "nx_new_part",
    "nx_open_part",
    "nx_preflight_modeling",
    "nx_revolve_sketch",
    "nx_save_as",
    "nx_undo_transaction",
    "nx_verify_modeling_result",
  ]);
  assert.equal(names.includes("run_python"), false);
  assert.equal(names.includes("run_journal"), false);
  for (const forbiddenAssemblyMutation of [
    "nx_add_component",
    "nx_delete_component",
    "nx_replace_component",
    "nx_move_component",
    "nx_constrain_component",
    "nx_relocate_component",
  ]) {
    assert.equal(names.includes(forbiddenAssemblyMutation), false);
  }

  const health = await client.callTool({
    name: "nx_health",
    arguments: {},
  });
  assert.equal(health.isError, undefined);
  assert.equal(
    (health.structuredContent as Record<string, unknown>).connected,
    true,
  );
  assert.equal(
    (health.structuredContent as Record<string, unknown>).adapterId,
    "nx12.0.2.9",
  );
  assert.equal(
    (health.structuredContent as Record<string, unknown>).compatibilityStatus,
    "verified",
  );

  const assemblyCapability = await client.callTool({
    name: "nx_get_assembly_capability",
    arguments: {},
  });
  assert.equal(assemblyCapability.isError, undefined);
  assert.deepEqual(
    {
      available: (
        assemblyCapability.structuredContent as Record<string, unknown>
      ).available,
      licensed: (
        assemblyCapability.structuredContent as Record<string, unknown>
      ).licensed,
      adapterId: (
        assemblyCapability.structuredContent as Record<string, unknown>
      ).adapterId,
      unsupportedReason: (
        assemblyCapability.structuredContent as Record<string, unknown>
      ).unsupportedReason,
    },
    {
      available: true,
      licensed: true,
      adapterId: "nx12.0.2.9",
      unsupportedReason: "",
    },
  );

  const assemblyStateBefore = await client.callTool({
    name: "nx_get_session_state",
    arguments: {},
  });
  const assemblyStructure = await client.callTool({
    name: "nx_get_assembly_structure",
    arguments: { maxDepth: 8, maxComponents: 128 },
  });
  const assemblyStructureRepeat = await client.callTool({
    name: "nx_get_assembly_structure",
    arguments: { maxDepth: 8, maxComponents: 128 },
  });
  const assemblyStateAfter = await client.callTool({
    name: "nx_get_session_state",
    arguments: {},
  });
  assert.equal(assemblyStructure.isError, undefined);
  const assemblyStructured =
    assemblyStructure.structuredContent as Record<string, unknown>;
  assert.equal(assemblyStructured.adapterId, "nx12.0.2.9");
  assert.equal(assemblyStructured.unsupportedReason, "");
  assert.equal(assemblyStructured.assemblyReadAvailable, true);
  assert.equal(assemblyStructured.isAssembly, true);
  assert.equal(assemblyStructured.componentCount, 3);
  assert.equal(assemblyStructured.returnedComponentCount, 3);
  assert.equal(assemblyStructured.componentCountComplete, true);
  assert.equal(assemblyStructured.assemblyStructureTruncated, false);
  assert.equal(
    (assemblyStructureRepeat.structuredContent as Record<string, unknown>)
      .assemblyStructureFingerprint,
    assemblyStructured.assemblyStructureFingerprint,
  );
  const beforeAssemblyState =
    assemblyStateBefore.structuredContent as Record<string, unknown>;
  const afterAssemblyState =
    assemblyStateAfter.structuredContent as Record<string, unknown>;
  assert.deepEqual(
    {
      modified: afterAssemblyState.modified,
      featureCount: afterAssemblyState.featureCount,
      bodyCount: afterAssemblyState.bodyCount,
    },
    {
      modified: beforeAssemblyState.modified,
      featureCount: beforeAssemblyState.featureCount,
      bodyCount: beforeAssemblyState.bodyCount,
    },
  );

  for (const [moduleName, licensed] of [
    ["drafting", true],
    ["cae", true],
    ["cam", false],
  ] as const) {
    const capability = await client.callTool({
      name: `nx_get_${moduleName}_capability`,
      arguments: {},
    });
    const structured = capability.structuredContent as Record<string, unknown>;
    assert.equal(capability.isError, undefined);
    assert.equal(structured.available, true);
    assert.equal(structured.licensed, licensed);
    assert.equal(structured.adapterId, "nx12.0.2.9");
    assert.equal(structured.unsupportedReason, "");
  }

  const caeCapability = await client.callTool({
    name: "nx_get_cae_capability",
    arguments: {},
  });
  const caeStructured = caeCapability.structuredContent as Record<
    string,
    unknown
  >;
  assert.deepEqual(Object.keys(caeStructured).sort(), [
    "adapterId",
    "applicationName",
    "available",
    "compatibilityStatus",
    "licensed",
    "unsupportedReason",
  ]);
  assert.equal(caeStructured.applicationName, "Modeling");
  assert.equal(caeStructured.compatibilityStatus, "verified");

  const draftingStateBefore = await client.callTool({
    name: "nx_get_session_state",
    arguments: {},
  });
  const draftingStructure = await client.callTool({
    name: "nx_get_drafting_structure",
    arguments: { maxSheets: 32, maxViews: 128 },
  });
  const draftingStructureRepeat = await client.callTool({
    name: "nx_get_drafting_structure",
    arguments: { maxSheets: 32, maxViews: 128 },
  });
  const draftingStateAfter = await client.callTool({
    name: "nx_get_session_state",
    arguments: {},
  });
  assert.equal(draftingStructure.isError, undefined);
  const draftingStructured =
    draftingStructure.structuredContent as Record<string, unknown>;
  assert.equal(draftingStructured.adapterId, "nx12.0.2.9");
  assert.equal(draftingStructured.unsupportedReason, "");
  assert.equal(draftingStructured.draftingReadAvailable, true);
  assert.equal(draftingStructured.hasDrawingSheets, true);
  assert.equal(draftingStructured.sheetCount, 1);
  assert.equal(draftingStructured.returnedSheetCount, 1);
  assert.equal(draftingStructured.viewCount, 2);
  assert.equal(draftingStructured.returnedViewCount, 2);
  assert.equal(draftingStructured.draftingStructureTruncated, false);
  assert.equal(
    (draftingStructureRepeat.structuredContent as Record<string, unknown>)
      .draftingStructureFingerprint,
    draftingStructured.draftingStructureFingerprint,
  );
  const beforeDraftingState =
    draftingStateBefore.structuredContent as Record<string, unknown>;
  const afterDraftingState =
    draftingStateAfter.structuredContent as Record<string, unknown>;
  assert.deepEqual(
    {
      modified: afterDraftingState.modified,
      featureCount: afterDraftingState.featureCount,
      bodyCount: afterDraftingState.bodyCount,
      solidBodyCount: afterDraftingState.solidBodyCount,
    },
    {
      modified: beforeDraftingState.modified,
      featureCount: beforeDraftingState.featureCount,
      bodyCount: beforeDraftingState.bodyCount,
      solidBodyCount: beforeDraftingState.solidBodyCount,
    },
  );

  const sketchPreflight = await client.callTool({
    name: "nx_preflight_modeling",
    arguments: {
      plan: {
        operation: "create_rectangle_sketch",
        width: 70,
        height: 40,
        center: { x: 0, y: 0 },
        planeZ: 0,
        name: "MCP_PROFILE",
      },
    },
  });
  assert.equal(sketchPreflight.isError, undefined);
  const sketchBaseline = (
    sketchPreflight.structuredContent as Record<string, unknown>
  ).baseline as Record<string, unknown>;

  const sketch = await client.callTool({
    name: "nx_create_rectangle_sketch",
    arguments: {
      width: 70,
      height: 40,
      center: { x: 0, y: 0 },
      planeZ: 0,
      name: "MCP_PROFILE",
    },
  });
  assert.equal(sketch.isError, undefined);
  assert.match(
    String(
      (sketch.structuredContent as Record<string, unknown>).transactionId,
    ),
    /^TX-/,
  );

  const sketchVerification = await client.callTool({
    name: "nx_verify_modeling_result",
    arguments: {
      operation: "create_rectangle_sketch",
      baseline: sketchBaseline,
      transactionId: String(
        (sketch.structuredContent as Record<string, unknown>).transactionId,
      ),
      featureJournalIdentifier: String(
        (sketch.structuredContent as Record<string, unknown>)
          .featureJournalIdentifier,
      ),
      screenshotFilePath: path.join(tempDirectory, "sketch-evidence.png"),
    },
  });
  assert.equal(sketchVerification.isError, undefined);
  assert.equal(
    (sketchVerification.structuredContent as Record<string, unknown>)
      .verificationPassed,
    true,
  );

  const extrudePreflight = await client.callTool({
    name: "nx_preflight_modeling",
    arguments: {
      plan: {
        operation: "extrude_sketch",
        sketchFeatureJournalIdentifier: String(
          (sketch.structuredContent as Record<string, unknown>)
            .featureJournalIdentifier,
        ),
        distance: 15,
        name: "MCP_EXTRUDE",
      },
    },
  });
  assert.equal(extrudePreflight.isError, undefined);
  const extrudeBaseline = (
    extrudePreflight.structuredContent as Record<string, unknown>
  ).baseline as Record<string, unknown>;

  const extrude = await client.callTool({
    name: "nx_extrude_sketch",
    arguments: {
      sketchFeatureJournalIdentifier: String(
        (sketch.structuredContent as Record<string, unknown>)
          .featureJournalIdentifier,
      ),
      distance: 15,
      name: "MCP_EXTRUDE",
    },
  });
  assert.equal(extrude.isError, undefined);

  const extrudeVerification = await client.callTool({
    name: "nx_verify_modeling_result",
    arguments: {
      operation: "extrude_sketch",
      baseline: extrudeBaseline,
      transactionId: String(
        (extrude.structuredContent as Record<string, unknown>).transactionId,
      ),
      featureJournalIdentifier: String(
        (extrude.structuredContent as Record<string, unknown>)
          .featureJournalIdentifier,
      ),
      screenshotFilePath: path.join(tempDirectory, "extrude-evidence.png"),
      expected: {
        boundingBox: {
          minX: -35,
          minY: -20,
          minZ: 0,
          maxX: 35,
          maxY: 20,
          maxZ: 15,
          sizeX: 70,
          sizeY: 40,
          sizeZ: 15,
        },
        surfaceArea: 8_900,
        volume: 42_000,
        centroid: { x: 0, y: 0, z: 7.5 },
      },
    },
  });
  assert.equal(extrudeVerification.isError, undefined);
  assert.equal(
    (extrudeVerification.structuredContent as Record<string, unknown>)
      .verificationPassed,
    true,
  );

  const measurement = await client.callTool({
    name: "nx_measure_work_part",
    arguments: {},
  });
  assert.equal(measurement.isError, undefined);
  assert.equal(
    (measurement.structuredContent as Record<string, unknown>).volume,
    42_000,
  );

  const rejectedHole = await client.callTool({
    name: "nx_create_simple_through_hole",
    arguments: {
      diameter: 10,
      center: { x: 34, y: 0 },
    },
  });
  assert.equal(rejectedHole.isError, true);

  const hole = await client.callTool({
    name: "nx_create_simple_through_hole",
    arguments: {
      diameter: 10,
      center: { x: 0, y: 0 },
      name: "MCP_THROUGH_HOLE",
    },
  });
  assert.equal(hole.isError, undefined);
  assert.equal(
    (hole.structuredContent as Record<string, unknown>).bodyCount,
    1,
  );
  const holedMeasurement = await client.callTool({
    name: "nx_measure_work_part",
    arguments: {},
  });
  assert.ok(
    Math.abs(
      Number(
        (holedMeasurement.structuredContent as Record<string, unknown>)
          .volume,
      ) -
        (42_000 - 375 * Math.PI),
    ) < 1e-9,
  );
  const undoneHole = await client.callTool({
    name: "nx_undo_transaction",
    arguments: {
      transactionId: String(
        (hole.structuredContent as Record<string, unknown>).transactionId,
      ),
    },
  });
  assert.equal(undoneHole.isError, undefined);

  const booleanTool = await client.callTool({
    name: "nx_create_block",
    arguments: {
      length: 10,
      width: 10,
      height: 25,
      origin: { x: 0, y: -5, z: -5 },
      name: "MCP_BOOLEAN_TOOL",
    },
  });
  assert.equal(booleanTool.isError, undefined);
  const booleanResult = await client.callTool({
    name: "nx_boolean_bodies",
    arguments: {
      operation: "SUBTRACT",
      targetFeatureJournalIdentifier: String(
        (extrude.structuredContent as Record<string, unknown>)
          .featureJournalIdentifier,
      ),
      toolFeatureJournalIdentifier: String(
        (booleanTool.structuredContent as Record<string, unknown>)
          .featureJournalIdentifier,
      ),
      name: "MCP_SUBTRACT",
    },
  });
  assert.equal(booleanResult.isError, undefined);
  assert.equal(
    (booleanResult.structuredContent as Record<string, unknown>).bodyCount,
    1,
  );
  const booleanMeasurement = await client.callTool({
    name: "nx_measure_work_part",
    arguments: {},
  });
  assert.equal(
    (booleanMeasurement.structuredContent as Record<string, unknown>).volume,
    40_500,
  );
  const undoneBoolean = await client.callTool({
    name: "nx_undo_transaction",
    arguments: {
      transactionId: String(
        (booleanResult.structuredContent as Record<string, unknown>)
          .transactionId,
      ),
    },
  });
  assert.equal(undoneBoolean.isError, undefined);
  const undoneBooleanTool = await client.callTool({
    name: "nx_undo_transaction",
    arguments: {
      transactionId: String(
        (booleanTool.structuredContent as Record<string, unknown>)
          .transactionId,
      ),
    },
  });
  assert.equal(undoneBooleanTool.isError, undefined);

  const rejectedFillet = await client.callTool({
    name: "nx_fillet_vertical_edges",
    arguments: {
      bodyFeatureJournalIdentifier: String(
        (extrude.structuredContent as Record<string, unknown>)
          .featureJournalIdentifier,
      ),
      radius: 20,
    },
  });
  assert.equal(rejectedFillet.isError, true);

  const fillet = await client.callTool({
    name: "nx_fillet_vertical_edges",
    arguments: {
      bodyFeatureJournalIdentifier: String(
        (extrude.structuredContent as Record<string, unknown>)
          .featureJournalIdentifier,
      ),
      radius: 5,
      name: "MCP_VERTICAL_FILLETS",
    },
  });
  assert.equal(fillet.isError, undefined);
  assert.equal(
    (fillet.structuredContent as Record<string, unknown>).bodyCount,
    1,
  );
  const filletMeasurement = await client.callTool({
    name: "nx_measure_work_part",
    arguments: {},
  });
  assert.ok(
    Math.abs(
      Number(
        (filletMeasurement.structuredContent as Record<string, unknown>)
          .volume,
      ) -
        (42_000 - 15 * 25 * (4 - Math.PI)),
    ) < 1e-9,
  );
  assert.ok(
    Math.abs(
      Number(
        (filletMeasurement.structuredContent as Record<string, unknown>)
          .surfaceArea,
      ) -
        (8_900 - 200 * (4 - Math.PI)),
    ) < 1e-9,
  );
  const undoneFillet = await client.callTool({
    name: "nx_undo_transaction",
    arguments: {
      transactionId: String(
        (fillet.structuredContent as Record<string, unknown>).transactionId,
      ),
    },
  });
  assert.equal(undoneFillet.isError, undefined);

  const revolveSketch = await client.callTool({
    name: "nx_create_rectangle_sketch",
    arguments: {
      width: 10,
      height: 20,
      center: { x: 15, y: 0 },
      planeZ: 0,
      name: "MCP_REVOLVE_PROFILE",
    },
  });
  assert.equal(revolveSketch.isError, undefined);

  const revolved = await client.callTool({
    name: "nx_revolve_sketch",
    arguments: {
      sketchFeatureJournalIdentifier: String(
        (revolveSketch.structuredContent as Record<string, unknown>)
          .featureJournalIdentifier,
      ),
      axis: {
        direction: "WCS_Y",
        origin: { x: 0, y: 0, z: 0 },
      },
      name: "MCP_FULL_REVOLVE",
    },
  });
  assert.equal(revolved.isError, undefined);
  assert.equal(
    (revolved.structuredContent as Record<string, unknown>).bodyCount,
    2,
  );

  const rejectedAxis = await client.callTool({
    name: "nx_revolve_sketch",
    arguments: {
      sketchFeatureJournalIdentifier: String(
        (revolveSketch.structuredContent as Record<string, unknown>)
          .featureJournalIdentifier,
      ),
      axis: {
        direction: "WCS_Z",
        origin: { x: 0, y: 0, z: 0 },
      },
    },
  });
  assert.equal(rejectedAxis.isError, true);

  const stepPath = path.join(tempDirectory, "mcp-export.step");
  const exported = await client.callTool({
    name: "nx_export_step",
    arguments: { filePath: stepPath, format: "AP214" },
  });
  assert.equal(exported.isError, undefined);
  assert.equal(
    (exported.structuredContent as Record<string, unknown>).exported,
    true,
  );
  assert.equal(
    (exported.structuredContent as Record<string, unknown>).stepFormat,
    "AP214",
  );

  const duplicateExport = await client.callTool({
    name: "nx_export_step",
    arguments: { filePath: stepPath, format: "AP214" },
  });
  assert.equal(duplicateExport.isError, true);

  const savedPath = path.join(tempDirectory, "mcp-saved.prt");
  const saved = await client.callTool({
    name: "nx_save_as",
    arguments: { filePath: savedPath },
  });
  assert.equal(saved.isError, undefined);
  assert.equal(
    (saved.structuredContent as Record<string, unknown>).saved,
    true,
  );

  const closed = await client.callTool({
    name: "nx_close_part",
    arguments: {},
  });
  assert.equal(closed.isError, undefined);
});

test("stdio MCP assembly tool fails closed with explicit adapter metadata when the license is inactive", async (context) => {
  const tempDirectory = await mkdtemp(
    path.join(os.tmpdir(), "nx-codex-mcp-assembly-unlicensed-"),
  );
  const sessionFile = path.join(tempDirectory, "session.json");
  const bridge = new MockBridge({
    sessionFile,
    licensedModules: { assembly: false },
    assemblyRoot: {
      instanceName: "MUST_NOT_BE_RETURNED",
      displayName: "blocked-fixture",
      prototypePartIdentifier: "blocked.prt",
      suppressed: false,
      loadState: "loaded",
      representationMode: "Exact",
    },
  });
  await bridge.start();
  context.after(async () => bridge.stop());

  const client = new Client({ name: "nx-codex-test", version: "0.1.0" });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.resolve("dist/mcp/index.mjs")],
    env: cleanEnvironment({ NX_CODEX_SESSION_FILE: sessionFile }),
    stderr: "pipe",
  });
  await client.connect(transport);
  context.after(async () => client.close());

  const before = await client.callTool({
    name: "nx_get_session_state",
    arguments: {},
  });
  const blocked = await client.callTool({
    name: "nx_get_assembly_structure",
    arguments: { maxDepth: 8, maxComponents: 128 },
  });
  const after = await client.callTool({
    name: "nx_get_session_state",
    arguments: {},
  });
  assert.equal(blocked.isError, undefined);
  const structured = blocked.structuredContent as Record<string, unknown>;
  assert.equal(structured.adapterId, "nx12.0.2.9");
  assert.equal(structured.assemblyReadAvailable, false);
  assert.equal(structured.licensed, false);
  assert.match(String(structured.unsupportedReason), /No assembly license is active/);
  assert.deepEqual(structured.components, []);
  assert.equal(JSON.stringify(structured).includes("MUST_NOT_BE_RETURNED"), false);
  assert.deepEqual(
    {
      modified: (after.structuredContent as Record<string, unknown>).modified,
      featureCount: (after.structuredContent as Record<string, unknown>)
        .featureCount,
      bodyCount: (after.structuredContent as Record<string, unknown>).bodyCount,
    },
    {
      modified: (before.structuredContent as Record<string, unknown>).modified,
      featureCount: (before.structuredContent as Record<string, unknown>)
        .featureCount,
      bodyCount: (before.structuredContent as Record<string, unknown>).bodyCount,
    },
  );
});

test("stdio MCP drafting tool fails closed before fixture reads when the license is inactive", async (context) => {
  const tempDirectory = await mkdtemp(
    path.join(os.tmpdir(), "nx-codex-mcp-drafting-unlicensed-"),
  );
  const sessionFile = path.join(tempDirectory, "session.json");
  const bridge = new MockBridge({
    sessionFile,
    licensedModules: { drafting: false },
    draftingSheets: [
      {
        journalIdentifier: "MUST_NOT_BE_RETURNED",
        name: "blocked-sheet",
        length: 420,
        height: 297,
        units: "Millimeters",
        projectionAngle: "FirstAngle",
        scaleNumerator: 1,
        scaleDenominator: 1,
        isOutOfDate: false,
      },
    ],
  });
  await bridge.start();
  context.after(async () => bridge.stop());

  const client = new Client({ name: "nx-codex-test", version: "0.1.0" });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.resolve("dist/mcp/index.mjs")],
    env: cleanEnvironment({ NX_CODEX_SESSION_FILE: sessionFile }),
    stderr: "pipe",
  });
  await client.connect(transport);
  context.after(async () => client.close());

  const before = await client.callTool({
    name: "nx_get_session_state",
    arguments: {},
  });
  const blocked = await client.callTool({
    name: "nx_get_drafting_structure",
    arguments: { maxSheets: 32, maxViews: 128 },
  });
  const after = await client.callTool({
    name: "nx_get_session_state",
    arguments: {},
  });
  assert.equal(blocked.isError, undefined);
  const structured = blocked.structuredContent as Record<string, unknown>;
  assert.equal(structured.adapterId, "nx12.0.2.9");
  assert.equal(structured.draftingReadAvailable, false);
  assert.equal(structured.licensed, false);
  assert.match(String(structured.unsupportedReason), /No drafting license is active/);
  assert.deepEqual(structured.sheets, []);
  assert.deepEqual(structured.views, []);
  assert.equal(JSON.stringify(structured).includes("MUST_NOT_BE_RETURNED"), false);
  assert.deepEqual(
    {
      modified: (after.structuredContent as Record<string, unknown>).modified,
      featureCount: (after.structuredContent as Record<string, unknown>)
        .featureCount,
      bodyCount: (after.structuredContent as Record<string, unknown>).bodyCount,
      solidBodyCount: (after.structuredContent as Record<string, unknown>)
        .solidBodyCount,
    },
    {
      modified: (before.structuredContent as Record<string, unknown>).modified,
      featureCount: (before.structuredContent as Record<string, unknown>)
        .featureCount,
      bodyCount: (before.structuredContent as Record<string, unknown>).bodyCount,
      solidBodyCount: (before.structuredContent as Record<string, unknown>)
        .solidBodyCount,
    },
  );
});
