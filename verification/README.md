# Verification and validation evidence

P01 passes 56 numerical checks in `verify.mjs`; the actual results are in [p01-numerics.json](results/p01-numerics.json). Run with Node 22.13 or later: `node --experimental-strip-types verification/verify.mjs`. Read the [P01 review](../docs/P01-REVIEW.md) for the tested scope and physical-validation limits, and the wider [engineering gates](../docs/ENGINEERING-PLAN.md) before extending the model.

- `reference/`: independently derived analytical and numerical models; document shared inputs and independence limits.
- `results/`: versioned evidence with exact case, solver/data versions, method, tolerances, actual errors and outcome.

Keep numerical verification, physical validation, UI/browser checks, performance and product-workflow approval distinct. Record failed and unverified checks as well as passes. A report must identify device/browser where relevant and must not treat a successful build as engineering validation.

For physical and UB1000 evidence, retain measurement provenance, uncertainty, supported range and calibration/holdout separation. Do not silently replace historical evidence by rerunning a script into the same report.
