# P12 — Circumference entry and UB1000 Test workspace

25 September 2026. Local review; no deployment.

## Implemented

- Setup offers Diameters or Circumferences for tip, groundline and butt measurements. Both use millimetres and convert to the same authoritative diameter in metres. Switching the selector does not change the geometry. Blank values still invoke existing diameter estimation, converted to the selected entry measure. The entry preference is retained in case exports.
- Test is the fourth tab after Stresses. It displays an opposed UB1000 probe pair at the selected section, with height and orientation controls. Drag a device vertically in the main view, or drag a device around the section to turn the pair. The existing section handle, wheel and shortcuts also move the test plane. Inspection height is limited to groundline through tip.
- The owner supplied approximate dimensions of 160 mm long by 60 mm diameter. Main-view meshes use those dimensions in metres; section devices use the same physical scale as the timber. The Test section fits the pole and both devices together. Devices follow the deformed shaft and local taper, and appear only while Test is active.
- Orange cylindrical housings, dark ribbed end caps, metal contacts and labels are modelled from the official reference photo. These are shaded, photo-referenced approximations, not manufacturer CAD or dimensionally verified replicas. The contact-to-cap envelope is 160 mm. An optional credited reference photograph is available in the Test controls.
- The right pane shows placeholder assessed fibre strength, fibre strength capacity reduction and wood remaining. A collapsed explanation states the precise proxy meaning. Case exports retain probe positions, dimensions and the versioned placeholder summaries. The previous beam/solid calculation kernels are unchanged.

## Explicit placeholder contract

The owner approved placeholder results pending an approved UB1000 formula or example report. `sandbox-placeholder-v1` samples known sandbox condition over the whole section with 48 equal-area radial bands and 96 angular samples. It does not infer hidden condition from simulated ultrasonic observations.

Assessed fibre strength is the average existing longitudinal strength factor over surviving wood, as a percentage of sound wood. No remaining wood returns no fibre-strength value. Fibre strength capacity reduction is one minus strength-weighted wood area divided by original circular area: voids count as absent material. This is an area–strength teaching proxy, **not bending capacity, RSV, a UB1000 reading or climbing clearance**. It deliberately does not change with pair orientation; position illustrates a transverse measurement while the placeholder summarises the whole section. Small features are limited by sampling resolution, including thin drill holes. A calibrated measurement-to-condition adapter remains future work.

## References and visual provenance

The [official UB1000 description](https://innerviewinsights.com/solutions/ub1000-asset-inspection-technology/) describes transverse acoustic testing and inspection planes from groundline upward. It does not supply an approved signal-to-fibre-strength calibration for this implementation.

The [official reference photograph](https://innerviewinsights.com/wp-content/uploads/2026/04/IMG_7231.jpg) was visually inspected. Attribution: InnerView Insights, photo courtesy of PowerNet. The optional photograph remains a remote image; it needs internet access. The modelled devices themselves work without it. No photograph of an operator is used as an in-scene device texture.

## Verification and limits

The complete build passes 266 numerical/software checks: the preceding 248 plus 18 P12 checks. New checks cover circumference conversion, missing values, round trips, sound and uniformly degraded fibre summaries, height changes, an annular cavity, absent fibres and the specified probe dimensions. The quarter-area cavity proxy agrees within the declared 1.1% absolute sampling tolerance. TypeScript and the production bundle pass; the existing bundle-size advisory remains.

Browser review checked circumference entry (1000 mm becomes 318.310 mm diameter), all four tabs, Test-only device visibility, main-view vertical dragging (0.30 to 0.68 m), rotation directly in the section, readout changes with height, and desktop / 390 × 844 phone layouts. The reference photo loaded and was visually inspected. No browser console errors were observed. Physical touchscreen testing and a separate full A/B interaction study were not performed in this increment.

These checks do not establish instrument accuracy, physical strength calibration or the broader FE qualification. P09–P11 limits remain unchanged. Earlier archives and the parent Crossarm/Conductors applications are preserved. P12 source/build archives include the latest changes; normal local previews remain on ports 5190 and 5191.
