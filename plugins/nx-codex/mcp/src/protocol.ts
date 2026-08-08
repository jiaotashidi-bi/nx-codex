import { randomUUID } from "node:crypto";

import { z } from "zod/v4";

export const PROTOCOL_VERSION = "1.0";
export const MAX_REQUEST_BYTES = 64 * 1024;
export const MAX_RESPONSE_BYTES = 256 * 1024;

export const BridgeOperationSchema = z.enum([
  "health",
  "get_capabilities",
  "get_session_state",
  "get_assembly_capability",
  "get_drafting_capability",
  "get_cae_capability",
  "get_cam_capability",
  "get_assembly_structure",
  "get_drafting_structure",
  "create_test_drawing",
  "preflight_modeling",
  "get_feature_tree",
  "capture_screenshot",
  "new_part",
  "open_part",
  "save_as",
  "close_part",
  "create_block",
  "create_rectangle_sketch",
  "extrude_sketch",
  "revolve_sketch",
  "create_simple_through_hole",
  "boolean_bodies",
  "fillet_vertical_edges",
  "measure_work_part",
  "export_step",
  "undo_transaction",
]);

export type BridgeOperation = z.infer<typeof BridgeOperationSchema>;

export const BridgeArgumentsSchema = z
  .object({
    length: z.number().positive().max(1_000_000).optional(),
    width: z.number().positive().max(1_000_000).optional(),
    height: z.number().positive().max(1_000_000).optional(),
    originX: z.number().finite().min(-1_000_000).max(1_000_000).optional(),
    originY: z.number().finite().min(-1_000_000).max(1_000_000).optional(),
    originZ: z.number().finite().min(-1_000_000).max(1_000_000).optional(),
    profileWidth: z.number().positive().max(1_000_000).optional(),
    profileHeight: z.number().positive().max(1_000_000).optional(),
    centerX: z.number().finite().min(-1_000_000).max(1_000_000).optional(),
    centerY: z.number().finite().min(-1_000_000).max(1_000_000).optional(),
    planeZ: z.number().finite().min(-1_000_000).max(1_000_000).optional(),
    sketchFeatureJournalIdentifier: z
      .string()
      .trim()
      .min(1)
      .max(1024)
      .optional(),
    distance: z.number().positive().max(1_000_000).optional(),
    axisDirection: z.enum(["WCS_X", "WCS_Y"]).optional(),
    axisOriginX: z.number().finite().min(-1_000_000).max(1_000_000).optional(),
    axisOriginY: z.number().finite().min(-1_000_000).max(1_000_000).optional(),
    axisOriginZ: z.number().finite().min(-1_000_000).max(1_000_000).optional(),
    holeCenterX: z.number().finite().min(-1_000_000).max(1_000_000).optional(),
    holeCenterY: z.number().finite().min(-1_000_000).max(1_000_000).optional(),
    holeDiameter: z.number().positive().max(1_000_000).optional(),
    booleanOperation: z.enum(["UNITE", "SUBTRACT", "INTERSECT"]).optional(),
    targetFeatureJournalIdentifier: z
      .string()
      .trim()
      .min(1)
      .max(1024)
      .optional(),
    toolFeatureJournalIdentifier: z
      .string()
      .trim()
      .min(1)
      .max(1024)
      .optional(),
    bodyFeatureJournalIdentifier: z
      .string()
      .trim()
      .min(1)
      .max(1024)
      .optional(),
    filletRadius: z.number().positive().max(1_000_000).optional(),
    name: z.string().trim().min(1).max(128).optional(),
    transactionId: z.string().trim().min(1).max(128).optional(),
    filePath: z.string().trim().min(1).max(240).optional(),
    partUnits: z.enum(["Millimeters", "Inches"]).optional(),
    stepFormat: z.enum(["AP203", "AP214", "AP242"]).optional(),
    plannedOperation: z
      .enum([
        "create_block",
        "create_rectangle_sketch",
        "extrude_sketch",
        "revolve_sketch",
        "create_simple_through_hole",
        "boolean_bodies",
        "fillet_vertical_edges",
      ])
      .optional(),
    maxDepth: z.number().int().min(0).max(32).optional(),
    maxComponents: z.number().int().min(1).max(128).optional(),
    maxSheets: z.number().int().min(1).max(64).optional(),
    maxViews: z.number().int().min(1).max(128).optional(),
  })
  .strict();

