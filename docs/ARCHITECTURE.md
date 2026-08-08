# Architecture

```text
Codex
  -> nx-engineering skill
  -> typed modeling plan / preflight baseline
  -> local stdio MCP
  -> authenticated per-user Named Pipe
  -> NX-hosted C# bridge
  -> main-thread dispatcher
  -> exact NXOpen version adapter
  -> narrow NXOpen operation executor
  -> joint state / measurement / feature-tree / PNG evidence
```

## Trust boundaries

1. Codex treats MCP tool arguments as untrusted.
2. The MCP validates tool arguments and creates a versioned bridge request.
3. The bridge limits message size and JSON depth, rejects unknown fields,
   authenticates a per-launch token, checks deadlines, and rejects replayed IDs.
4. Only fixed operation DTOs reach the NX executor.
5. Every model mutation receives a visible NX undo mark and rolls back on
   failure.
6. File paths are independently checked by MCP and the NX-hosted bridge
   against the current-user policy in `%LOCALAPPDATA%\NXCodex\policy.json`.
7. The exact NXOpen assembly version selects a typed adapter. Unknown versions
   advertise only handshake and structured read-only module detection, and
   reject every mutation.
8. Screenshot destinations pass the same independent allowed-root,
   no-reparse, and no-overwrite checks as other outputs. NX writes a unique
   staging PNG before an atomic same-directory move.

## MVP operations

| Operation | MCP tool | Mutation |
| --- | --- | --- |
| `health` | `nx_health` | No |
| `get_capabilities` | `nx_get_capabilities` | No |
| `get_session_state` | `nx_get_session_state` | No |
| `get_assembly_capability` | `nx_get_assembly_capability` | No; reads active licenses only |
| `get_assembly_structure` | `nx_get_assembly_structure` | No; bounded hierarchy, requires already-active assembly license |
| `get_drafting_capability` | `nx_get_drafting_capability` | No; reads active licenses only |
| `get_drafting_structure` | `nx_get_drafting_structure` | No; bounded sheets/views, requires already-active drafting license |
| `get_cae_capability` | `nx_get_cae_capability` | No; reads active licenses only |
| `get_cam_capability` | `nx_get_cam_capability` | No; reads active licenses only |
| `preflight_modeling` | `nx_preflight_modeling` | No; validates one typed plan |
| `get_feature_tree` | `nx_get_feature_tree` | No; ordered nodes plus full-tree fingerprint |
| `capture_screenshot` | `nx_capture_screenshot` | Creates a new `.png`; never overwrites |
| `new_part` | `nx_new_part` | New unsaved in-memory part |
| `open_part` | `nx_open_part` | Loads an existing allowed `.prt` |
| `save_as` | `nx_save_as` | Creates a new `.prt`; never overwrites |
| `close_part` | `nx_close_part` | Closes only an unmodified work part |
| `create_block` | `nx_create_block` | Yes, transactional |
| `create_rectangle_sketch` | `nx_create_rectangle_sketch` | Yes, transactional |
| `extrude_sketch` | `nx_extrude_sketch` | Yes, new solid, transactional |
| `revolve_sketch` | `nx_revolve_sketch` | Yes, full revolve/new solid, transactional |
| `create_simple_through_hole` | `nx_create_simple_through_hole` | Yes, semantic through hole in unique solid, transactional |
| `boolean_bodies` | `nx_boolean_bodies` | Yes, explicit two-body unite/subtract/intersect, transactional |
| `fillet_vertical_edges` | `nx_fillet_vertical_edges` | Yes, exactly four absolute-Z full-height edges, transactional |
| `measure_work_part` | `nx_measure_work_part` | No; temporary objects are rolled back |
| `export_step` | `nx_export_step` | Creates a new `.stp`/`.step`; never overwrites |
| `undo_transaction` | `nx_undo_transaction` | Yes |
| MCP composite | `nx_verify_modeling_result` | Reads evidence and creates one new `.png`; never saves the part |

The protocol intentionally has no generic execute, reflection, raw NXOpen
object, or journal tool.

## API compatibility boundary

Bridge `1.0.0` continues to report `nxOpenAssemblyVersion`, `adapterId`,
`adapterContractId`, and `compatibilityStatus` in handshake and general
results; the strict CAE result intentionally exposes only its six-field
contract. The sole
verified profile is NXOpen `12.0.2.9`; its version-sensitive UF calls live in
`Nx12_0_2_9Adapter`. `UnsupportedNxVersionAdapter` is deliberately read-only.

