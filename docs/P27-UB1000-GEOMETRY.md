# P27 display and geometry corrections

29 September 2026. Local implementation; no deployment.

The Detect probe pair now uses owner-supplied physical dimensions instead of the P12 visual approximation. Each cylindrical device is 50 mm in diameter and 200 mm long: a 180 mm housing plus a 20 mm metal probe tip. The housing comprises a 5 mm curved taper, 10 mm end cap, 110 mm orange mid-section and 55 mm black butt. A separate 50 mm steel wave guide is shown 20 mm inside the pole and 30 mm protruding to the probe/interface coupling.

The same constants control the 3D model, both end-on section renderers, interaction extents, displayed dimensions and exported inspection metadata. This is a dimensional visual correction only; it does not change the acoustic simulation, placeholder assessment or UB1000 inference boundary.

The P27 review also recentres the supplied end-grain texture crop so its pith aligns with the geometric centre of every pole section. This is display-only; section geometry and calculation coordinates are unchanged.

The explicit Metric / Imperial selection now governs scene leaders, height charts, section dimensions, capacity headings and Detect readouts independently of country. Changing country preserves the selected unit system. Load application is presented as an offset measured down from the pole tip while retaining the compatible groundline-relative SI value internally.

Break display is opt-in and defaults off, including for older case files. Its illustrative trigger uses timber capacity rather than a potentially lower soil/restraint limit. The loaded pole remains geometrically intact so defects, probes, sections and stress surfaces stay registered to the solved shape. The enabled annotation uses a small circumferential zig-zag seam, six frozen wood fragments on the load-facing side and a red likely/actual break-zone label; it does not claim to simulate fracture or fragment trajectories.