export type BridgeArguments = z.infer<typeof BridgeArgumentsSchema>;

export const BridgeRequestSchema = z
  .object({
    protocolVersion: z.literal(PROTOCOL_VERSION),
    requestId: z.string().uuid(),
    operation: BridgeOperationSchema,
    token: z.string().min(32).max(256),
    deadlineUtc: z.string().datetime({ offset: true }),
    arguments: BridgeArgumentsSchema,
  })
  .strict();

export type BridgeRequest = z.infer<typeof BridgeRequestSchema>;

export const FeatureTreeNodeSchema = z
  .object({
    index: z.number().int().nonnegative(),
    journalIdentifier: z.string().min(1).max(1024),
    name: z.string().max(1024),
    featureType: z.string().max(256),
    timestamp: z.number().int(),
    suppressed: z.boolean(),
    parentJournalIdentifiers: z.array(z.string().max(1024)).max(16),
    parentsTruncated: z.boolean().optional(),
  })
  .strict();

export type FeatureTreeNode = z.infer<typeof FeatureTreeNodeSchema>;

export const AssemblyComponentNodeSchema = z
  .object({
    index: z.number().int().nonnegative(),
    parentIndex: z.number().int().nonnegative().nullable().optional(),
    depth: z.number().int().nonnegative().max(32),
    instanceName: z.string().max(256),
    displayName: z.string().max(256),
    prototypePartIdentifier: z.string().max(256),
    suppressed: z.boolean(),
    loadState: z.enum(["loaded", "unloaded", "unknown"]),
    representationMode: z.enum([
      "Exact",
      "Lightweight",
      "None",
      "Partial",
      "Unknown",
    ]),
    childCount: z.number().int().nonnegative(),
    childrenTruncated: z.boolean().optional(),
  })
  .strict();

export type AssemblyComponentNode = z.infer<
  typeof AssemblyComponentNodeSchema
>;

export const DraftingSheetNodeSchema = z
  .object({
    index: z.number().int().nonnegative().max(63),
    journalIdentifier: z.string().max(1024),
    name: z.string().max(256),
    length: z.number().finite().nonnegative(),
    height: z.number().finite().nonnegative(),
    units: z.enum(["Millimeters", "Inches"]),
    projectionAngle: z.enum(["FirstAngle", "ThirdAngle"]),
    scaleNumerator: z.number().finite().nonnegative(),
    scaleDenominator: z.number().finite().nonnegative(),
    isOutOfDate: z.boolean(),
    viewCount: z.number().int().nonnegative(),
    viewsTruncated: z.boolean().optional(),
  })
  .strict();

export type DraftingSheetNode = z.infer<typeof DraftingSheetNodeSchema>;

export const DraftingViewNodeSchema = z
  .object({
    index: z.number().int().nonnegative().max(127),
    sheetIndex: z.number().int().nonnegative().max(63),
    journalIdentifier: z.string().max(1024),
    name: z.string().max(256),
    scale: z.number().finite().nonnegative(),
    originX: z.number().finite(),
    originY: z.number().finite(),
    originZ: z.number().finite(),
    isOutOfDate: z.boolean(),
    isBroken: z.boolean(),
    isDecoration: z.boolean(),
    isSlave: z.boolean(),
  })
  .strict();

export type DraftingViewNode = z.infer<typeof DraftingViewNodeSchema>;

