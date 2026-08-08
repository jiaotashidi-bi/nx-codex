import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v4";

import { BridgeClient } from "./bridge-client.js";
import {
  BridgeOperationError,
  BridgeProtocolError,
  BridgeUnavailableError,
  publicErrorMessage,
} from "./errors.js";
import {
  validatePartPath,
  validatePngPath,
  validateStepPath,
} from "./path-policy.js";
import type { BridgeResult } from "./protocol.js";
import {
  ExpectedMeasurementsSchema,
  ModelingOperationSchema,
  ModelingPlanSchema,
  VerificationBaselineSchema,
  expectedCountDeltas,
  measurementChecks,
  modelingPlanToBridgeArguments,
} from "./stage4.js";

const TOOL_INSTRUCTIONS = [
  "Call nx_health before relying on a live NX session.",
  "Require compatibilityStatus=verified and a known adapterId before any mutation; an unsupported NX version is read-only.",
  "Read session state before a modeling mutation.",
  "Create an explicit typed plan and call nx_preflight_modeling immediately before every modeling mutation; repeat preflight if NX state changes.",
  "Geometry mutations require a returned transaction ID; file operations require an explicit success flag.",
  "Sketch creation is limited to a rectangular profile on an absolute XY plane; extrusion and full revolve create new solids only; the simple through-hole adapter cuts the unique solid from its unique absolute-Z top face through its bottom face; Boolean operations require two explicit current-body feature identifiers and positive-volume overlap; vertical-edge fillet requires one explicit current-body feature identifier and exactly four full-height linear edges parallel to absolute WCS Z.",
  "Use nx_measure_work_part after modeling and compare its explicit units, exact bounding box, area, volume, and centroid with the plan.",
  "Use nx_verify_modeling_result after a modeling mutation to combine the post-state, exact measurement, feature tree, and no-overwrite PNG screenshot evidence.",
  "Part files are restricted to configured allowed roots and .prt files; STEP exports use .stp/.step and never overwrite.",
  "Never overwrite an existing file or discard unsaved changes.",
  "Use nx_undo_transaction only with a transaction ID returned by this bridge.",
  "Assembly structure reads require an already-active assembly license; never reserve or release a license or switch NX applications to probe availability.",
  "Drafting structure reads require an already-active drafting license and return only bounded sheet/view metadata; never reserve or release a license, switch applications, open sheets, update views, or create annotations.",
  "CAE capability is a strict six-field read-only result: available, licensed, applicationName, adapterId, compatibilityStatus, and unsupportedReason. Never reserve or release a license, switch applications, create FEM/SIM data, mesh, solve, or save.",
  "The protected test-drawing mutation requires an exact saved and unmodified millimeter work/display-part path under policy, Drafting already active, an already-active drafting license, and zero existing sheets/views; it creates exactly one fixed A4 sheet plus one base view using fixed ratio and placement requests in a visible undo transaction, reports the actual values accepted by NX, and never saves or explicitly updates the drawing.",
].join(" ");

function result(
  data: Record<string, unknown>,
  isError = false,
): {
  content: Array<{ type: "text"; text: string }>;
  structuredContent: Record<string, unknown>;
  isError?: boolean;
} {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
    structuredContent: data,
    ...(isError ? { isError: true } : {}),
  };
}

function bridgeResult(data: BridgeResult) {
  return result(data);
}

function toolError(error: unknown) {
  return result(
    {
      ok: false,
      error: publicErrorMessage(error),
    },
    true,
  );
}

