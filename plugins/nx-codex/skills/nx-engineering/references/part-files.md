# Safe part file lifecycle

## Preconditions

1. Call `nx_get_capabilities` and inspect `allowedRoots`.
2. Require an explicit absolute `.prt` path inside one allowed root.
3. Call `nx_get_session_state`.
4. Do not automatically retry a file operation after a timeout.

## Operations

- Use `nx_new_part` to create and display an unsaved part. State that no file
  exists until a successful `nx_save_as`.
- Use `nx_open_part` only for an existing `.prt`. It leaves the previous part
  loaded and never discards its changes.
- Use `nx_save_as` only for a new destination. It stages in the destination
  directory, moves without overwrite, reopens the saved part, and invalidates
  prior NX Codex transaction IDs.
- Use `nx_close_part` only when the bridge reports the work part is
  unmodified. There is no force-discard option.

After success, inspect session state and report `opened`, `saved`, or `closed`
plus the returned path and any load warnings. Treat `TARGET_EXISTS`,
`UNSAVED_CHANGES`, `PENDING_TRANSACTION`, and every path-policy error as a
safe refusal, not as a reason to weaken the request.

Never overwrite, delete, rename, traverse a junction, use a UNC/device path,
or write outside the advertised roots.
