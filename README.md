# NX Codex

The `1.0.0 RC1` release closeout, reproducible package procedure, SHA-256
workflow, support matrix, known limitations, and local-only verification record
are in [`docs/RELEASE_1.0.0_RC1.md`](docs/RELEASE_1.0.0_RC1.md).

## 1.0.0 RC1 status

RC1 formally supports only NXOpen `12.0.2.9` with adapter
`nx12.0.2.9` and contract `nx12.0.2.9-required-api-v1`. NX 2306, 2312, 2412,
and 2512 remain `unsupported/unverified` and fail closed for mutations.

The RC1 package is local-only and unsigned. The verified package, SHA-256, and
full release checklist are documented in
[`docs/RELEASE_1.0.0_RC1.md`](docs/RELEASE_1.0.0_RC1.md).

NX Codex is a security-first Codex plugin for controlling Siemens NX through a
small, typed MCP tool surface. The repository currently implements an MVP with:

- a Codex plugin and an `nx-engineering` skill;
- a local stdio MCP server;
- a per-user Windows Named Pipe protocol;
- an NX-hosted C# bridge;
- a mock bridge for development without Siemens NX;
- read-only health/session and assembly/drafting/CAE/CAM active-license tools,
  bounded assembly hierarchy and drafting sheet/view inspection,
  policy-restricted part file lifecycle,
  transactional block/rectangular-sketch/extrude/full-revolve/simple-through-hole/
  two-body-Boolean/four-vertical-edge-fillet creation, exact solid measurement,
  typed modeling preflight, feature-tree evidence, no-overwrite PNG capture,
  joint post-model verification, STEP export, and undo.

The bridge never exposes raw `NXOpen.Session`, `UI`, or `UFSession` objects and
does not accept arbitrary Python, C#, journal, or serialized .NET object graphs.

## How to use

The normal workflow has two independently loaded pieces: the Codex plugin/MCP
and the NX-hosted Bridge.

1. Configure the cloned/extracted plugin path, install its repository
   marketplace, and start a new Codex task:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass `
     -File .\plugins\nx-codex\scripts\configure-mcp-path.ps1
   codex.cmd plugin marketplace add (Resolve-Path .)
   codex.cmd plugin add nx-codex@personal
   ```

2. In NX 12.0.2.9, load
   `bridge/NXCodexBridge/bin/Release/NXCodexBridge.dll` with
   `File > Execute > NX Open`, or install it into an explicit user startup
   directory using `bridge/install.ps1`. Exit NX normally before replacing a
   loaded Bridge DLL.

3. For file operations, configure an explicit allowed root:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass `
     -File .\plugins\nx-codex\scripts\configure-file-policy.ps1 `
     -AllowedRoot "$env:USERPROFILE\Documents\UG\NXFiles"
   ```

4. Begin with a read-only handshake in the new Codex task:

   ```text
   Use NX Engineering to call nx_health, nx_get_capabilities, and
   nx_get_session_state. Do not modify, save, export, or screenshot anything.
   ```

5. For a direct modeling request, state units, dimensions, absolute WCS
   coordinates, and whether saving is allowed. The skill performs typed
   preflight and post-operation verification; modeling does not save
   automatically. Preserve the returned transaction ID for a user-requested
   `nx_undo_transaction`.

See [`docs/SETUP.md`](docs/SETUP.md) for build, Bridge loading, file lifecycle,
smoke tests, and example prompts.

## Safety and limitations

- Health, capabilities, module detection, session state, preflight, feature
  tree, and measurements are read-only.
- Assembly, drafting, CAE, and CAM checks report only licenses already active
  in the current NX session. The Bridge never acquires/releases licenses or
  switches applications to probe them.
- Modeling is limited to typed, bounded operations with a transaction and
  verification boundary. It does not run arbitrary Python, C#, NX journals, or
  shell commands.
- File tools require absolute paths below an advertised allowed root, never
  overwrite destinations, and never force-close a modified part.
- A timeout is an unknown execution state; the client must inspect NX state
  before any retry.

## Roadmap

Planned work is intentionally outside RC1 and will require separate versioned
validation:

- independent API indexes, contracts, adapters, and live test lanes for NX
  2306, 2312, 2412, and 2512;
- typed datum-plane and datum-axis selectors plus bounded hole, chamfer, and
  advanced blend features;
- dependency-aware edits to existing features and controlled file lifecycle
  extensions;
- separately governed CAM output workflows;
- reviewed, hash-pinned automation recipes instead of arbitrary code
  injection.

These items are not enabled by the RC1 plugin and must not be inferred from
similar NX release names or from an offline API index alone.

Siemens NX and NXOpen are Siemens products. This repository does not include
or redistribute Siemens NXOpen assemblies, licenses, or user part files.

## Repository layout

```text
.agents/plugins/marketplace.json       Local Codex marketplace
plugins/nx-codex/
  .codex-plugin/plugin.json            Plugin manifest
  .mcp.json                            Bundled MCP registration
  mcp/                                 TypeScript MCP and mock bridge
  bridge/NXCodexBridge/                NX-hosted .NET Framework bridge
  schemas/protocol-v1.schema.json      Wire contract
  skills/nx-engineering/               Codex workflow skill
  scripts/                             Runtime and build helpers