export const BridgeResultSchema = z
  .object({
    connected: z.boolean().optional(),
    status: z.string().max(128).optional(),
    bridgeVersion: z.string().max(64).optional(),
    protocolVersion: z.string().max(16).optional(),
    nxVersion: z.string().max(128).optional(),
    nxOpenAssemblyVersion: z.string().max(64).optional(),
    adapterId: z.string().max(128).optional(),
    adapterContractId: z.string().max(128).optional(),
    compatibilityStatus: z.enum(["verified", "unsupported"]).optional(),
    processId: z.number().int().positive().optional(),
    capabilities: z.array(z.string().max(128)).max(128).optional(),
    allowedRoots: z.array(z.string().max(240)).max(8).optional(),
    dispatcher: z.string().max(128).optional(),
    application: z.string().max(256).optional(),
    applicationName: z.string().max(256).optional(),
    available: z.boolean().optional(),
    licensed: z.boolean().optional(),
    unsupportedReason: z.string().max(4096).optional(),
    workPart: z.string().max(2048).optional(),
    displayPart: z.string().max(2048).optional(),
    units: z.string().max(64).optional(),
    modified: z.boolean().optional(),
    featureCount: z.number().int().nonnegative().optional(),
    bodyCount: z.number().int().nonnegative().optional(),
    solidBodyCount: z.number().int().nonnegative().optional(),
    transactionId: z.string().max(128).optional(),
    featureJournalIdentifier: z.string().max(1024).optional(),
    featureName: z.string().max(1024).optional(),
    curveCount: z.number().int().nonnegative().max(1_000_000).optional(),
    measuredBodyCount: z.number().int().positive().max(1_000_000).optional(),
    measurementUnits: z.enum(["Millimeters", "Inches"]).optional(),
    boundingBoxMinX: z.number().finite().optional(),
    boundingBoxMinY: z.number().finite().optional(),
    boundingBoxMinZ: z.number().finite().optional(),
    boundingBoxMaxX: z.number().finite().optional(),
    boundingBoxMaxY: z.number().finite().optional(),
    boundingBoxMaxZ: z.number().finite().optional(),
    boundingBoxSizeX: z.number().finite().nonnegative().optional(),
    boundingBoxSizeY: z.number().finite().nonnegative().optional(),
    boundingBoxSizeZ: z.number().finite().nonnegative().optional(),
    surfaceArea: z.number().finite().nonnegative().optional(),
    volume: z.number().finite().nonnegative().optional(),
    centroidX: z.number().finite().optional(),
    centroidY: z.number().finite().optional(),
    centroidZ: z.number().finite().optional(),
    filePath: z.string().max(240).optional(),
    opened: z.boolean().optional(),
    saved: z.boolean().optional(),
    closed: z.boolean().optional(),
    loadWarnings: z.array(z.string().max(1024)).max(32).optional(),
    message: z.string().max(4096).optional(),
    exported: z.boolean().optional(),
    stepFormat: z.enum(["AP203", "AP214", "AP242"]).optional(),
    preflightPassed: z.boolean().optional(),
    preflightId: z.string().max(128).optional(),
    preflightUtc: z.string().datetime({ offset: true }).optional(),
    plannedOperation: z.string().max(128).optional(),
    featureTreeFingerprint: z.string().regex(/^[A-Fa-f0-9]{64}$/).optional(),
    featureTreeTotalCount: z.number().int().nonnegative().optional(),
    featureTreeReturnedCount: z.number().int().nonnegative().max(128).optional(),
    featureTreeTruncated: z.boolean().optional(),
    features: z.array(FeatureTreeNodeSchema).max(128).optional(),
    assemblyReadAvailable: z.boolean().optional(),
    isAssembly: z.boolean().optional(),
    rootComponent: AssemblyComponentNodeSchema.nullable().optional(),
    components: z.array(AssemblyComponentNodeSchema).max(128).optional(),
    componentCount: z.number().int().nonnegative().optional(),
    returnedComponentCount: z
      .number()
      .int()
      .nonnegative()
      .max(128)
      .optional(),
    componentCountComplete: z.boolean().optional(),
    assemblyStructureTruncated: z.boolean().optional(),
    depthTruncated: z.boolean().optional(),
    componentLimitTruncated: z.boolean().optional(),
    maxDepth: z.number().int().min(0).max(32).optional(),
    maxComponents: z.number().int().min(1).max(128).optional(),
    assemblyStructureFingerprint: z
      .string()
      .regex(/^[A-Fa-f0-9]{64}$/)
      .optional(),
    draftingReadAvailable: z.boolean().optional(),
    hasDrawingSheets: z.boolean().optional(),
    sheets: z.array(DraftingSheetNodeSchema).max(64).optional(),
    views: z.array(DraftingViewNodeSchema).max(128).optional(),
    sheetCount: z.number().int().nonnegative().optional(),
    returnedSheetCount: z.number().int().nonnegative().max(64).optional(),
    sheetCountComplete: z.boolean().optional(),
    viewCount: z.number().int().nonnegative().optional(),
    returnedViewCount: z.number().int().nonnegative().max(128).optional(),
    viewCountComplete: z.boolean().optional(),
    draftingStructureTruncated: z.boolean().optional(),
    sheetLimitTruncated: z.boolean().optional(),
    viewLimitTruncated: z.boolean().optional(),
    maxSheets: z.number().int().min(1).max(64).optional(),
    maxViews: z.number().int().min(1).max(128).optional(),
    draftingStructureFingerprint: z
      .string()
      .regex(/^[A-Fa-f0-9]{64}$/)
      .optional(),
    captured: z.boolean().optional(),
    screenshotBytes: z.number().int().positive().optional(),
    screenshotSha256: z.string().regex(/^[A-Fa-f0-9]{64}$/).optional(),
  })
  .strict();

