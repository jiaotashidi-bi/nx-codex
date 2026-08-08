# Validation status

## NX 12 stage-one real smoke

Validated on 2026-07-31 against:

- Siemens NXOpen `12.0.2.9`;
- .NET Framework 4.0, x64;
- MCP protocol negotiated as `2025-03-26`;
- bridge dispatcher `winforms-main-thread`;
- an enterprise DLP-injected interactive NX process.

The real interactive-session test passed:

1. DLP-encrypted session file fallback through the current-user ACL discovery
   Named Pipe;
2. MCP initialize and exact safe tool enumeration;
3. health, capabilities, and session-state calls;
4. creation of a 100 x 60 x 20 millimeter block;
5. feature/body transition from `1/0` to `2/1`;
6. transaction Undo and exact restoration to `1/0`;
7. forced NX commit failure using a below-tolerance block length;
8. automatic failure rollback with exact restoration to `1/0`;
9. reconnect through a newly started MCP process.

The initial feature count of one is NX 12's default system feature in a blank
part. No file was saved by the test.

Run the same test only with a blank millimeter work part:

```powershell
cd plugins\nx-codex\mcp
npm.cmd run smoke:live
```

The script refuses to modify a part that has any body or more than one initial
feature. If an unexpected error occurs after a transaction is created, it
attempts transaction Undo before exiting and prints the transaction ID if
recovery fails.

## Not yet validated

- NX 2306, 2312, 2412, and 2512;
- reconnect after an NX crash;
- modal dialog and operation timeout fault injection;
- live stage-four screenshot and full semantic feature-tree verification.

## NX 12 stage-two real file lifecycle

Validated on 2026-07-31 against NXOpen `12.0.2.9` and bridge `0.2.0` in an
isolated real NX journal process:

1. owner-only policy discovery for
   `%USERPROFILE%\Documents\UG\NXFiles`;
2. save-as of an initially unsaved part through same-directory staging;
3. `new_part` with a non-existing absolute `.prt` path;
4. confirmation that the new part did not write its target before save-as;
5. save-as to that new target;
6. rejection of a second save-as with `TARGET_EXISTS`;
7. safe close of the unmodified part;
8. reopen of the saved `.prt`;
9. confirmation that the reopened part was unmodified.

The hidden `run_journal.exe` process did not receive a Modeling license and
returned NX license error `-10005` for the block probe. The bridge rolled that
failed mutation back, then the smoke continued with a blank part. Real block,
Undo, and failure rollback remain covered by the stage-one interactive test;
geometry persistence after file reopen still requires the interactive
stage-two follow-up.

Evidence files:

- `NXFiles\nx-codex-real-baseline-20260731025947.prt`;
- `NXFiles\nx-codex-real-block-20260731025947.prt`.

An earlier license-probe run safely produced only
`NXFiles\nx-codex-real-baseline-20260731025916.prt`.

## NX 12 stage-two interactive geometry persistence

Validated on 2026-07-31 against the normal interactive, Modeling-licensed NX
12 process through the complete MCP path:

1. MCP negotiated protocol `2025-03-26`;
2. bridge `0.2.0` reported NXOpen `12.0.2.9`;
3. `nx_new_part` created an unsaved millimeter part without manual setup;
4. `nx_create_block` created an 80 x 50 x 12 block;
5. `nx_save_as` wrote a new `.prt` through the no-overwrite staging flow;
6. a duplicate destination was rejected with `TARGET_EXISTS`;
7. `nx_close_part` safely closed the unmodified work part;
8. `nx_open_part` reopened the saved file;
9. the reopened state reported one feature, one body, and no unsaved changes.

Evidence:

- `NXFiles\nx-codex-phase2-block-20260731030825.prt`;
- SHA-256
  `055E324F17F9FA201CD6B12B682E34E058FAAAA48692094676A0B95861B29D13`;
- `NXFiles\nx-codex-phase2-validation.png`.

## NX 12 stage-two B sketch, extrusion, and measurement

Validated on 2026-07-31 against interactive NXOpen `12.0.2.9` and bridge
`0.3.0` through the complete MCP path:

1. `nx_new_part` created a unique unsaved millimeter part;
2. `nx_create_rectangle_sketch` created a four-line 70 x 40 rectangle on the
   absolute XY plane and returned `SKETCH(0)`;
