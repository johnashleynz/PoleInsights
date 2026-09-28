# P21 — Cavity interiors in the 3D view

26 September 2026. Local review only.

Setup previously omitted the cavity surface meshes while cutting holes in the outer pole skin. The skin rendered both sides, so a camera looking through a hole could see the reverse of the pole exterior.

## Changes

- Render textured cavity walls in Setup, using the same cavity geometry as Defects.
- Clip cavity surfaces at the actual tapered pole boundary instead of clamping outlying vertices onto the exterior and closing the mouth.
- Close rounded cavity ends and add end walls for constant-profile cavities, including concave sketched outlines. Do not add an artificial cap at a sawn pole end.
- Correct exterior triangle orientation and cull the back of the outer skin in Setup. Enclosed defects remain hidden behind intact wood.
- Add local axial stations near cavities and bores and refine exterior angular sampling so small openings have a rounded rim.
- Restrict blue defect selection emission to Defects; Setup keeps its natural cavity texture.

## Verification

TypeScript and production build pass. Run:
- node --experimental-strip-types verification/p21.mjs
- node tools/build.mjs (includes the P21 checks with the existing suite)

48 targeted geometry/ray checks pass: tapered boundary containment, unobstructed mouth with a real back wall, oblique rays at five angles, enclosed cavity walls at 36 orbit angles, rounded closures, constant-profile end walls, and concave sketch triangulation.

Browser checks used a 90 x 108 mm, 600 mm long cavity moved to the pole surface in a temporary development tab. Setup detail views show the natural interior and rounded rim; front elevation preserves the opaque exterior. These checks combined visible camera presets and analytic ray tests; no automated right-button drag was available. The production review was reloaded after building.

No structural equations, field values, acoustic parameters or saved material definitions changed. Stress surfaces retain their existing separate field-sampling implementation. Geometry is a tessellated display: clipping uses a 128-sided approximation of the pole cross-section, and overlapping void-wall removal uses face-centre sampling. This is not a CAD Boolean or a new FE qualification. Existing drilling and sawn section texture limitations remain outside this cavity-sidewall fix.

P20 archives are preserved.
