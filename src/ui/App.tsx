import DetectApps from "./DetectApps.tsx";
import type { WaveControl } from "../inspection/mockupProtocol.ts";
import MaterialPicker from "./MaterialPicker.tsx";
import { materialDescription, speciesById } from "../domain/species.ts";
import { inspectionCapacity } from "../inspection/capacity.ts";
import VideoLibrary from "../lessons/VideoLibrary.tsx";
import {
  yielding,
  structuralKey,
  resetHistoryOnGeometry,
} from "../analysis/nonlinear.ts";
import SolidAssessment from "./SolidAssessment.tsx";
import DetectSection from "./DetectSection.tsx";
import {
  placeholderAssessment,
  PROBE_LENGTH,
  PROBE_DIAMETER,
} from "../inspection/placeholder.ts";
import {
  measurementMM,
  diameterFromMM,
  type GirthMode,
} from "../domain/measurements.ts";
import { utilisationColour } from "../scene/utilisationPalette.ts";
import { profileLabel } from "../scene/heightChart.ts";
import Compass from "./Compass.tsx";
import { moveDefectHeight } from "../domain/defectEditing.ts";
import type { ProfileMetric, ProfileRow } from "../analysis/heightProfile.ts";
import DefectEditor, {
  presetRegion,
  type DefectPreset,
} from "./DefectEditor.tsx";
import { useSolid } from "../workers/useSolid.ts";
import { inLocalZone } from "../analysis/solid/field.ts";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  clamp,
  defaultCase,
  standardExample,
  refreshStandardMaterial,
  diameters,
  newRegion,
  validateCase,
  normaliseCase,
  safeAssetFilePart,
  loadApplicationHeight,
} from "../domain/model.ts";
import type {
  PoleCase,
  Region,
  Soil,
  ViewMode,
  StressDisplay,
} from "../domain/model.ts";
import {
  COUNTRIES,
  countryConfig,
  applyEmbedmentHeuristic,
  matchPoleClass,
  type CountryCode,
} from "../domain/countries.ts";
import {
  displayPoleLength,
  poleLengthFromDisplay,
  displaySmallLength,
  smallLengthFromDisplay,
  displayForce,
  forceFromDisplay,
  displayStress,
  formatPoleLength,
  formatSmallLength,
  formatForce,
  unitLabels,
  type UnitSystem,
} from "../domain/units.ts";
import { stationAt } from "../analysis/beam.ts";
import { resolveBreakState } from "../domain/break.ts";
import { useAnalysis } from "../workers/useAnalysis.ts";
import PoleScene from "../scene/PoleScene.tsx";
import SectionView, { type SectionPreviewHandle } from "./SectionView.tsx";
import { lessons } from "../lessons/content.ts";
type LabView = ViewMode | "Test";
const views: LabView[] = ["Setup", "Innerview", "Stresses", "Test"];
const companyUrl = "https://innerviewinsights.com/?utm_source=pole_insights&utm_medium=referral&utm_campaign=pole_insights_model";
function TextButton({
  label,
  onClick,
  active = false,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  const short: Record<string, string> = {
    "Frame whole pole": "Whole pole",
    "Focus on section": "Section detail",
    "Front elevation": "Elevation",
    "Plan view": "Pole top",
    "Link comparison cameras": "Link cameras",
    "Open saved case": "Open",
    "Toggle fullscreen": "Fullscreen",
    "Previous lesson step": "Previous",
    "Next lesson step": "Next",
    "Remove selected defect": "Remove",
    "Close lessons": "Close",
    "Close model details": "Close",
  };
  return (
    <button
      className={`text-control ${active ? "active" : ""}`}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {short[label] ?? label}
    </button>
  );
}
function NumberField({
  label,
  value,
  onChange,
  unit,
  min,
  max,
  step = 0.1,
  estimated,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  unit: string;
  min?: number;
  max?: number;
  step?: number;
  estimated?: string;
}) {
  const [draft, setDraft] = useState(value === null ? "" : String(value));
  useLayoutEffect(
    () => setDraft(value === null ? "" : String(Number(value.toFixed(3)))),
    [value],
  );
  function commit() {
    if (draft.trim() === "") {
      onChange(null);
    } else {
      const v = Number(draft);
      if (Number.isFinite(v))
        onChange(clamp(v, min ?? -Infinity, max ?? Infinity));
    }
    setDraft(value === null ? "" : String(value));
  }
  return (
    <label className="number-field">
      <span>{label}</span>
      <div>
        <input
          type="number"
          aria-label={label}
          value={draft}
          placeholder={estimated}
          step={step}
          min={min}
          max={max}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
        />
        <small>{unit}</small>
      </div>
      {value === null && estimated && (
        <em>
          Estimated {estimated} {unit}
        </em>
      )}
    </label>
  );
}
function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const commit = () => {
    if (draft !== value) onChange(draft);
  };
  return (
    <label className="range-field">
      <span>
        {label}
        <strong>
          {format ? format(draft) : draft.toFixed(step < 1 ? 1 : 0)}
          {unit && <small> {unit}</small>}
        </strong>
      </span>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={draft}
        onChange={(e) => setDraft(Number(e.target.value))}
        onPointerUp={commit}
        onKeyUp={(e) => {
          if (e.key === "Escape") setDraft(value);
          else commit();
        }}
        onBlur={commit}
        onPointerCancel={() => setDraft(value)}
        style={
          {
            "--range": `${((draft - min) / (max - min)) * 100}%`,
          } as React.CSSProperties
        }
      />
    </label>
  );
}

