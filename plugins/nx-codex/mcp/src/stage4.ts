import { z } from "zod/v4";

import type { BridgeArguments, BridgeResult } from "./protocol.js";

const coordinate = z.number().finite().min(-1_000_000).max(1_000_000);
const positiveLength = z.number().positive().max(1_000_000);
const featureIdentifier = z.string().trim().min(1).max(1024);

const point2 = z.object({ x: coordinate, y: coordinate }).strict();
const point3 = z.object({ x: coordinate, y: coordinate, z: coordinate }).strict();

export const ModelingOperationSchema = z.enum([
  "create_block",
  "create_rectangle_sketch",
  "extrude_sketch",
  "revolve_sketch",
  "create_simple_through_hole",
  "boolean_bodies",
  "fillet_vertical_edges",
]);

export const ModelingPlanSchema = z.discriminatedUnion("operation", [
  z
    .object({
      operation: z.literal("create_block"),
      length: positiveLength,
      width: positiveLength,
      height: positiveLength,
      origin: point3.optional(),
      name: z.string().trim().min(1).max(128).optional(),
    })
    .strict(),
  z
    .object({
      operation: z.literal("create_rectangle_sketch"),
      width: positiveLength,
      height: positiveLength,
      center: point2.optional(),
      planeZ: coordinate.default(0),
      name: z.string().trim().min(1).max(128).optional(),
    })
    .strict(),
  z
    .object({
      operation: z.literal("extrude_sketch"),
      sketchFeatureJournalIdentifier: featureIdentifier,
      distance: positiveLength,
      name: z.string().trim().min(1).max(128).optional(),
    })
    .strict(),
  z
    .object({
      operation: z.literal("revolve_sketch"),
      sketchFeatureJournalIdentifier: featureIdentifier,
      axis: z
        .object({
          direction: z.enum(["WCS_X", "WCS_Y"]),
          origin: point3,
        })
        .strict(),
      name: z.string().trim().min(1).max(128).optional(),
    })
    .strict(),
  z
    .object({
      operation: z.literal("create_simple_through_hole"),
      diameter: positiveLength,
      center: point2,
      name: z.string().trim().min(1).max(128).optional(),
    })
    .strict(),
  z
    .object({
      operation: z.literal("boolean_bodies"),
      booleanOperation: z.enum(["UNITE", "SUBTRACT", "INTERSECT"]),
      targetFeatureJournalIdentifier: featureIdentifier,
      toolFeatureJournalIdentifier: featureIdentifier,
      name: z.string().trim().min(1).max(128).optional(),
    })
    .strict(),
  z
    .object({
      operation: z.literal("fillet_vertical_edges"),
      bodyFeatureJournalIdentifier: featureIdentifier,
      radius: positiveLength,
      name: z.string().trim().min(1).max(128).optional(),
    })
    .strict(),
]);

export type ModelingPlan = z.infer<typeof ModelingPlanSchema>;
export type ModelingOperation = ModelingPlan["operation"];

export function modelingPlanToBridgeArguments(
  plan: ModelingPlan,
): BridgeArguments {
  const common = {
    plannedOperation: plan.operation,
    ...(plan.name === undefined ? {} : { name: plan.name }),
  };
  switch (plan.operation) {
    case "create_block":
      return {
        ...common,
        length: plan.length,
        width: plan.width,
        height: plan.height,
        originX: plan.origin?.x ?? 0,
        originY: plan.origin?.y ?? 0,
        originZ: plan.origin?.z ?? 0,
      };
    case "create_rectangle_sketch":
      return {
        ...common,
        profileWidth: plan.width,
        profileHeight: plan.height,
        centerX: plan.center?.x ?? 0,
        centerY: plan.center?.y ?? 0,
        planeZ: plan.planeZ,
      };
    case "extrude_sketch":
      return {
        ...common,
        sketchFeatureJournalIdentifier:
          plan.sketchFeatureJournalIdentifier,
        distance: plan.distance,
      };
    case "revolve_sketch":
      return {
        ...common,
        sketchFeatureJournalIdentifier:
          plan.sketchFeatureJournalIdentifier,
        axisDirection: plan.axis.direction,
        axisOriginX: plan.axis.origin.x,
        axisOriginY: plan.axis.origin.y,
        axisOriginZ: plan.axis.origin.z,
      };
    case "create_simple_through_hole":
      return {
        ...common,
        holeDiameter: plan.diameter,
        holeCenterX: plan.center.x,
        holeCenterY: plan.center.y,
      };
    case "boolean_bodies":
      return {
        ...common,
        booleanOperation: plan.booleanOperation,
        targetFeatureJournalIdentifier:
          plan.targetFeatureJournalIdentifier,
        toolFeatureJournalIdentifier: plan.toolFeatureJournalIdentifier,
      };
    case "fillet_vertical_edges":
      return {
        ...common,
        bodyFeatureJournalIdentifier: plan.bodyFeatureJournalIdentifier,
        filletRadius: plan.radius,
      };
  }
}

export function modelingMutationArguments(
  plan: ModelingPlan,
): BridgeArguments {
  const { plannedOperation: _plannedOperation, ...args } =
    modelingPlanToBridgeArguments(plan);
  return args;
}