3. `nx_extrude_sketch` created a new 15 mm solid and returned `EXTRUDE(1)`;
4. an unknown sketch journal identifier was rejected without changing feature
   or body counts;
5. `nx_measure_work_part` reported a 70 x 40 x 15 mm absolute bounding box,
   8900 mm² surface area, 42000 mm³ volume, and centroid `(0, 0, 7.5)`;
6. save-as, safe close, and reopen succeeded;
7. remeasurement matched the pre-save values and left the reopened part
   `modified=false`.

The first live run exposed that NX 12 marks the part modified even when
`CreateCoordinateSystem(..., true)` creates a nominally temporary object.
Bridge `0.3.0` now brackets measurement objects in an invisible Undo mark,
rolls them back, deletes the mark, and fails closed if cleanup cannot be
confirmed.

Evidence:

- `NXFiles\nx-codex-phase2b-sketch-extrude-20260731033713.prt`;
- part SHA-256
  `CE5951A18C506F706DC9FFF4D15A0BC1180EFE63F75666B5898A41121B572289`;
- `NXFiles\nx-codex-phase2b-validation.png`;
- screenshot SHA-256
  `0F6E9AC4E580A5EC5B6CDD57A02E8F412CC79B3F2598886C92B3AAF1ECB2C924`.

## Stage-two automated evidence

The strict mock, MCP stdio integration, protocol, path-policy, no-overwrite,
safe-close, junction, traversal, and duplicate-request tests pass on Windows.
The suite currently contains 24 tests, including strict full-revolve geometry,
semantic through-hole geometry, all three exact-box Boolean modes and rollback,
four-vertical-edge fillet geometry and rollback,
exact/unsupported adapter selection, fail-closed mutation rejection,
axis validation, crossing-profile/edge-clearance rejection, and Undo. The installed NX
12.0.2.9 assemblies also pass the exact reflection contract for `NewDisplay`,
`OpenDisplay`, `SaveAs`, `Close`, sketch/extrude builders,
`UFModl.CreateRevolved`, `UFModl.CreateSimpleHole`, `Body.GetFeatures`, all
three typed UF Boolean wrappers, `Body.GetEdges`, `Edge.GetVertices`,
`Edge.SolidEdgeType`, `UFModl.CreateBlend`, face data and point containment, exact
bounding boxes, mass properties, coordinate
mapping, STEP export, load/save status fields, and `UFPart.IsModified`. Bridge
`0.8.0` compiles against those assemblies in Debug configuration.

## NX 12 stage-two C full revolve

Bridge `0.4.2` exposes a narrow `nx_revolve_sketch` operation:

1. the profile must be the exact four-line rectangular sketch returned by the
   bridge;
2. the axis must be an explicit absolute WCS X or Y axis in the sketch plane;
3. a profile that crosses the axis is rejected before mutation;
4. the angle is fixed at 360 degrees and the Boolean mode is fixed to create a
   new solid;
5. every successful mutation returns an Undo transaction.

The initial `0.4.0` high-level `RevolveBuilder` adapter and the `0.4.1`
NX-sample-aligned variant both triggered NX 12 native exception `c0000005`
inside `jax_feat_builder_definitions.c`. Both failed operations were
automatically rolled back, and the smoke recovery successfully undid the
profile transaction, leaving zero features and zero bodies.

Version `0.4.2` uses the typed `UFModl.CreateRevolved` API documented and
demonstrated by the installed NX 12 UFUN sample instead of the unstable
high-level builder. It retains the same argument restrictions, main-thread
dispatch, visible Undo mark, result-count validation, and failure rollback.
Automated protocol, strict Fake, MCP integration, NXOpen 12.0.2.9 contract,
and isolated candidate-build checks pass. The real interactive smoke also
passed on 2026-07-31:

1. bridge `0.4.2` connected to NXOpen `12.0.2.9` through the
   `winforms-main-thread` dispatcher;
2. a unique unsaved millimeter part and offset 10 x 20 mm rectangular sketch
   were created;
3. `UFModl.CreateRevolved` returned `REVOLVED(1)` and one new solid;
4. exact measurement reported a 40 x 20 x 40 mm bounding box,
   `6000π` mm³ volume, `1800π` mm² surface area, and a zero centroid within
   modeling tolerance;
5. a profile crossing the WCS Y axis was rejected without changing feature or
   body counts;
