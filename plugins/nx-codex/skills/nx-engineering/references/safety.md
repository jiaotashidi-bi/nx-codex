# NX safety policy

## Risk levels

| Level | Examples | Behavior |
| --- | --- | --- |
| Read | health, capabilities, module active-license detection, session state, preflight, feature tree, measurement | Run automatically |
| Unverified NX version | health, capabilities, module detection, session state only | Fail closed; do not mutate |
| Reversible write | create a new feature with an undo transaction | Run when directly requested |
| Existing-model edit | edit/delete/suppress existing feature | Inspect dependencies first; require an explicit supported tool |
| New file | new part, save-as to a non-existing path | Require an explicit allowed path and a dedicated tool |
| Evidence file | PNG screenshot below an allowed root | New path only; stage then move; never overwrite |
| Destructive file mutation | save-over, overwrite, delete, rename, discard changes | Reject; no tool is exposed |
| Production output | CAM post, release, manufacturing export | Require explicit confirmation and organization policy |
| Arbitrary execution | journal, Python, C#, shell | Reject by default |

The current bridge exposes reads, restricted new/open/save-as/safe-close,
transactional block/rectangular-sketch/extrude/full-revolve/simple-hole and
explicit two-body Boolean/four-vertical-edge fillet creation,
read-only preflight, feature-tree inspection and solid measurement,
read-only assembly/drafting/CAE/CAM active-license detection,
bounded read-only assembly hierarchy and drafting sheet/view inspection,
one exact protected-copy A4 test-sheet/base-view transaction,
no-overwrite PNG screenshot evidence, and undo. It never overwrites or
force-closes a modified part.

Before every mutation, require the bridge handshake to report
`compatibilityStatus=verified`, a concrete adapter ID, and a concrete adapter
contract. Similar version names are not evidence of compatibility.

## Failure handling

- If health fails, stop.
- Never call license reserve/release or change bundle selection to probe a
  module. `licensed=false` means only that no matching license is active in the
  current session.
- Before an assembly or drafting structure read, require its matching
  active-license snapshot. Fail closed before component, sheet, or view APIs
  when the license is inactive. Never switch applications, load components,
  open sheets, update views, or create annotations to complete a read.
- Before the protected test-drawing write, require the exact expected path to
  match both work and display part, the part to be saved/unmodified and
  millimeter, Drafting and its license already active, no pending transaction,
  and zero existing sheets/views. Never broaden this into editing an existing
  drawing, adding annotations, updating views, or saving.
- If session state has no work part, ask the user to open or create a part.
- If units are unknown, do not infer inch versus millimeter.
- If the bridge rejects a request, report its code and message.
- If a path is rejected, do not normalize, shorten, relocate, or retry it
  without the user choosing an allowed path.
- If an operation times out, inspect session state before retrying. Never retry
  a mutation automatically because it might have completed after the client
  timeout.
- If validation differs from intent, offer undo using the returned transaction
  ID.
- If joint verification fails, do not save or export the result. Report the
  failed checks and offer undo.

## Data handling

Do not include session tokens, proprietary geometry, or full network paths in
logs. Report only the minimum part identifier needed by the user.
