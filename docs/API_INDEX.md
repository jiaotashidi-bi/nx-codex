# NXOpen API index and version adapters

Stage three makes NX compatibility explicit and reproducible. The runtime no
longer treats any loadable NXOpen assembly as supported.

## Baseline

The first verified profile is:

| Field | Value |
| --- | --- |
| NXOpen assembly version | `12.0.2.9` |
| Adapter ID | `nx12.0.2.9` |
| Contract ID | `nx12.0.2.9-required-api-v1` |
| Compatibility | `verified` |

Stage five C keeps this adapter and contract identity. The strict member set now
also covers feature-tree parents/properties plus the NX 12 typed PNG graphics
capture entry point used by the no-overwrite evidence workflow, and the
  read-only active-license inventory used by module detection, plus the exact
  NX 12 component-assembly, bounded hierarchy, suppression, representation,
  prototype metadata, and part-load-state APIs, plus typed drawing-sheet and
  drafting-view collection, scale, origin, state, units, and projection APIs.
  The current contract contains 37 required types and 81 canonical members.

Any other assembly version receives an `unsupported:<version>` adapter and
only advertises health, capabilities, session-state reads, and the four module
detectors. Each detector returns `available=false`, `licensed=false`, the
unsupported adapter ID, and a version-specific `unsupportedReason`.

## Generate the index

The generator reads public metadata from `NXOpen.dll`, `NXOpen.UF.dll`, and
`NXOpen.Utilities.dll`. It never connects to a running NX session.

```powershell
cd plugins\nx-codex\bridge\api-index
powershell -NoProfile -ExecutionPolicy Bypass `
  -File .\generate-nxopen-api-index.ps1 `
  -NXOpenDir "D:\Program Files\Siemens\NX 12.0\NXBIN\managed" `
  -OutputPath .\generated\nxopen-12.0.2.9.json
```

The index uses deterministic canonical keys such as:

```text
method|NXOpen.UF.UFModl|CreateBlend(System.String,NXOpen.Tag[],System.Int32,System.Int32,System.Int32,System.Double,out NXOpen.Tag&)->System.Void
```

Assembly hashes, assembly/file versions, type hierarchy, interfaces, and every
declared public constructor, method, property, field, and event are indexed.

## Query the index

```powershell
powershell -NoProfile -ExecutionPolicy Bypass `
  -File .\query-nxopen-api-index.ps1 `
  -IndexPath .\generated\nxopen-12.0.2.9.json `
  -TypePattern "NXOpen.UF.UFModl" `
  -MemberPattern "CreateBlend" `
  -Kind method
```

Patterns use PowerShell wildcard syntax. Set `-AsJson` for machine-readable
query output and `-Limit` to bound results.

## Validate the strict contract

```powershell
powershell -NoProfile -ExecutionPolicy Bypass `
  -File .\validate-api-contract.ps1 `
  -IndexPath .\generated\nxopen-12.0.2.9.json `
  -ContractPath .\contracts\nx12.0.2.9-required-api.json
```

The validator rejects unknown document fields, wrong assembly versions,
invalid hashes, duplicate types or members, incorrect statistics, and any
missing required type/member. Its automated negative test injects a nonexistent
API and requires rejection.

## Run the real-installation matrix

```powershell
powershell -NoProfile -ExecutionPolicy Bypass `
  -File .\test-version-matrix.ps1 `
  -MatrixPath .\version-matrix.json
```

NX 12.0.2.9 is required on the current workstation. Optional future lanes use:

- `NX_CODEX_NX2306_OPEN_DIR`
- `NX_CODEX_NX2312_OPEN_DIR`
- `NX_CODEX_NX2412_OPEN_DIR`
- `NX_CODEX_NX2512_OPEN_DIR`

The current matrix reports each optional future lane as `unverified` with
runtime `unsupported`. Supplying a real directory indexes the actual
assemblies; it does not grant compatibility. A lane becomes `verified` only
when its evidence records a real API index, strict required-API contract,
unique typed adapter, strict-Fake protocol pass, live read-only handshake, and
version-specific smoke pass. The NX 12 adapter ID is never reused for another
release.

## Complete stage-three verification

```powershell
powershell -NoProfile -ExecutionPolicy Bypass `
  -File plugins\nx-codex\bridge\contract-tests\verify-stage3.ps1 `
  -NXOpenDir "D:\Program Files\Siemens\NX 12.0\NXBIN\managed"
```

This runs the direct reflection contract, regenerates the deterministic index,
runs positive/query/negative tests, builds the Debug bridge, tests runtime
adapter selection, and executes the real-installation matrix.

After loading the resulting Release bridge in NX, run the read-only live
handshake without modifying the current part:

```powershell
cd plugins\nx-codex\mcp
npm.cmd run smoke:compatibility
```
