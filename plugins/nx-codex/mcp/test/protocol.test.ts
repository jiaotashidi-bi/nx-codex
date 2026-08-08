import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  BridgeArgumentsSchema,
  BridgeRequestSchema,
  CaeCapabilityResultSchema,
  PROTOCOL_VERSION,
} from "../src/protocol.js";

function validRequest(): Record<string, unknown> {
  return {
    protocolVersion: PROTOCOL_VERSION,
    requestId: randomUUID(),
    operation: "health",
    token: "a".repeat(43),
    deadlineUtc: new Date(Date.now() + 10_000).toISOString(),
    arguments: {},
  };
}

test("bridge request accepts the fixed protocol shape", () => {
  assert.equal(BridgeRequestSchema.safeParse(validRequest()).success, true);
});

test("CAE capability protocol result is exactly six read-only fields", () => {
  const result = {
    available: true,
    licensed: false,
    applicationName: "UG_APP_GATEWAY",
    adapterId: "nx12.0.2.9",
    compatibilityStatus: "verified",
    unsupportedReason: "",
  } as const;

  assert.equal(CaeCapabilityResultSchema.safeParse(result).success, true);
  assert.deepEqual(Object.keys(result).sort(), [
    "adapterId",
    "applicationName",
    "available",
    "compatibilityStatus",
    "licensed",
    "unsupportedReason",
  ]);
  assert.equal(
    CaeCapabilityResultSchema.safeParse({
      ...result,
      application: "UG_APP_GATEWAY",
    }).success,
    false,
  );
  assert.equal(
    CaeCapabilityResultSchema.safeParse({
      ...result,
      available: false,
    }).success,
    false,
  );
});

test("C# bridge argument whitelist matches the TypeScript protocol", async () => {
  const source = await readFile(
    new URL("../../bridge/NXCodexBridge/JsonCodec.cs", import.meta.url),
    "utf8",
  );
  const whitelistBody =
    /ArgumentFields\s*=\s*new HashSet<string>\([^)]*\)\s*\{([\s\S]*?)\};/.exec(
      source,
    )?.[1];
  assert.ok(whitelistBody, "C# ArgumentFields whitelist was not found");

  const csharpFields = [...whitelistBody.matchAll(/"([^"]+)"/g)]
    .map((match) => match[1])
    .filter((field): field is string => field !== undefined)
    .sort();
  const typescriptFields = Object.keys(BridgeArgumentsSchema.shape).sort();
  assert.deepEqual(csharpFields, typescriptFields);
});

test("bridge request rejects unknown root fields", () => {
  const request = { ...validRequest(), dotNetType: "System.Diagnostics.Process" };
  assert.equal(BridgeRequestSchema.safeParse(request).success, false);
});

test("bridge request rejects unknown argument fields", () => {
  const request = {
    ...validRequest(),
    arguments: { runPython: "import os" },
  };
  assert.equal(BridgeRequestSchema.safeParse(request).success, false);
});

test("bridge request accepts the fixed file-operation fields", () => {
  const request = {
    ...validRequest(),
    operation: "new_part",
    arguments: {
      filePath: "C:\\NXFiles\\safe.prt",
      partUnits: "Millimeters",
    },
  };
  assert.equal(BridgeRequestSchema.safeParse(request).success, true);
});

test("bridge request rejects unsupported units and overlong paths", () => {
  const badUnits = {
    ...validRequest(),
    operation: "new_part",
    arguments: {
      filePath: "C:\\NXFiles\\safe.prt",
      partUnits: "Meters",
    },
  };
  assert.equal(BridgeRequestSchema.safeParse(badUnits).success, false);

  const overlong = {
    ...validRequest(),
    operation: "open_part",
    arguments: { filePath: `C:\\${"x".repeat(241)}.prt` },
  };
  assert.equal(BridgeRequestSchema.safeParse(overlong).success, false);
});

test("assembly read arguments are strictly bounded", () => {
  const valid = {
    ...validRequest(),
    operation: "get_assembly_structure",
    arguments: { maxDepth: 8, maxComponents: 128 },
  };
  assert.equal(BridgeRequestSchema.safeParse(valid).success, true);
  assert.equal(
    BridgeRequestSchema.safeParse({
      ...valid,
      arguments: { maxDepth: 33, maxComponents: 128 },
    }).success,
    false,
  );
  assert.equal(
    BridgeRequestSchema.safeParse({
      ...valid,
      arguments: { maxDepth: 8, maxComponents: 129 },
    }).success,
    false,
  );
  assert.equal(
    BridgeRequestSchema.safeParse({
      ...valid,
      arguments: { maxDepth: 8, maxComponents: 8, loadComponents: true },
    }).success,
    false,
  );
  assert.equal(
    BridgeRequestSchema.safeParse({
      ...valid,
      operation: "add_component",
      arguments: {},
    }).success,
    false,
  );
});

