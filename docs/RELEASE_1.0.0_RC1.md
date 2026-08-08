# NX Codex 1.0.0 RC1 release closeout

Release status: local validation complete; no GitHub push, marketplace publication, or external distribution was performed.

## Version identity

The reproducible release identity is:

| Item | Value |
| --- | --- |
| Release | `1.0.0-rc.1` |
| Plugin/MCP/Bridge package version | `1.0.0-rc.1+codex.rc1` |
| Protocol | `1.0` |
| Verified NXOpen assembly | `12.0.2.9` only |
| Adapter | `nx12.0.2.9` |
| Adapter contract | `nx12.0.2.9-required-api-v1` |
| Compatibility | `verified` |

The `+codex.rc1` suffix is a single fixed cachebuster. It makes the RC1 cache
address deterministic while still forcing a fresh Codex plugin cache.

## Support matrix

| NX release | Runtime policy | Matrix status | Release decision |
| --- | --- | --- | --- |
| 12.0.2.9 | Full advertised capability set after exact handshake | `verified` | Formally supported |
| 2306 | Read-only health/capabilities/session/module detection only | `unsupported` / `unverified` | Not supported |
| 2312 | Read-only health/capabilities/session/module detection only | `unsupported` / `unverified` | Not supported |
| 2412 | Read-only health/capabilities/session/module detection only | `unsupported` / `unverified` | Not supported |
| 2512 | Read-only health/capabilities/session/module detection only | `unsupported` / `unverified` | Not supported |

The four newer releases must not be described as compatible, tested, or
supported. Their adapter IDs remain `unsupported:<version>` and their
mutation capability set stays fail-closed.

## Reproducible build and artifacts

From the repository root:

```powershell
cd plugins\nx-codex\mcp
npm.cmd ci --ignore-scripts
npm.cmd run typecheck
npm.cmd test

cd ..\scripts
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\verify-release-consistency.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\package-release.ps1 `
  -NXOpenDir "D:\Program Files\Siemens\NX 12.0\NXBIN\managed" `
  -BridgeAssemblyPath "C:\Path\To\NXCodexBridge-1.0.0-rc.1.dll"
```

The package script builds MCP into a fresh temporary directory and builds the
Bridge into a fresh independent Release directory, so it remains safe while a
different copy of the Bridge is loaded by a running NX process. For byte-for-
byte reproduction, retain the clean Bridge DLL as a fixed input and pass
`-BridgeAssemblyPath` on subsequent package runs; the legacy .NET Framework C# compiler
embeds a non-deterministic module identifier when it recompiles the DLL. The
script stages a minimal runtime plugin, writes a sorted file manifest, fixes
archive timestamps to `2000-01-01T00:00:00Z`, creates a deterministic ZIP from
those fixed inputs, and emits the sibling `.sha256` file.

Authoritative local artifact from this closeout:

- ZIP: `releases\nx-codex-1.0.0-rc.1-github2\nx-codex-1.0.0-rc.1.zip`
- SHA-256: `c05e28916d3d5d277cc91c5d18d2165b36a4d737ca404e86ea8a4b2fa136424c`
- Reproduction: github2 matches an independently generated github1 ZIP byte-for-byte.

## Install

Verify the artifact before extraction:

```powershell
$package = "C:\Path\To\nx-codex-1.0.0-rc.1.zip"
$expected = Get-Content "$package.sha256" | ForEach-Object { ($_ -split '\s+')[0] }
$actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $package).Hash.ToLowerInvariant()
if ($actual -ne $expected) { throw "SHA-256 mismatch" }
```

For the normal local Codex workflow, the repository marketplace entry already
points to `plugins\nx-codex`; configure the absolute bundled MCP entry point,
install or reinstall from the personal marketplace, then start a new Codex
task:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File .\plugins\nx-codex\scripts\configure-mcp-path.ps1
codex.cmd plugin marketplace add (Resolve-Path .)
codex.cmd plugin add nx-codex@personal
```

For an offline package/cache check, extract the ZIP to a new versioned cache
directory only when that directory does not already exist. After extraction,
run `scripts\configure-mcp-path.ps1 -PluginRoot <extraction-directory>` and
validate the manifest. The MCP process must be started from that extracted
directory; do not point it back to an older workspace build.

The NX Bridge is installed separately into an explicit user-managed NX startup
directory. Exit NX normally before replacing a loaded DLL:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File .\bridge\install.ps1 `
  -NxStartupDirectory "C:\Explicit\NX\User\Startup"
