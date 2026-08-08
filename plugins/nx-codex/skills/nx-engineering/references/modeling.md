# Supported modeling

## Block

Map a requested rectangular solid to `nx_create_block`:

- `length`: WCS X edge length;
- `width`: WCS Y edge length;
- `height`: WCS Z edge length;
- `origin.x/y/z`: absolute WCS coordinates;
- `name`: optional NX feature name.

Require positive finite edge lengths. Keep the active part's unit system; do
not convert silently.

Example:

```text
Create a 100 x 60 x 20 mm block centered about X and Y, with its bottom at Z=0.
```

For a centered base, derive the absolute origin as `(-50, -30, 0)` and state
that derivation before execution.

The operation creates a new body/feature. It does not unite, subtract,
intersect, save, or export.

## Rectangular sketch

Map a requested planar rectangle to `nx_create_rectangle_sketch`:

- `width` and `height`: positive dimensions in work-part units;
- `center.x/y`: absolute work-part X/Y coordinates;
- `planeZ`: absolute work-part Z coordinate;
- `name`: optional sketch/feature name.

The current NX 12 adapter intentionally supports only an XY plane. It creates
four connected lines but does not claim the profile is fully constrained.
Preserve the returned `featureJournalIdentifier`; do not guess a sketch name
or pass an arbitrary NX tag to extrusion or revolve.

## Extrude sketch

Call `nx_extrude_sketch` only with the exact sketch feature journal identifier
returned by this bridge:

- `sketchFeatureJournalIdentifier`: exact, case-sensitive identifier;
- `distance`: positive length in work-part units;
- `name`: optional extrude feature name.

The operation creates a new body in the positive sketch-normal direction.
Unite, subtract, intersect, symmetric limits, draft, offsets, and negative
direction are not implicit defaults and are not exposed by this capability.

After extrusion, call `nx_verify_modeling_result`. Compare the observed
absolute bounding extents, combined solid-body properties, feature tree, and
screenshot evidence with the preflight plan before saving.

## Full revolve sketch

Call `nx_revolve_sketch` only with the exact sketch feature journal identifier
returned by this bridge:

- `sketchFeatureJournalIdentifier`: exact, case-sensitive identifier;
- `axis.direction`: `WCS_X` or `WCS_Y`;
- `axis.origin.x/y/z`: explicit absolute work-part coordinates;
- `name`: optional revolve feature name.

The axis must lie in the sketch's absolute XY plane. The rectangular profile
must remain entirely on one side of the axis, although an edge may meet it.
The operation always revolves through 360 degrees and creates a new solid.
Partial angles, arbitrary axis vectors, offsets, thin features, and unite,
subtract, or intersect are not exposed.

After revolve, call `nx_verify_modeling_result`. For an offset rectangle revolved
around a coplanar WCS axis, compare the result with the expected annular
cylinder bounding box, volume, surface area, and centroid before saving.

## Simple through hole

Call `nx_create_simple_through_hole` only when the work part contains exactly
one solid body:

- `diameter`: positive finished-hole diameter in work-part units;
- `center.x/y`: explicit absolute work-part X/Y coordinates;
- `name`: optional hole feature name.

The NX 12 adapter selects the unique upward planar face at the body's maximum
absolute Z, uses the unique downward planar face at minimum Z as the through
face, and cuts in negative WCS Z. The center must be inside both faces and the
complete circle must fit strictly inside both face bounding boxes. Any missing
or ambiguous face, multiple solid bodies, or insufficient edge clearance is
rejected before the modeling transaction.

This capability creates a semantic NX simple-hole feature through the whole
body. It does not expose blind depth, counterbore, countersink, thread,
arbitrary face selection, arbitrary direction, or Boolean fallback. After the
operation, require one additional feature, an unchanged body count, and call
`nx_verify_modeling_result` before saving.

## Boolean bodies

Call `nx_boolean_bodies` only with exact feature journal identifiers returned
by this bridge:

- `operation`: `UNITE`, `SUBTRACT`, or `INTERSECT`;
- `targetFeatureJournalIdentifier`: feature that maps uniquely to the current
  target solid;
- `toolFeatureJournalIdentifier`: different feature that maps uniquely to the
  current tool solid;
- `name`: optional Boolean feature name.

State target/tool order explicitly because `SUBTRACT` is directional. The
adapter rejects identical identifiers, two identifiers resolving to the same
body, stale or ambiguous body mappings, and bodies whose exact absolute
bounding boxes lack positive-volume overlap. It requires one new Boolean
feature and exactly one consumed tool body; split or empty results roll back.

After execution, require body count to decrease by one and call
`nx_verify_modeling_result`. Do not infer body selection from display order, names,
proximity, or feature-tree position.

## Four vertical-edge fillet

Call `nx_fillet_vertical_edges` only with an exact feature journal identifier
returned by this bridge:

- `bodyFeatureJournalIdentifier`: feature that maps uniquely to the current
  target solid;
- `radius`: positive constant radius in work-part units;
- `name`: optional blend feature name.

The NX 12 adapter reads the target body's exact absolute bounding box and
selects only linear edges parallel to absolute WCS Z whose endpoints span the
complete minimum-to-maximum Z range. It requires exactly four such edges. The
radius must be strictly less than half the smaller X/Y bounding size. Stale or
ambiguous body mappings, non-four-edge shapes, and oversized radii are rejected
before the modeling transaction.

After execution, require one new blend feature, unchanged body count, and call
`nx_verify_modeling_result`. This first bounded adapter does not accept edge tags,
interactive selection, arbitrary edge lists, variable radii, setbacks, or
overflow options.

## Unsupported operations

Arbitrary-plane/general sketching, partial-angle or arbitrary-axis revolve,
blind/threaded/counterbored/countersunk or arbitrary-direction hole,
multi-tool/retained-tool Boolean, arbitrary-edge/variable-radius fillet,
chamfer, assembly, drawing, CAE,
CAM, import,
save-over, and overwrite are roadmap or deliberately unsupported
capabilities.
New/open/save-as/safe-close are described in `part-files.md`. Do not
approximate unsupported modeling with blocks or arbitrary journals.