6. the rejected-profile sketch transaction was undone;
7. no-overwrite save-as, safe close, reopen, and read-only remeasurement all
   succeeded;
8. the reopened part reported three features, one body, and
   `modified=false`.

```powershell
cd plugins\nx-codex\mcp
npm.cmd run smoke:revolve
```

The script creates an offset 10 x 20 mm rectangle and revolves it about WCS Y.
It verifies the expected 40 x 20 x 40 mm bounding box, `6000π` mm³ volume,
`1800π` mm² surface area, zero centroid, crossing-profile rejection, Undo,
save/close/reopen, and read-only remeasurement.

Evidence:

- `NXFiles\nx-codex-phase2c-revolve-20260731092158.prt`;
- part SHA-256
  `14756952B37B893F61578024919080903E0B3F63002AD60C557AE39E2E19A3AD`;
- bridge DLL SHA-256
  `D8D4220DBB62363D1D692C0385B3BDEB35A91CFDDBB1E01279C5C1466EE9E2F2`.

## NX 12 stage-two D simple through hole

Bridge `0.5.0` adds `nx_create_simple_through_hole` with a deliberately narrow
contract: exactly one solid body, explicit absolute X/Y center and diameter,
unique opposite planar faces at the body's absolute Z extrema, negative-Z
through direction, strict face-box clearance, one semantic hole feature, and
unchanged body count. All failures roll back to the visible Undo mark and the
operation never saves.

The adapter uses the installed NX 12 typed
`UFModl.CreateSimpleHole` API with explicit link and through face tags. Its
strict reflection contract, Debug bridge build, protocol validation, strict
Fake mass-property/Undo tests, and MCP stdio integration currently pass.
The Release bridge also compiled with zero warnings and zero errors. The real
interactive MCP smoke passed on 2026-08-01:

1. bridge `0.5.0` connected to NXOpen `12.0.2.9` through the
   `winforms-main-thread` dispatcher;
2. a 60 x 40 x 20 mm block was created at absolute origin `(-30,-20,0)`;
3. a diameter-10 hole at `X=29, Y=0` was rejected with
   `HOLE_CLEARANCE_OUTSIDE_FACE` without changing feature or body counts;
4. a diameter-10 hole at `X=10, Y=5` created native feature
   `SIMPLE_HOLE(1)` while retaining one solid body;
5. exact measurement reported the unchanged 60 x 40 x 20 mm bounding box,
   46429.2036732051 mm^3 volume, 9271.23889803847 mm^2 surface area, and
   centroid `(-0.3383207556,-0.1691603778,10)` mm;
6. Undo restored the original block measurements;
7. the hole was recreated and save-as, safe close, reopen, and read-only
   remeasurement all succeeded;
8. the reopened part reported two features, one body, and `modified=false`.

The repeatable command is:

```powershell
cd plugins\nx-codex\mcp
npm.cmd run smoke:hole
```

Evidence:

- `NXFiles\nx-codex-phase2d-through-hole-20260801001941.prt`;
- part SHA-256
  `0493F0A4BC30F7EC04DD99D484345868077BD89D817201941F015666F36C02E1`;
- bridge DLL SHA-256
  `B440CC54445F8AB64E1CE3BAA2AB5F2D2CB5528B1BD7A74D8ABB4E8296B31F22`.

## NX 12 stage-two E strict Boolean

Bridge `0.6.0` adds `nx_boolean_bodies` for one explicit target and one
explicit tool body. The adapter resolves current bodies through exact feature
journal identifiers, requires distinct bodies with positive-volume exact-box
overlap, supports `UNITE`, `SUBTRACT`, and `INTERSECT`, requires exactly one
new feature and one consumed tool body, and rejects split or empty results.

The NX 12 reflection contract, Debug bridge build, protocol validation,
strict Fake geometry/Undo checks for all three modes, and MCP stdio integration
currently pass. Interactive validation is performed with:

```powershell
cd plugins\nx-codex\mcp
npm.cmd run smoke:boolean
```

The real interactive MCP smoke passed on 2026-08-01. Bridge `0.6.0` connected
to NXOpen `12.0.2.9` through `winforms-main-thread`; same-feature selection was
rejected before mutation; `SUBTRACT`, `UNITE`, and `INTERSECT` each produced one
native Boolean feature and one solid with the expected exact mass properties;
Undo restored both input bodies after every mode. A final subtraction was
saved, safely closed, reopened without load warnings, and remeasured at
60 x 40 x 20 mm bounds, 40000 mm^3 volume, 9600 mm^2 area, and centroid
`(-2,0,10)` mm with `modified=false`.

