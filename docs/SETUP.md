# Build, install, and use

## 1. Build and verify the MCP

```powershell
cd plugins\nx-codex\mcp
npm.cmd ci
npm.cmd run verify
```

The build emits bundled runtime files under `mcp/dist`; installed users do not
need `node_modules`.

## 2. Test without NX

Run:

```powershell
plugins\nx-codex\scripts\start-mock-bridge.cmd
```

The command prints the mock session descriptor to stderr and remains running.
The MCP automatically discovers it.

## 3. Build the NX bridge

Requirements:

- Siemens NX with NXOpen .NET assemblies;
- .NET Framework 4.x MSBuild (the script can use the Windows Framework 4.0
  installation included on many NX 12 workstations);
- an explicit directory containing `NXOpen.dll`, `NXOpen.UF.dll`, and
  `NXOpen.Utilities.dll`.

For the verified NX 12.0.2 installation layout:

```powershell
plugins\nx-codex\bridge\build.ps1 `
  -NXOpenDir "D:\Program Files\Siemens\NX 12.0\NXBIN\managed"
```

The build script does not download or redistribute Siemens assemblies.

Run the complete offline stage-three API/index/adapter verification without
modifying a live NX part:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File plugins\nx-codex\bridge\contract-tests\verify-stage3.ps1 `
  -NXOpenDir "D:\Program Files\Siemens\NX 12.0\NXBIN\managed"
```

See [`API_INDEX.md`](API_INDEX.md) for index queries and optional NX
2306/2312/2412/2512 real-installation matrix variables.

Configure one or more explicit local directories before using file tools:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File plugins\nx-codex\scripts\configure-file-policy.ps1 `
  -AllowedRoot "$env:USERPROFILE\Documents\UG\NXFiles"
```

The helper creates missing root directories and writes an owner-only policy to
`%LOCALAPPDATA%\NXCodex\policy.json`. File tools fail closed if the policy is
missing or invalid.

To run the non-saving stage-one smoke test in a temporary NX session:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File plugins\nx-codex\bridge\smoke\invoke-real-smoke.ps1 `
  -NXBin "D:\Program Files\Siemens\NX 12.0\NXBIN"
```

The test creates an unsaved millimeter part, calls health and session state,
creates a 100 x 60 x 20 block through the secured pipe, undoes that
transaction, closes the temporary part without saving, and exits NX.

If the workstation has NX Gateway but no modeling license configured, validate
loading, handshake, capabilities, session state, Named Pipe transport, and
main-thread dispatch without creating geometry:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File plugins\nx-codex\bridge\smoke\invoke-real-smoke.ps1 `
  -NXBin "D:\Program Files\Siemens\NX 12.0\NXBIN" `
  -ConnectivityOnly
```

Validate the stage-five A module detectors in a separate real NX 12 process
without creating a work part, switching applications, reserving licenses,
creating assembly/drafting/CAE/CAM data, solving, or running CAM:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File plugins\nx-codex\bridge\smoke\invoke-real-smoke.ps1 `
  -NXBin "D:\Program Files\Siemens\NX 12.0\NXBIN" `
  -ModuleCapabilitiesOnly
```

The output contains independent `assembly`, `drafting`, `cae`, and `cam`
objects. `licensed` means a matching license is already active in that NX
session; the smoke test does not attempt to acquire one.

After rebuilding and restarting NX, run the CAE two-read smoke through MCP:

```powershell
cd plugins\nx-codex\mcp
npm.cmd run smoke:cae
```

It requires NXOpen `12.0.2.9`, reads `nx_get_cae_capability` twice, requires the
exact six-field result, and compares the complete session/part state before and
after the reads. It does not switch applications, acquire/release licenses,
create FEM/SIM data, mesh, solve, or save.

After restarting NX and loading the stage-five B bridge, validate bounded
assembly reads. The
script preserves fail-closed behavior when the current session has no active
assembly license and never reserves/releases a license or switches applications:

```powershell
cd plugins\nx-codex\mcp
npm.cmd run smoke:assembly
```

After restarting NX and loading the stage-five C bridge, validate bounded
drawing-sheet and drafting-view reads. The script preserves fail-closed behavior when the current
session has no active drafting license and never reserves/releases a license,
switches applications, opens a sheet, updates a view, or creates an annotation:

```powershell
cd plugins\nx-codex\mcp
npm.cmd run smoke:drafting
```

## 4. Load the bridge in NX

The bridge uses NX's `AtTermination` unload policy. When replacing an already
loaded bridge DLL, first preserve any wanted part changes and exit NX normally;
then start a new NX process and load the new DLL. Executing a second bridge DLL
inside the same NX process is rejected to prevent two same-process discovery
servers and ambiguous session ownership.

For initial testing, use NX's **File > Execute > NX Open** command and select:

```text
plugins\nx-codex\bridge\NXCodexBridge\bin\Release\NXCodexBridge.dll
```

For a controlled startup deployment, copy the built DLL into a user-managed NX
startup directory:

```powershell
plugins\nx-codex\bridge\install.ps1 `
  -NxStartupDirectory "C:\Explicit\NX\User\Startup"
```

