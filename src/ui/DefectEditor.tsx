import { useEffect, useState } from "react";
import {
  diameterAt,
  newRegion,
  clamp,
  drillingBounds,
} from "../domain/model.ts";
import type { PoleCase, Region } from "../domain/model.ts";
import {
  displayPoleLength,
  poleLengthFromDisplay,
  displaySmallLength,
  smallLengthFromDisplay,
  unitLabels,
  type UnitSystem,
} from "../domain/units.ts";
export type DefectPreset =
  "heart" | "shell" | "incipient" | "void" | "knot" | "drilling" | "chipping";
export function presetRegion(p: PoleCase, preset: DefectPreset) {
  const r = newRegion(
    p,
    ["void", "knot", "drilling", "chipping"].includes(preset)
      ? (preset as Region["kind"])
      : "decay",
  );
  if (r.kind === "decay") {
    r.name =
      preset === "shell"
        ? "Shell rot"
        : preset === "incipient"
          ? "Incipient heart rot"
          : "Heart rot";
    r.severity = preset === "incipient" ? 0.2 : 0.7;
    r.decay = {
      pattern: preset === "shell" ? "shell" : "heart",
      progression: "source",
      sourceZ: (r.zMin + r.zMax) / 2,
      exponent: 2,
      shellDepth: 0.03,
    };
    if (r.shape.type === "ellipse" && preset !== "shell") {
      r.shape.centreX = 0;
      r.shape.centreY = 0;
    }
  }
  return r;
}
function Field({
  label,
  value,
  unit,
  min,
  max,
  step = 0.01,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(Number(value.toFixed(4)))), [value]);
  const commit = () => {
    const v = Number(draft);
    if (draft.trim() && Number.isFinite(v))
      onChange(clamp(v, min ?? -Infinity, max ?? Infinity));
    else setDraft(String(value));
  };
  return (
    <label className="number-field">
      <span>{label}</span>
      <div>
        <input
          type="number"
          aria-label={label}
          value={draft}
          min={min}
          max={max}
          step={step}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
        />
        <small>{unit}</small>
      </div>
    </label>
  );
}
export default function DefectEditor({
  pole,
  units,
  selected,
  onSelect,
  onAdd,
  onEdit,
  onRemove,
  onFocus,
}: {
  pole: PoleCase;
  units: UnitSystem;
  selected: string | null;
  onSelect: (r: Region) => void;
  onAdd: (preset: DefectPreset) => void;
  onEdit: (id: string, update: Partial<Region>) => void;
  onRemove: (id: string) => void;
  onFocus: () => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(selected),
    [preset, setPreset] = useState<DefectPreset>("heart");
  useEffect(() => {
    if (selected) setExpanded(selected);
  }, [selected]);
  return (
    <div className="defect-editor">
      <div className="defect-add">
        <select
          aria-label="New defect type"
          value={preset}
          onChange={(e) => setPreset(e.target.value as DefectPreset)}
        >
          <option value="heart">Heart rot</option>
          <option value="shell">Shell rot</option>
          <option value="incipient">Incipient decay</option>
          <option value="void">Cavity</option>
          <option value="knot">Knot</option>
          <option value="drilling">Drilling</option>
          <option value="chipping">Chipping</option>
        </select>
        <button className="small-button" onClick={() => onAdd(preset)}>
          Add
        </button>
      </div>
      {!pole.regions.length && (
        <p className="field-note">
          Choose a defect to explore its effect on the pole.
        </p>
      )}
      {pole.regions.map((r) => {
        const open = expanded === r.id,
          centre = (r.zMin + r.zMax) / 2,
          update = (v: Partial<Region>) => onEdit(r.id, v),
          sh = r.shape,
          drill = r.drilling,
          chipping = r.chipping;
        const shape = (v: Record<string, number>) =>
          sh.type !== "section-contours" && update({ shape: { ...sh, ...v } });
        const move = (z: number) => {
          const target = poleLengthFromDisplay(z, units),
            current = drill?.entryHeight ?? centre,
            dz = target - current;
          if (drill) {
            const drilling = { ...drill, entryHeight: target },
              bounds = drillingBounds(drilling);
            update({ drilling, zMin: bounds.zMin, zMax: bounds.zMax });
          } else
            update({
              zMin: r.zMin + dz,
              zMax: r.zMax + dz,
              ...(r.decay
                ? { decay: { ...r.decay, sourceZ: r.decay.sourceZ + dz } }
                : {}),
            });
        };
        const updateDrill = (
          values: Partial<NonNullable<Region["drilling"]>>,
        ) => {
          if (!drill) return;
          const drilling = { ...drill, ...values },
            bounds = drillingBounds(drilling);
          update({ drilling, zMin: bounds.zMin, zMax: bounds.zMax });
        };
        const decay = r.decay ?? {
          pattern: "heart" as const,
          progression: "uniform" as const,
          sourceZ: centre,
          exponent: 2,
          shellDepth: 0.03,
        };
        return (
          <section className="defect-card" key={r.id}>
            <button
              className="defect-card-heading"
              aria-expanded={open}
              onClick={() => {
                setExpanded(open ? null : r.id);
                if (!open) onSelect(r);
              }}
            >
              <strong>{r.name}</strong>
              <span>
                {displayPoleLength(centre, units).toFixed(2)}{" "}
                {unitLabels[units].poleLength} · {open ? "Hide" : "Edit"}
              </span>
            </button>
            {open && (
              <div className="defect-card-body">
                <Field
                  label={
                    r.kind === "drilling"
                      ? "Drill entry height"
                      : "Defect height"
                  }
                  value={displayPoleLength(drill?.entryHeight ?? centre, units)}
                  unit={unitLabels[units].poleLength}
                  min={displayPoleLength(
                    -pole.embedment + (r.zMax - r.zMin) / 2,
                    units,
                  )}
                  max={displayPoleLength(
                    pole.length - pole.embedment - (r.zMax - r.zMin) / 2,
                    units,
                  )}
                  onChange={move}
                />
                {r.kind === "drilling" && drill ? (
                  <>
                    <label className="select-field">
                      Drill diameter
                      <select
                        aria-label="Drill diameter"
                        value={drill.diameter}
                        onChange={(e) => {
                          const diameter = Number(e.target.value);
                          updateDrill({ diameter });
                        }}
                      >
                        <option value={0.009525}>3/8 in · 9.525 mm</option>
                        <option value={0.0111125}>7/16 in · 11.113 mm</option>
                        <option value={0.0127}>1/2 in · 12.7 mm</option>
                      </select>
                    </label>
                    <div className="field-grid">
                      <Field
                        label="Drill depth"
                        value={displaySmallLength(drill.depth, units)}
                        unit={unitLabels[units].smallLength}
                        min={displaySmallLength(0.001, units)}
                        max={displaySmallLength(
                          diameterAt(pole, centre),
                          units,
                        )}
                        step={units === "metric" ? 1 : 0.05}
                        onChange={(v) =>
                          updateDrill({
                            depth: smallLengthFromDisplay(v, units),
                          })
                        }
                      />
                      <Field
                        label="Drill bearing"
                        value={drill.bearing}
                        unit="°"
                        min={0}
                        max={359}
                        step={5}
                        onChange={(v) => updateDrill({ bearing: v })}
                      />
                      <Field
                        label="Downward angle"
                        value={drill.inclination ?? 0}
                        unit="°"
                        min={0}
                        max={45}
                        step={5}
                        onChange={(v) => updateDrill({ inclination: v })}
                      />
                    </div>
                    <button
                      className="link-button"
                      onClick={() =>
                        updateDrill({ depth: diameterAt(pole, centre) / 3 })
                      }
                    >
                      Set depth to ⅓ diameter
                    </button>
                  </>
                ) : (
                  <>
                    <Field
                      label="Defect length"
                      value={displayPoleLength(r.zMax - r.zMin, units)}
                      unit={unitLabels[units].poleLength}
                      min={displayPoleLength(0.02, units)}
                      max={displayPoleLength(
                        Math.min(
                          centre + pole.embedment,
                          pole.length - pole.embedment - centre,
                        ) * 2,
                        units,
                      )}
                      onChange={(v) => {
                        const length = poleLengthFromDisplay(v, units);
                        update({
                          zMin: centre - length / 2,
                          zMax: centre + length / 2,
                          ...(r.decay
                            ? {
                                decay: {
                                  ...r.decay,
                                  sourceZ: clamp(
                                    r.decay.sourceZ,
                                    centre - length / 2,
                                    centre + length / 2,
                                  ),
                                },
                              }
                            : {}),
                        });
                      }}
                    />
                    {r.kind === "chipping" && chipping && (
                      <>
                        <div className="field-grid">
                          <Field
                            label="Chipping bearing"
                            value={chipping.bearing}
                            unit="°"
                            min={0}
                            max={359}
                            step={5}
                            onChange={(v) =>
                              update({ chipping: { ...chipping, bearing: v } })
                            }
                          />
                          <Field
                            label="Chipping arc"
                            value={chipping.degrees}
                            unit="°"
                            min={1}
                            max={360}
                            step={5}
                            onChange={(v) =>
                              update({ chipping: { ...chipping, degrees: v } })
                            }
                          />
                          <Field
                            label="Chipping depth"
                            value={displaySmallLength(chipping.depth, units)}
                            unit={unitLabels[units].smallLength}
                            min={displaySmallLength(0.001, units)}
                            max={displaySmallLength(
                              diameterAt(pole, centre) / 2 - 0.001,
                              units,
                            )}
                            step={units === "metric" ? 1 : 0.05}
                            onChange={(v) =>
                              update({
                                chipping: {
                                  ...chipping,
                                  depth: smallLengthFromDisplay(v, units),
                                },
                              })
                            }
                          />
                          <Field
                            label="Surface facets (0 = round)"
                            value={chipping.facets}
                            unit=""
                            min={0}
                            max={64}
                            step={1}
                            onChange={(v) =>
                              update({
                                chipping: {
                                  ...chipping,
                                  facets:
                                    v > 0 ? Math.max(6, Math.round(v)) : 0,
                                },
                              })
                            }
                          />
                        </div>
                        <p className="field-note">
                          Faceted chipping uses six or more flat faces in beam
                          section integration; zero retains a round surface.
                        </p>
                      </>
                    )}
                    {r.kind === "decay" && (
                      <>
                        <label className="select-field">
                          Decay pattern
                          <select
                            aria-label="Decay pattern"
                            value={decay.pattern}
                            onChange={(e) =>
                              update({
                                name:
                                  e.target.value === "shell"
                                    ? "Shell rot"
                                    : "Heart rot",
                                decay: {
                                  ...decay,
                                  pattern: e.target.value as "heart" | "shell",
                                },
                              })
                            }
                          >
                            <option value="heart">
                              Heart rot · inside outward
                            </option>
                            <option value="shell">
                              Shell rot · outside inward
                            </option>
                          </select>
                        </label>
                        <Field
                          label="Severity at source"
                          value={r.severity * 100}
                          unit="%"
                          min={0}
                          max={100}
                          step={5}
                          onChange={(v) => update({ severity: v / 100 })}
                        />
                      </>
                    )}
                    {r.kind === "decay" && decay.pattern === "shell" ? (
                      <Field
                        label="Shell decay depth"
                        value={displaySmallLength(decay.shellDepth, units)}
                        unit={unitLabels[units].smallLength}
                        min={displaySmallLength(0.001, units)}
                        max={displaySmallLength(
                          diameterAt(pole, centre) / 2,
                          units,
                        )}
                        step={units === "metric" ? 2 : 0.05}
                        onChange={(v) =>
                          update({
                            decay: {
                              ...decay,
                              shellDepth: smallLengthFromDisplay(v, units),
                            },
                          })
                        }
                      />
                    ) : (
                      r.kind !== "chipping" &&
                      sh.type !== "section-contours" && (
                        <div className="field-grid">
                          <Field
                            label="Defect width"
                            value={displaySmallLength(sh.radiusX * 2, units)}
                            unit={unitLabels[units].smallLength}
                            min={displaySmallLength(0.005, units)}
                            max={displaySmallLength(
                              diameterAt(pole, centre) * 1.5,
                              units,
                            )}
                            step={units === "metric" ? 5 : 0.05}
                            onChange={(v) =>
                              shape({
                                radiusX: smallLengthFromDisplay(v, units) / 2,
                              })
                            }
                          />
                          <Field
                            label="Defect depth"
                            value={displaySmallLength(sh.radiusY * 2, units)}
                            unit={unitLabels[units].smallLength}
                            min={displaySmallLength(0.005, units)}
                            max={displaySmallLength(
                              diameterAt(pole, centre) * 1.5,
                              units,
                            )}
                            step={units === "metric" ? 5 : 0.05}
                            onChange={(v) =>
                              shape({
                                radiusY: smallLengthFromDisplay(v, units) / 2,
                              })
                            }
                          />
                        </div>
                      )
                    )}
                    {r.kind === "knot" && (
                      <>
                        <Field
                          label="Knot grain angle"
                          value={r.knot?.grainAngle ?? 45}
                          unit="°"
                          min={0}
                          max={90}
                          step={5}
                          onChange={(v) => update({ knot: { grainAngle: v } })}
                        />
                        <p className="field-note">
                          Grain angle changes local stiffness and strength in
                          the beam. Illustrative approximation; splitting is not
                          assessed.
                        </p>
                      </>
                    )}
                    {r.kind !== "chipping" &&
                      sh.type !== "section-contours" &&
                      decay.pattern !== "shell" && (
                        <details className="advanced">
                          <summary>Position & shape</summary>
                          <div className="field-grid">
                            <Field
                              label="East–west offset"
                              value={displaySmallLength(sh.centreX, units)}
                              unit={unitLabels[units].smallLength}
                              step={units === "metric" ? 2 : 0.05}
                              onChange={(v) =>
                                shape({
                                  centreX: smallLengthFromDisplay(v, units),
                                })
                              }
                            />
                            <Field
                              label="North–south offset"
                              value={displaySmallLength(sh.centreY, units)}
                              unit={unitLabels[units].smallLength}
                              step={units === "metric" ? 2 : 0.05}
                              onChange={(v) =>
                                shape({
                                  centreY: smallLengthFromDisplay(v, units),
                                })
                              }
                            />
                          </div>
                          <Field
                            label="Shape rotation"
                            value={sh.angle}
                            unit="°"
                            min={0}
                            max={180}
                            step={5}
                            onChange={(v) => shape({ angle: v })}
                          />
                        </details>
                      )}
                    {r.kind === "decay" && decay.pattern === "shell" && (
                      <details className="advanced">
                        <summary>Position</summary>
                        <Field
                          label="Shell east–west offset"
                          value={displaySmallLength(
                            r.decay?.offsetX ?? 0,
                            units,
                          )}
                          unit={unitLabels[units].smallLength}
                          step={units === "metric" ? 2 : 0.05}
                          onChange={(v) =>
                            update({
                              decay: {
                                ...decay,
                                offsetX: smallLengthFromDisplay(v, units),
                              },
                            })
                          }
                        />
                        <Field
                          label="Shell north–south offset"
                          value={displaySmallLength(
                            r.decay?.offsetY ?? 0,
                            units,
                          )}
                          unit={unitLabels[units].smallLength}
                          step={units === "metric" ? 2 : 0.05}
                          onChange={(v) =>
                            update({
                              decay: {
                                ...decay,
                                offsetY: smallLengthFromDisplay(v, units),
                              },
                            })
                          }
                        />
                      </details>
                    )}
                    {r.kind === "decay" && (
                      <details className="advanced">
                        <summary>Decay spread</summary>
                        <label className="select-field">
                          Progression
                          <select
                            aria-label="Decay progression"
                            value={decay.progression}
                            onChange={(e) =>
                              update({
                                decay: {
                                  ...decay,
                                  progression: e.target.value as
                                    "source" | "uniform",
                                },
                              })
                            }
                          >
                            <option value="source">
                              Diminish away from source
                            </option>
                            <option value="uniform">
                              Uniform within region
                            </option>
                          </select>
                        </label>
                        {decay.progression === "source" && (
                          <>
                            <Field
                              label="Decay source height"
                              value={displayPoleLength(decay.sourceZ, units)}
                              unit={unitLabels[units].poleLength}
                              min={displayPoleLength(r.zMin, units)}
                              max={displayPoleLength(r.zMax, units)}
                              onChange={(v) =>
                                update({
                                  decay: {
                                    ...decay,
                                    sourceZ: poleLengthFromDisplay(v, units),
                                  },
                                })
                              }
                            />
                            <Field
                              label="Spread exponent"
                              value={decay.exponent}
                              unit=""
                              min={0.5}
                              max={6}
                              step={0.25}
                              onChange={(v) =>
                                update({ decay: { ...decay, exponent: v } })
                              }
                            />
                          </>
                        )}
                        <p className="field-note">
                          Assumed spatial progression. Early decay may have
                          little visible discoloration in Setup; Defects makes
                          its prescribed extent visible.
                        </p>
                      </details>
                    )}
                  </>
                )}
                <div className="defect-card-actions">
                  <button
                    onClick={() => {
                      onSelect(r);
                      onFocus();
                    }}
                  >
                    Focus
                  </button>
                  <button onClick={() => onRemove(r.id)}>Remove</button>
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
