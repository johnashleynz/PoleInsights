# P22 — Supplied pole standards and verified material presets

27 September 2026. Local review, no deployment.

## Sources inspected

Owner-supplied NZS AS 1720.1:2022, including AS 1720.1:2010 and amendments 1–3:
- PDF pages 89–92 / printed ZZ71–ZZ74: NZ round-timber replacement section; Tables ZZ6.1–ZZ6.4 and all accompanying notes.
- PDF pages 209–212 / printed 89–92: Australian round-timber clauses; Tables 6.1–6.3.
- PDF pages 275–279 / printed 155–159: Tables H2.1–H2.4 and their notes.
- NZ foreword explicitly replaces section 6 with ZZ6; the Australian mapping must not substitute for the NZ density categories.

Owner-supplied ANSI O5.1-2022:
- PDF page 21 / printed 13, Table 1 and notes, visually inspected and cross-checked against extraction.
- Annex A, printed 32 onward, establishes the limits of groundline values at other heights.
- Existing six US presets match Table 1. Its fibre strengths are mean groundline values (COV 0.20), not characteristic lower-tail strengths. E is mean. Conditioning is already accounted for when it satisfies the standard; do not apply NZ steaming reductions to US presets. Through-bored Douglas fir retains the specific 5% reduction.

Source PDFs and page images remain outside the distributable project assets. Verification records contain file names, hashes and reviewed page references, not copies of the standards.

## Behaviour and defaults

Available species selections apply immediately. Properties remains collapsed initially. It now contains standard preparation and, for NZ, density controls alongside editable user-entered alternatives. Manual option changes are committed together with Apply material.

NZ radiata, NZ-grown Douglas fir and NZ-grown European larch use the conditional naturally-round-softwood density category of Table ZZ6.1. This is not evidence that a particular larch or Douglas fir pole satisfies NZS 3605. The selected category and grading must be established for the actual pole.

Normal-density raw reference: E 8.7 GPa, Fb 38 MPa; high-density raw reference: E 12.1 GPa, Fb 52 MPa. High density requires supplier evidence or the specified proof testing. Outer-zone density refers to the outer 20% of radius, not whole-pole average density. Different qualifying softwoods can legitimately give identical results at the same density/preparation.

Default NZ example: normal density, machine peeled, steamed, unseasoned. This gives E 8.265 GPa and modified characteristic Fb 29.07 MPa. Steaming is assumed for H4/H5/H6 unless supplier information establishes otherwise. Properties exposes the actual assumptions.

NZ controls implement bending and E adjustments:
- Natural/hand peeled/hydraulic debarked: no preparation reduction.
- Machine peeled: Fb ×0.90, E unchanged.
- Machine shaved: Fb ×0.80, E ×0.95.
- Steaming: Fb ×0.85, E ×0.95.
- The whole embedded pole uses the unseasoned reference; no whole-pole seasoned multiplier is offered because groundline must remain unseasoned.

Australian groups map S1→F34 through S7→F8 using Table 6.1 and bending/E from H2.1. Applicable species are conditional on AS 3818.11 pole quality. Most group assignments are directly in H2.3/H2.4. Grey gum, Gympie messmate, red ironbark and forest red gum retain the previously documented DTM Timber group source; they are not claimed as rows transcribed from H2.3.

Australian radiata and hoop pine are S6; slash pine is S5; jarrah S4. Added Australian-grown radiata as a distinct species entry: it must not share the NZ reference by virtue of botanical identity. Added coast grey box (E. moluccana) with the table's S1 designation.

Australian controls implement:
- Actual mid-length diameter, automatically refreshed after geometry edits, determines capacity and stiffness immaturity multipliers.
- Between the 25 mm tabulated diameters, use the lower band's factor conservatively; no interpolation rule is claimed. Below 75 mm is unsupported.
- Shaving: Fb ×0.85 for eucalypts/corymbias, ×0.75 for softwoods; E ×0.95.
- Steaming: bending ×0.85, as given in the bending equation. No unsupported Australian steaming multiplier is added to E.
- Default is natural preparation, unsteamed, unseasoned, with adequate preservation assumed for using the full cross-section.

Maritime pine, southern plantation hybrids and the old combined grey-box entry still require supplied data. The old grey-box entry combined botanical identities and a supplier S2 grouping; it is not silently replaced by the coast-grey-box S1 reference.

## Existing cases and compatibility

New/reset examples use the NZ default above. On first loading existing browser cases, only the exact unmodified radiata teaching material (8 GPa / 35 MPa tension / 25 MPa compression, with no source) is upgraded; geometry, defects and load are preserved, and incompatible ground history is cleared. The original pair is retained under browser storage key innerview-poles-before-p22. User-entered properties and other species are preserved. Explicitly imported legacy files retain their recorded material. Legacy numerical fixtures and recorded films are unchanged.

Saved standard-derived references store density, preparation, steaming, actual mid-diameter and source ID. Import validation rejects altered reference values and stale Australian diameter factors. Custom editing drops the standard configuration and retains a user-entered source.

## Result meaning and limits

NZ/Australian capacities now use modified characteristic bending references. They are not mean individual test-failure predictions and not complete factored design capacities. Capacity factor, load-duration, temperature and other applicable design provisions are not implemented in this property milestone. ANSI still uses mean groundline references without Annex A height adjustments. The UI identifies these different bases beside results.

The beam and height chart use the actual modified bending reference. E changes stiffness; strength changes utilisation and timber capacity. Detect's MPa proxy follows the same selected reference but remains uncalibrated. No acoustic species calibration is claimed.

This milestone does not qualify local solid failure. Although the supplied NZ and Australian tables also contain direct strength data, those data are not substituted into the present solid screening without addressing their size, stress-state and modification rules. Local solid utilisation remains withheld for pole-reference materials; stress components remain available. Defect reductions remain illustrative; graded characteristic properties and explicit knot penalties can overlap.

## Verification

Full build: 549 checks pass, including 41 new P22 checks. These cover source-row arithmetic, density categories, preparation/steaming products, Australian group mapping, conservative immaturity bands, automatic geometry refresh, tamper/stale-data rejection, legacy compatibility, independent circular-cantilever Fb·Z/H capacity, density response ratios and Detect reference propagation.

Browser checks:
- Initial NZ default shows collapsed Properties and a characteristic-basis label.
- Expanding reveals the verified defaults, modified E/Fb and qualifying conditions.
- High NZ density produces E 11.495 GPa and Fb 39.78 MPa with default peeling/steaming.
- Spotted gum immediately selects S2→F27, E 18.5 GPa / Fb 67 MPa.
- Australian radiata: changing ground diameter from 320 to 180 mm (tip 180 mm) lowers E from 10.5 to 9.45 GPa and Fb from 31 to 27.9 MPa via actual mid-length diameter. Restoring geometry restores values.
- The temporary test case was restored to normal NZ radiata; production was rebuilt and reloaded.

P21 archives and the parent Crossarm/Conductors project are preserved.
