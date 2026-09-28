# P18 — UK narration, directed films and inspection capacity

The owner requested a less artificial voice, more dynamic and professional films, and estimated pole-top capacity in Detect. The subsequent instruction selects a UK voice and takes precedence over the brief US voice sample. This remains a local review; P17 build/source ZIPs are preserved.

## Narration and films

All sixteen chapters have new conversational scripts and UK `en-GB-RyanNeural` narration at its normal rate. The earlier New Zealand voice and deliberately slowed delivery are replaced. Shorter sentences, contractions and paragraph-level generation give the speech more natural phrasing. Narration remains synthetic; subjective voice quality should be judged from playback, not inferred from successful file decoding. The original, non-sensitive scripts are the only content sent to the existing speech service.

Narration caches now fingerprint the exact voice, rate and script. A voice change cannot silently reuse a previous recording. Chapter audio has a 300 ms lead and 450 ms tail; captions shift with the lead and chapter lengths are rounded to 30 fps boundaries. Captions, transcripts, MP4 downloads and chapter navigation are retained.

The films use the app's actual pole, section and wave canvases. Six smooth camera paths vary viewing direction, distance, target height and elevation: wider establishing shots, pans, close approaches and oblique rotations. Camera movement changes only the view, never the calculated deflection. Feature leaders project actual deformed positions with the shot camera; load labels point to the load arrow. The layout adds chapter progress, inspection height/diameter, a separate caption band and restrained labels. The final detection chapter shows the timber capacity alongside the explanation of its separate origin. Wave sections preserve their circular aspect ratio and all stress colours retain the existing calculation/palette.

Authoring: `src/lessons/VideoStudio.tsx`, `src/lessons/filmDirector.ts`, `public/videos/storyboard.json`, `tools/narrate.py`, `tools/encode_videos.py`. Recording waits for the current section and stress/wave calculation. Captures are 1280 × 720 at 30 fps, with H.264/AAC delivery. No external stock footage or generated replacement stress maps are used.

## Estimated pole-top capacity

Detect's simulated assessment now includes **Estimated pole-top capacity (kN)**. This reuses the current whole-pole elastic **timber bending** estimate for the specified load direction. It is not capped by the separate soil limit and is not calculated from the fibre-strength percentage, area–strength proxy or received waveform. The details name its governing timber section and explain the distinction.

The estimate applies to the whole prescribed pole, so moving the inspection plane or rotating the probes does not change it. Editing the pole/defects or structural load direction updates it with the existing structural result. Pending, failed or nonfinite results have no capacity value. Detect uses the specified structural direction even if the user previously selected a worst-direction plot in Stresses; that Stresses preference is retained when leaving Detect. Saved Detect cases include the estimate's basis and bearing.

For yielding ground, this remains the existing elastic timber reference; it is not a prediction of history-dependent collapse. Existing material assumptions, unsupported failure mechanisms, UB1000 calibration and climbing-clearance gaps remain unchanged. No solver, material constants, stress smoothing or failure criterion was altered by P18.

## Verification

Thirteen targeted checks cover capacity provenance, rejection of unavailable/nonfinite values, response to known section loss, current-load independence, nonlinear-reference labelling, and finite continuous camera paths. The full build passes **413 numerical/software checks**, TypeScript and Vite. The existing large-bundle advisory remains; physical-mobile performance is not established here.

All four UK-narrated MP4s decode successfully: 61.12, 60.12, 64.05 and 62.75 seconds. Voice/script fingerprints match every chapter; caption cues remain within chapter times. Caption punctuation is recovered from the original script and the final export redraws that band using timed subtitles, avoiding lost punctuation and overlapping cues. Frames from all sixteen chapters were visually reviewed. Independent early/late frame comparisons confirm changing pole imagery in every chapter (minimum 6.6% changed pixels in the inspected central pole area). This confirms motion is present, not a sustained frame-rate guarantee. Evidence: `verification/results/p18-media.json`, `p18-narration.json` and `p18-film-motion.json`; reproduce media checks with `tools/verify_videos.py` and `tools/verify_film_motion.py`.

Browser acceptance: Detect displayed an 8.02 kN whole-pole estimate for the existing synthetic case at 359°. Changing inspection height from 0.30 to 1.40 m and probe orientation from 90° to 0° left capacity unchanged. The row spans the assessment width. The revised film played and sought to the close-up chapter without media errors. The production preview was refreshed to P18; its narrow layout displays UK narration and the new durations. The final production check had no browser console errors. The existing user pole inputs were retained.

Protected parent digest is unchanged: `238E244E51FBFB0DDECD994A10CF27CBD878040E1C270A3C75F6F309C3E4F512`. P17 narration source files were retained in the temporary local media archive, and P17 build/source ZIPs remain the complete rollback point. P18 packages include the finished UK media and reproducible authoring sources, excluding temporary dependencies and raw capture files.

The existing protected Crossarm/Conductors files and earlier review archives remain outside this milestone. No deployment is authorised or performed.

Speech references: [Microsoft voice support](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support), [edge-tts](https://github.com/rany2/edge-tts). UK voice availability was checked against the service's current voice list.