Evidence:

- `NXFiles\nx-codex-phase2e-boolean-20260801003903.prt`;
- bridge DLL SHA-256
  `A34776503063EB20D08115F6A6906C884A4139F983373C52CB46B81F8AF4DA38`.

## NX 12 stage-two F four vertical-edge fillet

Bridge `0.7.0` adds `nx_fillet_vertical_edges`. It resolves one current solid
through an exact feature journal identifier, requires exactly four full-height
linear edges parallel to absolute WCS Z, and rejects a radius at or above half
the smaller exact X/Y size. The typed NX 12 `UFModl.CreateBlend` call is
transactional, must create exactly one feature, must preserve body count, and
never saves.

The strict NX 12 reflection contract, zero-warning Debug bridge build,
protocol validation, strict Fake analytic mass-property/Undo test, and MCP
stdio integration pass. The Release bridge also compiles with zero warnings
and zero errors. The real interactive MCP smoke passed on 2026-08-01:

1. bridge `0.7.0` connected to NXOpen `12.0.2.9` through the
   `winforms-main-thread` dispatcher and advertised `fillet_vertical_edges`;
2. a centered 60 x 40 x 20 mm block was created as `BLOCK(0)`;
3. radius 20 mm was rejected with `FILLET_RADIUS_TOO_LARGE` before changing
   feature or body counts;
4. radius 5 mm created native feature `BLEND(1)` while retaining one body;
5. exact measurement reported the unchanged 60 x 40 x 20 mm bounding box,
   47570.7963267949 mm^3 volume, 8585.398163397447 mm^2 surface area, and
   centroid `(0,0,10)` mm within modeling tolerance;
6. Undo restored the original 48000 mm^3 volume and 8800 mm^2 area;
7. the blend was recreated and save-as, safe close, reopen, and read-only
   remeasurement all succeeded;
8. the reopened part reported two features, one body, and `modified=false`.

The repeatable command is:

```powershell
cd plugins\nx-codex\mcp
npm.cmd run smoke:fillet
```

Evidence:

- `NXFiles\nx-codex-phase2f-fillet-20260801050125.prt`;
- part SHA-256
  `D2F9251356FE681ECB657A741D91BD8796932F0835518667A270FA3599B157FB`;
- bridge DLL SHA-256
  `892EBA74A289BE3EB58F2917BAE9B86AFD5F55BE7BB59D2253B26DFBA0A2E7BB`.

## Stage three API index and version adapters

Bridge `0.8.0` introduces explicit NXOpen compatibility profiles. The runtime
selects `nx12.0.2.9` only for exact assembly version `12.0.2.9`; every other
version receives an `unsupported:<version>` adapter that advertises only
health, capabilities, and session state. Modeling, file mutation, export, and
Undo requests fail with `NX_VERSION_NOT_SUPPORTED` before reaching NXOpen.

The offline baseline index was generated from the real installed
`NXOpen.dll`, `NXOpen.UF.dll`, and `NXOpen.Utilities.dll` without connecting to
the live NX session:

- public types: 13,257;
- declared public canonical members: 104,997;
- compact JSON size: 14,090,126 bytes;
- required bridge contract: 22 types and 42 exact members;
- index SHA-256:
  `0D51AA6019ADDC69626D6093670AE9682081010718A114B258931E16E8941EE3`.

The strict tooling passes:

1. direct reflection verification against exact NXOpen `12.0.2.9`;
2. deterministic full-index regeneration;
3. exact member query for `UFModl.CreateBlend`;
4. positive required-API validation;
5. negative validation with an injected nonexistent member;
6. zero-warning Debug bridge compilation;
7. runtime adapter selection for the verified baseline and fail-closed
   candidates;
8. the real-installation matrix.

The current matrix result is:

| Lane | Result | Compatibility claim |
| --- | --- | --- |
| NX 12.0.2.9 | Passed against real assemblies | Verified |
| NX 2306 | Skipped; installation directory not configured | Unsupported |
| NX 2312 | Skipped; installation directory not configured | Unsupported |
| NX 2412 | Skipped; installation directory not configured | Unsupported |
| NX 2512 | Skipped; installation directory not configured | Unsupported |