```

The installer never edits machine-wide NX configuration and never overwrites a
destination unless `-Force` is explicitly supplied after review.

## Uninstall

Stop Codex tasks using the plugin, remove the exact versioned plugin cache
directory, and remove the Bridge DLL from the explicit user startup directory
after NX has exited. Do not remove `NXFiles`, user parts, or the marketplace
source entry unless that separate cleanup is explicitly intended.

## Upgrade and rollback

Install the new version side by side under its new cache/version directory,
verify the manifest and MCP tool list in a new Codex task, then retire the old
cache directory. Bridge upgrades require a normal NX restart because a loaded
DLL cannot be replaced in place. Rollback means starting a new task with the
previous cache directory and restoring the previous Bridge DLL after NX exits.

## Verification record

- NX health: connected and ready; `NXOpen 12.0.2.9`, adapter
  `nx12.0.2.9`, contract `nx12.0.2.9-required-api-v1`, `verified`.
- Current NX session: `UG_APP_NOPART`, no work part, zero features/bodies,
  unmodified. No part mutation, save, export, or screenshot was performed.
- MCP typecheck: passed.
- MCP full test suite: 51 passed, 0 failed.
- Plugin manifest validation: passed.
- Release consistency check: passed.
- Fresh Codex plugin cache install: passed at
  `1.0.0-rc.1+codex.rc1`; the new cache manifest validates and its MCP config
  points to its own bundled entry point.
- New MCP/Codex-task boundary: passed; a fresh client discovered 28 tools and
  completed read-only `nx_health` and `nx_get_capabilities`. It observed the
  already-loaded live Bridge as `1.0.0` because NX was intentionally not
  restarted or reloaded during this closeout.
- Bridge build: validated through a clean independent output directory; the
  normal in-place output was intentionally not overwritten because the running
  NX process holds the existing DLL open.
- API index/contract: exact `12.0.2.9` assemblies and strict contract retained;
  2306/2312/2412/2512 remain `unsupported`/`unverified`.
- Publication: not performed.

## Known limitations

1. Only NXOpen `12.0.2.9` is formally supported. Similar release names do not
   imply compatibility.
2. NX 2306, 2312, 2412, and 2512 remain unsupported/unverified and are
   read-only fail-closed lanes.
3. A Bridge DLL already loaded by NX locks the in-place build output. Build a
   new Bridge to an independent output directory and restart NX before loading
   it; do not force-close NX or discard unsaved work to release the lock.
4. The RC1 package is unsigned and local-only. Signing, GitHub push, and
   external publication are outside this closeout.
5. The dependency lock was refreshed with the available non-breaking fixes;
   `npm ci --ignore-scripts` and `npm audit` now report zero vulnerabilities.

## Release checklist

- [x] NX current-part safety boundary confirmed; no part changes.
- [x] Clean MCP dependency install, bundle build, typecheck, and 51-test suite.
- [x] Independent clean Bridge Release build against the exact NX 12 managed assemblies.
- [x] Bridge protocol, MCP server, mock bridge, plugin manifest, and AssemblyInfo versions aligned.
- [x] API index, required API contract, runtime adapters, and matrix cross-checked.
- [x] Only NXOpen 12.0.2.9 marked formally supported.
- [x] 2306/2312/2412/2512 explicitly unsupported/unverified.
- [x] Reproducible ZIP, per-file manifest, and SHA-256 sidecar generated.
- [x] Fresh plugin cache and new MCP/Codex-task boundary verification completed.
- [x] Install, uninstall, upgrade, rollback, support matrix, limitations, and checklist documented.
- [x] GitHub push and external publication intentionally not performed.
