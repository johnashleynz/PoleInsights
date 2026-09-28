# P24 — Filtered signal display and video review brief

27 September 2026. Local review; no deployment. Videos themselves are unchanged.

## Delivered

`docs/CLAUDE-VIDEO-REVIEW.md` is a ready-to-send review prompt for all five films. It requires actual video/audio review, timestamped findings, natural narration, purposeful camera work, stable labels, technical accuracy, current-interface comparisons and a prioritised editing plan. Reviewers without playback access must declare that limitation.

Detect → **Wave controls and received signal** now includes a second graph beneath the existing signed receiver waveform. It follows the supplied screenshot's dark plot, green positive trace and white peak markers. The graph uses the actual simulated receiver sequence; no screenshot points or artificial UB1000 numbers are substituted. The original waveform and sound-reference control remain available.

The new plot includes time-sample ticks, a shared reference amplitude scale, an optional dashed sound curve, a playhead linked to existing playback and four values: height AGL, arrival indicator, peak amplitude and signal energy proxy. The existing mockup scan controls also govern its playhead. Retained/stale calculations show their original height and bearing.

## Definitions and limits

- Envelope: centred moving RMS of receiver displacement over approximately one source period, with available-sample averaging at the ends. This is display processing, not a change to the acoustic solver or stress fields.
- Amplitude: percentage of the sound-reference RMS peak, using the same scale for both curves. More than 100% is allowed; each signal is not normalised to its own maximum.
- Peak markers: up to two highest local maxima separated by more than the RMS window radius times two. They are not identified as heart or shell paths.
- Arrival indicator: first **raw** receiver sample exceeding 5% of the raw sound-reference peak. Uses the simulation clock, including source-pulse timing; it is not calibrated device time of flight. Using the raw trace avoids reporting an artificial early arrival caused by the centred filter.
- Signal energy proxy: trapezoidal integral of squared receiver displacement divided by the matching sound-reference integral. This is neither measured acoustic energy nor a strength percentage.
- Time samples refer to the simulation's stored receiver samples, not the screenshot's device sample clock. Total physical simulated duration is also shown.
- Empty reference amplitude produces an unavailable message. No signal produces no arrival and zero ratios. Unsupported inputs/non-finite samples are rejected by the processing function.

The screenshot does not define the device's filter, Heart Energy/Shell Energy windows, calibration or sample rate. Those quantities are not invented or relabelled. Manufacturer definitions are needed before reproducing their meanings and numerical units. Existing acoustic late-waveform convergence and physical calibration limits remain.

## Checks

- `node --experimental-strip-types verification/p24.mjs`: 16 checks, covering matched sound signals, amplitude/energy scaling, above-reference peaks, raw arrival timing, zero/missing signals, separated peaks and invalid inputs.
- TypeScript and production build checks; interactive browser inspection of the drawer and chart, reference visibility, playback and height-dependent results.
- Existing FE/acoustic solver implementations, material references, P23 workflow copies and video media are unchanged. No repeat of unchanged FE qualification studies is claimed.

Rebuild with `node tools/build.mjs`; the P24 display checks are included. Preserve P23 release archives.