The installer requires an explicit existing destination and never modifies
machine-wide NX configuration.

## 5. Install the local Codex plugin

The repository contains a local marketplace at:

```text
.agents\plugins\marketplace.json
```

Add the repository marketplace root once, then install `nx-codex` from the
marketplace. Start a new Codex task after installing or rebuilding the plugin
so updated skills and MCP metadata are loaded.

```powershell
plugins\nx-codex\scripts\configure-mcp-path.ps1
codex.cmd plugin marketplace add "C:\Path\To\NX-Codex-Repository"
codex.cmd plugin add nx-codex@personal
```

## 6. First prompts

```text
Use NX Engineering to connect to the current NX session and read its state.
Do not modify anything.
```

```text
Create a 100 x 60 x 20 mm block at the absolute origin. Do not save the file.
```

```text
Undo transaction TX-...
```

```text
Create a new millimeter part at
$env:USERPROFILE\Documents\UG\NXFiles\demo.prt, create a block, and save
it there only if the destination does not already exist.
```

After loading bridge version 1.0.0, run the real interactive file lifecycle
test:

```powershell
cd plugins\nx-codex\mcp
npm.cmd run smoke:files
```

If no work part is open, the test creates one through `nx_new_part`. If a blank
millimeter work part is already open, it first saves that baseline to a unique
file. It then creates a block, saves without overwrite, verifies overwrite
rejection, closes, and reopens the saved part. Test files remain in the allowed
root as evidence.

For an isolated real NX file test that does not require manually opening NX:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File plugins\nx-codex\bridge\smoke\invoke-real-smoke.ps1 `
  -NXBin "D:\Program Files\Siemens\NX 12.0\NXBIN" `
  -FileLifecycle `
  -FileRoot "$env:USERPROFILE\Documents\UG\NXFiles"
```

If the hidden NX journal process cannot obtain a Modeling license, the script
records `modelingLicenseUnavailable=true` and still verifies the blank-part
file lifecycle.

To validate the NX 12 rectangular-sketch, extrusion, exact-measurement, and
save/close/reopen path:

```powershell
cd plugins\nx-codex\mcp
npm.cmd run smoke:modeling
```

The script creates a unique 70 x 40 x 15 mm test part below the configured
allowed root. It verifies the feature identifiers, exact bounding extents,
surface area, volume, centroid, rejection of an unknown sketch identifier,
no-overwrite save lifecycle, and that measurement leaves `modified=false`.

To validate the full-revolve path after loading bridge `1.0.0`:

```powershell
cd plugins\nx-codex\mcp
npm.cmd run smoke:revolve
```

The script creates an offset rectangular sketch, revolves it 360 degrees
around the absolute WCS Y axis as a new solid, verifies exact annular-cylinder
measurements, rejects a profile that crosses the axis, undoes the rejected
profile, and verifies save/close/reopen persistence.

To validate the simple through-hole path after loading bridge `1.0.0`:

```powershell
cd plugins\nx-codex\mcp
npm.cmd run smoke:hole
```

The script creates a 60 x 40 x 20 mm block, rejects a hole without edge
clearance, creates a diameter-10 mm semantic through hole at absolute
`X=10, Y=5`, verifies exact mass properties, undoes and verifies restoration,
then recreates, saves, closes, reopens, and remeasures the result.

To validate all three strict two-body Boolean modes after loading bridge
`1.0.0`:

```powershell
cd plugins\nx-codex\mcp
npm.cmd run smoke:boolean
```

The script creates two overlapping blocks, rejects same-feature selection,
verifies `SUBTRACT`, `UNITE`, and `INTERSECT` mass properties, undoes every
mode and confirms both bodies return, then persists a subtraction and verifies
save/close/reopen.

To validate the bounded four-vertical-edge fillet after loading bridge
`1.0.0`:

```powershell
cd plugins\nx-codex\mcp
npm.cmd run smoke:fillet
```

The script creates a centered 60 x 40 x 20 mm block, rejects radius 20 mm
without mutation, creates radius-5 mm blends on all four full-height WCS-Z
edges, verifies exact bounding box and analytic mass properties, undoes and
confirms baseline restoration, then recreates and verifies save/close/reopen.

To validate the stage-four plan/preflight/evidence loop after loading bridge
`1.0.0`:

```powershell
cd plugins\nx-codex\mcp
npm.cmd run smoke:stage4
```

The script creates a unique millimeter part and an explicit 50 x 30 x 10 block
plan, requires the exact NX 12.0.2.9 adapter preflight, executes the matching
block, and jointly verifies session deltas, exact bounding box, area, volume,
centroid, active feature-tree node, and a new PNG with SHA-256. It then saves
and safely closes the evidence part. Existing `.prt` or `.png` destinations
are never overwritten.