Skipped lanes are not counted as supported. Set the corresponding environment
variable documented in [`API_INDEX.md`](API_INDEX.md) to test a real
installation. This stage did not call a live NX modeling or part-file
operation.

The Release `0.8.0` read-only live handshake passed on 2026-08-01:

1. the bridge connected to NXOpen `12.0.2.9` through
   `winforms-main-thread`;
2. `nxOpenAssemblyVersion` was exactly `12.0.2.9`;
3. adapter `nx12.0.2.9` selected contract
   `nx12.0.2.9-required-api-v1` with `compatibilityStatus=verified`;
4. the complete existing capability surface remained advertised;
5. two consecutive session-state reads were identical;
6. NX reported no work part, zero features, zero bodies, and
   `modified=false`;
7. no modeling, save, close, export, or Undo tool was called.

Release bridge DLL SHA-256:
`1F9806B34933C70192EDA9D938FD585FF244D6AB8FB435E4B3B70A1319DA3D49`.

## Stage four plan, preflight, and joint verification

Bridge and MCP `0.9.0` add three NX 12.0.2.9 adapter capabilities and one MCP
composite tool:

1. `nx_preflight_modeling` validates the exact typed plan, compatibility,
   units, feature/body selectors, and topology constraints without committing
   the feature. It returns baseline counts and a complete feature-tree SHA-256.
2. `nx_get_feature_tree` returns ordered feature identifiers, names, types,
   timestamps, suppression state, and parent links. The response is bounded to
   the latest 128 nodes while its fingerprint covers every feature.
3. `nx_capture_screenshot` writes a staged PNG below an allowed root, refuses
   overwrite and reparse points, verifies non-empty output and unchanged NX
   modified state, then returns byte count and SHA-256.
4. `nx_verify_modeling_result` combines post-session identity/units,
   operation-specific count deltas, exact bounding box/mass properties, the
   active created feature node, and screenshot evidence into individual checks
   plus `verificationPassed`.

Automated verification currently passes:

- TypeScript strict typecheck and all 24 protocol, path-policy, strict Fake,
  bridge-client, version-adapter, and stdio MCP tests;
- end-to-end mock preflight for a rectangle and extrusion;
- joint sketch verification without solid measurement;
- joint extrusion verification against exact 70 x 40 x 15 mm bounds,
  8900 mm^2 area, 42000 mm^3 volume, and centroid `(0,0,7.5)`;
- no-overwrite PNG creation and SHA-256 evidence through the MCP;
- the expanded real NXOpen 12.0.2.9 contract with 26 types and 50 exact
  members;
- zero-warning Debug compilation against the installed NXOpen `12.0.2.9`
  assemblies.

Run the offline suite with:

```powershell
cd plugins\nx-codex\mcp
npm.cmd run verify
```

After loading the Release `0.9.0` bridge in interactive NX, run the dedicated
live stage-four path with a valid `NXFiles` allowed root:

```powershell
cd plugins\nx-codex\mcp
npm.cmd run smoke:stage4
```

The live script creates a unique 50 x 30 x 10 mm block, performs typed
preflight, joint measurement/tree/PNG verification, then saves and safely
closes the evidence part. This live stage-four command has been added but is
not claimed as passed until it is run against the reloaded `0.9.0` DLL.

## Stage five A module capability and license detection

Bridge and MCP `1.0.0` add four independent read-only operations:

- `nx_get_assembly_capability`;
- `nx_get_drafting_capability`;
- `nx_get_cae_capability`;
- `nx_get_cam_capability`.

Every operation returns `available`, `licensed`, `adapterId`, and
`unsupportedReason`. On the verified NX 12 adapter, `available=true` means the
typed detector is implemented. `licensed=true` means the current NX session
already has a matching module license active. Detection reads only
`Session.ApplicationName`, `LicenseManager.GetBundlesUsed()`, and
`LicenseManager.GetActiveLicensesInABundle()`; it never reserves or releases a
license, changes bundle selection, or initializes a module. Unknown NXOpen
versions return `available=false`, `licensed=false`, their
`unsupported:<version>` adapter ID, and a version-specific reason.

Automated validation passed on 2026-08-03:

1. TypeScript strict typecheck and all 25 protocol, path-policy, strict Fake,
   bridge-client, version-adapter, and stdio MCP tests;
