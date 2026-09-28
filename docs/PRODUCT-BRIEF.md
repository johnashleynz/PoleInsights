# Product and interface

**Draft P00.** Requirements below are proposed behaviour, not implemented features.

## Product structure

| Mode | Main purpose | Primary experience |
|---|---|---|
| Explore | Understand behaviour by changing a pole | Large scene, load/direction controls, three views and section slider |
| Lessons | Follow an explanation, then experiment | Same scene with captions, short steps and a playback timeline |
| Engineering | Inspect a reproducible supported calculation | Same case plus material/foundation basis, qualification status and export |

Changing mode must not change the underlying physics or silently replace inputs. Engineering eligibility belongs to the case and model, not the mode selector.

## Layout and first use

Desktop: a compact InnerView header; mode and A/B switches; a large central scene; a collapsible Pole / Load / Decay & defects / Ground panel; and a cross-section/results area. Keep Setup / Innerview / Stresses controls visible beside the scene. These are the owner-confirmed view names, distinct from Explore / Lessons / Engineering modes. Avoid a long settings form before the user can interact.

Beauty and engagement are explicit priorities. The owner selected a **clean studio scene focused on the pole**. Compose the opening view deliberately, with convincing timber, attractive lighting, a readable silhouette and smooth transitions into sections and hidden decay. Use restrained motion and satisfying direct manipulation. Technical completeness alone does not meet the visual brief. Keep soil visible as a restrained ground element/cutaway within the studio; avoid competing background scenery.

Prioritise **radiata pine** for the first pole. Keep species data replaceable and document the strength/stiffness basis; selecting a species alone does not determine grade, treatment or design properties.

The opening example presents one pole, a clear groundline, a force arrow and a short invitation to change the load or look inside. Start with true-scale displacement (1×). If deformation is too small to see, offer a labelled visual magnifier that never changes the calculation.

On narrow screens, use one scene and a bottom settings sheet, with the active A/B pole named clearly. Preserve access to the section and paired result summary. Pinch zoom and touch gestures must not fight page scrolling. Provide numeric alternatives to all dragging.

Proposed interaction journey: load the pole → rotate the force → move the section → reveal decay → duplicate into B → remove or move the decay → compare response → play a lesson. Advanced controls appear where they become relevant.

## Controls

| Group | Basic controls | Expanded controls |
|---|---|---|
| Pole | Species, total length, embedment, three diameters | Input provenance, taper rule, material dataset, moisture/grade/treatment where supported |
| Load | Magnitude in kN; force-toward direction in degrees | Components, loading history and additional engineering actions when implemented |
| Ground | Show soil/cutaway; Soft / Medium / Hard response | Documented preset parameters; custom response; layering only if it adds useful accuracy at modest cost |
| Decay & defects | Add preset, select, move, resize, delete, undo | Shape, eccentricity, orientation, longitudinal extent, material changes and evidence |
| View | Setup / Innerview / Stresses; orbit, pan, zoom, reset | Camera presets, clipping, mesh inspection, stress component, quality and magnification |
| Section | Drag height, type height, jump to groundline or governing section | Independent view style; dimensions, orientation and probe values |
| Compare | Duplicate, select A/B, copy, swap | Link camera/load/section separately; edit both; shared legend; difference summary |

Show lengths in metres and diameters in millimetres by default. Keep SI internally. International unit display is a later extension with round-trip conversion tests.

## Geometry and cuts

The visible pole runs from butt to tip; total length includes embedment. Sections are perpendicular to the pole axis by default. Position is a material station, so the plane follows a bent pole rather than drifting off the selected wood. Display signed height relative to groundline, with a clear below-ground label. A vertical reveal is a separate cutaway control, not a replacement for the transverse section.

The Setup view needs surface grain, appropriate taper, subtle roughness, weathering and realistic lighting. Its sawn sections need spatially consistent rings, pith and grain, plus configured knots, cavities and checks. Texture and mesh refinement must preserve a defect's size and location. Use licensed photographs/materials or purpose-made assets with a recorded source; an invented scan is not evidence.

Innerview uses transparent/cutaway timber and a restrained condition legend. Incipient deterioration must be representable without automatically creating an empty hole. A demonstration progression slider represents prescribed scenarios; it does not predict decay rate or years of remaining life without a separate validated model.

Stresses separates MPa from utilisation percentages. Show signed longitudinal stress first, with supported shear/material-axis components in a selector. Do not make a generic von Mises display the timber failure criterion. Keep zero/void/unassessed distinct. A/B should use common bounds unless the user deliberately chooses independent scales.

## Defect workflow

Select a feature or Add defect, then place it using the scene or section. Provide handles and numeric inputs for height, dimensions, radial offset and angle. Support a list for selecting hidden/buried features. Include undo/redo and a reset of the selected feature.

Stage the catalogue: central and eccentric internal decay, surface loss and voids first; then knots/grain deviation, splits/checks and holes/notches as their models are developed. Overlapping features require a defined composition rule; no repeated subtraction of the same wood. Appearance-only features must be marked as such.

## Results and uncertainty

Main results: current tip load; tip displacement; first supported limiting load; governing height and mechanism; and capacity change relative to the comparison case where the bases match. Offer a capacity-versus-direction plot in advanced analysis, computed from actual cases rather than a decorative polar outline.

Use plain states such as Updating, Preview, Checked result, Outside supported range and More information needed. Preserve a previous result only with an unmistakable previous-input indication. No current numerical verdict should accompany a failed or stale solve.

A result-details drawer holds estimated inputs, calibration/model revision, assumptions, unassessed mechanisms and uncertainty. For actual engineering use, the export carries this information with the results. Do not export a clean-looking capacity number stripped of its basis.

## Website fit and accessibility

Visual inspection of the [current homepage](https://innerviewinsights.com/) on 24 September 2026 showed a dark burgundy logo panel, warm amber accents, white space, grey navigation and photographic utility imagery. Proposed lab styling adapts that direction; exact brand tokens and font licences have not been obtained.

Use high contrast text, visible keyboard focus, accessible labels, useful empty/error states, a non-colour explanation of every condition, and generous touch targets. Provide reduced motion, captions, keyboard section/load adjustments and readable 2D results if WebGL fails. A single-pole teaching view should remain useful on a phone.

The initial hosting proposal is an isolated responsive laboratory that can run full-page and be embedded in an InnerView page. This is a proposal, not a confirmed hosting capability. P06 must verify the site's actual integration, content-security policy, worker/asset delivery, fullscreen and mobile height behaviour.