export type BridgeResult = z.infer<typeof BridgeResultSchema>;

export const CaeCapabilityResultSchema = z
  .object({
    available: z.boolean(),
    licensed: z.boolean(),
    applicationName: z.string().max(256),
    adapterId: z.string().max(128),
    compatibilityStatus: z.enum(["verified", "unsupported"]),
    unsupportedReason: z.string().max(4096),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.available && value.unsupportedReason !== "") {
      context.addIssue({
        code: "custom",
        message: "Available CAE capability must have an empty unsupportedReason.",
        path: ["unsupportedReason"],
      });
    }
    if (!value.available && value.unsupportedReason === "") {
      context.addIssue({
        code: "custom",
        message: "Unavailable CAE capability must explain why it is unsupported.",
        path: ["unsupportedReason"],
      });
    }
    if (
      value.compatibilityStatus === "unsupported" &&
      !value.adapterId.startsWith("unsupported:")
    ) {
      context.addIssue({
        code: "custom",
        message: "Unsupported compatibility must use an unsupported adapter ID.",
        path: ["adapterId"],
      });
    }
  });

export type CaeCapabilityResult = z.infer<typeof CaeCapabilityResultSchema>;

export const BridgeErrorPayloadSchema = z
  .object({
    code: z.string().min(1).max(128),
    message: z.string().min(1).max(4096),
    retryable: z.boolean(),
  })
  .strict();

export const BridgeResponseSchema = z
  .object({
    protocolVersion: z.literal(PROTOCOL_VERSION),
    requestId: z.string().uuid(),
    ok: z.boolean(),
    result: BridgeResultSchema.nullable(),
    error: BridgeErrorPayloadSchema.nullable(),
    durationMs: z.number().int().nonnegative(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.ok && value.result === null) {
      context.addIssue({
        code: "custom",
        message: "Successful responses require a result.",
        path: ["result"],
      });
    }
    if (!value.ok && value.error === null) {
      context.addIssue({
        code: "custom",
        message: "Failed responses require an error.",
        path: ["error"],
      });
    }
  });

export type BridgeResponse = z.infer<typeof BridgeResponseSchema>;

export const BridgeSessionSchema = z
  .object({
    protocolVersion: z.literal(PROTOCOL_VERSION),
    pipeName: z
      .string()
      .regex(/^nx-codex-[A-Za-z0-9-]+$/)
      .max(128),
    token: z.string().min(32).max(256),
    processId: z.number().int().positive(),
    createdUtc: z.string().datetime({ offset: true }),
    expiresUtc: z.string().datetime({ offset: true }),
  })
  .strict();

export type BridgeSession = z.infer<typeof BridgeSessionSchema>;

export function createBridgeRequest(
  session: BridgeSession,
  operation: BridgeOperation,
  args: BridgeArguments,
  timeoutMs: number,
): BridgeRequest {
  const safeTimeout = Math.min(Math.max(timeoutMs, 1_000), 120_000);
  return BridgeRequestSchema.parse({
    protocolVersion: PROTOCOL_VERSION,
    requestId: randomUUID(),
    operation,
    token: session.token,
    deadlineUtc: new Date(Date.now() + safeTimeout).toISOString(),
    arguments: args,
  });
}