The NX 12 module detector reads `Session.ApplicationName`,
`LicenseManager.GetBundlesUsed()`, and
`LicenseManager.GetActiveLicensesInABundle()`. It returns one independent
result for assembly, drafting, CAE, or CAM. `available` describes whether a
verified adapter implements the detector; `licensed` describes a matching
license already active in the current NX session. CAE is a strict six-field
result: `available`, `licensed`, `applicationName`, `adapterId`,
`compatibilityStatus`, and `unsupportedReason`. Detection never reserves or
releases a feature, changes bundle selection, enters an application, or
initializes a module. Active license names are matched inside NX and are not
returned over the bridge.

The stage-five B assembly reader is implemented only by
`Nx12_0_2_9Adapter`. It uses the exact typed `ComponentAssembly.RootComponent`,
`Component.GetChildren`, component display/suppression/representation members,
`UFAssem.AskComponentData`, and `UFPart.IsLoaded` contract. The executor checks
the active-license snapshot first, so an inactive license returns a structured
failure without touching component-tree APIs. A breadth-first traversal is
bounded to caller-selected depth 0-32 and 1-128 returned occurrences; the
default is 8/128. Parent indexes, depths, immediate child counts, truncation
flags, and a SHA-256 fingerprint preserve hierarchy and make repeated reads
comparable without exposing raw NX tags or full prototype paths.

The stage-five C drafting reader is also implemented only by
`Nx12_0_2_9Adapter`. It checks the active drafting-license snapshot before
calling `Part.DrawingSheets`, then uses the exact typed drawing-sheet and
drafting-view APIs. Requests are bounded to 1-64 sheets and 1-128 total views;
defaults are 32/128. The result records sheet and view counts, independent
completeness and truncation flags, and a SHA-256 fingerprint. It does not open
a sheet, update a view, create an annotation, switch applications, save, or
export.

The offline API index catalogs all public metadata from the three installed
NXOpen assemblies using deterministic canonical member keys. A separate strict
contract lists only APIs required by the bridge. This keeps the complete index
queryable while making the runtime compatibility claim small and auditable.
See [API_INDEX.md](API_INDEX.md).

The NX 12 full-revolve adapter uses the typed
`NXOpen.UF.UFModl.CreateRevolved` wrapper because real interactive tests found
that NX 12.0.2.9 can raise native exception `c0000005` in the high-level
`RevolveBuilder`. The UF adapter remains behind the same strict DTO,
main-thread dispatcher, Undo transaction, and rollback boundary.

The NX 12 simple-through-hole adapter uses the typed
`NXOpen.UF.UFModl.CreateSimpleHole` wrapper with explicit link and through
faces. Preflight requires one solid, unique opposite absolute-Z planar faces,
center containment, and circular edge clearance. It never substitutes an
untracked Boolean operation.

The Boolean adapter maps exact feature journal identifiers to current solid
bodies through `Body.GetFeatures()`, requires distinct mappings and
positive-volume exact-box overlap, and calls only the typed NX 12 UF Boolean
wrappers. It accepts one target and one tool, consumes the tool, rejects split
or empty results, and rolls back if feature/body count invariants fail.

The first fillet adapter maps one exact feature journal identifier to its
current solid body, reads exact absolute bounds, and accepts only exactly four
linear edges parallel to WCS Z that span the body's full Z range. It calls the
typed NX 12 `UFModl.CreateBlend` wrapper with a constant radius and rejects
oversized radii before creating an Undo mark.

The stage-four preflight calls the same bounded NX 12 selectors without
committing a modeling feature, then returns a baseline containing part identity,
units, counts, and a complete feature-tree SHA-256. The mutation still repeats
its fail-closed validation. Post-execution verification compares the baseline
with fresh session state, exact solid measurement, and the active created
feature node. PNG capture is isolated in `Nx12_0_2_9Adapter`; the NX 12 typed
graphics API writes only to a validated staging path, and capture must not
change the work-part modified state.

`save_as` writes a unique staging `.prt` in the destination directory, closes
the saved staging part, uses a same-volume `File.Move` that fails when the
target exists, and reopens the final path. If the atomic move fails, the
staging file is retained and reported as a recovery copy.

## Threading

The pipe listener runs on a background thread. NXOpen work is dispatched to a
hidden Windows Forms control created on the NX entry thread. A queued action
that cannot begin before its queue deadline is cancelled, preventing it from
executing later after the MCP has reported a timeout. Once NX starts an
operation it is allowed to finish because NXOpen operations cannot generally be
cancelled safely.

This dispatcher must be smoke-tested for every supported NX release before that
release is marked compatible.
