# Reserved datasets

P01 uses explicitly illustrative timber, decay and soil parameters in the source model, documented in the [review](../docs/P01-REVIEW.md). These are not engineering-qualified material datasets. No UB1000 calibration values have been invented. `cases/sound-and-decayed.json` is a synthetic A/B example that can be opened from the app.

- `materials/`: sourced species/grade/treatment datasets with strength basis and applicable scope.
- `cases/`: versioned synthetic demonstrations and benchmark input cases, labelled by purpose.
- `ub1000/`: approved example observations and adapter fixtures when provided. Keep confidentiality/licensing metadata with each file; this is not a public-assets folder.

Every supplied value must carry units, a source/revision and measured/estimated/illustrative status as relevant. Use the [evidence record](../docs/SOURCES-AND-DATA.md) when accepting new data. Record raw observations separately from transformations and keep calibration versus validation sets identifiable.