2. all four independent tools through the end-to-end stdio MCP path;
3. exact fail-closed structured results on unverified versions;
4. the pure NX 12 module/application/license matcher for assembly, drafting,
   CAE, and CAM feature names;
5. the expanded real NXOpen 12.0.2.9 contract with 28 types and 54 exact
   members;
6. zero-warning Debug and Release compilation against the installed NXOpen
   `12.0.2.9` assemblies.

The real read-only smoke passed on 2026-08-03 in an isolated NXOpen
`12.0.2.9` process through `winforms-main-thread`:

1. bridge `1.0.0` selected `nx12.0.2.9`;
2. the host deliberately kept `workPart=null`;
3. assembly, drafting, CAE, and CAM each returned `available=true`,
   `licensed=false`, `adapterId=nx12.0.2.9`, and an empty
   `unsupportedReason`;
4. the Gateway-only isolated session had no matching active module licenses;
5. no part, assembly, sheet, view, annotation, CAE model/mesh/solve, CAM setup,
   operation, toolpath, post, output file, or license reservation was created.

Release bridge DLL SHA-256:
`7235D9F29BB102C387B624933C0BF7B58585D556DA34AD152C3C158CAE11CE22`.

Repeat the same real read-only test with:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File plugins\nx-codex\bridge\smoke\invoke-real-smoke.ps1 `
  -NXBin "D:\Program Files\Siemens\NX 12.0\NXBIN" `
  -ModuleCapabilitiesOnly
