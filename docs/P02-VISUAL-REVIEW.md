# P02 — white full-height workspace

24 September 2026. Owner-requested visual revision of P01, not an engineering qualification milestone.

- White panels, neutral text and restrained blue selections replace the tan palette. The scene has a white minor/major drafting grid.
- View selectors, file actions, loading and settings occupy the left rail; cross-section and results occupy the right. The desktop model extends through the full browser height; side rails scroll independently.
- Logo, decorative icons and promotional headings removed. Previously icon-only actions have visible text labels.
- Generated photographic-style grey-green treated-pine exterior, neutral lighting and fine bump relief. Grain repeats at a fixed two-metre longitudinal scale and introduces no mechanical knots, cracks or decay. This is a synthetic visual asset, not a pole photograph or measurement.
- Neutral soil, blue section-plane highlighting and recoloured synthetic sawn faces. Stress zero is neutral; stress values are unchanged.
- Calculation parameters, saved-case schema and future photo-input contract are preserved.

## Verification

Typecheck, production build and 56 existing numerical checks pass. Desktop browser inspection at 1440 × 900 confirmed a 900-pixel-high scene starting at y=0, two comparison viewports, no horizontal page overflow, no SVG icons and no blank visible buttons. Setup texture detail and Stresses were inspected in genuine WebGL. Inspected browser error/warning logs were empty.

This visual revision does not change P01's engineering, material, soil, UB1000 or climbing-clearance limitations. Actual mobile-hardware performance remains unqualified.

The 390 × 844 browser layout was also checked: model, settings and section navigation, text-only lesson dialog controls, no horizontal overflow and no blank visible buttons. The mobile scene keeps view selectors overlaid beside the pole. These are browser viewport checks, not physical-phone testing.

## Asset

[Treated-pine texture](../public/textures/treated-pine-p02.png), made with the built-in image-generation tool using [this prompt](P02-TEXTURE-PROMPT.md). P01 archives are preserved; P02 is packaged separately.