test("drafting read arguments are strictly bounded", () => {
  const valid = {
    ...validRequest(),
    operation: "get_drafting_structure",
    arguments: { maxSheets: 32, maxViews: 128 },
  };
  assert.equal(BridgeRequestSchema.safeParse(valid).success, true);
  assert.equal(
    BridgeRequestSchema.safeParse({
      ...valid,
      arguments: { maxSheets: 65, maxViews: 128 },
    }).success,
    false,
  );
  assert.equal(
    BridgeRequestSchema.safeParse({
      ...valid,
      arguments: { maxSheets: 32, maxViews: 129 },
    }).success,
    false,
  );
  assert.equal(
    BridgeRequestSchema.safeParse({
      ...valid,
      arguments: { maxSheets: 32, maxViews: 128, openSheet: true },
    }).success,
    false,
  );
  assert.equal(
    BridgeRequestSchema.safeParse({
      ...valid,
      operation: "create_drawing_sheet",
      arguments: {},
    }).success,
    false,
  );
});

test("bridge request accepts only the bounded stage 2 modeling fields", () => {
  const sketch = {
    ...validRequest(),
    operation: "create_rectangle_sketch",
    arguments: {
      profileWidth: 70,
      profileHeight: 40,
      centerX: 0,
      centerY: 0,
      planeZ: 0,
      name: "BASE_PROFILE",
    },
  };
  assert.equal(BridgeRequestSchema.safeParse(sketch).success, true);

  const extrude = {
    ...validRequest(),
    operation: "extrude_sketch",
    arguments: {
      sketchFeatureJournalIdentifier: "SKETCH(1)",
      distance: 15,
    },
  };
  assert.equal(BridgeRequestSchema.safeParse(extrude).success, true);

  const revolve = {
    ...validRequest(),
    operation: "revolve_sketch",
    arguments: {
      sketchFeatureJournalIdentifier: "SKETCH(1)",
      axisDirection: "WCS_Y",
      axisOriginX: 0,
      axisOriginY: 0,
      axisOriginZ: 0,
      name: "FULL_REVOLVE",
    },
  };
  assert.equal(BridgeRequestSchema.safeParse(revolve).success, true);

  const hole = {
    ...validRequest(),
    operation: "create_simple_through_hole",
    arguments: {
      holeCenterX: 10,
      holeCenterY: 5,
      holeDiameter: 10,
      name: "THROUGH_HOLE",
    },
  };
  assert.equal(BridgeRequestSchema.safeParse(hole).success, true);

  const boolean = {
    ...validRequest(),
    operation: "boolean_bodies",
    arguments: {
      booleanOperation: "SUBTRACT",
      targetFeatureJournalIdentifier: "BLOCK(1)",
      toolFeatureJournalIdentifier: "BLOCK(2)",
      name: "CUT_SLOT",
    },
  };
  assert.equal(BridgeRequestSchema.safeParse(boolean).success, true);

  const fillet = {
    ...validRequest(),
    operation: "fillet_vertical_edges",
    arguments: {
      bodyFeatureJournalIdentifier: "EXTRUDE(2)",
      filletRadius: 5,
      name: "VERTICAL_FILLETS",
    },
  };
  assert.equal(BridgeRequestSchema.safeParse(fillet).success, true);

  const preflight = {
    ...validRequest(),
    operation: "preflight_modeling",
    arguments: {
      ...boolean.arguments,
      plannedOperation: "boolean_bodies",
    },
  };
  assert.equal(BridgeRequestSchema.safeParse(preflight).success, true);

  assert.equal(
    BridgeRequestSchema.safeParse({
      ...sketch,
      arguments: { ...sketch.arguments, planeNormal: [0, 0, 1] },
    }).success,
    false,
  );
  assert.equal(
    BridgeRequestSchema.safeParse({
      ...extrude,
      arguments: { ...extrude.arguments, distance: Number.POSITIVE_INFINITY },
    }).success,
    false,
  );
  assert.equal(
    BridgeRequestSchema.safeParse({
      ...revolve,
      arguments: { ...revolve.arguments, axisDirection: "ARBITRARY_VECTOR" },
    }).success,
    false,
  );
  assert.equal(
    BridgeRequestSchema.safeParse({
      ...revolve,
      arguments: {
        ...revolve.arguments,
        axisVector: [0, 1, 0],
      },
    }).success,
    false,
  );
  assert.equal(
    BridgeRequestSchema.safeParse({
      ...hole,
      arguments: {
        center: { x: 10, y: 5 },
        holeDiameter: 10,
      },
    }).success,
    false,
  );
  assert.equal(
    BridgeRequestSchema.safeParse({
      ...hole,
      arguments: { ...hole.arguments, holeDiameter: 0 },
    }).success,
    false,
  );
  assert.equal(
    BridgeRequestSchema.safeParse({
      ...boolean,
      arguments: {
        ...boolean.arguments,
        booleanOperation: "XOR",
      },
    }).success,
    false,
  );
  assert.equal(
    BridgeRequestSchema.safeParse({
      ...boolean,
      arguments: {
        ...boolean.arguments,
        targetBodyTag: 1234,
      },
    }).success,
    false,
  );
  assert.equal(
    BridgeRequestSchema.safeParse({
      ...fillet,
      arguments: { ...fillet.arguments, filletRadius: 0 },
    }).success,
    false,
  );
  assert.equal(
    BridgeRequestSchema.safeParse({
      ...fillet,
      arguments: { ...fillet.arguments, edgeTags: [1, 2, 3, 4] },
    }).success,
    false,
  );
});