```

## Stage five B bounded assembly read-only capability

Bridge and MCP `1.0.0` add `get_assembly_structure` /
`nx_get_assembly_structure` only to the exact NXOpen `12.0.2.9` adapter. The
tool returns `adapterId` and `unsupportedReason` on every semantic result, then
reports whether the work part is an assembly, its root component, and a flat
breadth-first hierarchy with `parentIndex` and `depth`. Component records
contain instance/display names, a leaf prototype part identifier, suppression,
load and representation states, immediate child count, and per-node truncation.

The request accepts `maxDepth` from 0 through 32 and `maxComponents` from 1
through 128; defaults are 8 and 128. `componentCount` is exact only when
`componentCountComplete=true`; otherwise it is the returned lower bound.
`assemblyStructureFingerprint` hashes the bounded hierarchy and truncation
state for repeat-read comparison.

Automated validation passed on 2026-08-03:

1. all 30 TypeScript protocol, path policy, strict Fake, bridge client,
   version-adapter, assembly-read, and stdio MCP tests;
2. end-to-end MCP enumeration and two stable reads of a hierarchical assembly
   fixture, including instance/prototype identifiers, suppression and load
   state, parent indexes, depths, counts, and fingerprint equality;
3. strict Fake depth truncation, component-limit truncation, and inactive-
   license failure before fixture traversal;
4. unchanged `modified`, `featureCount`, and `bodyCount` before and after both
   successful and license-blocked reads;
5. generated API-index contract validation with 32 required types and 66 exact
   canonical members;
6. zero-warning Debug and isolated `bin/Stage5B` Release compilation against
   the installed NXOpen `12.0.2.9` assemblies, plus reflection-level API,
   exact-version adapter, and JSON codec contract tests.

The isolated stage-five B Release DLL is 135680 bytes with SHA-256
`511B1CC8DD3F48C1F210DB86BFAE028D374FB730AE1AE2E4042AC480B661F55D`.

The live validation command is:

```powershell
cd plugins\nx-codex\mcp
npm.cmd run smoke:assembly
```

The command requires NX to be restarted and the newly built bridge loaded. If the assembly
capability reports `licensed=false`, the expected result is
`assemblyReadAvailable=false`, an explicit inactive-license
`unsupportedReason`, no components or structure fingerprint, and unchanged
session state. It does not reserve/release a license or switch applications.

## Stage five C bounded drafting read-only capability

Bridge and MCP `1.0.0` add `get_drafting_structure` /
`nx_get_drafting_structure` only to the exact NXOpen `12.0.2.9` adapter. The
tool returns bounded drawing-sheet and drafting-view metadata including names,
journal identifiers, sizes, units, projection angle, sheet scale, view scale
and origin, and out-of-date/broken/decoration/slave flags. It returns explicit
sheet and view counts, completeness and truncation flags, plus a stable
`draftingStructureFingerprint` for repeat-read comparison.

The request accepts `maxSheets` from 1 through 64 and `maxViews` from 1
through 128; defaults are 32 and 128. The executor checks for an already-active
drafting license before any sheet or view API, then verifies that modified,
feature, body, and solid-body state is unchanged. It never reserves/releases a
license, switches applications, opens a sheet, updates a view, creates an
annotation, saves, or exports.

Automated validation passed on 2026-08-04:

1. strict TypeScript typecheck and all 35 protocol, path policy, strict Fake,
   bridge client, version-adapter, assembly/drafting read, and stdio MCP tests;
2. end-to-end MCP enumeration and two stable reads of a sheet/view fixture,
   including metadata, count completeness, fingerprint equality, and unchanged
   session state;
3. strict Fake sheet and global-view return limits plus inactive-license
   failure before fixture access;
4. generated full API index with 13257 public types and 104997 declared public
   members, and strict contract validation with 37 required types and 81 exact
   canonical members;
5. positive, negative, query, deterministic-generation, JSON codec, exact API
   reflection, and exact-version adapter tests;
6. zero-warning Debug and isolated `bin/Stage5C-Restart` Release compilation against
   the installed NXOpen `12.0.2.9` assemblies, with the real-version matrix
   passing the required NX 12 lane and skipping only unconfigured future lanes.

The restart-safe isolated stage-five C Release DLL is 151552 bytes with
SHA-256
`C4AF2CCC2536A77A5EFE6C10CE157FFE97C74D5AE9274E87BA13043EBD1098D5`.

The live validation command is:

```powershell
cd plugins\nx-codex\mcp
npm.cmd run smoke:drafting
```

The command requires NX to be restarted and the newly built bridge loaded. If drafting
capability reports `licensed=false`, the expected result is
`draftingReadAvailable=false`, an explicit inactive-license
`unsupportedReason`, no sheets, views, or structure fingerprint, and unchanged
session state.

The inactive-license live path passed on 2026-08-04 in a restarted interactive
NXOpen `12.0.2.9` process. The bridge advertised `get_drafting_structure`,
selected `nx12.0.2.9`, returned
`stage5c_drafting_license_inactive_failed_closed`, reported zero sheets and
views with no fingerprint, did not read the structure, and preserved the
application plus work-part modified/feature/body/solid-body state. This proves
the live fail-closed guard; actual sheet/view metadata remains unvalidated
until a session already has an active drafting license.

The active-license empty-structure path also passed on 2026-08-04 after the
user entered the normal NX Drafting application. The detector reported
`licensed=true`, and two bounded reads returned
`stage5c_drafting_readonly_passed`, `hasDrawingSheets=false`, zero sheets and
views, no truncation, and the identical SHA-256 structure fingerprint
`67de71e2fabe350b6e638bf8cec412c156338e26ec7340cac630013b8b7d8059`.
The application, work-part modified flag, and feature/body/solid-body counts
were unchanged. A non-empty real sheet/view sample remains the final drafting
metadata coverage lane.

## Stage five D CAE capability and active-license read

The CAE lane uses the exact NXOpen `12.0.2.9` adapter and returns only six
fields: `available`, `licensed`, `applicationName`, `adapterId`,
`compatibilityStatus`, and `unsupportedReason`. The strict Fake and protocol
schema reject any extra field. The reflection contract requires only
`Session.ApplicationName`, `LicenseManager.GetBundlesUsed()`, and
`LicenseManager.GetActiveLicensesInABundle(string)`; the typed read does not
switch applications, reserve/release licenses, create FEM/SIM data, mesh,
solve, or save.

The live validation command is:

```powershell
cd plugins\nx-codex\mcp
npm.cmd run smoke:cae
```

The command reads the capability twice and requires identical results plus an
unchanged complete session/part state before and after both reads.

The live stage-five D smoke passed on 2026-08-04 after loading the Release
Bridge DLL. NXOpen `12.0.2.9` selected `nx12.0.2.9`; both reads returned the
exact six-field result with `applicationName=UG_APP_NOPART`,
`available=true`, `licensed=false`, and an empty `unsupportedReason`. The
consecutive results matched and the complete session/part state was unchanged.

Same-process replacement is deliberately rejected because the bridge uses
NX's `AtTermination` unload policy. The lifecycle regression test verifies
that a duplicate discovery server returns a clear restart requirement, an
unpublished replacement cannot delete the active bridge's session descriptor,
and the fixed discovery pipe can be started again after a clean stop.
