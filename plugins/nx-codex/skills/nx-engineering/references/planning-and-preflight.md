# Modeling plan and preflight

## Typed plan

Before a modeling write, record one exact plan with:

- advertised operation name;
- work-part units, never an inferred or silently converted unit;
- every dimension and absolute WCS coordinate;
- exact, case-sensitive feature journal identifiers and explicit target/tool
  roles where applicable;
- intended feature name when supplied;
- expected feature/body count deltas;
- expected absolute bounding-box minimum, maximum, and size;
- expected surface area, volume, and centroid when analytically known;
- linear and property-relative tolerances;
- a new `.png` evidence path below an advertised allowed root.

Do not add unsupported defaults such as unite, subtract, symmetric extrusion,
arbitrary axes, retained Boolean tools, save, or export. If a material value is
missing, state the assumption before execution. If the assumption could change
the modeling operation or topology, ask the user instead of guessing.

## Preflight

Call `nx_preflight_modeling` with the exact typed plan immediately before the
mutation. Require:

- `preflightPassed=true`;
- exact NXOpen compatibility `verified` with a concrete adapter and contract;
- the work part is also the display part;
- explicit `Millimeters` or `Inches` units;
- the operation appears in capabilities;
- operation-specific feature identifiers, body mappings, face/edge selectors,
  overlap, clearance, axis, and radius rules pass;
- a baseline containing work part, units, modified state, feature/total-body/
  solid-body counts, `preflightId`, and the full feature-tree fingerprint.

The preflight does not authorize a different operation or altered parameter.
If the user or NX changes anything, preflight the revised plan again. A
preflight success is not proof that the later NX commit succeeded.

## Expected count deltas

| Operation | Feature delta | Solid-body delta |
| --- | ---: | ---: |
| block | +1 | +1 |
| rectangular sketch | +1 | 0 |
| extrude | +1 | +1 |
| full revolve | +1 | +1 |
| simple through hole | +1 | 0 |
| Boolean | +1 | -1 |
| four-vertical-edge fillet | +1 | 0 |

For a standalone sketch with no solid, omit solid-measurement expectations;
verify session state, feature-tree evidence, and screenshot instead.

## Handoff to verification

Preserve the baseline exactly. After the mutation, pass it with the returned
transaction and feature journal identifiers to `nx_verify_modeling_result`.
Never reconstruct baseline counts or fingerprint from memory after execution.
