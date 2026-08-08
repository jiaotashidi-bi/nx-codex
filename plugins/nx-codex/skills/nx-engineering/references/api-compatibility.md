# NXOpen API compatibility

Treat `nxVersion` as display information and
`nxOpenAssemblyVersion` as the adapter-selection key. Before any mutation,
require all of:

- `compatibilityStatus` is `verified`;
- `adapterId` is not prefixed with `unsupported:`;
- `adapterContractId` is not `none`;
- the requested operation appears in `capabilities`.

If compatibility is `unsupported`, use only `nx_health`,
`nx_get_capabilities`, `nx_get_session_state`, and the four read-only module
capability detectors. The module detectors must return `available=false` with
a concrete unsupported adapter ID and reason. Do not attempt a mutation, retry
through another tool, or infer compatibility from a similar marketing release
number.

The initial verified profile is:

| NXOpen assembly | Adapter | Contract |
| --- | --- | --- |
| `12.0.2.9` | `nx12.0.2.9` | `nx12.0.2.9-required-api-v1` |

For adapter development, use only the checked-in offline tooling under
`bridge/api-index` against an explicit directory containing `NXOpen.dll`,
`NXOpen.UF.dll`, and `NXOpen.Utilities.dll`. The generator reads assembly
metadata and does not connect to a live NX session.

Promote a new NX version only after all of these exist and pass:

1. a generated machine-readable index from the real installed assemblies;
2. a strict required-API contract with exact assembly versions and canonical
   member keys;
3. a typed runtime adapter with a unique ID;
4. strict Fake protocol and fail-closed tests;
5. the real-installation matrix lane;
6. live read-only handshake and version-specific smoke tests.

Never copy the NX 12 adapter ID onto another release merely because its
methods look similar.
