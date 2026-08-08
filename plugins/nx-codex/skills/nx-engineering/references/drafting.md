# Protected test drawing

Use `nx_create_test_drawing` only when the user explicitly authorizes creating
a test drawing sheet and view in a copy. This is a bounded reversible write,
not a general drafting editor.

## Required state

Before the call:

1. Call health and capabilities. Require the exact verified
   `nx12.0.2.9` adapter and advertised `create_test_drawing` operation.
2. Require an absolute existing `.prt` path below an allowed root. Pass that
   exact path as `expectedWorkPartPath`.
3. Require that exact path to be both work and display part, saved and
   unmodified, and millimeter units.
4. Require the user to have already switched NX to Drafting and require an
   already-active drafting license. Never switch the application or reserve or
   release a license.
5. Read drafting structure twice. Both reads must show zero sheets and zero
   views, stable fingerprints, and unchanged session/body state.

## Exact mutation

The tool creates only:

- one `297 x 210 mm` sheet named `NX_CODEX_TEST_A4`;
- sheet scale `1:1` and third-angle projection;
- one base view from the current model work view, with a `1:1` ratio request
  and center-placement hint at drawing coordinates `(148.5, 105, 0)`.

NX 12 may report a derived actual drafting-view scale or origin after commit.
Treat the returned metadata as authoritative: require a finite positive scale
and report the observed scale/origin instead of claiming the requested values
were accepted literally.

It uses one visible undo mark, rolls back on any internal failure, never adds
annotations, never explicitly updates drawing views, and never saves.

## Verification and handoff

Require a transaction ID. Then read drafting structure twice and verify exactly
one sheet and one view, the expected sheet metadata, stable fingerprints, and
unchanged body and solid-body counts. Accept A4 dimensions as the unordered
pair `210` and `297`, because NX 12 may expose them as length/height in the
opposite order from the insert call. The part should now report
`modified=true`; report that it remains unsaved.

If external verification fails after creation, immediately undo only the
returned latest transaction. On success, preserve the transaction ID for a
user-requested undo. Do not save over the protected copy. A later save requires
a separate explicit `nx_save_as` request to a new non-existing path.
