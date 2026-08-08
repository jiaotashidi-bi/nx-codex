# Security model

## Protections

- No TCP listener and no .NET Remoting.
- Named Pipe ACL grants access only to the Windows identity running NX.
- A random 256-bit token and random pipe name are generated for every NX
  process launch.
- Session descriptors are stored under the current user's LocalAppData with an
  owner-only ACL.
- If enterprise DLP encrypts the descriptor written by the NX process, the MCP
  retrieves the same descriptor from a fixed-format discovery Named Pipe. That
  pipe has the same current-user-only ACL, a 128-byte request limit, and does
  not accept NX operations.
- Requests use a strict, versioned JSON shape with no polymorphic type metadata.
- Requests are capped at 64 KiB, responses at 256 KiB, and JSON recursion at
  16 levels on the bridge.
- Deadlines and replay-resistant UUID request IDs are mandatory.
- Only one pipe request and one NX operation run at a time.
- The audit log stores operation metadata but never the session token.
- Model writes use visible undo marks and roll back on failure.
- Part paths must be absolute local-drive `.prt` paths under an owner-only
  configured root. UNC, device, ADS, relative, reserved-name, trailing-dot,
  traversal, symbolic-link, and junction paths are rejected.
- MCP and the NX bridge validate paths independently.
- Save-as stages and moves without overwrite; close refuses modified parts.
- Modeling preflight is read-only and returns a baseline full feature-tree
  fingerprint; successful preflight does not bypass validation in the later
  transactional mutation.
- Feature-tree responses are bounded to the latest 128 nodes while the
  fingerprint covers the complete tree.
- PNG evidence paths are absolute `.png` files below an allowed root. Capture
  stages, checks the PNG signature, non-empty output and unchanged NX modified state, hashes the
  file, and moves without overwrite.
- Module capability tools inspect only the current application and licenses
  already checked out in currently used bundles. They never reserve, release,
  or reconfigure licenses, and never return raw license or bundle names.
- `nx_get_cae_capability` is additionally schema-checked as an exact six-field
  result (`available`, `licensed`, `applicationName`, `adapterId`,
  `compatibilityStatus`, `unsupportedReason`). It never changes applications,
  creates FEM/SIM data, meshes, solves, or saves.
- Assembly hierarchy reads check that snapshot first and fail closed before any
  component-tree call when no assembly license is active. Responses are bounded
  to depth 0-32 and at most 128 component occurrences, expose leaf prototype
  identifiers instead of full paths, and include explicit truncation flags plus
  a repeatable bounded-structure fingerprint.
- Drafting structure reads likewise fail closed before sheet or view APIs when
  no drafting license is active. Responses are bounded to 64 sheets and 128
  total views, include explicit count-completeness and truncation flags plus a
  repeatable fingerprint, and never open sheets, update views, create
  annotations, save, or export.

## Deliberately unsupported

- arbitrary Python, C#, journal, shell, or PowerShell execution;
- raw `Session`, `UI`, `UFSession`, builders, tags, or remoting proxies;
- overwrite, delete, save-over, force-discard close, CAM post-processing, and
  unrestricted or production file export;
- license reservation/release, bundle selection changes, application switching,
  CAE solve/mesh, drafting output, assembly creation, and CAM initialization;
- TCP/LAN access;
- silent fallback to background-thread NXOpen calls.

## Residual risks

- A process already running as the same Windows user may be able to read the
  session descriptor. The ACL and token primarily establish a clear
  application boundary; they are not a sandbox from a fully compromised user
  account.
- NXOpen itself is large and version-sensitive. The bridge limits exposed
  operations but cannot remove defects in NX or NXOpen.
- A started NX operation cannot always be cancelled safely. The bridge avoids
  delayed execution and serializes calls, but an NX operation can still hang.
- Loading unsigned binaries into NX is unsafe. Production packages should sign
  the bridge, publish hashes/SBOMs, and use a controlled installer.
- A same-user process can still create a target between validation steps.
  The final same-directory `File.Move` is the no-overwrite enforcement point;
  a collision preserves the staging recovery copy.

## Reporting

Do not include proprietary part data or session tokens in reports. Include the
bridge version, NX version, request ID, error code, and a redacted audit-log
excerpt.
