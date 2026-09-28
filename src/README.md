# Application modules

P01 implements the studio interface, shared region model, section renderer and initial beam/soil solver. Read [P01 review](../docs/P01-REVIEW.md) for the precise scope and remaining gaps. Module boundaries:

| Directory | Responsibility |
|---|---|
| `domain/` | Versioned case model, units, input provenance, validation and saved-case migrations |
| `geometry/` | Pole taper, spatial defects, material axes and section intersections |
| `analysis/` | Section integration, beam/soil/local FE, stress recovery, capacity and qualification metadata |
| `workers/` | Analysis jobs, cancellation, progress, transfer and stale-result rejection |
| `scene/` | Pole/soil/probes, materials, camera, clipping and display quality |
| `ui/` | Controls, result explanations, A/B state, comparison and accessibility |
| `inspection/` | Conceptual acoustic observations and the approved UB1000 adapter boundary |
| `lessons/` | Versioned lesson states, timelines, captions and exploration handoff |

Dependencies should flow from UI/scene/workers toward pure domain/geometry/analysis modules. The solver must not depend on a React render or scene mesh. Inspection interpretation receives observations with explicit provenance; it cannot read sandbox truth and represent that as a measurement. Lessons edit cases through the same validated input path as the controls.

A result envelope should include case fingerprint, solver/material/inspection versions, supported physics, units, result status, numerical resolution, convergence, governing mechanism/location, uncertainty and unassessed mechanisms. Keep model A and B histories independent.

P01 has its own package, lockfile, build configuration and launchers. Do not import mutable parent application state or change the parent build to accommodate this folder.
