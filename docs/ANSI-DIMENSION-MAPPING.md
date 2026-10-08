# ANSI Dimension Mapping

Source: supplied `reference/ANSI+O5.1-2022.pdf`, imperial dimension tables.
Dimensions are species-specific, not universal across all timber poles.

| Catalogue Species | Table | Printed Page | PDF Page |
| --- | --- | --- | --- |
| Western Red Cedar | 5 | 18 | 26 |
| Lodgepole Pine, Red / Norway Pine | 6 | 20 | 28 |
| Douglas Fir (coastal), Southern Pine | 8 | 24 | 32 |
| Western Larch | 9 | 26 | 34 |

Table 8 remains in `src/domain/countries.ts`; the other applicable tables are
in `src/domain/ansiDimensions.ts`. Species outside these mappings must not borrow
an unrelated species' table. Blank sizes remain unavailable. Dimensions do not
change material strengths or certify the measured pole's class.

## Conversion and Geometry

The tables publish minimum circumference at the top and at six feet from the
butt. They do not publish butt circumference. Using inch circumferences:

```text
nominal taper = (C6 - Ctop) / (total length in feet - 6)
estimated Cbutt = C6 + nominal taper * 6
diameter in metres = circumference in inches * 0.0254 / pi
```

Table groundline distances are explicitly NOT recommended embedment depths.
Use the app's country starting heuristic or an assessor-entered embedment.
All UB1000 test heights remain relative to that groundline.

Match class AND length, with a half-foot tolerance for converted US length;
do not substitute another length row. Combined source labels such as `1/45`,
`Class 1/45`, and `6 kN / 10 m` are supported. NZ uses the supplied Goldpine
class rows with a 0.26 m length tolerance, not ANSI rows.

For an import with measured stations, retain the applicable nominal tip and
extrapolated butt. Interpolate piecewise linearly through every usable measured
section; groundline lies on the same interpolation, adding no artificial kink.
A measured endpoint overrides its estimate. Incompatible end estimates adjust
with an explicit warning: increase an undersized butt using nominal taper below
the first measured section, or reduce an oversized tip to the last measured
diameter. Measurements are never altered to force a regular taper. Increasing
measurements remain visible with a warning. Review suspect units/class data.

If no applicable class/length exists, use bounded decreasing fitted taper where
multiple stations establish it. A single measurement cannot establish a taper;
the fallback remains an explicitly warned cylindrical estimate, not a claim
that real poles are cylindrical. Estimated anchors retain `(est.)` provenance.

## Regression Examples

- Western Red Cedar Class 1/45: 27 in top; 47.5 in at six feet from butt;
  extrapolated butt about 50.654 in. A compatible measured station retains these
  ends. A 54 in reading near groundline forces a larger estimated butt with a
  warning, rather than an hourglass or a 54 in tip.
- Class 1/45 six-foot circumference differs by species: Southern Pine and
  Douglas Fir 43 in, Lodgepole/Red Pine 46 in, Western Larch 42 in.
- Labels: `Western Red Cedar` followed by a separate `Class 1/45` row;
  NZ class convention is `6 kN / 10 m`.

`verification/system-integration.mjs` checks species/table selection, published
top/six-foot values, derived butt, exact measured girths, GL interpolation,
conflict warnings and unsupported class/length rejection.
