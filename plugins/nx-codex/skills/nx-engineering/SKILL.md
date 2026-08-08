---
name: nx-engineering
description: Safely inspect and control a live Siemens NX (UG/NX) session through the nx-codex MCP. Use for NX connection checks, current-part inspection, policy-restricted part file lifecycle, feature planning, creating supported geometry, verification, and undoing NX Codex transactions. Also use when the user says UG, Siemens NX, NXOpen, NX modeling, or asks Codex to operate the currently open NX window.
---

# NX Engineering

Use the `nx-codex` MCP as the only execution boundary. Never emulate a
successful NX operation with generated code or shell commands.

## Workflow

1. Call `nx_health`.
2. If disconnected, report how to load `NXCodexBridge.dll`; do not claim NX was
   inspected or changed.
3. Call `nx_get_capabilities` before selecting a tool.
4. For assembly, drafting, CAE, or CAM availability, call the corresponding
   `nx_get_*_capability` tool. These tools are read-only and report only whether
   a matching license is already active; never infer entitlement from
   `licensed=false` and never reserve a license to probe it.
5. For bounded structure inspection, call `nx_get_assembly_structure` or
   `nx_get_drafting_structure` only when the matching capability reports an
   already-active license and the operation is advertised. Drafting structure
   reads report sheets and their drafting views without opening a sheet,
   updating a view, creating an annotation, or changing applications.
6. Require `compatibilityStatus=verified`, a non-unsupported `adapterId`, and
   a non-`none` adapter contract before every mutation. Read
   [references/api-compatibility.md](references/api-compatibility.md) when
   inspecting or adding NX version support.
7. For an explicitly requested protected test drawing, read
   [references/drafting.md](references/drafting.md). Create it only with
   `nx_create_test_drawing` against the exact saved, unmodified millimeter
   work/display-part copy after Drafting and its license are already active
   and two bounded reads confirm zero sheets and views.
8. For modeling, read
   [references/planning-and-preflight.md](references/planning-and-preflight.md),
   translate the request into one typed plan with explicit work-part units,
   absolute WCS coordinates, feature identifiers, expected count deltas,
   expected geometry, and tolerances. State every assumption.
9. If the user requested only a plan, preview, or no changes, present the plan
   and stop before preflight or mutation.
10. Immediately before a modeling mutation, call `nx_preflight_modeling` with
   the exact plan. Preserve its complete `baseline`, including `preflightId`
   and `featureTreeFingerprint`. If NX state or the plan changes, discard that
   baseline and preflight again.
11. Execute only the exact operation and parameters that passed preflight and
   only when that operation is advertised by the connected bridge.
12. Require a non-empty transaction ID and feature journal identifier. Then call
   `nx_verify_modeling_result` with the preserved baseline, operation, returned
   identifiers, planned measurements, tolerances, and a new policy-approved
   PNG path that does not exist.
13. Inspect the returned screenshot when image inspection is available. Treat
    it as visual corroboration only; dimensions come from the exact bounding
    box and measurement result. Do not claim visual inspection if only the PNG
    hash and byte count were checked.
14. Report the joint result: individual failed checks, work-part units,
    feature/body deltas, exact bounding box, area, volume, centroid, created
    feature-tree node, screenshot path/hash, transaction ID, and `partSaved`
    (modeling must report false).
15. Preserve the transaction ID for follow-up undo requests. If joint
    verification fails, do not save; offer undo.

Direct requests such as "create a 100 x 60 x 20 block" authorize that
reversible feature creation. If the user asks for a plan, preview, or no
changes, stop before any mutation.

A direct request to create a test sheet and view in a copy authorizes only the
fixed protected-copy operation described in `references/drafting.md`. It does
not authorize editing existing drawings, creating annotations, updating views,
or saving over a part.

## Safety

Read [references/safety.md](references/safety.md) before a write, an ambiguous
request, or any request involving files, overwrite, delete, CAM, production
output, or arbitrary code.

Never:

- expose or request raw NXOpen `Session`, `UI`, or `UFSession` objects;
- invent an unavailable tool;
- reserve, release, or reconfigure an NX license to test availability;
- run arbitrary Python, C#, journals, shell commands, or live-session
  reflection; offline adapter-development scripts may only read explicitly
  selected NXOpen assembly metadata;
- claim that NX saved, exported, or modified a part without a matching tool
  result;
- treat a timeout as proof that NX did nothing.

## Modeling

For supported geometry, read
[references/modeling.md](references/modeling.md). Keep units explicit. The
block tool uses absolute WCS origin and edge lengths. The stage-2B sketch tool
creates a four-line rectangle on an absolute XY plane. Extrusion creates a new
solid in the positive sketch-normal direction. Full revolve creates a new
solid around an explicit absolute WCS X or Y axis in the sketch plane. The
simple through-hole tool cuts the current unique solid from its unique
absolute-Z top face through its bottom face at an explicit absolute X/Y
center. The Boolean tool resolves target and tool bodies from two exact
feature journal identifiers and requires positive-volume overlap. The
vertical-edge fillet tool resolves one current solid from an exact feature
journal identifier and blends exactly four full-height linear edges parallel
to absolute WCS Z.
Modeling tools never save the part.

Never bypass a failed `nx_preflight_modeling` call by invoking the mutation
directly. Preflight is a preview of the bridge's bounded selectors and
constraints; the mutation repeats its own fail-closed validation.

## Part files

For new, open, save-as, or close requests, read
[references/part-files.md](references/part-files.md). Use only an absolute
`.prt` path below a root returned by `nx_get_capabilities`. Never change the
path to bypass a policy rejection.

## Verification

After any change, read
[references/verification.md](references/verification.md). Prefer observed
session state over intended parameters.

If a request is unsupported, explain the missing capability and propose the
next narrow typed tool to implement. Do not fall back to generic code
execution.
