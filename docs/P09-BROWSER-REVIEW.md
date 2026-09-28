# P09 browser review

25 September 2026. Graphics-enabled Codex in-app Chromium; desktop 1440 × 900 and simulated mobile viewport 390 × 844. This is not a physical-phone performance certification.

- Drew a four-point cavity by clicking corners and double-clicking to finish. The section showed the polygon, its actual size appeared in the numeric editor, and the beam result changed. Dragging the polygon moved it and updated calculations only on release.
- Changed the height chart quantity and dragged on the chart from 0.30 m to 5.00 m. Section diameter changed from 315 to 244 mm. The 512-pixel section remained full resolution; the diagnostic counter recorded nine held frames while preparing uncached cuts, followed by an exact ready cut. No blank replacement was painted for those held frames.
- Confirmed left-drag pan: the attached section leader shifted by approximately 30 horizontal / 15 vertical screen pixels for the tested drag. Right-drag rotation is configured in OrbitControls; no automated right-button drag was available in the current browser interface.
- Used the sound-reference A/B action. In the tested synthetic multi-defect case the sound pole's timber limit was 53.4% higher and its tip movement about 5 mm smaller, while the displayed overall limit remained soil-controlled. This is a particular illustrative case, not a general deterioration estimate.
- Verified shared A/B chart selection and independent section material. On mobile, choosing the best-direction capacity on A also selected it for B. Switching to B retained its sound cross-section while A contained a bore.
- Completed an in-browser 3/8-inch blind-bore local FE solve at 0.30 m. The section displayed the bore and reported a local 3D preview; the mixed local-patch/beam scope remained visible. The detailed solver remained in its worker.
- Inspected the full-height mobile model, groundline contact, chart, load/section leaders, A/B switch and shared view buttons. The enlarged section uses the available phone width. Opening the mobile section now scrolls that panel to its top.
- The packaged-build browser error/warning log was empty when checked. The final section was ready at 512 pixels; individual observed main-thread paints were about 9.8–18 ms in the packaged review and 38–42 ms during development while other analysis was running. These observations are not sustained FPS or p95 results.

Remaining browser coverage: real touch/phone hardware, prolonged thermal/memory tests, automated right-button rotation, complex freehand touch drawings, a new end-to-end native file-import/export cycle, and a broad range of simultaneous detailed A/B solves. Input geometry including sketches has a numerical JSON round-trip check.
