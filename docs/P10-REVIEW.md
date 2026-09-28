# P10 — Focused controls and direct defect editing

Latest display follow-up: retain numeric endpoint heights without Tip/Butt words; enlarge the section ring and disk by 50%; add a 40 px tall drag target along the entire leader and a 44 px endpoint target. Utilisation charts now grow right-to-left from zero and use one horizontal gradient clipped to the curve. The Line Lab utilisation palette (green → amber at 75% → red at 100% → dark red at 120%) is shared by the chart, material maps and legend. Capacity chart colour is also horizontal, using applied load divided by the capacity at each horizontal position. No calculated stress, utilisation or capacity changes.

Follow-up verification: TypeScript and production bundle pass. Inspected the reversed utilisation plot and numeric-only endpoint labels in the browser; dragging the middle of the leader moved the section from 0.30 m to 1.42 m. The measured leader target was about 200 × 40 pixels in that viewport. Colour/interaction changes do not rerun or supersede FE qualification evidence.

Follow-up: the chart height scale now explicitly marks Tip and Butt with their current heights relative to groundline, including fractional metres. Nearby metre labels are suppressed to avoid overlap; off-screen endpoints are not falsely pinned to the viewport. This is a display-only change; P10 archives remain the prior checkpoint.

25 September 2026. Local review; no deployment.

## Changes

- Setup, Defects and Stresses now sit at the top of the left rail. Setup has collapsible Pole and Ground groups; Defects has the collapsible defect editor; Stresses has load controls and a draggable bearing compass. The header and view choices remain available while the fields scroll.
- A Menu above the views contains Guides, Save case, Open, Fullscreen and Compare A/B. The display no longer repeats these actions. A/B case selectors remain available in the left rail and over the displayed models.
- Whole pole, Section detail, Elevation and Pole top are stacked vertically. Pole top fits the displaced shaft's horizontal envelope from well above the tip so the top and base are visible together, and refits when the applied load changes. Comparison framing reserves room beside the pole for the chart.
- Removed the above-ground/embedded labels from the scene, the manual section-height field, movement-magnification selector and the requested introductory/instructional text. Model basis remains available in the details dialog. Movement is displayed at actual scale.
- Defects sections show the tapered exterior below the cut with the same opacity as Setup. Wheel scrolling over the section changes height, including when the pointer is over a defect; it does not zoom. Arrow keys also change section height. Uncached cuts retain the last image and identify its displayed height.
- The analysis selector is above the section. The chart is filled using the existing utilisation palette, with metre labels on its right. For capacity plots, width is capacity and fill is the current load divided by that capacity; for utilisation plots both refer to the chosen utilisation quantity. The section leader reaches the chart and carries the selected quantity and height above the line. Unavailable/updating results remain identified. The chart/leader are suppressed in the near-plan view where projected vertical height is not meaningful.
- All supported defect kinds can be selected and dragged in sections in all three views. Existing sketches and ellipses translate; shell rot can be offset; radial drill holes remain attached to the outside and change bearing/depth with dragging. In the main Defects view, select and vertically drag the actual defect, with larger invisible picking targets for small features. Overlapping selections prefer the already-selected defect. Use Section detail for close inspection.
- Defect and compass gestures preview without launching new structural solves during pointer movement; edits commit on release. Cancellation restores the original input. Vertical movement retains the decay source's relative height and clips the whole extent to the pole ends. Drill depth is limited to the local pole diameter when moving into a narrower section.

## Geometry compatibility and evidence

The stored view identifier remains `Innerview` for compatibility; its visible label is Defects. Shell offsets are optional `decay.offsetX/offsetY` values, defaulting to zero. Existing shell cases retain their concentric response even if the unused ellipse centre was nonzero. The authoritative condition query, section outlines and 3D depiction consume the offset; no FE stiffness kernel or strength law changed.

`node tools/build.mjs` passed 227 checks: the prior 214 checks plus 13 P10 geometry/compatibility checks. The new checks cover axial clipping, source translation, knot placement/property preservation, radial bore attachment/material removal, cut outlines, legacy shell compatibility, shifted shell material, valid round trips and invalid offsets. Evidence is in `verification/results/p10.json`. The TypeScript check and final production bundle also pass. The existing bundle-size advisory remains.

Browser checks in the graphics-enabled in-app browser at its desktop viewport (1280 × 720) and a simulated 390 × 844 phone viewport:

- Inspected Setup groups, view-specific controls, menu, vertical camera buttons, absent scene dimensions, right-hand selector and leader/chart alignment.
- Pole top showed the sawn tip, displaced shaft back to its base and grass together. Inspected the filled chart in capacity and utilisation modes and the A/B layout.
- Scrolling up over the section moved the cut from 1.51 m to 2.95 m and changed its diameter without zooming or replacing it with a blank.
- Directly dragged a shell region vertically. Selected a knot, used Section detail, and dragged the knot from 1.00 m to 1.20 m. Dragged that knot 40 pixels left and 30 pixels up in the section; its outline and numeric offsets updated together.
- Used the compass to turn the load from east to approximately north. Verified menu-driven comparison and the phone settings/section layouts. Corrected mobile A/B controls overlapping the menu during review.

Physical touchscreen behaviour, every possible overlap, and new off-centre shell FE refinement have not been separately qualified. P09's local-solid, capacity and physical-calibration limitations remain. No new engineering or climbing qualification is claimed.

## Preservation and handover

Changes remain within `innerview-pole-lab`; parent applications and earlier review archives are preserved. P10 source/build review archives are in `releases/`. The normal local production preview uses port 5191. A source rebuild includes all regression checks; use `Start-Pole-Lab.ps1` for development on port 5190.