docs/                                  Architecture, security, and setup
```

## Quick verification without NX

Requirements: Windows and Node.js 20 or newer.

```powershell
cd plugins\nx-codex\mcp
npm.cmd ci
npm.cmd run verify
```

Start the mock bridge:

```powershell
plugins\nx-codex\scripts\start-mock-bridge.cmd
```

In another terminal, use MCP Inspector or let Codex start the bundled MCP
server from `.mcp.json`.

## Current verification boundary

The MCP, protocol, mock bridge, and end-to-end stdio flow are tested without
NX. The stage-one bridge path has also passed a real interactive Siemens NX
12.0.2 smoke test covering DLP-safe discovery, main-thread dispatch, block
creation, Undo, and failed-operation rollback. See
[`docs/VALIDATION.md`](docs/VALIDATION.md) for the evidence and remaining test
matrix, and [`docs/SETUP.md`](docs/SETUP.md) for build and load instructions.

The second-stage implementation adds `nx_new_part`, `nx_open_part`,
`nx_save_as`, and `nx_close_part`. Both MCP and the NX-hosted bridge enforce
the same current-user policy, `.prt`-only local paths, reparse-point rejection,
no overwrite, and no force-discard close.

The full second-stage path is validated in interactive NX 12.0.2.9, including
block creation, save-as, overwrite rejection, safe close, reopen, and
feature/body persistence.

Stage 2B is also validated through the complete MCP path: a four-line 70 x 40
XY sketch, a 15 mm new-solid extrusion, exact 70 x 40 x 15 bounding box,
8900 mm² area, 42000 mm³ volume, save/close/reopen, and read-only remeasurement.

Stage 2C adds a strictly bounded 360-degree new-solid revolve around an
explicit coplanar absolute WCS X or Y axis. Its automated tests cover annular
cylinder geometry, invalid axis input, profile-crossing rejection, and Undo.
The NX 12 adapter uses the typed UF revolve wrapper after real tests exposed a
native fault in NX 12's high-level `RevolveBuilder`. Bridge 0.4.2 has now
passed the full interactive MCP path, including exact measurement,
crossing-profile rejection, Undo, save/close/reopen, and read-only
remeasurement. See [`docs/VALIDATION.md`](docs/VALIDATION.md).

Stage 2D adds a semantic simple through-hole feature for a current unique
solid. The first strict adapter selects the unique absolute-Z top and bottom
planar faces, cuts in negative WCS Z, rejects ambiguous faces or inadequate
edge clearance before mutation, preserves body count, and supports full Undo.
Bridge 0.5.0 uses the typed NX 12 `UFModl.CreateSimpleHole` wrapper rather than
an arbitrary subtract-cylinder fallback.

Stage 2E adds typed `UNITE`, `SUBTRACT`, and `INTERSECT` operations between
two explicitly selected current solids. Selection uses exact feature journal
identifiers, target/tool roles are never inferred, positive-volume overlap is
required, split or empty results roll back, and successful operations must
create one Boolean feature while consuming exactly one tool body.

Stage 2F adds `nx_fillet_vertical_edges`, a deliberately bounded constant-radius
blend. It resolves one current solid from an exact feature journal identifier,
requires exactly four full-height linear edges parallel to absolute WCS Z,
rejects a radius at or above half the smaller X/Y body size, preserves body
count, and participates in the same Undo/rollback boundary. Bridge `0.7.0` has
passed the full interactive NX 12.0.2.9 path, including preflight rejection,
native blend creation, analytic measurement, Undo restoration, and
save/close/reopen.

Stage 3 adds a deterministic machine-readable index of the installed NXOpen
API, exact required-member contracts, and fail-closed runtime version
adapters. NXOpen `12.0.2.9` is the first verified baseline. Other versions can
perform read-only handshake calls but cannot mutate NX until their real
installation matrix lane, API contract, typed adapter, and smoke tests pass.
See [`docs/API_INDEX.md`](docs/API_INDEX.md).

Stage 4 adds the modeling evidence loop. The skill now emits one explicit typed
plan, calls `nx_preflight_modeling` immediately before execution, preserves a
baseline feature-tree fingerprint, and verifies the result through session
state, exact bounding box/mass properties, the created feature-tree node, and
a policy-restricted PNG screenshot. Bridge `0.9.0` keeps the exact
`nx12.0.2.9` adapter and all prior fail-closed file, version, transaction, and
arbitrary-execution boundaries.

Stage 5A adds four independent read-only module probes:
`nx_get_assembly_capability`, `nx_get_drafting_capability`,
`nx_get_cae_capability`, and `nx_get_cam_capability`. Each returns
`available`, `licensed`, `adapterId`, and `unsupportedReason`; the CAE tool
strictly returns only those fields plus `applicationName` and
`compatibilityStatus`. `licensed` means that the current NX session already
has a matching module license active; the bridge never calls `Reserve`,
`Release`, switches applications, initializes CAM, creates drafting/assembly/
CAE data, or starts a solve. Bridge `1.0.0` has passed a no-work-part real
NXOpen `12.0.2.9` read-only smoke test.

Stage 5B adds `nx_get_assembly_structure`, an independent read-only assembly
tool for the exact `nx12.0.2.9` adapter. It returns the root component and a
bounded breadth-first hierarchy with instance/prototype identifiers,
suppression, load and representation state, child counts, explicit truncation
metadata, and a stable bounded-structure fingerprint. The default limits are
depth 8 and 128 component occurrences. It checks for an already-active
assembly license before calling any component-tree API and fails closed with an
explicit `adapterId` and `unsupportedReason`; it never reserves/releases a
license, changes applications, loads components, edits the assembly, saves, or
exports.

Stage 5C adds `nx_get_drafting_structure` to the same exact-version boundary.
It returns bounded drawing-sheet and drafting-view metadata, explicit
sheet/view completeness and truncation flags, and a stable fingerprint for
repeat-read comparison. The tool checks for an already-active drafting license
before any sheet or view API; it never reserves/releases a license, changes
applications, opens a sheet, updates a view, creates an annotation, saves, or
exports.

Stage 5D hardens `nx_get_cae_capability` for the exact NXOpen `12.0.2.9`
adapter. Its result is exactly `available`, `licensed`, `applicationName`,
`adapterId`, `compatibilityStatus`, and `unsupportedReason`. It reads only the
current application name and already-active license snapshot; it never switches
applications, reserves or releases licenses, creates FEM/SIM data, meshes,
solves, or saves. The live smoke reads the capability twice and compares the
complete session/part state before and after both reads.

The testing closeout adds deterministic strict-Fake fault injection for modal
dialogs, bridge disconnect/crash, post-commit timeout with unknown execution
state, replay/idempotency, Named Pipe replacement/reconnect, and protocol/path
security refusal. The release matrix records NX 12.0.2.9 as `verified` and
2306, 2312, 2412, and 2512 as `unsupported/unverified` until each has its own
real assembly index, required-API contract, typed adapter, live handshake, and
version-specific smoke evidence. See [`docs/TEST_CLOSEOUT.md`](docs/TEST_CLOSEOUT.md).