function download(name: string, text: string) {
  const a = document.createElement("a"),
    url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function safeInitial(): PoleCase[] {
  try {
    const saved = localStorage.getItem("innerview-poles-p01");
    if (saved) {
      const v = JSON.parse(saved);
      if (
        Array.isArray(v) &&
        v.length === 2 &&
        v.every((p) => validateCase(p).length === 0)
      ) {
        const next = v.map((p) =>
          normaliseCase(
            p.species === "radiata-pine" &&
              p.material.basis === "illustrative" &&
              p.material.E === 8e9 &&
              p.material.tension === 35e6 &&
              p.material.compression === 25e6 &&
              !p.material.source
              ? {
                  ...p,
                  material: standardExample(p.id).material,
                  soilHistory: [],
                }
              : p,
          ),
        );
        if (
          JSON.stringify(next) !== JSON.stringify(v) &&
          !localStorage.getItem("innerview-poles-before-p22")
        )
          localStorage.setItem("innerview-poles-before-p22", JSON.stringify(v));
        return next;
      }
    }
  } catch {}
  return [
    normaliseCase(standardExample("A")),
    normaliseCase(standardExample("B")),
  ];
}

export default function App() {
  const [waveControl, setWaveControl] = useState<WaveControl | null>(null);
  const controlWaves = (v: WaveControl | null) =>
    setWaveControl((old) =>
      old?.running === v?.running && old?.runId === v?.runId ? old : v,
    );
  const [girthMode, setGirthMode] = useState<GirthMode>("diameter"),
    [testBearings, setTestBearings] = useState([90, 90]);
  const [stressComponent, setStressComponent] = useState<
    "stress" | "longitudinal" | "transverse" | "shear"
  >("stress");
  const [quantity, setQuantity] = useState<
      "stress" | "utilisation" | "capacity"
    >("utilisation"),
    [resultDirection, setResultDirection] = useState<"specified" | "worst">(
      "specified",
    ),
    [chartRows, setChartRows] = useState<Record<string, ProfileRow[]>>({});
  const [narrow, setNarrow] = useState(
    () => window.matchMedia("(max-width:760px)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(max-width:760px)"),
      update = () => setNarrow(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const [cases, setCases] = useState<PoleCase[]>(safeInitial),
    [active, setActive] = useState(0),
    [compare, setCompare] = useState(false),
    [view, setView] = useState<LabView>("Setup"),
    [sections, setSections] = useState([0.3, 0.3]),
    [linkedSection, setLinkedSection] = useState(true),
    [tab, setTab] = useState<"pole" | "decay" | "ground">("pole"),
    [selected, setSelected] = useState<string | null>(null),
    [showSoil, setShowSoil] = useState(true),
    [scale, setScale] = useState(1),
    [cameraCommand, setCameraCommand] = useState({
      mode: "whole",
      seq: 0,
      animate: false,
    }),
    [notice, setNotice] = useState(""),
    [showDetails, setShowDetails] = useState(false),
    [showLessons, setShowLessons] = useState(false),
    [lesson, setLesson] = useState<number | null>(null),
    [step, setStep] = useState(0),
    [playing, setPlaying] = useState(false),
    [linkedCamera, setLinkedCamera] = useState(true),
    [linkedLoad, setLinkedLoad] = useState(false),
    [editBoth, setEditBoth] = useState(false),
    [pose, setPose] = useState<{
      position: number[];
      target: number[];
      source: string;
    } | null>(null),
    [mobilePanel, setMobilePanel] = useState<"model" | "settings" | "section">(
      "model",
    );
  const chartMetric: ProfileMetric =
    quantity === "capacity"
      ? resultDirection === "worst"
        ? "capacityWorst"
        : "capacityApplied"
      : quantity === "stress"
        ? resultDirection === "worst"
          ? "stressWorst"
          : "stressApplied"
        : resultDirection === "worst"
          ? "usageWorst"
          : "usageApplied";
  useEffect(() => {
    if ((compare ? cases : [cases[active]]).some(yielding))
      setResultDirection("specified");
  }, [cases, compare, active]);
  const renderView: ViewMode = view === "Test" ? "Setup" : view;
  const testBearing = testBearings[active];
  useEffect(() => {
    if (view === "Test") setResultDirection("specified");
  }, [view]);
  function setTestBearing(value: number) {
    setTestBearings((old) =>
      old.map((v, i) =>
        i === active || (compare && linkedSection)
          ? ((Math.round(value) % 360) + 360) % 360
          : v,
      ),
    );
  }
  const stressDisplay: StressDisplay =
    quantity === "stress" ? stressComponent : "utilisation";
  const visibleCases = compare ? cases : [cases[active]];
  const directionRows = visibleCases.map((c, i) =>
    (chartRows[c.id] ?? []).reduce<ProfileRow | null>(
      (best, row) =>
        !best ||
        Math.abs(row.z - sections[compare ? i : active]) <
          Math.abs(best.z - sections[compare ? i : active])
          ? row
          : best,
      null,
    ),
  );
  const awaitingDirection =
    view !== "Test" &&
    resultDirection === "worst" &&
    directionRows.some((row) => !row);
  const shownCases = useMemo(
    () =>
      (compare ? cases : [cases[active]]).map((c, i) => {
        const height = sections[compare ? i : active],
          row = (chartRows[c.id] ?? []).reduce<ProfileRow | null>(
            (best, row) =>
              !best || Math.abs(row.z - height) < Math.abs(best.z - height)
                ? row
                : best,
            null,
          );
        return view !== "Test" && resultDirection === "worst" && row
          ? {
              ...c,
              bearing:
                quantity === "stress"
                  ? row.stressWorstBearing
                  : row.worstBearing,
            }
          : c;
      }),
    [
      cases,
      compare,
      active,
      chartRows,
      sections,
      quantity,
      resultDirection,
      view,
    ],
  );
  const shownPole = shownCases[compare ? active : 0],
    peakUsage = Math.max(
      0,
      ...visibleCases.flatMap((c) =>
        (chartRows[c.id] ?? []).map((row) =>
          resultDirection === "worst" ? row.usageWorst : row.usageApplied,
        ),
      ),
    ),
    utilisationMax = peakUsage > 1 ? peakUsage : 1.5;
  const shell = useRef<HTMLDivElement>(null),
    importInput = useRef<HTMLInputElement>(null),
    lessonBackup = useRef<{
      cases: PoleCase[];
      compare: boolean;
      active: number;
      view: LabView;
      sections: number[];
      quantity: typeof quantity;
      resultDirection: typeof resultDirection;
    } | null>(null),
    history = useRef<PoleCase[][]>([]),
    lastHistory = useRef(0);
  const [reveal, setReveal] = useState(false),
    [solidEnabled, setSolidEnabled] = useState(false),
    [solidResolution, setSolidResolution] = useState("coarse"),
    [loadPointLocked, setLoadPointLocked] = useState(true);
  const solidAnalysis = useSolid(
      shownCases,
      solidEnabled && view === "Stresses" && !awaitingDirection,
      solidResolution,
    ),
    solidJob = solidAnalysis.jobs[compare ? active : 0],
    solidField = solidJob?.result ?? null;
  const sectionPreview = useRef<SectionPreviewHandle>(null);
  useEffect(() => {
    if (narrow && mobilePanel === "section")
      shell.current?.querySelector(".section-panel")?.scrollTo(0, 0);
  }, [narrow, mobilePanel]);
  const section = sections[active];
  function setSection(z: number) {
    setSections((previous) =>
      previous.map((v, i) =>
        i === active || linkedSection
          ? clamp(z, -cases[i].embedment, cases[i].length - cases[i].embedment)
          : v,
      ),
    );
  }
  const calculated = useAnalysis(shownCases),
    analysis = awaitingDirection
      ? {
          pending: true,
          jobs: shownCases.map(() => ({ result: null, error: null })),
        }
      : calculated,
    p = cases[active],
    job = analysis.jobs[compare ? active : 0],
    result = job?.result ?? null,
    region = p.regions.find((r) => r.id === selected) ?? p.regions[0],
    h = p.length - p.embedment,
    resolved = diameters(p),
    effectiveSection = clamp(section, -p.embedment, h);
  const units = p.unitSystem ?? "metric",
    country = countryConfig(p.country),
    lengthUnit = unitLabels[units].poleLength,
    smallUnit = unitLabels[units].smallLength,
    forceUnit = unitLabels[units].force,
    stressUnit = unitLabels[units].stress;
  useEffect(() => {
    if (calculated.pending) return;
    setCases((old) => {
      let changed = false;
      const next = old.map((c) => {
        const i = shownCases.findIndex((q) => q.id === c.id),
          source = shownCases[i],
          r = calculated.jobs[i]?.result;
        if (
          !r?.nonlinear ||
          !source ||
          structuralKey(source) !== structuralKey(c) ||
          source.loadKN !== c.loadKN ||
          source.bearing !== c.bearing
        )
          return c;
        const path = r.nonlinear.path;
        if (JSON.stringify(c.soilHistory ?? []) === JSON.stringify(path))
          return c;
        changed = true;
        return { ...c, soilHistory: path };
      });
      return changed ? next : old;
    });
  }, [calculated.jobs, calculated.pending]);
  useEffect(() => {
    try {
      localStorage.setItem("innerview-poles-p01", JSON.stringify(cases));
    } catch {}
  }, [cases]);
  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => setNotice(""), 5000);
      return () => clearTimeout(t);
    }
  }, [notice]);
  useEffect(() => {
    if (!showDetails && !showLessons) return;
    const previous = document.activeElement as HTMLElement | null;
    const modal = document.querySelector<HTMLElement>('[role="dialog"]');
    const focusable = () =>
      Array.from(
        modal?.querySelectorAll<HTMLElement>(
          'button, a[href], input, select, [tabindex="0"]',
        ) ?? [],
      ).filter((e) => !(e as HTMLButtonElement).disabled);
    focusable()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowDetails(false);
        setShowLessons(false);
      }
      if (e.key === "Tab") {
        const items = focusable(),
          first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [showDetails, showLessons]);
  function change(
    fn: (c: PoleCase) => PoleCase,
    { both = editBoth, load = false, record = true } = {},
  ) {
    setCases((previous) => {
      const next = previous.map((c, i) =>
        i === active || (compare && (both || (load && linkedLoad)))
          ? refreshStandardMaterial(fn(structuredClone(c)))
          : c,
      );
      const tracked = next.map((c, i) =>
        resetHistoryOnGeometry(previous[i], c),
      );
      const errors = tracked.flatMap(validateCase);
      if (errors.length) {
        setNotice(errors[0]);
        return previous;
      }
      if (record && Date.now() - lastHistory.current > 600) {
        history.current.push(structuredClone(previous));
        if (history.current.length > 30) history.current.shift();
        lastHistory.current = Date.now();
      }
      return tracked;
    });
  }
  function patch(patch: Partial<PoleCase>, load = false) {
    if (patch.bearing !== undefined) setResultDirection("specified");
    change((c) => ({ ...c, ...patch }), { load });
  }
  function setGlobalUnits(unitSystem: UnitSystem) {
    setCases((previous) => previous.map((c) => ({ ...c, unitSystem })));
  }
  function setGlobalCountry(code: CountryCode) {
    setCases((previous) =>
      previous.map((c) => ({
        ...c,
        country: code,
        poleClass: null,
      })),
    );
  }
  function applyPoleClass(classId: string) {
    const selectedClass = country.poleClasses.find(
      (item) => item.id === classId,
    );
    if (!selectedClass) {
      patch({ poleClass: null });
      return;
    }
    patch({
      poleClass: selectedClass.id,
      length: selectedClass.lengthM,
      embedment: selectedClass.embedmentM,
      diameters: {
        butt: selectedClass.buttDiameterM,
        ground: selectedClass.groundDiameterM,
        tip: selectedClass.tipDiameterM,
      },
      loadHeight: selectedClass.lengthM - selectedClass.embedmentM,
    });
  }
  function add(kind: Region["kind"]) {
    const r = newRegion(p, kind);
    change((c) => ({ ...c, regions: [...c.regions, r] }));
    setSelected(r.id);
    setView("Innerview");
    setSection((r.zMin + r.zMax) / 2);
    setTab("decay");
  }
  function addPreset(preset: DefectPreset) {
    const r = presetRegion(p, preset);
    change((c) => ({ ...c, regions: [...c.regions, r] }));
    setSelected(r.id);
    setSection((r.zMin + r.zMax) / 2);
    setTab("decay");
  }
  function updateRegion(id: string, update: Partial<Region>) {
    const previous = p.regions.find((r) => r.id === id);
    if (!previous) return;
    const next = { ...previous, ...update };
    const errors = validateCase({
      ...p,
      regions: p.regions.map((r) => (r.id === id ? next : r)),
    });
    if (errors.length) {
      setNotice(errors[0]);
      return;
    }
    change((c) => ({
      ...c,
      regions: c.regions.map((r) => (r.id === id ? next : r)),
    }));
    setSection(clamp((next.zMin + next.zMax) / 2, -p.embedment, h));
  }
  function addSolidExample() {
    const centre = Math.min(h * 0.5, Math.max(1.9, h * 0.3)),
      half = Math.min(0.3, h * 0.05),
      r = newRegion(p, "void");
    r.zMin = centre - half;
    r.zMax = centre + half;
    if (r.shape.type === "ellipse") {
      r.shape.centreX = resolved.ground * 0.065;
      r.shape.centreY = 0;
      r.shape.radiusX = resolved.tip * 0.25;
      r.shape.radiusY = resolved.tip * 0.3;
    }
    change((c) => ({ ...c, regions: [r] }), { both: false });
    setSelected(r.id);
    setSection(centre);
    setSolidEnabled(true);
    setSolidResolution("coarse");
    setNotice(
      "Enclosed hollow example loaded. Undo restores the previous pole.",
    );
  }
  function camera(mode: string, animate = false) {
    setCameraCommand((c) => ({ mode, seq: c.seq + 1, animate }));
  }
  function startCompare() {
    setPose(null);
    setCompare(!compare);
  }
  function save() {
    download(
      `Pole-Insights-${safeAssetFilePart(p.assetId)}-P27-DEV.json`,
      JSON.stringify(
        {
          format: "innerview-pole-lab",
          product: "Pole Insights",
          version: 1,
          cases,
          view,
          girthMode,
          testBearings,
          inspection:
            view === "Test"
              ? {
                  basis: "sandbox-placeholder-v1",
                  probeLengthM: PROBE_LENGTH,
                  probeDiameterM: PROBE_DIAMETER,
                  poleTopCapacity: analysis.pending
                    ? null
                    : {
                        caseId: p.id,
                        ...inspectionCapacity(result, p.bearing),
                      },
                  assessments: cases.map((c, i) => ({
                    caseId: c.id,
                    bearing: testBearings[i],
                    ...placeholderAssessment(c, sections[i]),
                  })),
                }
              : null,
          quantity,
          resultDirection,
          stressComponent,
          stressDisplay,
          solidEnabled,
          solidResolution,
          solidResults: solidAnalysis.jobs.map((j) =>
            j.result
              ? {
                  version: j.result.version,
                  resolution: j.result.resolution,
                  nodes: j.result.nodes,
                  elements: j.result.elements,
                  zMin: j.result.zMin,
                  zMax: j.result.zMax,
                  unitLoadKN: j.result.actualLoad ? null : 1,
                  actualLoadKN: j.result.actualLoad ? p.loadKN : null,
                  sampledPeakPaAtUnitLoad: j.result.sampledPeakPa,
                  diagnosticOnly: true,
                  assessment: j.result.assessment,
                  basis: j.result.basis,
                }
              : null,
          ),
          section: effectiveSection,
          sections,
          active,
          compare,
          units: {
            storage: "SI",
            display: units,
            length: "m",
            force: "N except fields labelled kN",
            stress: "Pa",
            displacement: "m",
          },
          results: analysis.pending
            ? null
            : shownCases.map((c, i) => ({
                caseId: c.id,
                caseFingerprint: JSON.stringify(c),
                ...analysis.jobs[i],
              })),
          qualification:
            "Illustrative prototype; not an engineering or climbing clearance.",
        },
        null,
        2,
      ),
    );
    setNotice("Case and calculation basis saved.");
  }
  async function load(file?: File) {
    if (!file) return;
    try {
      if (file.size > 2e6) throw new Error("Choose a case smaller than 2 MB.");
      const data = JSON.parse(await file.text());
      if (
        data.format !== "innerview-pole-lab" ||
        data.version !== 1 ||
        !Array.isArray(data.cases) ||
        data.cases.length !== 2
      )
        throw new Error("This is not a supported Pole Insights case.");
      const errors = data.cases.flatMap(validateCase);
      if (errors.length) throw new Error(errors[0]);
      if (data.cases[0].id !== "A" || data.cases[1].id !== "B")
        throw new Error("The file must contain Pole A followed by Pole B.");
      setCases(data.cases.map(normaliseCase));
      setActive(data.active === 1 ? 1 : 0);
      setCompare(!!data.compare);
      setSections(
        Array.isArray(data.sections) &&
          data.sections.length === 2 &&
          data.sections.every(Number.isFinite)
          ? data.sections
          : [
              Number.isFinite(data.section) ? data.section : 0.3,
              Number.isFinite(data.section) ? data.section : 0.3,
            ],
      );
      setView(views.includes(data.view) ? data.view : "Setup");
      setGirthMode(
        data.girthMode === "circumference" ? "circumference" : "diameter",
      );
      setTestBearings(
        Array.isArray(data.testBearings) &&
          data.testBearings.length === 2 &&
          data.testBearings.every(Number.isFinite)
          ? data.testBearings.map((v: number) => ((v % 360) + 360) % 360)
          : [90, 90],
      );
      setQuantity(
        ["stress", "utilisation", "capacity"].includes(data.quantity)
          ? data.quantity
          : data.stressDisplay === "utilisation"
            ? "utilisation"
            : "stress",
      );
      setResultDirection(
        data.resultDirection === "worst" ? "worst" : "specified",
      );
      setStressComponent(
        ["stress", "longitudinal", "transverse", "shear"].includes(
          data.stressComponent,
        )
          ? data.stressComponent
          : "stress",
      );
      setSolidEnabled(data.solidEnabled === true);
      setSolidResolution(
        data.solidResolution === "medium" ? "medium" : "coarse",
      );
      setNotice("Case opened. Results are being recalculated.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Could not open that case.");
    } finally {
      if (importInput.current) importInput.current.value = "";
    }
  }
  function startLesson(index: number) {
    if (!lessonBackup.current)
      lessonBackup.current = {
        cases: structuredClone(cases),
        compare,
        active,
        view,
        sections: [...sections],
        quantity,
        resultDirection,
      };
    setResultDirection("specified");
    setLesson(index);
    setStep(0);
    setShowLessons(false);
    setPlaying(false);
    setActive(0);
    setCompare(false);
    applyLesson(index, 0);
  }
  function applyLesson(index: number, s: number) {
    const q = defaultCase("A"),
      r = newRegion(q);
    q.regions = [];
    q.soil = index < 2 ? "Fixed" : "Medium";
    q.loadKN = 2;
    if (index === 0) {
      if (s >= 2) {
        r.zMin = 1;
        r.zMax = 2.4;
        if (r.shape.type === "ellipse") {
          r.shape.centreX = 0.055;
          r.shape.radiusX = 0.07;
          r.shape.radiusY = 0.09;
        }
        r.severity = 0.9;
        q.regions = [r];
      }
      if (s === 3) q.bearing = 0;
      setView("Stresses");
      setSections([s < 2 ? 0 : 1.7, s < 2 ? 0 : 1.7]);
    } else if (index === 1) {
      if (s > 0) {
        r.severity = 0.85;
        if (r.shape.type === "ellipse") {
          r.shape.centreX = s > 1 ? 0.09 : 0;
          r.shape.radiusX = 0.085;
          r.shape.radiusY = 0.075;
        }
        if (s === 3) r.kind = "void";
        q.regions = [r];
      }
      setView("Innerview");
      setSections([0.3, 0.3]);
    } else {
      q.regions = [r];
      setView(s === 0 ? "Setup" : "Innerview");
      setSections([0.3, 0.3]);
    }
    const storyboard: ViewMode[][] = [
      ["Setup", "Stresses", "Innerview", "Stresses"],
      ["Setup", "Innerview", "Stresses", "Setup"],
      ["Setup", "Innerview", "Innerview", "Stresses"],
      ["Setup", "Innerview", "Stresses", "Setup"],
    ];
    setView(storyboard[index][s]);
    camera(s === 0 ? "whole" : s === 3 ? "front" : "detail", true);
    setCases([q, defaultCase("B")]);
  }
  function moveLesson(s: number) {
    if (lesson === null) return;
    const next = clamp(s, 0, 3);
    setStep(next);
    applyLesson(lesson, next);
    if (next === 3) setPlaying(false);
  }
  useEffect(() => {
    if (!playing || lesson === null) return;
    const t = setTimeout(() => moveLesson(step + 1), 5000);
    return () => clearTimeout(t);
  }, [playing, lesson, step]);
  function leaveLesson(restore: boolean) {
    setPlaying(false);
    setLesson(null);
    if (restore && lessonBackup.current) {
      const b = lessonBackup.current;
      setCases(b.cases);
      setCompare(b.compare);
      setActive(b.active);
      setView(b.view);
      setSections(b.sections);
      setQuantity(b.quantity);
      setResultDirection(b.resultDirection);
    }
    lessonBackup.current = null;
  }
  const currentLesson = lesson === null ? null : lessons[lesson],
    meanStress = result
      ? Math.max(
          ...result.stations.map((s) =>
            Math.max(Math.abs(s.stressMin), Math.abs(s.stressMax)),
          ),
        ) / 1e6
      : 0;

  const chartScales = (compare ? cases : [p]).map((c) => {
      const values = (chartRows[c.id] ?? [])
        .map((r) => r[chartMetric])
        .filter((v): v is number => v !== null && Number.isFinite(v) && v < 1e6)
        .sort((a, b) => a - b);
      return chartMetric.startsWith("capacity")
        ? Math.max(
            1,
            Math.min(100, values[Math.floor(values.length * 0.8)] ?? 10),
          )
        : Math.max(1, ...values);
    }),
    sharedChartScale = Math.max(...chartScales);
  const viewButtons = (
    <div
      className="view-switch shared-view-switch"
      role="tablist"
      aria-label="Pole views"
    >
      {views
        .filter((v) => v !== "Test" || p.showDetect !== false)
        .map((v) => {
          return (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              className={view === v ? "selected" : ""}
              onClick={() => {
                setView(v);
                if (v === "Test") {
                  setResultDirection("specified");
                  camera("detail");
                }
              }}
            >
              {v === "Innerview" ? "Defects" : v === "Test" ? "Detect" : v}
            </button>
          );
        })}
    </div>
  );
  return (
    <div className="app-shell" ref={shell}>
      <nav className="mobile-navigation">
        {(["model", "settings", "section"] as const).map((v) => (
          <button
            key={v}
            className={mobilePanel === v ? "selected" : ""}
            onClick={() => setMobilePanel(v)}
          >
            {v === "model"
              ? "3D model"
              : v === "settings"
                ? "Settings"
                : "Cross-section"}
          </button>
        ))}
      </nav>
      <main className={`workspace mobile-${mobilePanel}`}>
        {narrow && compare && (
          <div className="mobile-pole-switch" aria-label="Comparison pole">
            {cases.map((c, i) => (
              <button
                key={c.id}
                className={active === i ? "selected" : ""}
                onClick={() => setActive(i)}
              >
                Pole {c.id}
              </button>
            ))}
          </div>
        )}
        <aside className="controls-panel">
          <header className="topbar">
            <div className="app-title">Pole Insights</div>
            <details className="workspace-menu">
              <summary>Menu</summary>
              <div
                onClick={(e) => {
                  const menu = e.currentTarget.closest("details");
                  if (menu) menu.open = false;
                }}
              >
                <button onClick={() => setShowLessons(true)}>Videos</button>
                <button onClick={save}>Save case</button>
                <button onClick={() => importInput.current?.click()}>
                  Open
                </button>
                <button
                  onClick={() => {
                    if (document.fullscreenElement)
                      void document.exitFullscreen();
                    else
                      void shell.current
                        ?.requestFullscreen()
                        .catch(() =>
                          setNotice("Fullscreen is not available here."),
                        );
                  }}
                >
                  Fullscreen
                </button>
                <button onClick={startCompare}>
                  {compare ? "Close comparison" : "Compare A/B"}
                </button>
              </div>
            </details>
            <input
              type="file"
              accept=".json"
              hidden
              ref={importInput}
              onChange={(e) => void load(e.target.files?.[0])}
            />
          </header>
          {viewButtons}
          {compare && (
            <div className="compare-controls">
              <div className="editing-poles">
                {cases.map((c, i) => (
                  <button
                    key={c.id}
                    className={i === active ? "selected" : ""}
                    onClick={() => setActive(i)}
                  >
                    Pole {c.id}
                  </button>
                ))}
              </div>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={editBoth}
                  onChange={(e) => setEditBoth(e.target.checked)}
                />
                Edit both poles
              </label>
              <div className="compare-copy">
                <button
                  onClick={() => {
                    setCases((cs) =>
                      cs.map((c, i) =>
                        i === 1 - active
                          ? {
                              ...structuredClone(cs[active]),
                              id: c.id,
                              name: c.name,
                            }
                          : c,
                      ),
                    );
                    setNotice(`Copied ${p.id} to ${active === 0 ? "B" : "A"}.`);
                  }}
                >
                  Copy {p.id} → {active === 0 ? "B" : "A"}
                </button>
                <button
                  onClick={() => {
                    history.current.push(structuredClone(cases));
                    setCases((cs) =>
                      cs.map((c, i) =>
                        i === active
                          ? c
                          : {
                              ...structuredClone(cs[active]),
                              id: c.id,
                              name: c.name,
                              regions: [],
                            },
                      ),
                    );
                    setLinkedLoad(true);
                    setLinkedSection(true);
                    setNotice(
                      "Other pole is now a sound reference with matching geometry and load.",
                    );
                  }}
                >
                  Sound reference
                </button>
                <button
                  onClick={() =>
                    setCases((cs) => [
                      { ...cs[1], id: "A", name: "Pole A" },
                      { ...cs[0], id: "B", name: "Pole B" },
                    ])
                  }
                >
                  Swap
                </button>
              </div>
            </div>
          )}
          {compare && (
            <div className="comparison-links">
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={linkedLoad}
                  onChange={(e) => setLinkedLoad(e.target.checked)}
                />
                Link loads
              </label>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={linkedSection}
                  onChange={(e) => setLinkedSection(e.target.checked)}
                />
                Link section heights
              </label>
            </div>
          )}
          <div className="control-scroll">
            {view === "Stresses" && (
              <>
                {" "}
                <div className="load-bar">
                  <div className="load-label">
                    <span>
                      APPLIED LOAD<small>Horizontal force</small>
                    </span>
                  </div>
                  <div className="load-slider">
                    <Slider
                      label="Load"
                      value={displayForce(p.loadKN, units)}
                      min={0}
                      max={displayForce(
                        Math.max(12, Math.ceil(p.loadKN)),
                        units,
                      )}
                      step={units === "metric" ? 0.1 : 0.05}
                      unit={forceUnit}
                      onChange={(v) =>
                        patch({ loadKN: forceFromDisplay(v, units) }, true)
                      }
                    />
                  </div>
                  <div className="direction-control">
                    <span>
                      Specified direction <small>toward</small>
                    </span>
                    <div>
                      <NumberField
                        label="Load direction"
                        value={p.bearing}
                        min={0}
                        max={359}
                        step={1}
                        unit="°"
                        onChange={(v) => patch({ bearing: v ?? 0 }, true)}
                      />
                      <button
                        aria-label="Rotate load 45 degrees"
                        title="Rotate load 45°"
                        onClick={() =>
                          patch({ bearing: (p.bearing + 45) % 360 }, true)
                        }
                      >
                        Turn 45°
                      </button>
                    </div>
                  </div>
                </div>
                <Compass
                  bearing={p.bearing}
                  onChange={(bearing) => patch({ bearing }, true)}
                />
                <div className="scene-metrics">
                  <div>
                    <span>Tip movement</span>
                    <strong>
                      {result
                        ? displaySmallLength(result.tipMovement, units).toFixed(
                            0,
                          )
                        : "—"}
                      <small> {smallUnit}</small>
                    </strong>
                  </div>
                  <div>
                    <span>
                      {yielding(p)
                        ? "Elastic limit reference"
                        : "First model limit"}
                    </span>
                    <strong
                      className={
                        (result?.utilisation ?? 0) > 1 ? "over-limit" : ""
                      }
                    >
                      {result
                        ? displayForce(result.limitKN, units).toFixed(2)
                        : "—"}
                      <small> {forceUnit}</small>
                    </strong>
                  </div>
                  <div>
                    <span>Load</span>
                    <NumberField
                      label={`Applied load in ${forceUnit}`}
                      value={displayForce(p.loadKN, units)}
                      min={0}
                      max={displayForce(50, units)}
                      step={units === "metric" ? 0.1 : 0.05}
                      unit={forceUnit}
                      onChange={(v) =>
                        patch({ loadKN: forceFromDisplay(v ?? 0, units) }, true)
                      }
                    />
                  </div>
                </div>
                {result && result.utilisation > 1 && (
                  <button
                    className="response-note"
                    onClick={() => setShowDetails(true)}
                  >
                    Beyond the first model limit · linear response shown{" "}
                  </button>
                )}
              </>
            )}
            {view === "Setup" && (
              <details className="setup-group" open>
                <summary>Case settings</summary>
                <div>
                  <label className="select-field">
                    Asset ID
                    <input
                      aria-label="Asset ID"
                      maxLength={255}
                      value={p.assetId ?? ""}
                      onChange={(e) => patch({ assetId: e.target.value })}
                    />
                  </label>
                  <div
                    className="result-quantity"
                    role="group"
                    aria-label="Measurement units"
                  >
                    {(["metric", "imperial"] as const).map((u) => (
                      <button
                        key={u}
                        className={units === u ? "selected" : ""}
                        aria-pressed={units === u}
                        onClick={() => setGlobalUnits(u)}
                      >
                        {u === "metric" ? "Metric" : "Imperial"}
                      </button>
                    ))}
                  </div>
                  <label className="select-field">
                    Country
                    <select
                      aria-label="Country"
                      value={p.country ?? "NZ"}
                      onChange={(e) =>
                        setGlobalCountry(e.target.value as CountryCode)
                      }
                    >
                      {Object.values(COUNTRIES).map((c) => (
                        <option value={c.code} key={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="field-note">{country.standards.join(" · ")}</p>
                  <button
                    className="link-button"
                    onClick={() =>
                      patch({
                        embedment: applyEmbedmentHeuristic(
                          p.length,
                          country.code,
                        ),
                        loadHeight: Math.min(
                          loadApplicationHeight(p),
                          p.length -
                            applyEmbedmentHeuristic(p.length, country.code),
                        ),
                      })
                    }
                  >
                    Apply {country.name} embedment starting point
                  </button>
                  <p className="field-note">{country.embedmentRule}</p>
                  <label className="check-row">
                    <input
                      type="checkbox"
                      checked={p.showDetect !== false}
                      onChange={(e) => patch({ showDetect: e.target.checked })}
                    />
                    Show Detect features
                  </label>
                </div>
              </details>
            )}
            {view === "Setup" && (
              <details className="setup-group" open>
                <summary>Pole</summary>
                <div>
                  <MaterialPicker key={p.id} pole={p} onChange={patch} />
                  <label className="select-field">
                    Pole class
                    <select
                      aria-label="Pole class"
                      value={p.poleClass ?? ""}
                      onChange={(e) => applyPoleClass(e.target.value)}
                    >
                      <option value="">Custom dimensions</option>
                      {country.poleClasses
                        .filter((item) => item.speciesIds.includes(p.species))
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                    </select>
                  </label>
                  {p.poleClass ? (
                    <p className="field-note">
                      {
                        country.poleClasses.find(
                          (item) => item.id === p.poleClass,
                        )?.source
                      }
                    </p>
                  ) : (
                    <p className="field-note">
                      {matchPoleClass(
                        country.code,
                        p.species,
                        p.length,
                        resolved.ground,
                      )
                        ? `Geometry meets ${matchPoleClass(country.code, p.species, p.length, resolved.ground)?.label}.`
                        : country.poleClasses.length
                          ? "No supplied class matches the current species and dimensions."
                          : "No verified class table is loaded for this country."}
                    </p>
                  )}
                  <div className="field-grid">
                    <NumberField
                      label="Total length"
                      value={displayPoleLength(p.length, units)}
                      onChange={(v) => {
                        if (v === null) return;
                        const length = poleLengthFromDisplay(v, units),
                          top = length - p.embedment;
                        patch({
                          length,
                          loadHeight: Math.min(loadApplicationHeight(p), top),
                        });
                      }}
                      unit={lengthUnit}
                      min={displayPoleLength(3, units)}
                      max={displayPoleLength(30, units)}
                    />
                    <NumberField
                      label="Embedment"
                      value={displayPoleLength(p.embedment, units)}
                      onChange={(v) => {
                        if (v === null) return;
                        const embedment = poleLengthFromDisplay(v, units);
                        patch({
                          embedment,
                          loadHeight: Math.min(
                            loadApplicationHeight(p),
                            p.length - embedment,
                          ),
                        });
                      }}
                      unit={lengthUnit}
                      min={displayPoleLength(0.4, units)}
                      max={displayPoleLength(p.length - 1, units)}
                    />
                  </div>
                  <div className="derived-line">
                    Above ground{" "}
                    <strong>{formatPoleLength(h, units, 1)}</strong>
                  </div>
                  <label className="select-field">
                    Pole measurements
                    <select
                      aria-label="Pole measurements"
                      value={girthMode}
                      onChange={(e) =>
                        setGirthMode(e.target.value as GirthMode)
                      }
                    >
                      <option value="diameter">Diameters</option>
                      <option value="circumference">Circumferences</option>
                    </select>
                  </label>
                  <div className="group-label">
                    <span>Leave blank to estimate</span>
                  </div>
                  <div className="diameter-fields">
                    {(["tip", "ground", "butt"] as const).map((key) => {
                      const measured = measurementMM(
                          p.diameters[key],
                          girthMode,
                        ),
                        estimate = measurementMM(resolved[key], girthMode)!;
                      return (
                        <NumberField
                          key={key + girthMode + units}
                          label={
                            key === "ground"
                              ? "Groundline"
                              : key === "tip"
                                ? "Tip"
                                : "Butt"
                          }
                          value={
                            measured === null
                              ? null
                              : units === "metric"
                                ? measured
                                : measured / 25.4
                          }
                          onChange={(v) =>
                            change((c) => ({
                              ...c,
                              diameters: {
                                ...c.diameters,
                                [key]: diameterFromMM(
                                  v === null
                                    ? null
                                    : units === "metric"
                                      ? v
                                      : v * 25.4,
                                  girthMode,
                                ),
                              },
                            }))
                          }
                          unit={smallUnit}
                          min={
                            (units === "metric" ? 70 : 70 / 25.4) *
                            (girthMode === "circumference" ? Math.PI : 1)
                          }
                          max={
                            (units === "metric" ? 1200 : 1200 / 25.4) *
                            (girthMode === "circumference" ? Math.PI : 1)
                          }
                          step={units === "metric" ? 5 : 0.25}
                          estimated={(units === "metric"
                            ? estimate
                            : estimate / 25.4
                          ).toFixed(units === "metric" ? 0 : 2)}
                        />
                      );
                    })}
                  </div>
                </div>
              </details>
            )}
            {view === "Setup" && (
              <details className="setup-group" open>
                <summary>Load and break demonstration</summary>
                <div>
                  <NumberField
                    label="Load application offset"
                    value={displayPoleLength(h-loadApplicationHeight(p), units)}
                    onChange={(v) =>
                      v !== null &&
                      patch({ loadHeight: h-poleLengthFromDisplay(v, units) })
                    }
                    unit={lengthUnit}
                    min={0}
                    max={displayPoleLength(h, units)}
                    step={units === "metric" ? 0.05 : 0.1}
                  />
                  <label className="check-row">
                    <input
                      type="checkbox"
                      checked={loadPointLocked}
                      onChange={(e) => setLoadPointLocked(e.target.checked)}
                    />
                    Lock load point slider
                  </label>
                  {!loadPointLocked && (
                    <Slider
                      label="Load application offset"
                      value={displayPoleLength(h-loadApplicationHeight(p), units)}
                      min={0}
                      max={displayPoleLength(h, units)}
                      step={units === "metric" ? 0.05 : 0.1}
                      unit={lengthUnit}
                      onChange={(v) => {
                        patch({ loadHeight: h-poleLengthFromDisplay(v, units) });
                        setLoadPointLocked(true);
                      }}
                    />
                  )}
                  <p className="field-note">
                    Measured down from the pole tip. Zero applies the load at
                    the tip. The slider locks again after one adjustment.
                  </p>
                  <label className="check-row">
                    <input
                      type="checkbox"
                      checked={p.breakEnabled === true}
                      onChange={(e) => patch({ breakEnabled: e.target.checked })}
                    />
                    Show pole break demonstration
                  </label>
                  <NumberField
                    label="Illustrative break trigger"
                    value={p.breakCapacityPercent ?? 200}
                    onChange={(v) =>
                      v !== null && patch({ breakCapacityPercent: v })
                    }
                    unit="% of timber capacity"
                    min={100}
                    max={1000}
                    step={10}
                  />
                  <div className="field-grid">
                    <NumberField
                      label="Actual break height"
                      value={
                        p.actualBreakHeight === null ||
                        p.actualBreakHeight === undefined
                          ? null
                          : displayPoleLength(p.actualBreakHeight, units)
                      }
                      onChange={(v) =>
                        patch({
                          actualBreakHeight:
                            v === null ? null : poleLengthFromDisplay(v, units),
                        })
                      }
                      unit={lengthUnit}
                      min={0}
                      max={displayPoleLength(h, units)}
                    />
                    <NumberField
                      label="Actual break force"
                      value={
                        p.actualBreakForceKN === null ||
                        p.actualBreakForceKN === undefined
                          ? null
                          : displayForce(p.actualBreakForceKN, units)
                      }
                      onChange={(v) =>
                        patch({
                          actualBreakForceKN:
                            v === null ? null : forceFromDisplay(v, units),
                        })
                      }
                      unit={forceUnit}
                      min={0}
                      max={displayForce(500, units)}
                    />
                  </div>
                  <p className="field-note">
                    Recorded height and force override the illustrative trigger.
                    This visualization is not a fracture prediction.
                  </p>
                </div>
              </details>
            )}
            {view === "Setup" && (
              <details className="setup-group" open>
                <summary>Ground</summary>
                <div>
                  <p className="panel-copy">
                    Ground restraint changes how the pole moves and where it is
                    most demanded.
                  </p>
                  <div className="soil-options">
                    {(["Soft", "Medium", "Hard"] as const).map((s, i) => (
                      <button
                        key={s}
                        className={p.soil === s ? "selected" : ""}
                        onClick={() => patch({ soil: s })}
                      >
                        <span>
                          <strong>{s}</strong>
                          <small>
                            {i === 0
                              ? "More movement"
                              : i === 1
                                ? "Balanced restraint"
                                : "Less movement"}
                          </small>
                        </span>
                      </button>
                    ))}
                  </div>
                  <label className="check-row">
                    <input
                      type="checkbox"
                      checked={showSoil}
                      onChange={(e) => setShowSoil(e.target.checked)}
                    />
                    Show grass and soil
                  </label>
                  <label className="check-row">
                    <input
                      type="checkbox"
                      checked={p.soilResponse === "yielding"}
                      disabled={p.soil === "Fixed"}
                      onChange={(e) =>
                        patch({
                          soilResponse: e.target.checked
                            ? "yielding"
                            : "elastic",
                        })
                      }
                    />
                    Allow ground yielding
                  </label>
                  <p className="field-note">
                    Representative spring response, not a site-specific soil
                    assessment.
                  </p>
                  {yielding(p) && (
                    <div className="soil-history">
                      <p>
                        Successful load changes are remembered. Geometry or soil
                        edits start a new ground history.
                      </p>
                      <button onClick={() => patch({ loadKN: 0 }, true)}>
                        Unload pole
                      </button>
                      <button
                        onClick={() => {
                          history.current.push(structuredClone(cases));
                          setCases(
                            cases.map((q, i) =>
                              i === active
                                ? { ...q, loadKN: 0, soilHistory: [] }
                                : q,
                            ),
                          );
                        }}
                      >
                        Reset ground history
                      </button>
                      <p>
                        {p.soilHistory?.length ?? 0} recorded load points ·
                        worst-direction foundation envelopes are unavailable.
                      </p>
                      {result?.nonlinear && (
                        <p>
                          Plastic slip:{" "}
                          {(result.nonlinear.plasticSlip * 1000).toFixed(2)}{" "}
                          {smallUnit} · {result.nonlinear.plasticDepths.length}{" "}
                          yielded integration points.
                        </p>
                      )}
                    </div>
                  )}
                  <details className="advanced">
                    <summary>Reference option</summary>
                    <label className="check-row">
                      <input
                        type="checkbox"
                        checked={p.soil === "Fixed"}
                        onChange={(e) =>
                          patch({ soil: e.target.checked ? "Fixed" : "Medium" })
                        }
                      />
                      Ideal fixed groundline
                    </label>
                  </details>
                </div>
              </details>
            )}
            {view === "Test" && (
              <div className="test-controls">
                <DetectApps
                  key={p.id}
                  pole={p}
                  z={effectiveSection}
                  onControl={controlWaves}
                  onHeight={setSection}
                />
                <h3>Position the UB1000 probes</h3>
                <p>
                  Drag either device up or down the pole. Turn the pair by
                  dragging a device around the section.
                </p>
                <NumberField
                  label="Detection height"
                  value={displayPoleLength(effectiveSection, units)}
                  unit={lengthUnit}
                  min={displayPoleLength(-p.embedment, units)}
                  max={displayPoleLength(h, units)}
                  step={units === "metric" ? 0.05 : 0.1}
                  onChange={(v) =>
                    v !== null && setSection(poleLengthFromDisplay(v, units))
                  }
                />
                <Slider
                  label="Pair orientation"
                  value={testBearing}
                  min={0}
                  max={359}
                  unit="°"
                  onChange={setTestBearing}
                />
                <button className="test-focus" onClick={() => camera("detail")}>
                  Focus on devices
                </button>
                <p className="field-note">
                  Opposed pair · {formatSmallLength(PROBE_LENGTH, units)} long ×{" "}
                  {formatSmallLength(PROBE_DIAMETER, units)} diameter each. Negative height is
                  for an excavated or unembedded pole.
                </p>
                <details className="test-reference">
                  <summary>UB1000 reference photo</summary>
                  <img
                    src="https://innerviewinsights.com/wp-content/uploads/2026/04/IMG_7231.jpg"
                    alt="Orange UB1000 probe against a timber pole"
                  />
                  <a
                    href="https://innerviewinsights.com/solutions/ub1000-asset-inspection-technology/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    InnerView Insights · photo courtesy of PowerNet
                  </a>
                </details>
              </div>
            )}
            {view === "Innerview" && (
              <DefectEditor
                units={units}
                pole={p}
                selected={selected}
                onSelect={(r) => {
                  setSelected(r.id);
                  setSection((r.zMin + r.zMax) / 2);
                }}
                onAdd={addPreset}
                onEdit={updateRegion}
                onRemove={(id) =>
                  change((c) => ({
                    ...c,
                    regions: c.regions.filter((r) => r.id !== id),
                  }))
                }
                onFocus={() => camera("detail")}
              />
            )}
          </div>
          <div className="control-footer">
            <button
              onClick={() => {
                const prev = history.current.pop();
                if (prev) setCases(prev);
                else setNotice("Nothing to undo yet.");
              }}
            >
              Undo
            </button>
            <button
              onClick={() => {
                history.current.push(structuredClone(cases));
                setCases([standardExample("A"), standardExample("B")]);
                setSections([0.3, 0.3]);
                setNotice("Restored the sound pole examples.");
              }}
            >
              Reset poles
            </button>
          </div>
        </aside>
        <section className={`scene-panel ${compare ? "comparing" : ""}`}>
          <div className={`scene-grid ${compare ? "two-poles" : ""}`}>
            {(compare ? cases : [p]).map((c, i) => {
              const r = analysis.jobs[compare ? i : 0]?.result ?? null;
              return (
                <div
                  className={`model-viewport ${compare && active === i ? "active-model" : ""}`}
                  key={c.id}
                >
                  {compare && (
                    <button
                      className="model-badge"
                      onClick={() => setActive(i)}
                    >
                      Pole {c.id}
                      {active === i && <small>Editing</small>}
                    </button>
                  )}
                  <PoleScene
                    units={units}
                    breakState={resolveBreakState(c, r)}
                    testBearing={
                      view === "Test"
                        ? testBearings[compare ? i : active]
                        : undefined
                    }
                    profilePole={c}
                    utilisationMax={utilisationMax}
                    selected={selected}
                    onDefectSelect={(id) => {
                      setActive(compare ? i : active);
                      setSelected(id);
                      const defect = c.regions.find((d) => d.id === id);
                      if (defect)
                        setSections((ss) =>
                          ss.map((v, k) =>
                            linkedSection || k === (compare ? i : active)
                              ? (defect.zMin + defect.zMax) / 2
                              : v,
                          ),
                        );
                    }}
                    onDefectMove={(id, z) => {
                      const index = compare ? i : active;
                      setCases((previous) => {
                        const next = previous.map((q, k) =>
                          k === index
                            ? {
                                ...q,
                                regions: q.regions.map((d) =>
                                  d.id === id
                                    ? { ...d, ...moveDefectHeight(q, d, z) }
                                    : d,
                                ),
                              }
                            : q,
                        );
                        const errors = next.flatMap(validateCase);
                        if (errors.length) {
                          setNotice(errors[0]);
                          return previous;
                        }
                        history.current.push(structuredClone(previous));
                        return next.map((q, k) =>
                          resetHistoryOnGeometry(previous[k], q),
                        );
                      });
                      setSections((ss) =>
                        ss.map((v, k) =>
                          linkedSection || k === index ? z : v,
                        ),
                      );
                    }}
                    chartMetric={chartMetric}
                    chartScale={sharedChartScale}
                    onProfile={(rows) =>
                      setChartRows((old) =>
                        old[c.id] === rows ? old : { ...old, [c.id]: rows },
                      )
                    }
                    comparison={compare}
                    reveal={reveal}
                    pole={shownCases[compare ? i : 0]}
                    result={r}
                    solid={solidAnalysis.jobs[compare ? i : 0]?.result ?? null}
                    view={renderView}
                    section={clamp(
                      compare ? sections[i] : section,
                      -c.embedment,
                      c.length - c.embedment,
                    )}
                    stressDisplay={stressDisplay}
                    soil={showSoil}
                    scale={scale}
                    cameraCommand={cameraCommand}
                    onSection={(z) =>
                      setSections((ss) =>
                        ss.map((v, k) =>
                          linkedSection || k === (compare ? i : active)
                            ? clamp(
                                z,
                                -cases[k].embedment,
                                cases[k].length - cases[k].embedment,
                              )
                            : v,
                        ),
                      )
                    }
                    onSectionPreview={(z) => {
                      if (linkedSection || (compare ? i : active) === active)
                        sectionPreview.current?.preview(z);
                    }}
                    onForce={(b, loadKN) => {
                      setResultDirection("specified");
                      setCases((cs) => {
                        const next = cs.map((q, k) =>
                          k === (compare ? i : active) ||
                          (compare && linkedLoad)
                            ? { ...q, bearing: b, loadKN }
                            : q,
                        );
                        if (
                          next.every(
                            (q, k) =>
                              q.bearing === cs[k].bearing &&
                              q.loadKN === cs[k].loadKN,
                          )
                        )
                          return cs;
                        history.current.push(structuredClone(cs));
                        if (history.current.length > 30)
                          history.current.shift();
                        return next;
                      });
                    }}
                    linkedPose={linkedCamera ? pose : null}
                    onPose={linkedCamera ? setPose : undefined}
                  />
                </div>
              );
            })}
          </div>
          <div className="scene-tools">
            <div>
              <TextButton
                label="Frame whole pole"
                onClick={() => camera("whole")}
              />
              <TextButton
                label="Focus on section"
                onClick={() => camera("detail")}
              />
              <TextButton
                label="Front elevation"
                onClick={() => camera("front")}
              />
              <TextButton label="Plan view" onClick={() => camera("top")} />
            </div>
            <span>Left drag: pan · right drag: rotate · scroll: zoom</span>
            {compare && (
              <TextButton
                label="Link comparison cameras"
                active={linkedCamera}
                onClick={() => setLinkedCamera(!linkedCamera)}
              />
            )}
          </div>
          {currentLesson && (
            <div className="lesson-player">
              <div className="lesson-kicker">
                GUIDED EXPLORATION <span>{step + 1} / 4</span>
                <button
                  aria-label="Close lesson and restore case"
                  onClick={() => leaveLesson(true)}
                >
                  Close
                </button>
              </div>
              <h3>{currentLesson.steps[step].title}</h3>
              <p>{currentLesson.steps[step].text}</p>
              {lesson !== null && lesson >= 2 && step === 0 && (
                <figure className="instrument-photo">
                  <img
                    src="https://innerviewinsights.com/wp-content/uploads/2026/04/IMG_7231.jpg"
                    alt="UB1000 probes used for pole inspection"
                    onError={(e) => {
                      e.currentTarget.closest("figure")!.hidden = true;
                    }}
                  />
                  <figcaption>
                    <a
                      href="https://innerviewinsights.com/solutions/ub1000-asset-inspection-technology/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      UB1000 inspection · InnerView Insights / PowerNet
                    </a>
                  </figcaption>
                </figure>
              )}
              <div className="lesson-actions">
                <TextButton
                  label="Previous lesson step"
                  onClick={() => moveLesson(step - 1)}
                />
                <button
                  className="play-button"
                  onClick={() => {
                    if (step === 3) moveLesson(0);
                    setPlaying(!playing);
                  }}
                >
                  {" "}
                  {playing ? "Pause" : "Play"}
                </button>
                <TextButton
                  label="Next lesson step"
                  onClick={() => moveLesson(step + 1)}
                />
                <div className="lesson-dots">
                  {[0, 1, 2, 3].map((s) => (
                    <button
                      aria-label={`Lesson step ${s + 1}`}
                      className={s === step ? "active" : ""}
                      key={s}
                      onClick={() => {
                        setPlaying(false);
                        moveLesson(s);
                      }}
                    >
                      {s + 1}
                    </button>
                  ))}
                </div>
                <button
                  className="link-button"
                  onClick={() => leaveLesson(false)}
                >
                  Explore this moment{" "}
                </button>
              </div>
            </div>
          )}
        </section>
        <aside className="section-panel">
          {view === "Test" ? null : (
            <div className="result-controls">
              <div
                className="result-quantity"
                role="group"
                aria-label="Result quantity"
              >
                {(["stress", "utilisation", "capacity"] as const).map((q) => (
                  <button
                    key={q}
                    aria-pressed={quantity === q}
                    className={quantity === q ? "selected" : ""}
                    onClick={() => {
                      setQuantity(q);
                      setView("Stresses");
                    }}
                  >
                    {q === "stress"
                      ? "Stress"
                      : q === "utilisation"
                        ? "Utilisation"
                        : `Capacity (${forceUnit})`}
                  </button>
                ))}
              </div>
              {quantity === "stress" && view === "Stresses" && (
                <label className="select-field stress-component">
                  Stress component
                  <select
                    aria-label="Stress component"
                    value={stressComponent}
                    onChange={(e) => {
                      setStressComponent(
                        e.target.value as typeof stressComponent,
                      );
                      if (e.target.value !== "stress") setSolidEnabled(true);
                    }}
                  >
                    <option value="stress">Pole axis</option>
                    <option value="longitudinal">Along fibre · local 3D</option>
                    <option value="transverse">Across fibre · local 3D</option>
                    <option value="shear">Fibre shear · local 3D</option>
                  </select>
                </label>
              )}
              <label className="select-field result-direction">
                Show results for
                <select
                  aria-label="Show results for"
                  value={resultDirection}
                  onChange={(e) =>
                    setResultDirection(e.target.value as "specified" | "worst")
                  }
                >
                  <option value="specified">Specified load direction</option>
                  <option value="worst" disabled={yielding(p)}>
                    Load applied in worst direction
                  </option>
                </select>
              </label>
              {stressComponent !== "stress" && quantity === "stress" && (
                <p className="field-note">
                  Selected component uses the local solid field. Grey means
                  unassessed. The height curve remains pole-axis beam stress;
                  worst direction refers to that beam quantity.
                </p>
              )}
              <div className="selected-result">
                <strong>
                  {profileLabel(
                    chartRows[p.id] ?? [],
                    chartMetric,
                    effectiveSection,
                    units,
                  )}
                </strong>
                <span>
                  {quantity === "stress" ? "Beam peak |stress| at" : "at"}{" "}
                  {formatPoleLength(effectiveSection, units)}
                </span>
              </div>
              {resultDirection === "worst" && (
                <p className="field-note direction-basis">
                  {awaitingDirection
                    ? "Finding the worst direction…"
                    : `Field at ${shownPole.bearing.toFixed(1)}° · worst beam direction at this section. The height curve uses the worst direction at each height.`}
                </p>
              )}
              {quantity === "capacity" && view === "Stresses" && (
                <p className="field-note">
                  Curve: section capacity. Pole and section colours: utilisation
                  at the current load.
                </p>
              )}
            </div>
          )}
          {view === "Test" ? (
            <DetectSection
              units={units}
              control={waveControl}
              ref={sectionPreview}
              result={analysis.pending ? null : result}
              pole={p}
              z={effectiveSection}
              bearing={testBearing}
              onBearing={setTestBearing}
              onHeight={setSection}
            />
          ) : (
            <SectionView
              units={units}
              utilisationMax={utilisationMax}
              onHeight={setSection}
              selected={selected}
              onAdd={(r) => {
                change((c) => ({ ...c, regions: [...c.regions, r] }));
                setSelected(r.id);
                setTab("decay");
                setView("Innerview");
              }}
              onEdit={updateRegion}
              onSelect={setSelected}
              onMessage={setNotice}
              ref={sectionPreview}
              solid={solidField}
              stressDisplay={stressDisplay}
              pole={shownPole}
              z={effectiveSection}
              view={renderView}
              result={result}
              scan={lesson === 2 && step > 0}
            />
          )}
          <div className="section-shortcuts">
            <button onClick={() => setSection(0)}>Groundline</button>
            <button
              disabled={!result}
              onClick={() => setSection(result!.timberZ)}
            >
              Critical section
            </button>
          </div>
          {result?.nonlinear && (
            <div className="soil-history">
              <strong>Ground yielding · history applied</strong>
              <p>
                {result.nonlinear.plasticDepths.length
                  ? `Yielded ground extends from ${formatPoleLength(Math.min(...result.nonlinear.plasticDepths),units)} to ${formatPoleLength(Math.max(...result.nonlinear.plasticDepths),units)}.`
                  : "Ground remains elastic in this history."}
              </p>
              <p>
                Timber utilisation: {(result.utilisation * 100).toFixed(1)}%.{" "}
                {p.loadKN === 0
                  ? `Residual tip movement: ${formatSmallLength(result.tipMovement,units,units==='metric'?1:3)}.`
                  : ""}
              </p>
              <p>
                Capacity curves and limit loads are elastic reference values.
                Applied stress maps use the nonlinear ground solution.
              </p>
            </div>
          )}
          {view === "Stresses" && solidField && (
            <SolidAssessment
              field={solidField}
              load={p.loadKN}
              onHeight={setSection}
            />
          )}
          {view === "Stresses" && (
            <div className="solid-controls">
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={reveal}
                  onChange={(e) => setReveal(e.target.checked)}
                />
                Reveal interior
              </label>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={solidEnabled}
                  onChange={(e) => setSolidEnabled(e.target.checked)}
                />
                Resolve defect in 3D
              </label>
              {solidEnabled && (
                <>
                  <label className="select-field">
                    Detail
                    <select
                      aria-label="Solid mesh detail"
                      value={solidResolution}
                      onChange={(e) => setSolidResolution(e.target.value)}
                    >
                      <option value="coarse">Initial mesh</option>
                      <option value="medium">Refined mesh · slower</option>
                    </select>
                  </label>
                  <p className="field-note" role="status">
                    {solidAnalysis.pending
                      ? "Solving the local solid model… You can keep moving the camera."
                      : (solidJob?.error ??
                        (solidField
                          ? "Local 3D preview · mesh/boundary qualification incomplete."
                          : "Detailed result unavailable."))}
                  </p>
                  {solidField && (
                    <p className="field-note">
                      {inLocalZone(p, solidField, effectiveSection)
                        ? "This section uses local 3D stresses."
                        : stressDisplay === "stress" ||
                            stressDisplay === "utilisation"
                          ? "This section uses beam stresses."
                          : "The selected component is unassessed outside the local zone."}{" "}
                      {solidField.patch
                        ? "Local bore stresses are shown inside the surrounding timber patch; other points have no local solid assessment."
                        : "The two rings mark the 3D display zone."}{" "}
                      Capacity figures remain beam estimates.{" "}
                      {p.material.basis !== "illustrative" &&
                        "Local solid utilisation is unassessed: this material provides a pole bending reference, not direct fibre strengths."}{" "}
                      {p.regions.some((r) => r.zMin < 0) &&
                        "Only the above-ground portion is resolved locally."}
                    </p>
                  )}
                  {solidJob?.error && (
                    <button className="link-button" onClick={addSolidExample}>
                      Try an enclosed hollow
                    </button>
                  )}
                </>
              )}
            </div>
          )}
          {view === "Stresses" && (
            <>
              <div
                className={`stress-legend ${stressDisplay === "utilisation" ? "utilisation-legend" : stressDisplay === "shear" ? "shear-legend" : ""}`}
              >
                {stressDisplay !== "utilisation" && <div />}
                {stressDisplay !== "utilisation" ? (
                  <>
                    <span>
                      <b>{stressDisplay === "shear" ? "0 MPa" : "−35 MPa"}</b>
                      {stressDisplay === "shear"
                        ? "Shear magnitude"
                        : "Compression · Tension"}
                      <b>+35 MPa</b>
                    </span>
                    <small>
                      {stressComponent === "stress"
                        ? solidField
                          ? "Signed pole-axis stress · local 3D / beam"
                          : "Signed pole-axis stress · beam FE"
                        : stressComponent === "shear"
                          ? "Fibre shear magnitude · local 3D"
                          : `Signed ${stressComponent === "longitudinal" ? "along-fibre" : "across-fibre principal"} stress · local 3D`}
                    </small>
                  </>
                ) : (
                  <>
                    <div className="palette-key">
                      {[0, 0.4, 0.6, 0.8, 1, utilisationMax].map((value, i) => (
                        <span key={i}>
                          <i
                            style={{
                              background: `rgb(${utilisationColour(value, utilisationMax).join(",")})`,
                            }}
                          />
                          {i === 5 && peakUsage <= 1
                            ? "150%+"
                            : `${Number((value * 100).toFixed(1))}%`}
                        </span>
                      ))}
                    </div>
                    <small>
                      Longitudinal demand / strength · hollow = no material
                    </small>
                  </>
                )}
              </div>
            </>
          )}
          <div className="results-card">
            <div className="results-heading">
              <span className="eyebrow">
                {solidEnabled ? "BEAM RESPONSE" : "MODEL RESPONSE"}
              </span>
              <span className={analysis.pending ? "status pending" : "status"}>
                {analysis.pending
                  ? "Updating"
                  : job?.error
                    ? "Unavailable"
                    : "Illustrative"}
              </span>
            </div>
            {p.material.basis === "pole-reference" && (
              <p className="field-note">
                {p.material.round
                  ? "Capacity basis: modified characteristic bending strength; not a mean breaking load."
                  : p.species === "southern-pine" ||
                      p.material.referenceId?.startsWith("ansi-")
                    ? "Capacity basis: mean groundline bending strength; height adjustment not applied."
                    : "Capacity basis: supplier pole reference."}
              </p>
            )}
            {job?.error ? (
              <p className="error-copy">{job.error}</p>
            ) : (
              <>
                <div className="primary-result">
                  <span>
                    {result
                      ? displayForce(result.limitKN, units).toFixed(
                          units === "metric" ? 2 : 0,
                        )
                      : "—"}
                    <small> {forceUnit}</small>
                  </span>
                  <p>
                    {yielding(p)
                      ? "Elastic limit reference"
                      : "First model limit"}
                    <button
                      onClick={() => setShowDetails(true)}
                      aria-label="About the first model limit"
                    >
                      Details
                    </button>
                  </p>
                </div>
                <p className="governing-explanation">
                  {!result
                    ? "Calculating the governing response…"
                    : result.nonlinear
                      ? "Current movement and stresses include ground yielding. The load above is an elastic first-limit reference, not the nonlinear failure load."
                      : result.governing === "Soil response limit"
                        ? "Ground restraint reaches its model limit first. Timber capacity is shown separately below."
                        : "Timber bending reaches its model limit first. Inspect the critical timber section to see why."}
                </p>
                <div className="usage-track">
                  <i
                    style={{
                      width: `${Math.min(100, (result?.utilisation ?? 0) * 100)}%`,
                    }}
                  />
                </div>
                <div className="usage-caption">
                  <span>
                    {result?.nonlinear
                      ? "Current timber demand"
                      : "Current demand"}
                  </span>
                  <strong>
                    {result ? `${Math.round(result.utilisation * 100)}%` : "—"}
                  </strong>
                </div>
                <dl>
                  <div>
                    <dt>
                      {result?.nonlinear
                        ? "Assessed timber mechanism"
                        : "Governing mechanism"}
                    </dt>
                    <dd>{result?.governing ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>
                      {result?.nonlinear
                        ? "Peak timber demand height"
                        : "Height at limit"}
                    </dt>
                    <dd>
                      {result
                        ? formatPoleLength(result.governingZ, units)
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt>
                      {yielding(p)
                        ? "Elastic soil-yield reference"
                        : "Soil response limit"}
                    </dt>
                    <dd>
                      {!result
                        ? "—"
                        : result.soilLimitKN
                          ? formatForce(
                              result.soilLimitKN,
                              units,
                              units === "metric" ? 2 : 0,
                            )
                          : "Fixed restraint"}
                    </dd>
                  </div>
                  <div>
                    <dt>
                      {yielding(p)
                        ? "Elastic timber reference"
                        : "Timber bending limit"}
                    </dt>
                    <dd>
                      {result
                        ? formatForce(
                            result.timberLimitKN,
                            units,
                            units === "metric" ? 2 : 0,
                          )
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt>Section wood remaining</dt>
                    <dd>
                      {result
                        ? `${Math.round(stationAt(result, effectiveSection).remaining * 100)}%`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt>
                      {solidEnabled
                        ? "Beam section utilisation"
                        : "Section peak utilisation"}
                    </dt>
                    <dd>
                      {result
                        ? `${Math.round(stationAt(result, effectiveSection).usage * 100)}%`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt>Tip movement</dt>
                    <dd>
                      {result
                        ? formatSmallLength(result.tipMovement, units)
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt>
                      {solidEnabled
                        ? "Beam peak bending stress"
                        : "Peak bending stress"}
                    </dt>
                    <dd>
                      {result
                        ? `${displayStress(meanStress, units).toFixed(1)} ${stressUnit}`
                        : "—"}
                    </dd>
                  </div>
                </dl>
                {compare && (
                  <div className="comparison-result">
                    {cases.map((c, i) => (
                      <span key={c.id}>
                        <b>{c.id}</b>
                        {analysis.jobs[i]?.result
                          ? formatForce(
                              analysis.jobs[i].result!.limitKN,
                              units,
                              units === "metric" ? 2 : 0,
                            )
                          : "—"}
                      </span>
                    ))}
                    {analysis.jobs[0]?.result && analysis.jobs[1]?.result && (
                      <p className="comparison-delta">
                        B versus A: timber{" "}
                        {(
                          (analysis.jobs[1].result!.timberLimitKN /
                            analysis.jobs[0].result!.timberLimitKN -
                            1) *
                          100
                        ).toFixed(1)}
                        % · tip movement{" "}
                        {formatSmallLength(
                          analysis.jobs[1].result!.tipMovement -
                            analysis.jobs[0].result!.tipMovement,
                          units,
                        )}
                      </p>
                    )}
                  </div>
                )}
                <button
                  className="link-button"
                  onClick={() => setShowDetails(true)}
                >
                  Model basis & limitations{" "}
                </button>
              </>
            )}
          </div>
          <footer className="app-footer">
            <span>P27 DEV · P26 base · Local review</span>
            <button onClick={() => setShowDetails(true)}>
              About this model{" "}
            </button>
          </footer>{" "}
        </aside>
      </main>
      <footer className="company-footer">
        <span>Copyright InnerView Insights Limited {new Date().getFullYear()}</span>
        <a href={`${companyUrl}&utm_content=footer_logo`} aria-label="Visit InnerView Insights">
          <img
            src={`${import.meta.env.BASE_URL}innerview-insights-logo.png`}
            alt="InnerView Insights"
            width="56"
            height="23"
          />
        </a>
      </footer>
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            Dismiss
          </button>
        </div>
      )}
      {showLessons && (
        <VideoLibrary
          showDetect={p.showDetect !== false}
          onClose={() => setShowLessons(false)}
        />
      )}
      {showDetails && (
        <div className="modal-backdrop" onClick={() => setShowDetails(false)}>
          <section
            className="modal details-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Model basis and limitations"
            onClick={(e) => e.stopPropagation()}
          >
            <TextButton
              label="Close model details"
              onClick={() => setShowDetails(false)}
            />
            <span className="eyebrow">UNDERSTAND THE RESULT</span>
            <h2>A model with a stated scope.</h2>
            <p>
              The geometry and loads drive a tapered beam finite-element
              calculation. Section integration accounts for eccentric
              deterioration; distributed soil springs support the buried length.
            </p>
            <h3>What the number means</h3>
            <p>
              “First model limit” is the lower of the illustrative timber
              bending limit and the soil spring response envelope. It is not an
              ultimate break load, a factored design capacity or an instruction
              to climb.
            </p>
            <dl>
              <div>
                <dt>Timber</dt>
                <dd>
                  {speciesById(p.species)?.name}:{" "}
                  {materialDescription(p.material)}.{" "}
                  {p.material.source ?? "No specified pole grade."}
                </dd>
              </div>
              <div>
                <dt>Decay</dt>
                <dd>
                  Prescribed regions reduce stiffness and strength by separate
                  illustrative laws. No measured signal-to-strength calibration.
                </dd>
              </div>
              <div>
                <dt>Soil</dt>
                <dd>
                  Soft / Medium / Hard use representative stiffness and
                  resistance. Optional ground yielding adds plastic slip and
                  loading history; these are not measured ground conditions.
                </dd>
              </div>
              <div>
                <dt>Solver</dt>
                <dd>
                  {result
                    ? `${result.nodes} nodes · ${result.elapsedMs.toFixed(0)} ms · residual ${result.balance.toExponential(1)}`
                    : "Calculation pending"}{" "}
                  · small-deflection beam bending.
                </dd>
              </div>
            </dl>
            <h3>Detailed stress preview</h3>
            {solidField && (
              <p>
                {solidField.nodes.toLocaleString()} nodes ·{" "}
                {solidField.elements.toLocaleString()} quadratic tetrahedra ·{" "}
                {(solidField.elapsedMs / 1000).toFixed(2)} s · residual{" "}
                {solidField.residual.toExponential(1)}. Elastic ratios:
                transverse E / longitudinal E = 0.10, longitudinal shear G / E =
                0.065; Poisson ratios 0.30 and 0.35. These are illustrative
                assumptions, not calibrated species-specific data.
              </p>
            )}
            <p>
              The local 3D preview supports enclosed rounded hollows, spatially
              graded heart/shell decay, prescribed knot fibre directions, and a
              single blind drill bore. Decay and knot material properties are
              integrated at the FE quadrature points. Drilling uses a
              body-fitted local patch with beam displacements on its remote cuts
              and free bore walls. The material model is illustrative. Mesh and
              boundary sensitivity remain under review; flat bore-end edges are
              singular. Select pole-axis, along-fibre, across-fibre or
              fibre-shear stresses. Normal-stress screening uses illustrative
              reference strengths; shear capacity remains unassessed. No local
              stress or stiffness is added to the beam, and local fields do not
              set capacity.
            </p>
            <h3>Still to be developed</h3>
            <p>
              Qualified solid stresses and capacity, validated knot response,
              splitting, thin-wall buckling, nonlinear timber failure,
              calibrated soil response and physical calibration.
              {p.showDetect !== false &&
                " Actual instrument inference and official Safe to Climb decisions remain undeveloped."}{" "}
              Hand-sketched
              synthetic pockets are available. Photo registration remains
              reserved; a single section photo cannot establish the full decay
              length.
            </p>
            {result?.warnings.map((w) => (
              <p className="detail-warning" key={w}>
                {w}
              </p>
            ))}
            <h3>Measurement provenance</h3>
            <p>
              All current defect regions are synthetic sandbox inputs. Future
              registered contours will retain scale, position, orientation,
              source and uncertainty. Unsupported measured-contour imports are
              rejected rather than silently approximated. Sketches have an
              explicitly assumed constant extrusion, editable length and
              placement.
            </p>
            <button className="primary-button" onClick={save}>
              Save inputs and result basis
            </button>
            <div className="model-company-logo">
              <a href={`${companyUrl}&utm_content=about_model_logo`} aria-label="Visit InnerView Insights">
              <img
                src={`${import.meta.env.BASE_URL}innerview-insights-logo.png`}
                alt="InnerView Insights"
                width="160"
                height="66"
              />
              </a>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