export function buildServer(
  client: BridgeClient = new BridgeClient(),
): McpServer {
  const server = new McpServer(
    {
      name: "nx-codex",
      version: "1.0.0-rc.1+codex.rc1",
    },
    {
      instructions: TOOL_INSTRUCTIONS,
    },
  );

  server.registerTool(
    "nx_health",
    {
      title: "NX bridge health",
      description:
        "Check whether a local Siemens NX bridge is available. This is read-only and returns connected=false instead of failing when NX is closed.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        return bridgeResult(await client.call("health"));
      } catch (error) {
        if (error instanceof BridgeUnavailableError) {
          return result({
            connected: false,
            status: "unavailable",
            message: error.message,
          });
        }
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "nx_get_capabilities",
    {
      title: "NX bridge capabilities",
      description:
        "List the operations supported by the connected NX bridge and report bridge/NX versions, exact NXOpen assembly version, adapter ID, adapter contract, and compatibility status. Read-only.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        return bridgeResult(await client.call("get_capabilities"));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "nx_get_session_state",
    {
      title: "Read NX session state",
      description:
        "Read the current work/display part, units, modification state, feature count, and body count. Does not modify NX.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        return bridgeResult(await client.call("get_session_state"));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "nx_get_assembly_capability",
    {
      title: "Detect NX assembly capability and active license",
      description:
        "Read whether the connected NX adapter supports assembly workflows and whether an assembly license is already active in the current NX session. Does not reserve or release licenses and does not create assembly data.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        return bridgeResult(await client.call("get_assembly_capability"));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "nx_get_assembly_structure",
    {
      title: "Read bounded NX assembly structure",
      description:
        "Read whether the current work part is an assembly and, when an assembly license is already active, return its root component plus a bounded breadth-first component hierarchy with instance name, prototype part identifier, suppression state, load state, representation mode, child count, totals, truncation flags, and a structure fingerprint. Defaults to depth 8 and at most 128 component occurrences. Every semantic result includes adapterId and unsupportedReason. Fails closed without calling component-tree APIs when no assembly license is active. Never reserves or releases licenses, switches applications, loads components, modifies assembly data, saves, or exports.",
      inputSchema: {
        maxDepth: z.number().int().min(0).max(32).default(8),
        maxComponents: z.number().int().min(1).max(128).default(128),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ maxDepth, maxComponents }) => {
      let adapterId = "unsupported:unknown";
      try {
        const capabilities = await client.call("get_capabilities");
        adapterId = capabilities.adapterId ?? adapterId;
        if (
          capabilities.compatibilityStatus !== "verified" ||
          adapterId !== "nx12.0.2.9" ||
          capabilities.capabilities?.includes("get_assembly_structure") !== true
        ) {
          return result(
            {
              adapterId,
              unsupportedReason:
                "The connected bridge does not advertise the exact NX 12.0.2.9 bounded assembly-read contract.",
              assemblyReadAvailable: false,
              components: [],
              componentCount: 0,
              returnedComponentCount: 0,
              componentCountComplete: false,
              maxDepth,
              maxComponents,
            },
            true,
          );
        }
        return bridgeResult(
          await client.call("get_assembly_structure", {
            maxDepth,
            maxComponents,
          }),
        );
      } catch (error) {
        return result(
          {
            ok: false,
            adapterId,
            unsupportedReason: publicErrorMessage(error),
            assemblyReadAvailable: false,
            components: [],
            componentCount: 0,
            returnedComponentCount: 0,
            componentCountComplete: false,
            maxDepth,
            maxComponents,
          },
          true,
        );
      }
    },
  );

  server.registerTool(
    "nx_get_drafting_capability",
    {
      title: "Detect NX drafting capability and active license",
      description:
        "Read whether the connected NX adapter supports drafting workflows and whether a drafting license is already active in the current NX session. Does not reserve or release licenses and does not create sheets, views, or annotations.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        return bridgeResult(await client.call("get_drafting_capability"));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "nx_get_drafting_structure",
    {
      title: "Read bounded NX drafting structure",
      description:
        "Read bounded drawing-sheet and drafting-view metadata when a drafting license is already active. Returns sheet names, identifiers, dimensions, units, projection angle, scale, out-of-date state, view names, scale/origin/status flags, exact-or-lower-bound counts, truncation flags, and a stable fingerprint. Defaults to 32 sheets and 128 views. Fails closed before any sheet/view API when no drafting license is active. Never reserves/releases a license, switches applications, opens sheets, updates views, creates annotations, modifies the part, saves, or exports.",
      inputSchema: {
        maxSheets: z.number().int().min(1).max(64).default(32),
        maxViews: z.number().int().min(1).max(128).default(128),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ maxSheets, maxViews }) => {
      let adapterId = "unsupported:unknown";
      try {
        const capabilities = await client.call("get_capabilities");
        adapterId = capabilities.adapterId ?? adapterId;
        if (
          capabilities.compatibilityStatus !== "verified" ||
          adapterId !== "nx12.0.2.9" ||
          capabilities.capabilities?.includes("get_drafting_structure") !== true
        ) {
          return result(
            {
              adapterId,
              unsupportedReason:
                "The connected bridge does not advertise the exact NX 12.0.2.9 bounded drafting-read contract.",
              draftingReadAvailable: false,
              sheets: [],
              views: [],
              sheetCount: 0,
              returnedSheetCount: 0,
              sheetCountComplete: false,
              viewCount: 0,
              returnedViewCount: 0,
              viewCountComplete: false,
              maxSheets,
              maxViews,
            },
            true,
          );
        }
        return bridgeResult(
          await client.call("get_drafting_structure", {
            maxSheets,
            maxViews,
          }),
        );
      } catch (error) {
        return result(
          {
            ok: false,
            adapterId,
            unsupportedReason: publicErrorMessage(error),
            draftingReadAvailable: false,
            sheets: [],
            views: [],
            sheetCount: 0,
            returnedSheetCount: 0,
            sheetCountComplete: false,
            viewCount: 0,
            returnedViewCount: 0,
            viewCountComplete: false,
            maxSheets,
            maxViews,
          },
          true,
        );
      }
    },
  );

  server.registerTool(
    "nx_create_test_drawing",
    {
      title: "Create one protected NX test drawing",
      description:
        "Create exactly one fixed A4 millimeter sheet named NX_CODEX_TEST_A4 and one base view from the current model work view using fixed 1:1-ratio and center-placement requests. NX may report a derived actual view scale or origin, which the tool returns for verification. Requires the exact expected saved and unmodified work/display-part path under policy, Drafting already active, an already-active drafting license, and zero existing sheets/views. Uses one visible undo transaction, rolls back on failure, never switches applications, never reserves/releases a license, never creates annotations, never explicitly updates the drawing, and never saves.",
      inputSchema: {
        expectedWorkPartPath: z.string().trim().min(1).max(240),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ expectedWorkPartPath }) => {
      try {
        const canonicalPath = await validatePartPath(
          expectedWorkPartPath,
          "open",
        );
        const capabilities = await client.call("get_capabilities");
        if (
          capabilities.compatibilityStatus !== "verified" ||
          capabilities.adapterId !== "nx12.0.2.9" ||
          capabilities.capabilities?.includes("create_test_drawing") !== true
        ) {
          return result(
            {
              ok: false,
              adapterId: capabilities.adapterId ?? "unsupported:unknown",
              error:
                "The connected bridge does not advertise the exact NX 12.0.2.9 protected test-drawing contract.",
            },
            true,
          );
        }

        const state = await client.call("get_session_state");
        if (
          state.workPart === undefined ||
          state.displayPart === undefined ||
          state.workPart.toLocaleLowerCase("en-US") !==
            canonicalPath.toLocaleLowerCase("en-US") ||
          state.displayPart.toLocaleLowerCase("en-US") !==
            canonicalPath.toLocaleLowerCase("en-US") ||
          state.modified !== false ||
          state.units !== "Millimeters" ||
          state.application?.toLocaleUpperCase("en-US").includes("DRAFT") !==
            true
        ) {
          return result(
            {
              ok: false,
              error:
                "The exact expected millimeter copy must be both work and display part, saved and unmodified, with Drafting already active.",
              expectedWorkPartPath: canonicalPath,
              state,
            },
            true,
          );
        }

        const draftingCapability = await client.call(
          "get_drafting_capability",
        );
        if (
          draftingCapability.available !== true ||
          draftingCapability.licensed !== true
        ) {
          return result(
            {
              ok: false,
              error:
                "An already-active drafting license is required; no license was reserved or released.",
              draftingCapability,
            },
            true,
          );
        }

        const structure = await client.call("get_drafting_structure", {
          maxSheets: 1,
          maxViews: 1,
        });
        if (
          structure.draftingReadAvailable !== true ||
          structure.sheetCount !== 0 ||
          structure.viewCount !== 0
        ) {
          return result(
            {
              ok: false,
              error:
                "The protected copy must contain zero drawing sheets and zero drafting views.",
              structure,
            },
            true,
          );
        }

        return bridgeResult(
          await client.call("create_test_drawing", {
            filePath: canonicalPath,
          }),
        );
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "nx_get_cae_capability",
    {
      title: "Detect NX CAE capability and active license",
      description:
        "Read whether the connected NX adapter supports CAE workflows and whether a CAE license is already active in the current NX session. Strictly returns available, licensed, applicationName, adapterId, compatibilityStatus, and unsupportedReason. Does not reserve or release licenses, switch applications, create FEM/SIM data, mesh, solve, or save.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        return bridgeResult(await client.call("get_cae_capability"));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "nx_get_cam_capability",
    {
      title: "Detect NX CAM capability and active license",
      description:
        "Read whether the connected NX adapter supports CAM workflows and whether a CAM license is already active in the current NX session. Does not reserve or release licenses, initialize CAM, create operations, generate paths, or postprocess.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        return bridgeResult(await client.call("get_cam_capability"));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "nx_preflight_modeling",
    {
      title: "Preflight a typed NX modeling plan",
      description:
        "Validate one explicit bounded modeling plan against bridge health, exact NXOpen compatibility, advertised capabilities, current work-part units/state, feature identifiers, and operation-specific geometry constraints. This does not execute the plan.",
      inputSchema: {
        plan: ModelingPlanSchema,
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ plan }) => {
      try {
        const health = await client.call("health");
        if (health.connected !== true) {
          throw new BridgeProtocolError("NX bridge is not connected.");
        }
        const capabilities = await client.call("get_capabilities");
        if (
          capabilities.compatibilityStatus !== "verified" ||
          capabilities.adapterId?.startsWith("unsupported:") !== false ||
          capabilities.adapterContractId === undefined ||
          capabilities.adapterContractId === "none" ||
          capabilities.capabilities?.includes(plan.operation) !== true ||
          capabilities.capabilities?.includes("preflight_modeling") !== true
        ) {
          throw new BridgeOperationError(
            "PREFLIGHT_COMPATIBILITY_BLOCKED",
            "The connected NX version, adapter contract, or planned capability is not verified.",
            false,
          );
        }
        const before = await client.call("get_session_state");
        if (
          before.workPart === undefined ||
          before.displayPart === undefined ||
          before.workPart !== before.displayPart
        ) {
          throw new BridgeOperationError(
            "PREFLIGHT_PART_STATE_INVALID",
            "Preflight requires one work part that is also the displayed part.",
            false,
          );
        }
        if (before.units !== "Millimeters" && before.units !== "Inches") {
          throw new BridgeOperationError(
            "PREFLIGHT_UNITS_UNKNOWN",
            "Preflight requires explicit Millimeters or Inches work-part units.",
            false,
          );
        }
        const preflight = await client.call(
          "preflight_modeling",
          modelingPlanToBridgeArguments(plan),
        );
        if (
          preflight.preflightPassed !== true ||
          preflight.preflightId === undefined ||
          preflight.featureTreeFingerprint === undefined ||
          preflight.workPart === undefined ||
          preflight.units === undefined ||
          preflight.modified === undefined ||
          preflight.featureCount === undefined ||
          preflight.bodyCount === undefined ||
          preflight.solidBodyCount === undefined
        ) {
          throw new BridgeProtocolError(
            "NX bridge returned an incomplete modeling preflight.",
          );
        }
        return result({
          preflightPassed: true,
          plan,
          expectedDeltas: expectedCountDeltas(plan.operation),
          compatibility: {
            nxOpenAssemblyVersion: capabilities.nxOpenAssemblyVersion,
            adapterId: capabilities.adapterId,
            adapterContractId: capabilities.adapterContractId,
          },
          baseline: {
            preflightId: preflight.preflightId,
            workPart: preflight.workPart,
            units: preflight.units,
            modified: preflight.modified,
            featureCount: preflight.featureCount,
            bodyCount: preflight.bodyCount,
            solidBodyCount: preflight.solidBodyCount,
            featureTreeFingerprint: preflight.featureTreeFingerprint,
          },
          preflightUtc: preflight.preflightUtc,
          featureTreeTotalCount: preflight.featureTreeTotalCount,
          featureTreeTruncated: preflight.featureTreeTruncated,
          message:
            "Preflight passed. Execute this exact plan next, or repeat preflight if NX state changes.",
        });
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "nx_get_feature_tree",
    {
      title: "Read the NX work-part feature tree",
      description:
        "Read ordered feature identifiers, names, types, timestamps, suppression state, parent links, and a SHA-256 fingerprint of the complete work-part feature tree. Responses contain at most the latest 128 nodes and report truncation. Does not modify NX.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        return bridgeResult(await client.call("get_feature_tree"));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "nx_capture_screenshot",
    {
      title: "Capture NX screenshot evidence",
      description:
        "Capture the current NX graphics area to a policy-approved absolute .png path. The destination must not exist; the bridge stages the image, verifies its PNG signature and unchanged work-part modified state, atomically moves it, and returns byte size plus SHA-256.",
      inputSchema: {
        filePath: z.string().trim().min(1).max(240),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ filePath }) => {
      try {
        const canonicalPath = await validatePngPath(filePath);
        return bridgeResult(
          await client.call("capture_screenshot", {
            filePath: canonicalPath,
          }),
        );
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "nx_verify_modeling_result",
    {
      title: "Jointly verify an NX modeling result",
      description:
        "After one modeling transaction, jointly verify work-part identity and units, operation-specific feature/body count deltas, exact measurements and toleranced planned values, the created feature in the feature tree, and no-overwrite PNG screenshot evidence. Returns individual checks and an overall pass/fail without saving the part.",
      inputSchema: {
        operation: ModelingOperationSchema,
        baseline: VerificationBaselineSchema,
        transactionId: z.string().trim().regex(/^TX-[A-Za-z0-9-]+$/).max(128),
        featureJournalIdentifier: z.string().trim().min(1).max(1024),
        screenshotFilePath: z.string().trim().min(1).max(240),
        expected: ExpectedMeasurementsSchema.optional(),
        linearTolerance: z.number().positive().max(1).default(0.000001),
        propertyRelativeTolerance: z
          .number()
          .positive()
          .max(0.1)
          .default(0.000001),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({
      operation,
      baseline,
      transactionId,
      featureJournalIdentifier,
      screenshotFilePath,
      expected,
      linearTolerance,
      propertyRelativeTolerance,
    }) => {
      try {
        const canonicalScreenshot = await validatePngPath(screenshotFilePath);
        const capabilities = await client.call("get_capabilities");
        if (
          capabilities.compatibilityStatus !== "verified" ||
          capabilities.adapterId?.startsWith("unsupported:") !== false ||
          capabilities.adapterContractId === undefined ||
          capabilities.adapterContractId === "none"
        ) {
          throw new BridgeOperationError(
            "VERIFICATION_COMPATIBILITY_BLOCKED",
            "Joint verification requires a verified typed NX adapter contract.",
            false,
          );
        }

        const delta = expectedCountDeltas(operation);
        if (!delta.requiresMeasurement && expected !== undefined) {
          throw new BridgeOperationError(
            "MEASUREMENT_NOT_APPLICABLE",
            "A standalone rectangular-sketch verification cannot assert solid measurements.",
            false,
          );
        }
        const state = await client.call("get_session_state");
        const tree = await client.call("get_feature_tree");
        const measurement = delta.requiresMeasurement
          ? await client.call("measure_work_part")
          : undefined;
        const screenshot = await client.call("capture_screenshot", {
          filePath: canonicalScreenshot,
        });

        const checks: Array<{
          check: string;
          passed: boolean;
          expected: unknown;
          observed: unknown;
        }> = [];
        const add = (
          check: string,
          expectedValue: unknown,
          observed: unknown,
          passed: boolean,
        ): void => {
          checks.push({ check, passed, expected: expectedValue, observed });
        };
        add("transactionId", "non-empty NX Codex transaction", transactionId, transactionId.length > 3);
        add("workPart", baseline.workPart, state.workPart, state.workPart === baseline.workPart);
        add("displayPart", baseline.workPart, state.displayPart, state.displayPart === baseline.workPart);
        add("units", baseline.units, state.units, state.units === baseline.units);
        add(
          "featureCount",
          baseline.featureCount + delta.featureDelta,
          state.featureCount,
          state.featureCount === baseline.featureCount + delta.featureDelta,
        );
        add(
          "bodyCount",
          baseline.bodyCount + delta.bodyDelta,
          state.bodyCount,
          state.bodyCount === baseline.bodyCount + delta.bodyDelta,
        );
        add(
          "solidBodyCount",
          baseline.solidBodyCount + delta.bodyDelta,
          state.solidBodyCount,
          state.solidBodyCount === baseline.solidBodyCount + delta.bodyDelta,
        );
        add(
          "featureTreeFingerprintChanged",
          `different from ${baseline.featureTreeFingerprint}`,
          tree.featureTreeFingerprint,
          tree.featureTreeFingerprint !== undefined &&
            tree.featureTreeFingerprint !== baseline.featureTreeFingerprint,
        );
        add(
          "featureTreeCountMatchesSession",
          state.featureCount,
          tree.featureTreeTotalCount,
          tree.featureTreeTotalCount === state.featureCount,
        );
        const createdFeature = tree.features?.find(
          (feature) =>
            feature.journalIdentifier === featureJournalIdentifier,
        );
        add(
          "createdFeaturePresent",
          featureJournalIdentifier,
          createdFeature?.journalIdentifier,
          createdFeature !== undefined,
        );
        add(
          "createdFeatureActive",
          false,
          createdFeature?.suppressed,
          createdFeature?.suppressed === false,
        );

        if (measurement !== undefined) {
          const measurementValues = [
            measurement.boundingBoxMinX,
            measurement.boundingBoxMinY,
            measurement.boundingBoxMinZ,
            measurement.boundingBoxMaxX,
            measurement.boundingBoxMaxY,
            measurement.boundingBoxMaxZ,
            measurement.boundingBoxSizeX,
            measurement.boundingBoxSizeY,
            measurement.boundingBoxSizeZ,
            measurement.surfaceArea,
            measurement.volume,
            measurement.centroidX,
            measurement.centroidY,
            measurement.centroidZ,
          ];
          add(
            "measurementComplete",
            "14 finite bounding-box and mass-property values",
            measurementValues,
            measurementValues.every(
              (value) => typeof value === "number" && Number.isFinite(value),
            ),
          );
          add(
            "measurementWorkPart",
            state.workPart,
            measurement.workPart,
            measurement.workPart === state.workPart,
          );
          add(
            "measurementDidNotChangeModifiedState",
            state.modified,
            measurement.modified,
            measurement.modified === state.modified,
          );
          add(
            "measurementUnits",
            baseline.units,
            measurement.measurementUnits,
            measurement.measurementUnits === baseline.units,
          );
          add(
            "measuredBodyCount",
            state.solidBodyCount,
            measurement.measuredBodyCount,
            measurement.measuredBodyCount === state.solidBodyCount,
          );
          checks.push(
            ...measurementChecks(
              measurement,
              expected,
              linearTolerance,
              propertyRelativeTolerance,
            ),
          );
        }
        add(
          "featureTreeDidNotChangeModifiedState",
          state.modified,
          tree.modified,
          tree.modified === state.modified,
        );
        add(
          "featureTreeWorkPart",
          state.workPart,
          tree.workPart,
          tree.workPart === state.workPart,
        );
        add("screenshotCaptured", true, screenshot.captured, screenshot.captured === true);
        add(
          "screenshotPath",
          canonicalScreenshot,
          screenshot.filePath,
          screenshot.filePath?.toLocaleLowerCase("en-US") ===
            canonicalScreenshot.toLocaleLowerCase("en-US"),
        );
        add(
          "screenshotNonEmpty",
          "positive PNG byte count",
          screenshot.screenshotBytes,
          typeof screenshot.screenshotBytes === "number" &&
            screenshot.screenshotBytes > 0,
        );
        add(
          "screenshotWorkPart",
          state.workPart,
          screenshot.workPart,
          screenshot.workPart === state.workPart,
        );
        add(
          "screenshotDidNotChangeModifiedState",
          state.modified,
          screenshot.modified,
          screenshot.modified === state.modified,
        );
        add(
          "screenshotSha256",
          "64 hexadecimal characters",
          screenshot.screenshotSha256,
          /^[A-Fa-f0-9]{64}$/.test(screenshot.screenshotSha256 ?? ""),
        );

        return result({
          verificationPassed: checks.every((check) => check.passed),
          operation,
          preflightId: baseline.preflightId,
          transactionId,
          featureJournalIdentifier,
          checks,
          sessionState: state,
          measurement: measurement ?? null,
          featureTree: tree,
          screenshot,
          partSaved: false,
          message:
            "Joint verification completed. The NX work part was not saved.",
        });
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "nx_new_part",
    {
      title: "Create a new NX part",
      description:
        "Create and display a new unsaved NX part at a policy-approved absolute .prt path. The destination must not exist. This does not write the file until nx_save_as is called.",
      inputSchema: {
        filePath: z.string().trim().min(1).max(240),
        units: z.enum(["Millimeters", "Inches"]).default("Millimeters"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ filePath, units }) => {
      try {
        const canonicalPath = await validatePartPath(filePath, "create");
        return bridgeResult(
          await client.call("new_part", {
            filePath: canonicalPath,
            partUnits: units,
          }),
        );
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "nx_open_part",
    {
      title: "Open an NX part",
      description:
        "Open and display an existing policy-approved .prt file. The current part is left loaded; this operation never closes or discards it.",
      inputSchema: {
        filePath: z.string().trim().min(1).max(240),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ filePath }) => {
      try {
        const canonicalPath = await validatePartPath(filePath, "open");
        return bridgeResult(
          await client.call("open_part", { filePath: canonicalPath }),
        );
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "nx_save_as",
    {
      title: "Save the NX work part as a new file",
      description:
        "Save the current work part to a policy-approved .prt destination using a same-directory staging file and a no-overwrite atomic move. The destination must not exist.",
      inputSchema: {
        filePath: z.string().trim().min(1).max(240),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ filePath }) => {
      try {
        const canonicalPath = await validatePartPath(filePath, "create");
        return bridgeResult(
          await client.call("save_as", { filePath: canonicalPath }),
        );
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "nx_close_part",
    {
      title: "Safely close the NX work part",
      description:
        "Close only the current work part. The bridge refuses if the part has unsaved changes and exposes no force-discard option.",
      inputSchema: {},
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        return bridgeResult(await client.call("close_part"));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "nx_create_block",
    {
      title: "Create an NX block",
      description:
        "Create one block feature in the current NX work part using absolute WCS origin and edge lengths. The operation receives a visible undo mark, rolls back on failure, and never saves the part.",
      inputSchema: {
        length: z.number().positive().max(1_000_000),
        width: z.number().positive().max(1_000_000),
        height: z.number().positive().max(1_000_000),
        origin: z
          .object({
            x: z.number().finite().min(-1_000_000).max(1_000_000),
            y: z.number().finite().min(-1_000_000).max(1_000_000),
            z: z.number().finite().min(-1_000_000).max(1_000_000),
          })
          .strict()
          .optional(),
        name: z.string().trim().min(1).max(128).optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ length, width, height, origin, name }) => {
      try {
        return bridgeResult(
          await client.call("create_block", {
            length,
            width,
            height,
            originX: origin?.x ?? 0,
            originY: origin?.y ?? 0,
            originZ: origin?.z ?? 0,
            ...(name === undefined ? {} : { name }),
          }),
        );
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "nx_create_rectangle_sketch",
    {
      title: "Create a rectangular NX sketch",
      description:
        "Create a four-line rectangular sketch on an absolute XY plane. Width/height are in work-part units; center is absolute X/Y and planeZ is absolute Z. The operation receives a visible undo mark, rolls back on failure, and never saves.",
      inputSchema: {
        width: z.number().positive().max(1_000_000),
        height: z.number().positive().max(1_000_000),
        center: z
          .object({
            x: z.number().finite().min(-1_000_000).max(1_000_000),
            y: z.number().finite().min(-1_000_000).max(1_000_000),
          })
          .strict()
          .optional(),
        planeZ: z.number().finite().min(-1_000_000).max(1_000_000).default(0),
        name: z.string().trim().min(1).max(128).optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ width, height, center, planeZ, name }) => {
      try {
        return bridgeResult(
          await client.call("create_rectangle_sketch", {
            profileWidth: width,
            profileHeight: height,
            centerX: center?.x ?? 0,
            centerY: center?.y ?? 0,
            planeZ,
            ...(name === undefined ? {} : { name }),
          }),
        );
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "nx_extrude_sketch",
    {
      title: "Extrude an NX sketch",
      description:
        "Extrude the exact sketch feature journal identifier returned by nx_create_rectangle_sketch in the positive sketch-normal direction. Creates a new solid only, receives a visible undo mark, rolls back on failure, and never saves.",
      inputSchema: {
        sketchFeatureJournalIdentifier: z.string().trim().min(1).max(1024),
        distance: z.number().positive().max(1_000_000),
        name: z.string().trim().min(1).max(128).optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ sketchFeatureJournalIdentifier, distance, name }) => {
      try {
        return bridgeResult(
          await client.call("extrude_sketch", {
            sketchFeatureJournalIdentifier,
            distance,
            ...(name === undefined ? {} : { name }),
          }),
        );
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "nx_revolve_sketch",
    {
      title: "Fully revolve an NX sketch",
      description:
        "Revolve the exact sketch feature journal identifier returned by nx_create_rectangle_sketch through 360 degrees about an explicit absolute WCS X- or Y-axis lying in the sketch plane. The profile must not cross the axis. Creates a new solid only, receives a visible undo mark, rolls back on failure, and never saves.",
      inputSchema: {
        sketchFeatureJournalIdentifier: z.string().trim().min(1).max(1024),
        axis: z
          .object({
            direction: z.enum(["WCS_X", "WCS_Y"]),
            origin: z
              .object({
                x: z.number().finite().min(-1_000_000).max(1_000_000),
                y: z.number().finite().min(-1_000_000).max(1_000_000),
                z: z.number().finite().min(-1_000_000).max(1_000_000),
              })
              .strict(),
          })
          .strict(),
        name: z.string().trim().min(1).max(128).optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ sketchFeatureJournalIdentifier, axis, name }) => {
      try {
        return bridgeResult(
          await client.call("revolve_sketch", {
            sketchFeatureJournalIdentifier,
            axisDirection: axis.direction,
            axisOriginX: axis.origin.x,
            axisOriginY: axis.origin.y,
            axisOriginZ: axis.origin.z,
            ...(name === undefined ? {} : { name }),
          }),
        );
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "nx_create_simple_through_hole",
    {
      title: "Create a simple NX through hole",
      description:
        "Create one semantic simple through-hole feature in the current unique solid body. The center is absolute WCS X/Y; the adapter selects the unique upward top planar face at maximum Z, cuts along negative WCS Z through the unique bottom planar face, requires strict circular clearance inside both face bounding boxes, rolls back on failure, and never saves.",
      inputSchema: {
        diameter: z.number().positive().max(1_000_000),
        center: z
          .object({
            x: z.number().finite().min(-1_000_000).max(1_000_000),
            y: z.number().finite().min(-1_000_000).max(1_000_000),
          })
          .strict(),
        name: z.string().trim().min(1).max(128).optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ diameter, center, name }) => {
      try {
        return bridgeResult(
          await client.call("create_simple_through_hole", {
            holeDiameter: diameter,
            holeCenterX: center.x,
            holeCenterY: center.y,
            ...(name === undefined ? {} : { name }),
          }),
        );
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "nx_boolean_bodies",
    {
      title: "Boolean two NX solid bodies",
      description:
        "Unite, subtract, or intersect two explicitly selected current solid bodies. Each body is resolved from an exact feature journal identifier, the identifiers and bodies must be distinct, their exact absolute bounding boxes must have positive-volume overlap, exactly one tool body must be consumed, the operation receives a visible undo mark, rolls back on failure, and never saves.",
      inputSchema: {
        operation: z.enum(["UNITE", "SUBTRACT", "INTERSECT"]),
        targetFeatureJournalIdentifier: z.string().trim().min(1).max(1024),
        toolFeatureJournalIdentifier: z.string().trim().min(1).max(1024),
        name: z.string().trim().min(1).max(128).optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({
      operation,
      targetFeatureJournalIdentifier,
      toolFeatureJournalIdentifier,
      name,
    }) => {
      try {
        return bridgeResult(
          await client.call("boolean_bodies", {
            booleanOperation: operation,
            targetFeatureJournalIdentifier,
            toolFeatureJournalIdentifier,
            ...(name === undefined ? {} : { name }),
          }),
        );
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "nx_fillet_vertical_edges",
    {
      title: "Fillet four vertical NX body edges",
      description:
        "Create one constant-radius blend on exactly four full-height linear edges parallel to absolute WCS Z. The current solid body is resolved from an exact feature journal identifier, the radius must be strictly less than half the smaller exact X/Y body size, body count must remain unchanged, the operation receives a visible undo mark, rolls back on failure, and never saves.",
      inputSchema: {
        bodyFeatureJournalIdentifier: z.string().trim().min(1).max(1024),
        radius: z.number().positive().max(1_000_000),
        name: z.string().trim().min(1).max(128).optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ bodyFeatureJournalIdentifier, radius, name }) => {
      try {
        return bridgeResult(
          await client.call("fillet_vertical_edges", {
            bodyFeatureJournalIdentifier,
            filletRadius: radius,
            ...(name === undefined ? {} : { name }),
          }),
        );
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "nx_measure_work_part",
    {
      title: "Measure NX work-part solids",
      description:
        "Read exact absolute-coordinate bounding extents plus combined solid-body surface area, volume, and centroid. Returns all values in the work-part units and does not modify NX.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        return bridgeResult(await client.call("measure_work_part"));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "nx_export_step",
    {
      title: "Export the NX work part to STEP",
      description:
        "Export the displayed NX work part as a precise AP203, AP214, or AP242 STEP file. The destination must be below a configured allowed root, use .stp or .step, and must not already exist; the work part is not modified or saved.",
      inputSchema: {
        filePath: z.string().trim().min(1).max(240),
        format: z.enum(["AP203", "AP214", "AP242"]).default("AP214"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ filePath, format }) => {
      try {
        const canonicalPath = await validateStepPath(filePath, "create");
        return bridgeResult(
          await client.call("export_step", {
            filePath: canonicalPath,
            stepFormat: format,
          }),
        );
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "nx_undo_transaction",
    {
      title: "Undo an NX Codex transaction",
      description:
        "Undo a transaction created by this running NX bridge. Requires the exact transaction ID returned by a prior mutation.",
      inputSchema: {
        transactionId: z.string().trim().min(1).max(128),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ transactionId }) => {
      try {
        return bridgeResult(
          await client.call("undo_transaction", { transactionId }),
        );
      } catch (error) {
        return toolError(error);
      }
    },
  );

  return server;
}

export async function runServer(): Promise<void> {
  const server = buildServer();
  const transport = new StdioServerTransport();

  const shutdown = async (): Promise<void> => {
    await server.close();
    process.exit(0);
  };
  process.once("SIGINT", () => void shutdown());
  process.once("SIGTERM", () => void shutdown());

  await server.connect(transport);
  console.error("NX Codex MCP is running on stdio.");
}