export const VerificationBaselineSchema = z
  .object({
    preflightId: z.string().trim().min(1).max(128),
    workPart: z.string().trim().min(1).max(2048),
    units: z.enum(["Millimeters", "Inches"]),
    modified: z.boolean(),
    featureCount: z.number().int().nonnegative(),
    bodyCount: z.number().int().nonnegative(),
    solidBodyCount: z.number().int().nonnegative(),
    featureTreeFingerprint: z.string().regex(/^[A-Fa-f0-9]{64}$/),
  })
  .strict();

const ExpectedBoundingBoxSchema = z
  .object({
    minX: coordinate.optional(),
    minY: coordinate.optional(),
    minZ: coordinate.optional(),
    maxX: coordinate.optional(),
    maxY: coordinate.optional(),
    maxZ: coordinate.optional(),
    sizeX: z.number().finite().nonnegative().max(2_000_000).optional(),
    sizeY: z.number().finite().nonnegative().max(2_000_000).optional(),
    sizeZ: z.number().finite().nonnegative().max(2_000_000).optional(),
  })
  .strict();

const ExpectedCentroidSchema = point3;

export const ExpectedMeasurementsSchema = z
  .object({
    boundingBox: ExpectedBoundingBoxSchema.optional(),
    surfaceArea: z.number().finite().nonnegative().optional(),
    volume: z.number().finite().nonnegative().optional(),
    centroid: ExpectedCentroidSchema.optional(),
  })
  .strict();

export type VerificationBaseline = z.infer<
  typeof VerificationBaselineSchema
>;
export type ExpectedMeasurements = z.infer<
  typeof ExpectedMeasurementsSchema
>;

export type VerificationCheck = {
  check: string;
  passed: boolean;
  expected: unknown;
  observed: unknown;
};

export function expectedCountDeltas(operation: ModelingOperation): {
  featureDelta: number;
  bodyDelta: number;
  requiresMeasurement: boolean;
} {
  switch (operation) {
    case "create_block":
    case "extrude_sketch":
    case "revolve_sketch":
      return { featureDelta: 1, bodyDelta: 1, requiresMeasurement: true };
    case "create_rectangle_sketch":
      return { featureDelta: 1, bodyDelta: 0, requiresMeasurement: false };
    case "create_simple_through_hole":
    case "fillet_vertical_edges":
      return { featureDelta: 1, bodyDelta: 0, requiresMeasurement: true };
    case "boolean_bodies":
      return { featureDelta: 1, bodyDelta: -1, requiresMeasurement: true };
  }
}

function numberCheck(
  checks: VerificationCheck[],
  check: string,
  expected: number | undefined,
  observed: unknown,
  tolerance: number,
): void {
  if (expected === undefined) return;
  const numeric = typeof observed === "number" ? observed : Number.NaN;
  checks.push({
    check,
    passed: Number.isFinite(numeric) && Math.abs(numeric - expected) <= tolerance,
    expected,
    observed,
  });
}

export function measurementChecks(
  measurement: BridgeResult,
  expected: ExpectedMeasurements | undefined,
  linearTolerance: number,
  relativeTolerance: number,
): VerificationCheck[] {
  const checks: VerificationCheck[] = [];
  if (expected === undefined) return checks;
  const box = expected.boundingBox;
  numberCheck(checks, "boundingBox.minX", box?.minX, measurement.boundingBoxMinX, linearTolerance);
  numberCheck(checks, "boundingBox.minY", box?.minY, measurement.boundingBoxMinY, linearTolerance);
  numberCheck(checks, "boundingBox.minZ", box?.minZ, measurement.boundingBoxMinZ, linearTolerance);
  numberCheck(checks, "boundingBox.maxX", box?.maxX, measurement.boundingBoxMaxX, linearTolerance);
  numberCheck(checks, "boundingBox.maxY", box?.maxY, measurement.boundingBoxMaxY, linearTolerance);
  numberCheck(checks, "boundingBox.maxZ", box?.maxZ, measurement.boundingBoxMaxZ, linearTolerance);
  numberCheck(checks, "boundingBox.sizeX", box?.sizeX, measurement.boundingBoxSizeX, linearTolerance);
  numberCheck(checks, "boundingBox.sizeY", box?.sizeY, measurement.boundingBoxSizeY, linearTolerance);
  numberCheck(checks, "boundingBox.sizeZ", box?.sizeZ, measurement.boundingBoxSizeZ, linearTolerance);
  if (expected.surfaceArea !== undefined) {
    numberCheck(
      checks,
      "surfaceArea",
      expected.surfaceArea,
      measurement.surfaceArea,
      relativeTolerance * Math.max(1, Math.abs(expected.surfaceArea)),
    );
  }
  if (expected.volume !== undefined) {
    numberCheck(
      checks,
      "volume",
      expected.volume,
      measurement.volume,
      relativeTolerance * Math.max(1, Math.abs(expected.volume)),
    );
  }
  numberCheck(checks, "centroid.x", expected.centroid?.x, measurement.centroidX, linearTolerance);
  numberCheck(checks, "centroid.y", expected.centroid?.y, measurement.centroidY, linearTolerance);
  numberCheck(checks, "centroid.z", expected.centroid?.z, measurement.centroidZ, linearTolerance);
  return checks;
}
