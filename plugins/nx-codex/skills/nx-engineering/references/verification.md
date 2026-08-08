# Verification

## Before

Record the `nx_preflight_modeling` baseline:

- work and display part;
- unit system;
- modified state;
- feature, total-body, and solid-body counts;
- supported capabilities;
- `preflightId` and the complete feature-tree fingerprint.

## After a modeling mutation

Use `nx_verify_modeling_result` to gather the post-session state, exact solid
measurement, ordered feature tree, and no-overwrite PNG screenshot as one
verification bundle. The tool does not save the part.

Require all of:

- a non-empty `transactionId`;
- the returned feature journal identifier;
- unchanged work-part identity and units;
- the expected operation-specific feature/body count deltas;
- a changed full feature-tree fingerprint;
- the returned feature identifier present as an unsuppressed node;
- a session-state response after execution;
- a non-empty PNG path, byte count, and SHA-256;
- work-part modified state unchanged by measurement, tree reads, and capture;
- `partSaved=false`.

For solid geometry, require:

- explicit `measurementUnits` matching the work part;
- measured body count matching the post-operation solid-body count;
- absolute bounding-box minimum, maximum, and size;
- nonnegative surface area and volume;
- centroid coordinates;
- every planned value within its explicit modeling tolerance.

A rectangular sketch alone is verified without a solid measurement when the
work part has no measurable solid.

Inspect the PNG when image inspection is available and confirm that the
graphics area is non-empty and visually consistent with the planned topology.
Screenshot appearance cannot prove dimensions, volume, or feature dependency;
those conclusions must come from exact measurement and feature-tree data. If
the image was not actually inspected, report only that screenshot evidence was
captured and hashed.

For a single rectangular extrusion, compare bounding-box sizes and volume
against the planned profile and distance. Treat floating-point values within
an appropriate modeling tolerance rather than requiring bitwise equality.

For a simple through hole, require the feature count to increase by one while
the body count remains one. Confirm the solid bounding box is unchanged, the
volume is reduced by `pi * radius^2 * bodyHeight`, and the reported centroid
shift is consistent with the removed cylinder. For a planar block, the
surface-area change is `-2 * pi * radius^2 + 2 * pi * radius * bodyHeight`.

For a Boolean, record the two selected feature identifiers and their target /
tool roles. Require exactly one additional feature and one fewer body. Compare
the measured volume, bounding box, surface area, and centroid with the planned
union, target-minus-tool, or intersection result. Undo must restore both input
bodies and their combined measurements.

For the four-vertical-edge fillet on a rectangular block, require one
additional feature and unchanged body count and bounding box. With block height
`H` and radius `r`, compare volume against
`V_before - H * r^2 * (4 - pi)` and surface area against
`A_before - 2 * (4 - pi) * (r^2 + r * H)`. A centered rectangular block keeps
the same centroid. Undo must restore the baseline values.

If any joint check fails, do not save or export. Report the failed checks and
offer undo using the returned transaction ID.

## Undo

Pass only a transaction ID returned by the same running bridge to
`nx_undo_transaction`. Re-read session state after undo. A transaction ID
becomes invalid after it is undone or after NX restarts.
