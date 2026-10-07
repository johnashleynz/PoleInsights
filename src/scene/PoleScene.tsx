import { cavityGeometry } from "./cavityGeometry.ts";
import { makeProbePair, placeProbePair } from "./inspectionProbes.ts";
import { useProfile } from "../workers/useProfile.ts";
import { paintHeightChart, chartLeft, profileLabel } from "./heightChart.ts";
import type { ProfileMetric, ProfileRow } from "../analysis/heightProfile.ts";
import type { SolidField } from "../analysis/solid/field.ts";
import { displayedStress } from "../analysis/solid/field.ts";
import { useEffect, useRef, useState } from "react";
import * as T from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { PoleCase, ViewMode, StressDisplay } from "../domain/model.ts";
import {
  conditionAt,
  defectDistance,
  diameterAt,
  exteriorRadiusAt,
  regionScale,
  loadApplicationHeight,
} from "../domain/model.ts";
import type { AnalysisResult } from "../analysis/beam.ts";
import { stationAt, stressAt, utilisationAt } from "../analysis/beam.ts";
import {
  poleTopTexture,
  stressColour,
  utilisationColour,
  woodTexture,
  imageTexture,
} from "./materials.ts";
import { groundPatch } from "./ground.ts";
import { drillingScenePlacement } from "./drillingGeometry.ts";
import {displayForce,formatPoleLength,unitLabels,type UnitSystem} from '../domain/units.ts';
export const arrowLength = (load: number) =>
  0.35 + 0.6 * Math.sqrt(Math.max(0, load));
function resizeArrow(arrow: T.Object3D, len: number) {
  const head = Math.min(0.24, len * 0.28),
    shaft = arrow.getObjectByName("arrow-shaft"),
    pick = arrow.getObjectByName("arrow-shaft-pick"),
    cone = arrow.getObjectByName("arrow-head");
  if (shaft) {
    shaft.scale.y = len - head;
    shaft.position.y = (len - head) / 2;
  }
  if (pick) {
    pick.scale.y = len;
    pick.position.y = len / 2;
  }
  if (cone) {
    cone.scale.setScalar(head);
    cone.position.y = len - head / 2;
  }
}

export interface SceneProps {
  showRecordedReadings?: boolean;
  units?: UnitSystem;
  capture?: boolean;
  testBearing?: number;
  profilePole?: PoleCase;
  utilisationMax?: number;
  selected?: string | null;
  breakState?: {
    active: boolean;
    heightM: number;
    basis: "observed" | "illustrative";
  } | null;
  onDefectSelect: (id: string) => void;
  onDefectMove: (id: string, height: number) => void;
  chartMetric: ProfileMetric;
  chartScale?: number;
  onProfile: (rows: ProfileRow[]) => void;
  pole: PoleCase;
  result: AnalysisResult | null;
  solid?: SolidField | null;
  view: ViewMode;
  section: number;
  reveal?: boolean;
  comparison?: boolean;
  stressDisplay: StressDisplay;
  soil: boolean;
  scale: number;
  cameraCommand: { mode: string; seq: number; animate?: boolean };
  onSection: (z: number) => void;
  onSectionPreview?: (z: number | null) => void;
  onForce: (bearing: number, loadKN: number) => void;
  onReady?: (text: string) => void;
  linkedPose?: { position: number[]; target: number[]; source: string } | null;
  onPose?: (pose: {
    position: number[];
    target: number[];
    source: string;
  }) => void;
}
interface SceneState {
  scene: T.Scene;
  camera: T.PerspectiveCamera;
  renderer: T.WebGLRenderer;
  controls: OrbitControls;
  model: T.Group;
  render: () => void;
  disposeModel: () => void;
}
function disposeGroup(group: T.Group) {
  group.traverse((o) => {
    if (o instanceof T.Mesh || o instanceof T.Line) {
      o.geometry.dispose();
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => {
        for (const value of Object.values(m))
          if (value instanceof T.Texture) value.dispose();
        m.dispose();
      });
    }
  });
  group.clear();
}
function tubeGeometry(
  p: PoleCase,
  result: AnalysisResult | null,
  scale: number,
  top: number,
  kind: "pole" | "region",
  regionIndex = 0,
  view: ViewMode = "Setup",
  display: StressDisplay = "stress",
  clip?: { start: number; end: number },
) {
  const region = p.regions[regionIndex],
    start =
      clip?.start ??
      (kind === "pole" ? -p.embedment : Math.max(-p.embedment, region.zMin)),
    end = clip?.end ?? (kind === "pole" ? top : Math.min(top, region.zMax)),
    baseRows = kind === "pole" ? 100 : 32,
    cols =
      kind === "pole"
        ? 128
        : region.shape.type === "sketch"
          ? region.shape.outline.length
          : 64,
    positions: number[] = [],
    uv: number[] = [],
    colours: number[] = [],
    indices: number[] = [];
  const axial = Array.from(
    { length: baseRows + 1 },
    (_, j) => start + ((end - start) * j) / baseRows,
  );
  for (const s of p.diameterStations ?? []) if (s.heightM > start && s.heightM < end) axial.push(s.heightM);
  if (kind === "pole")
    for (const r of p.regions)
      if (
        r.kind === "void" ||
        r.kind === "drilling" ||
        r.kind === "chipping"
      )
        for (let j = 0; j <= 80; j++)
          axial.push(
            Math.max(
              start,
              Math.min(
                end,
                r.zMin +
                  ((r.zMax - r.zMin) * (1 - Math.cos((Math.PI * j) / 80))) / 2,
              ),
            ),
          );
  const heights = [...new Set(axial)].sort((a, b) => a - b),
    rows = heights.length - 1;
  for (let j = 0; j <= rows; j++) {
    const z = heights[j],
      s = result ? stationAt(result, z) : null,
      nominalRadius = diameterAt(p, z) / 2;
    for (let k = 0; k <= cols; k++) {
      const a = (k / cols) * Math.PI * 2;
      const bearing = ((90 - (a * 180) / Math.PI) % 360 + 360) % 360,
        R =
          kind === "pole"
            ? exteriorRadiusAt(p, z, bearing)
            : nominalRadius;
      let x = R * Math.cos(a),
        y = R * Math.sin(a);
      if (kind === "region" && region.shape.type !== "section-contours") {
        const sh = region.shape,
          f = regionScale(region, z),
          ang = (sh.angle * Math.PI) / 180,
          q =
            sh.type === "sketch"
              ? sh.outline[(((k % cols) * sh.outline.length) / cols) | 0]
              : [Math.cos(a), Math.sin(a)],
          u = sh.radiusX * f * q[0],
          v = sh.radiusY * f * q[1];
        x = sh.centreX + u * Math.cos(ang) - v * Math.sin(ang);
        y = sh.centreY + u * Math.sin(ang) + v * Math.cos(ang);
        if (region.kind === "decay" && region.decay?.pattern === "shell") {
          x =
            (region.decay.offsetX ?? 0) +
            (R - region.decay.shellDepth * f * 0.5) * Math.cos(a);
          y =
            (region.decay.offsetY ?? 0) +
            (R - region.decay.shellDepth * f * 0.5) * Math.sin(a);
        }
        const rr = Math.hypot(x, y);
        if (rr > R) {
          x *= R / rr;
          y *= R / rr;
        }
      }
      positions.push(x + (s?.ux ?? 0) * scale, z, -y - (s?.uy ?? 0) * scale);
      uv.push(
        k / cols,
        kind === "region" ? j / rows : (z + p.embedment) / p.length,
      );
      const stress = s ? stressAt(p, s, x, y) : 0,
        c =
          display === "utilisation"
            ? utilisationColour(s ? (utilisationAt(p, s, x, y) ?? 0) : 0)
            : stressColour(stress ?? 0),
        condition = conditionAt(p, x, y, z);
      if (view === "Stresses") {
        const colour = new T.Color().setRGB(
          c[0] / 255,
          c[1] / 255,
          c[2] / 255,
          T.SRGBColorSpace,
        );
        colours.push(colour.r, colour.g, colour.b);
      } else
        colours.push(
          1 - condition.severity * 0.35,
          1 - condition.severity * 0.55,
          1 - condition.severity * 0.65,
        );
      if (j < rows && k < cols) {
        const q = j * (cols + 1) + k,
          zz = (heights[j] + heights[j + 1]) / 2,
          rr = diameterAt(p, zz) / 2,
          aa = ((k + 0.5) / cols) * Math.PI * 2;
        if (
          kind === "pole" &&
          p.regions.some(
            (r) =>
              (r.kind === "void" || r.kind === "drilling") &&
              defectDistance(
                p,
                r,
                rr * Math.cos(aa),
                rr * Math.sin(aa),
                zz,
              ) <= 1,
          )
        )
          continue;
        if (kind === "pole")
          indices.push(
            q,
            q + 1,
            q + cols + 1,
            q + 1,
            q + cols + 2,
            q + cols + 1,
          );
        else
          indices.push(
            q,
            q + cols + 1,
            q + 1,
            q + 1,
            q + cols + 1,
            q + cols + 2,
          );
      }
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  g.setAttribute("color", new T.Float32BufferAttribute(colours, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
function line(points: T.Vector3[], colour: string, dashed = false) {
  const geo = new T.BufferGeometry().setFromPoints(points),
    l = new T.Line(
      geo,
      dashed
        ? new T.LineDashedMaterial({
            color: colour,
            dashSize: 0.08,
            gapSize: 0.06,
            transparent: true,
            opacity: 0.65,
          })
        : new T.LineBasicMaterial({
            color: colour,
            transparent: true,
            opacity: 0.65,
          }),
    );
  l.computeLineDistances();
  return l;
}

export default function PoleScene(props: SceneProps) {
  const profile = useProfile(props.profilePole ?? props.pole),
    metric = props.chartMetric,
    chart = useRef<HTMLCanvasElement>(null),
    chartPositions = useRef<{ z: number; y: number }[]>([]),
    chartHeight = useRef<number | null>(null),
    chartState = useRef({
      profile,
      metric,
      scale: props.chartScale,
      maximum: props.utilisationMax,
    });
  chartState.current = {
    profile,
    metric,
    scale: props.chartScale,
    maximum: props.utilisationMax,
  };
  const sectionHandle = useRef<HTMLDivElement>(null),
    loadHandle = useRef<HTMLDivElement>(null),
    breakLabel = useRef<HTMLDivElement>(null),
    sectionLabel = useRef<HTMLSpanElement>(null),
    loadLabel = useRef<HTMLSpanElement>(null),
    dragNote = useRef<HTMLSpanElement>(null),
    actions = useRef<{
      start: (kind: "section" | "bearing", x: number, y: number) => void;
      move: (x: number, y: number) => void;
      end: (commit?: boolean) => void;
    } | null>(null);
  const readingLabels = useRef(new Map<string, HTMLButtonElement>());
  const mount = useRef<HTMLDivElement>(null),
    state = useRef<SceneState | null>(null),
    latest = useRef(props);
  latest.current = props;
  const [failed, setFailed] = useState(false),
    [quality, setQuality] = useState("Auto quality"),
    [narrow, setNarrow] = useState(window.innerWidth <= 760);
  useEffect(() => {state.current?.render();}, [props.showRecordedReadings, props.pole.gridManager]);
  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: props.capture ?? false,
        powerPreference: "high-performance",
      });
    } catch {
      setFailed(true);
      props.onReady?.("3D unavailable");
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFShadowMap;
    host.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      "aria-label",
      "Interactive 3D pole. Left-drag to pan, right-drag to rotate and scroll to zoom.",
    );
    renderer.domElement.setAttribute("tabindex", "0");
    const scene = new T.Scene(),
      camera = new T.PerspectiveCamera(
        32,
        host.clientWidth / host.clientHeight,
        0.01,
        200,
      );
    camera.position.set(11, 7.3, 15);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 3.1, 0);
    controls.mouseButtons = {
      LEFT: T.MOUSE.PAN,
      MIDDLE: T.MOUSE.DOLLY,
      RIGHT: T.MOUSE.ROTATE,
    };
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.minDistance = 0.5;
    controls.maxDistance = 60;
    controls.maxPolarAngle = Math.PI * 0.92;
    controls.zoomToCursor = true;
    controls.update();
    scene.add(new T.HemisphereLight("#ffffff", "#79838a", 1.8));
    const key = new T.DirectionalLight("#ffffff", 3);
    key.position.set(-6, 12, 8);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -8;
    key.shadow.camera.right = 8;
    key.shadow.camera.top = 15;
    key.shadow.camera.bottom = -8;
    key.shadow.bias = -0.001;
    key.shadow.normalBias = 0.02;
    scene.add(key);
    const fill = new T.DirectionalLight("#e8eff6", 1.2);
    fill.position.set(6, 8, -5);
    scene.add(fill);
    const model = new T.Group();
    scene.add(model);
    let frame = 0,
      timer: ReturnType<typeof setTimeout> | null = null,
      disposed = false,
      frames = 0,
      ms = 0,
      last = 0,
      moving = false,
      applyingPose = false;
    function draw() {
      frame = 0;
      if (disposed) return;
      const begin = performance.now();
      controls.update();
      const current = latest.current,
        probePair = model.getObjectByName("inspection-pair"),
        probeZ = drag?.kind === "section" ? drag.value : current.section,
        probeAt = current.result ? stationAt(current.result, probeZ) : null;
      if (probePair && current.testBearing !== undefined)
        placeProbePair(
          probePair,
          diameterAt(current.pole, probeZ) / 2,
          probeZ,
          current.testBearing,
          (probeAt?.ux ?? 0) * current.scale,
          (probeAt?.uy ?? 0) * current.scale,
        );
      renderer.render(scene, camera);
      const p = latest.current,
        h = p.pole.length - p.pole.embedment,
        loadZ = loadApplicationHeight(p.pole),
        z = drag?.kind === "section" ? drag.value : p.section,
        sec = p.result ? stationAt(p.result, z) : null,
        tip = p.result ? stationAt(p.result, loadZ) : null,
        a =
          ((drag?.kind === "bearing" ? drag.value : p.pole.bearing) * Math.PI) /
          180,
        len = arrowLength(drag?.kind === "bearing" ? drag.load : p.pole.loadKN);
      function place(el: HTMLDivElement | null, v: T.Vector3, side?: boolean) {
        if (!el) return;
        v.project(camera);
        const x = ((v.x + 1) * host!.clientWidth) / 2,
          y = ((1 - v.y) * host!.clientHeight) / 2;
        el.style.display =
          v.z > 1 ||
          v.z < -1 ||
          x < 0 ||
          x > host!.clientWidth ||
          y < 22 ||
          y > host!.clientHeight - 16
            ? "none"
            : "block";
        const reverse = side ?? x > host!.clientWidth - 125;
        el.classList.toggle("leader-reverse", reverse);
        el.style.width =
          Math.min(
            110,
            Math.max(8, reverse ? x - 18 : host!.clientWidth - x - 18),
          ) + "px";
        el.style.left = x + "px";
        el.style.top = y + "px";
      }
      // Attach to the ring's screen-right point, including after camera orbit.
      const right = new T.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
      right.y = 0;
      right.normalize().multiplyScalar(0.705);
      const sectionAnchor = new T.Vector3(
          (sec?.ux ?? 0) * p.scale,
          z,
          -(sec?.uy ?? 0) * p.scale,
        ),
        candidate = sectionAnchor.clone().add(right).project(camera),
        reverseSection =
          ((candidate.x + 1) * host!.clientWidth) / 2 > host!.clientWidth - 125;
      sectionAnchor.add(right);
      const point = project(sectionAnchor.clone()),
        endX = chartLeft(host!.clientWidth),
        leader = sectionHandle.current;
      if (leader) {
        leader.style.display =
          Math.abs(
            project(new T.Vector3(0, h, 0)).y -
              project(new T.Vector3(0, -p.pole.embedment, 0)).y,
          ) < 40 ||
          point.y < 40 ||
          point.y > host!.clientHeight - 25
            ? "none"
            : "block";
        leader.style.left = point.x + "px";
        leader.style.top = point.y + "px";
        leader.style.width = Math.max(8, Math.abs(endX - point.x)) + "px";
        leader.classList.toggle("leader-reverse", endX < point.x);
      }
      const zone=p.breakState?.active?p.breakState:null,label=breakLabel.current;
      if(label&&zone){
        const breakAt=p.result?stationAt(p.result,zone.heightM):null,
          screen=project(new T.Vector3((breakAt?.ux??0)*p.scale,zone.heightM,-(breakAt?.uy??0)*p.scale)),
          placeLeft=screen.x>host!.clientWidth-190;
        label.hidden=screen.y<24||screen.y>host!.clientHeight-24;
        label.classList.toggle('left',placeLeft);
        label.style.left=(screen.x+(placeLeft?-20:20))+'px';
        label.style.top=screen.y+'px';
        label.textContent=zone.basis==='observed'?'Actual break zone':'Likely break zone';
      }else if(label)label.hidden=true;
      const inspection = p.pole.gridManager?.inspections.find(s => s.id === p.pole.gridManager?.selectedInspectionId);
      let lastReadingY = -100;
      const recorded = (p.showRecordedReadings ? inspection?.readings ?? [] : []).filter(r => r.heightM !== null).map(r => {
        const q = p.result ? stationAt(p.result, r.heightM!) : null;
        const at = new T.Vector3((q?.ux ?? 0) * p.scale, r.heightM!, -(q?.uy ?? 0) * p.scale);
        const right = new T.Vector3().setFromMatrixColumn(camera.matrixWorld, 0).multiplyScalar(-diameterAt(p.pole, r.heightM!) / 2 - .15);
        at.add(right);
        return {reading: r, screen: project(at.clone()), depth: at.project(camera).z};
      }).sort((a, b) => a.screen.y - b.screen.y);
      for (const {reading, screen, depth} of recorded) {
        const el = readingLabels.current.get(reading.id);
        if (!el) continue;
        const y = Math.max(screen.y, lastReadingY + 35); lastReadingY = y;
        el.hidden = depth < -1 || depth > 1 || screen.x < 0 || screen.x > host!.clientWidth || y < 40 || y > host!.clientHeight - 40 || reading.heightM! < -p.pole.embedment || reading.heightM! > h;
        el.style.left = Math.max(8, Math.min(host!.clientWidth - 170, screen.x - 164)) + "px";
        el.style.top = y + "px";
      }
      const origin = new T.Vector3(
          (tip?.ux ?? 0) * p.scale,
          loadZ,
          -(tip?.uy ?? 0) * p.scale,
        ),
        end = origin
          .clone()
          .add(new T.Vector3(Math.sin(a) * len, 0, -Math.cos(a) * len));
      const at = project(end),
        start = project(origin),
        direction = at.clone().sub(start).normalize(),
        el = loadHandle.current;
      if (el) {
        const w = host!.clientWidth,
          hh = host!.clientHeight;
        el.style.display =
          at.x < 0 || at.x > w || at.y < 18 || at.y > hh - 18
            ? "none"
            : "block";
        if (direction.lengthSq() < 0.1) direction.set(1, 0);
        const reachX =
            direction.x > 0
              ? (w - 18 - at.x) / direction.x
              : direction.x < 0
                ? (18 - at.x) / direction.x
                : Infinity,
          reachY =
            direction.y > 0
              ? (hh - 18 - at.y) / direction.y
              : direction.y < 0
                ? (18 - at.y) / direction.y
                : Infinity;
        const angle = Math.atan2(direction.y, direction.x);
        el.style.width = Math.max(8, Math.min(100, reachX, reachY)) + "px";
        el.style.left = at.x + "px";
        el.style.top = at.y + "px";
        el.style.transform = `rotate(${angle}rad)`;
        el.style.setProperty("--counter-angle", `${-angle}rad`);
      }
      if (loadLabel.current)
        loadLabel.current.textContent = `${displayForce(drag?.kind === "bearing" ? drag.load : p.pole.loadKN,p.units??'metric').toFixed((p.units??'metric')==='metric'?1:0)} ${unitLabels[p.units??'metric'].force}`;
      if (sectionLabel.current)
        sectionLabel.current.textContent = `${chartState.current.profile.error ? "Chart unavailable" : chartState.current.profile.pending ? "Updating…" : profileLabel(chartState.current.profile.rows, chartState.current.metric, z,p.units??'metric')} · ${formatPoleLength(z,p.units??'metric')}`;
      chartPositions.current = Array.from({ length: 101 }, (_, i) => {
        const z = -p.pole.embedment + (p.pole.length * i) / 100,
          q = p.result ? stationAt(p.result, z) : null;
        return {
          z,
          y: project(
            new T.Vector3((q?.ux ?? 0) * p.scale, z, -(q?.uy ?? 0) * p.scale),
          ).y,
        };
      });
      if (chart.current)
        paintHeightChart(
          chart.current,
          host!.clientWidth,
          host!.clientHeight,
          (height) => {
            const q = p.result ? stationAt(p.result, height) : null;
            return project(
              new T.Vector3(
                (q?.ux ?? 0) * p.scale,
                height,
                -(q?.uy ?? 0) * p.scale,
              ),
            ).y;
          },
          chartState.current.profile.rows,
          chartState.current.metric,
          z,
          p.pole.embedment,
          h,
          chartState.current.scale,
          p.pole.loadKN,
          chartState.current.maximum,
          p.units??'metric',
        );
      const dt = last ? begin - last : 16;
      if (moving && dt < 200) {
        ms += dt;
        frames++;
      }
      if (moving && frames >= 35) {
        if (ms / frames > 28 && renderer.getPixelRatio() > 1) {
          renderer.setPixelRatio(1);
          setQuality("Balanced quality");
        }
        frames = ms = 0;
      }
      last = begin;
    }
    const request = () => {
      if (!frame && !disposed) frame = requestAnimationFrame(draw);
    };
    controls.addEventListener("change", () => {
      request();
      if (!applyingPose && moving) {
        const { onPose, pole } = latest.current;
        onPose?.({
          position: camera.position.toArray(),
          target: controls.target.toArray(),
          source: pole.id,
        });
      }
    });
    controls.addEventListener("start", () => {
      moving = true;
    });
    controls.addEventListener("end", () => {
      moving = false;
    });
    const resize = new ResizeObserver(() => {
      setNarrow(window.innerWidth <= 760);
      if (!host.clientWidth || !host.clientHeight) return;
      camera.aspect = host.clientWidth / host.clientHeight;
      if (camera.view?.enabled)
        camera.setViewOffset(
          host.clientWidth,
          host.clientHeight,
          Math.min(70, host.clientWidth * 0.2),
          0,
          host.clientWidth,
          host.clientHeight,
        );
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
      request();
    });
    resize.observe(host);
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        const delta = 0.25;
        if (e.key === "ArrowLeft") controls.target.x -= delta;
        if (e.key === "ArrowRight") controls.target.x += delta;
        if (e.key === "ArrowUp") controls.target.y += delta;
        if (e.key === "ArrowDown") controls.target.y -= delta;
        controls.update();
        request();
      }
    };
    renderer.domElement.addEventListener("keydown", onKey);
    // Both the 3D objects and their attached readable handles use the same drag mapping.
    const raycaster = new T.Raycaster(),
      pointer = new T.Vector2();
    raycaster.params.Line.threshold = 0.045;
    let drag: null | {
      kind: "section" | "bearing";
      x: number;
      y: number;
      z: number;
      bearing: number;
      value: number;
      length: number;
      load: number;
      origin: T.Vector3;
      tipScreen: T.Vector2;
      axis: T.Vector2;
      east: T.Vector2;
      north: T.Vector2;
    } = null;
    const project = (v: T.Vector3) => {
      v.project(camera);
      return new T.Vector2(
        ((v.x + 1) * host.clientWidth) / 2,
        ((1 - v.y) * host.clientHeight) / 2,
      );
    };
    const begin = (kind: "section" | "bearing", x: number, y: number) => {
      const p = latest.current,
        z = kind === "section" ? p.section : loadApplicationHeight(p.pole),
        q = p.result ? stationAt(p.result, z) : null,
        o = new T.Vector3((q?.ux ?? 0) * p.scale, z, -(q?.uy ?? 0) * p.scale),
        at = project(o.clone());
      drag = {
        kind,
        x,
        y,
        z: p.section,
        bearing: p.pole.bearing,
        value: kind === "section" ? p.section : p.pole.bearing,
        length: arrowLength(p.pole.loadKN),
        load: p.pole.loadKN,
        origin: o,
        tipScreen: project(
          o
            .clone()
            .add(
              new T.Vector3(
                Math.sin((p.pole.bearing * Math.PI) / 180) *
                  arrowLength(p.pole.loadKN),
                0,
                -Math.cos((p.pole.bearing * Math.PI) / 180) *
                  arrowLength(p.pole.loadKN),
              ),
            ),
        ),
        axis: project(o.clone().add(new T.Vector3(0, 1, 0))).sub(at),
        east: project(o.clone().add(new T.Vector3(1, 0, 0))).sub(at),
        north: project(o.clone().add(new T.Vector3(0, 0, -1))).sub(at),
      };
      controls.enabled = false;
      renderer.domElement.style.cursor = "grabbing";
      if (dragNote.current) {
        dragNote.current.hidden = false;
        dragNote.current.textContent = "Release to update";
      }
    };
    const preview = (
      kind: "section" | "bearing",
      value: number,
      load = latest.current.pole.loadKN,
    ) => {
      const p = latest.current;
      if (kind === "section") {
        p.onSectionPreview?.(value);
        const q = p.result ? stationAt(p.result, value) : null;
        for (const name of ["section-fill", "section-ring"])
          model
            .getObjectByName(name)
            ?.position.set(
              (q?.ux ?? 0) * p.scale,
              value,
              -(q?.uy ?? 0) * p.scale,
            );
      } else {
        const a = (value * Math.PI) / 180,
          dir = new T.Vector3(Math.sin(a), 0, -Math.cos(a)),
          arrow = model.getObjectByName("load-arrow");
        arrow?.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir);
        if (arrow) {
          resizeArrow(arrow, arrowLength(load));
          model
            .getObjectByName("load-pick")
            ?.position.copy(arrow.position)
            .addScaledVector(dir, arrowLength(load));
        }
      }
      request();
    };
    const move = (x: number, y: number) => {
      if (!drag) return;
      const p = latest.current,
        dx = x - drag.x,
        dy = y - drag.y;
      if (drag.kind === "section") {
        const a = drag.axis,
          n = a.lengthSq(),
          dz =
            n > 4
              ? (dx * a.x + dy * a.y) / n
              : (-dy / host.clientHeight) * p.pole.length;
        drag.value = Math.max(
          -p.pole.embedment,
          Math.min(
            p.pole.length - p.pole.embedment,
            Math.round((drag.z + dz) * 100) / 100,
          ),
        );
      } else {
        const target = drag.tipScreen.clone().add(new T.Vector2(dx, dy));
        raycaster.setFromCamera(
          new T.Vector2(
            (target.x / host.clientWidth) * 2 - 1,
            1 - (target.y / host.clientHeight) * 2,
          ),
          camera,
        );
        const hit = new T.Vector3(),
          plane = new T.Plane(new T.Vector3(0, 1, 0), -drag.origin.y);
        let vx: number, vy: number;
        if (
          Math.abs(raycaster.ray.direction.y) > 0.06 &&
          raycaster.ray.intersectPlane(plane, hit)
        ) {
          vx = hit.x - drag.origin.x;
          vy = -(hit.z - drag.origin.z);
        } else {
          // Front elevation cannot determine depth: keep direction, use the visible arrow axis.
          const b = (drag.bearing * Math.PI) / 180,
            axis = drag.east
              .clone()
              .multiplyScalar(Math.sin(b))
              .addScaledVector(drag.north, Math.cos(b)),
            length = Math.max(
              0,
              drag.length +
                (dx * axis.x + dy * axis.y) / Math.max(1, axis.lengthSq()),
            );
          vx = Math.sin(b) * length;
          vy = Math.cos(b) * length;
        }
        const length = Math.hypot(vx, vy);
        if (length > 0.05)
          drag.value = ((Math.atan2(vx, vy) * 180) / Math.PI + 360) % 360;
        const projected = drag.tipScreen
            .clone()
            .sub(project(drag.origin.clone()))
            .normalize(),
          across = dx * projected.y - dy * projected.x;
        if (
          Math.abs(across) < 3 &&
          length > 0.05 &&
          Math.abs(drag.value - drag.bearing) < 90
        )
          drag.value = drag.bearing;
        drag.load = Math.min(50, Math.pow(Math.max(0, length - 0.35) / 0.6, 2));
      }
      preview(drag.kind, drag.value, drag.load);
    };
    // Only a completed gesture changes application inputs. No worker, canvas section
    // painting or full scene reconstruction is triggered by pointer movement.
    const finish = (commit = true) => {
      if (!drag) return;
      const done = drag;
      drag = null;
      controls.enabled = true;
      renderer.domElement.style.cursor = "grab";
      if (dragNote.current) dragNote.current.hidden = true;
      if (commit) {
        if (done.kind === "section") latest.current.onSection(done.value);
        else
          latest.current.onForce(
            Math.round(done.value * 10) / 10,
            Math.round(done.load * 100) / 100,
          );
      } else
        preview(done.kind, done.kind === "section" ? done.z : done.bearing);
      if (done.kind === "section") latest.current.onSectionPreview?.(null);
      request();
    };
    actions.current = { start: begin, move, end: finish };
    const release = () => {
        finishDefect(true);
        finish(true);
      },
      cancel = () => {
        finishDefect(false);
        finish(false);
      },
      escape = (e: KeyboardEvent) => {
        if (e.key === "Escape") cancel();
      };
    window.addEventListener("keydown", escape);
    window.addEventListener("blur", cancel);
    let defectDrag: null | {
      id: string;
      y: number;
      x: number;
      centre: number;
      value: number;
      axis: T.Vector2;
      objects: { object: T.Object3D; y: number }[];
    } = null;
    function finishDefect(commit: boolean) {
      if (!defectDrag) return;
      const d = defectDrag;
      defectDrag = null;
      controls.enabled = true;
      renderer.domElement.style.cursor = "grab";
      d.objects.forEach(({ object, y }) => (object.position.y = y));
      if (dragNote.current) dragNote.current.hidden = true;
      if (commit && Math.abs(d.value - d.centre) > 0.0001)
        latest.current.onDefectMove(d.id, d.value);
      request();
    }
    const pointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const r = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        (-(e.clientY - r.top) / r.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(model.children, true),
        p = latest.current,
        defectHit =
          p.view === "Innerview"
            ? (hits.find((h) => h.object.userData.defect === p.selected) ??
              hits
                .filter((h) => h.object.userData.defect)
                .sort((a, b) => {
                  const ra = p.pole.regions.find(
                      (r) => r.id === a.object.userData.defect,
                    )!,
                    rb = p.pole.regions.find(
                      (r) => r.id === b.object.userData.defect,
                    )!;
                  return (
                    Math.abs(a.point.y - (ra.zMin + ra.zMax) / 2) -
                    Math.abs(b.point.y - (rb.zMin + rb.zMax) / 2)
                  );
                })[0])
            : null,
        hit = hits.find((h) => h.object.userData.drag);
      if (defectHit && hit?.object.userData.drag !== "bearing") {
        const id = defectHit.object.userData.defect,
          region = p.pole.regions.find((d) => d.id === id)!;
        const centre = (region.zMin + region.zMax) / 2,
          at = project(new T.Vector3(0, centre, 0)),
          objects: { object: T.Object3D; y: number }[] = [];
        model.traverse((object) => {
          if (object.userData.defect === id)
            objects.push({ object, y: object.position.y });
        });
        defectDrag = {
          id,
          x: e.clientX,
          y: e.clientY,
          centre,
          value: centre,
          axis: project(new T.Vector3(0, centre + 1, 0)).sub(at),
          objects,
        };
        controls.enabled = false;
        p.onDefectSelect(id);
        renderer.domElement.style.cursor = "grabbing";
        renderer.domElement.setPointerCapture(e.pointerId);
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      if (hit) {
        begin(hit.object.userData.drag, e.clientX, e.clientY);
        renderer.domElement.setPointerCapture(e.pointerId);
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    const pointerMove = (e: PointerEvent) => {
      if (defectDrag) {
        const d = defectDrag,
          p = latest.current,
          r = p.pole.regions.find((r) => r.id === d.id);
        if (!r) return;
        const a = d.axis,
          n = a.lengthSq(),
          dz =
            n > 4
              ? ((e.clientX - d.x) * a.x + (e.clientY - d.y) * a.y) / n
              : (-(e.clientY - d.y) / host.clientHeight) * p.pole.length,
          half = (r.zMax - r.zMin) / 2;
        d.value = Math.max(
          -p.pole.embedment + half,
          Math.min(
            p.pole.length - p.pole.embedment - half,
            Math.round((d.centre + dz) * 100) / 100,
          ),
        );
        d.objects.forEach(
          ({ object, y }) => (object.position.y = y + d.value - d.centre),
        );
        if (dragNote.current) {
          dragNote.current.hidden = false;
          dragNote.current.textContent =
            formatPoleLength(d.value,latest.current.units??'metric') + " · release to update";
        }
        request();
        return;
      }
      move(e.clientX, e.clientY);
    };
    renderer.domElement.addEventListener("pointerdown", pointerDown, true);
    renderer.domElement.addEventListener("pointermove", pointerMove);
    renderer.domElement.addEventListener("pointerup", release);
    renderer.domElement.addEventListener("pointercancel", cancel);
    renderer.domElement.addEventListener("lostpointercapture", cancel);
    state.current = {
      scene,
      camera,
      renderer,
      controls,
      model,
      render: request,
      disposeModel: () => disposeGroup(model),
    };
    props.onReady?.(
      `WebGL · ${renderer.capabilities.maxTextureSize}px textures`,
    );
    request();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      if (timer) clearTimeout(timer);
      window.removeEventListener("keydown", escape);
      window.removeEventListener("blur", cancel);
      resize.disconnect();
      controls.dispose();
      disposeGroup(model);
      renderer.dispose();
      renderer.domElement.remove();
      state.current = null;
      actions.current = null;
    };
  }, []);
  useEffect(() => {
    const s = state.current;
    if (!s) return;
    const {
      pole: p,
      result,
      view,
      section,
      stressDisplay,
      soil,
      scale,
    } = props;
    s.disposeModel();
    if (view !== "Stresses") setQuality("Auto quality");
    const h = p.length - p.embedment,
      top = h;
    const timber = woodTexture(s.render);
    timber.repeat.set(1, p.length / 2);
    const mat =
      view === "Stresses"
        ? new T.MeshBasicMaterial({
            color: "#b4c5d2",
            side: T.DoubleSide,
            transparent: true,
            opacity: 0.07,
            depthWrite: false,
            toneMapped: false,
          })
        : new T.MeshStandardMaterial({
            map: timber,
            bumpMap: timber,
            bumpScale: 0.0025,
            color: "#ffffff",
            roughness: 0.93,
            metalness: 0,
            vertexColors: view !== "Setup",
            transparent: view === "Innerview",
            opacity: view === "Innerview" ? 0.07 : 1,
            depthWrite: view !== "Innerview",
            side: view === "Setup" ? T.FrontSide : T.DoubleSide,
          });
    if (view === "Stresses") timber.dispose();
    const breakHeight = props.breakState?.active
      ? Math.max(
          -p.embedment + 0.02,
          Math.min(top - 0.02, props.breakState.heightM),
        )
      : null;
    const body = new T.Mesh(
      tubeGeometry(p, result, scale, top, "pole", 0, view, stressDisplay),
      mat,
    );
    body.castShadow = view === "Setup";
    body.receiveShadow = view === "Setup";
    s.model.add(body);
    if (breakHeight !== null) {
      const atBreak=result?stationAt(result,breakHeight):null,
        cx=(atBreak?.ux??0)*scale,
        cz=-(atBreak?.uy??0)*scale,
        radius=diameterAt(p,breakHeight)/2,
        seamMaterial=new T.LineBasicMaterial({color:'#b42318'}),
        points=Array.from({length:32},(_,i)=>{
          const angle=i/32*Math.PI*2,r=radius*(1+(i%3===0?.018:0));
          return new T.Vector3(cx+r*Math.cos(angle),breakHeight+(i%2===0?.012:-.012),cz+r*Math.sin(angle));
        });
      s.model.add(new T.LineLoop(new T.BufferGeometry().setFromPoints(points),seamMaterial));

      const chipMaterial=new T.MeshStandardMaterial({color:'#b88a5b',roughness:.92}),
        loadAngle=p.bearing*Math.PI/180,
        outward=new T.Vector3(Math.sin(loadAngle),0,-Math.cos(loadAngle)),
        tangent=new T.Vector3(-outward.z,0,outward.x);
      for(let i=0;i<6;i++){
        const chip=new T.Mesh(new T.TetrahedronGeometry(.011+i*.0014,0),chipMaterial),
          distance=radius+.025+i*.014,
          spread=(i-2.5)*.012;
        chip.position.set(cx,0,cz).addScaledVector(outward,distance).addScaledVector(tangent,spread);
        chip.position.y=breakHeight+(i%3-1)*.018;
        chip.rotation.set(i*.7,i*.43,i*.29);
        chip.scale.set(1.6,.65+(.12*(i%2)),.8);
        chip.castShadow=true;
        s.model.add(chip);
      }
    }

    const capTexture = poleTopTexture(
      p,
      top,
      view,
      result,
      stressDisplay,
      s.render,
      props.utilisationMax,
    );
    capTexture.colorSpace = T.SRGBColorSpace;
    capTexture.repeat.set(0.92, 0.92);
    capTexture.offset.set(0.04, 0.04);
    const cap = new T.Mesh(
      new T.CircleGeometry(diameterAt(p, top) / 2, 64),
      view === "Stresses"
        ? new T.MeshBasicMaterial({
            map: capTexture,
            side: T.DoubleSide,
            transparent: true,
            opacity: 0.1,
            depthWrite: false,
            toneMapped: false,
          })
        : new T.MeshStandardMaterial({
            map: capTexture,
            bumpMap: capTexture,
            bumpScale: 0.0012,
            roughness: 0.94,
            side: T.DoubleSide,
            transparent: true,
            opacity: view === "Setup" ? 1 : 0.07,
            depthWrite: view === "Setup",
          }),
    );
    cap.rotation.x = -Math.PI / 2;
    const capStation = result ? stationAt(result, top) : null;
    cap.position.set(
      (capStation?.ux ?? 0) * scale,
      top + 0.001,
      -(capStation?.uy ?? 0) * scale,
    );
    s.model.add(cap);
    if (view !== "Stresses")
      p.regions.forEach((r, i) => {
        if (
          r.shape.type === "section-contours" ||
          r.zMin > top ||
          (r.kind === "decay" && r.severity === 0)
        )
          return;
        if (r.kind === "drilling" && r.drilling) {
          const d = r.drilling,
            z = d.entryHeight ?? (r.zMin + r.zMax) / 2,
            R = diameterAt(p, z) / 2,
            q = result ? stationAt(result, z) : null,
            placement = drillingScenePlacement(
              d.bearing,
              d.inclination ?? 0,
              R,
              d.depth,
            ),
            axis = new T.Vector3(...placement.inward),
            poleCentre = new T.Vector3(
              (q?.ux ?? 0) * scale,
              z,
              -(q?.uy ?? 0) * scale,
            );
          const bore = new T.Mesh(
            new T.CylinderGeometry(
              d.diameter / 2,
              d.diameter / 2,
              d.depth,
              24,
              1,
              true,
            ),
            new T.MeshStandardMaterial({
              color: "#55402c",
              roughness: 0.96,
              side: T.DoubleSide,
            }),
          );
          bore.userData.defect = r.id;
          bore.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), axis);
          bore.position.copy(poleCentre).add(new T.Vector3(...placement.midpoint));
          s.model.add(bore);
          const mouth = new T.Mesh(
            new T.CircleGeometry(d.diameter / 2, 32),
            new T.MeshBasicMaterial({ color: "#302317", side: T.DoubleSide }),
          );
          mouth.userData.defect = r.id;
          mouth.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), axis);
          mouth.position.copy(poleCentre).add(new T.Vector3(...placement.mouth));
          s.model.add(mouth);
          const pick = new T.Mesh(
            new T.CylinderGeometry(0.04, 0.04, d.depth, 12),
            new T.MeshBasicMaterial({
              transparent: true,
              opacity: 0,
              depthWrite: false,
            }),
          );
          pick.quaternion.copy(bore.quaternion);
          pick.position.copy(bore.position);
          pick.userData.defect = r.id;
          s.model.add(pick);
          return;
        }
        if (r.kind === "chipping") {
          const centre = (r.zMin + r.zMax) / 2,
            at = result ? stationAt(result, centre) : null,
            pick = new T.Mesh(
              new T.CylinderGeometry(
                diameterAt(p, centre) / 2,
                diameterAt(p, centre) / 2,
                Math.max(0.08, r.zMax - r.zMin),
                24,
              ),
              new T.MeshBasicMaterial({
                transparent: true,
                opacity: 0,
                depthWrite: false,
              }),
            );
          pick.position.set(
            (at?.ux ?? 0) * scale,
            centre,
            -(at?.uy ?? 0) * scale,
          );
          pick.userData.defect = r.id;
          s.model.add(pick);
          return;
        }
        if (view === "Setup" && r.kind !== "void") return;
        const tex = imageTexture("textures/defects-p08.png", s.render);
        tex.colorSpace = T.SRGBColorSpace;
        tex.repeat.set(0.48, 0.48);
        tex.offset.set(
          r.kind === "decay" ? 0.51 : 0.01,
          r.kind === "void" ? 0.01 : 0.51,
        );
        const material = new T.MeshStandardMaterial({
          map: tex,
          bumpMap: tex,
          bumpScale: 0.0015,
          color: r.kind === "decay" ? "#ba9980" : "#ffffff",
          roughness: 0.96,
          side: T.DoubleSide,
          transparent: r.kind === "decay",
          opacity: r.kind === "decay" ? 0.12 + 0.63 * r.severity : 1,
          depthWrite: r.kind !== "decay",
        });
        const regionMesh = new T.Mesh(
          r.kind === "void"
            ? cavityGeometry(p, r, result, scale)
            : tubeGeometry(p, result, scale, top, "region", i),
          material,
        );
        regionMesh.userData.defect = r.id;
        regionMesh.name = r.kind === "void" ? "cavity-wall" : "defect-surface";
        s.model.add(regionMesh);
        const centre = (r.zMin + r.zMax) / 2,
          at = result ? stationAt(result, centre) : null,
          pickRadius = Math.max(
            0.1,
            Math.min(
              diameterAt(p, centre) / 2,
              Math.max(r.shape.radiusX, r.shape.radiusY),
            ),
          ),
          regionPick = new T.Mesh(
            new T.CylinderGeometry(
              pickRadius,
              pickRadius,
              Math.max(0.18, r.zMax - r.zMin),
              16,
            ),
            new T.MeshBasicMaterial({
              transparent: true,
              opacity: 0,
              depthWrite: false,
            }),
          );
        regionPick.position.set(
          (at?.ux ?? 0) * scale + r.shape.centreX,
          centre,
          -(at?.uy ?? 0) * scale - r.shape.centreY,
        );
        regionPick.userData.defect = r.id;
        s.model.add(regionPick);
        if (r.kind === "decay" && r.decay?.progression === "source") {
          const source = r.decay.sourceZ,
            core = structuredClone(p),
            cr = core.regions[i];
          cr.zMin = source - (source - r.zMin) * 0.65;
          cr.zMax = source + (r.zMax - source) * 0.65;
          if (cr.shape.type === "ellipse") {
            cr.shape.radiusX *= 0.6;
            cr.shape.radiusY *= 0.6;
          }
          if (cr.decay?.pattern === "shell") cr.decay.shellDepth *= 0.4;
          const inner = new T.MeshStandardMaterial({
            color: "#844025",
            roughness: 1,
            transparent: true,
            opacity: 0.22 + 0.6 * r.severity,
            depthWrite: false,
            side: T.DoubleSide,
          });
          const coreMesh = new T.Mesh(
            tubeGeometry(core, result, scale, top, "region", i),
            inner,
          );
          coreMesh.userData.defect = r.id;
          s.model.add(coreMesh);
        }
      });
    if (view === "Stresses" && props.solid) {
      const field = props.solid,
        margin = diameterAt(p, (field.defectMin + field.defectMax) / 2) * 0.5;
      for (const z of [field.defectMin - margin, field.defectMax + margin]) {
        const q = result ? stationAt(result, z) : null,
          ring = new T.Mesh(
            new T.TorusGeometry(diameterAt(p, z) / 2 + 0.025, 0.004, 5, 48),
            new T.MeshBasicMaterial({
              color: "#637d90",
              transparent: true,
              opacity: 0.5,
              depthWrite: false,
            }),
          );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set((q?.ux ?? 0) * scale, z, -(q?.uy ?? 0) * scale);
        s.model.add(ring);
      }
    }
    if (soil) {
      const ground = groundPatch(diameterAt(p, 0) / 2, s.render),
        at = result ? stationAt(result, 0) : null;
      ground.position.set((at?.ux ?? 0) * scale, 0, -(at?.uy ?? 0) * scale);
      s.model.add(ground);
    }
    if (props.testBearing !== undefined) s.model.add(makeProbePair());
    const sectionStation = result ? stationAt(result, section) : null,
      sx = (sectionStation?.ux ?? 0) * scale,
      sy = -(sectionStation?.uy ?? 0) * scale;
    const disk = new T.Mesh(
      new T.CircleGeometry(0.72, 64),
      new T.MeshBasicMaterial({
        color: "#397fae",
        transparent: true,
        opacity: 0.12,
        side: T.DoubleSide,
        depthWrite: false,
      }),
    );
    disk.rotation.x = -Math.PI / 2;
    disk.position.set(sx, section, sy);
    disk.name = "section-fill";
    disk.userData.drag = "section";
    s.model.add(disk);
    const ring = new T.Mesh(
      new T.TorusGeometry(0.705, 0.006, 8, 96),
      new T.MeshBasicMaterial({
        color: "#28688f",
        transparent: true,
        opacity: 0.75,
        side: T.DoubleSide,
        depthWrite: false,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(disk.position);
    ring.name = "section-ring";
    ring.userData.drag = "section";
    ring.renderOrder = 5;
    s.model.add(ring);
    if (result && view === "Stresses") {
      const z = result.governingZ,
        q = stationAt(result, z),
        marker = new T.Mesh(
          new T.RingGeometry(0.24, 0.26, 64),
          new T.MeshBasicMaterial({
            color: "#a64d3a",
            side: T.DoubleSide,
            depthTest: false,
            transparent: true,
            opacity: 0.9,
          }),
        );
      marker.rotation.x = -Math.PI / 2;
      marker.position.set(q.ux * scale, z, -q.uy * scale);
      marker.renderOrder = 6;
      s.model.add(marker);
    }

    const loadZ = loadApplicationHeight(p),
      th = (p.bearing * Math.PI) / 180,
      dir = new T.Vector3(Math.sin(th), 0, -Math.cos(th)),
      tip = result ? stationAt(result, loadZ) : null,
      origin = new T.Vector3(
        (tip?.ux ?? 0) * scale,
        loadZ,
        -(tip?.uy ?? 0) * scale,
      ),
      len = arrowLength(p.loadKN),
      head = Math.min(0.24, len * 0.28);
    const arrow = new T.Group();
    arrow.name = "load-arrow";
    arrow.position.copy(origin);
    arrow.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir);
    const arrowMat = new T.MeshBasicMaterial({
      color: "#d92828",
      depthTest: false,
      toneMapped: false,
    });
    const shaft = new T.Mesh(
      new T.CylinderGeometry(0.019, 0.019, 1, 12),
      arrowMat,
    );
    shaft.name = "arrow-shaft";
    shaft.scale.y = len - head;
    shaft.position.y = (len - head) / 2;
    shaft.userData.drag = "bearing";
    shaft.renderOrder = 8;
    arrow.add(shaft);
    const shaftPick = new T.Mesh(
      new T.CylinderGeometry(0.085, 0.085, 1, 12),
      new T.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    shaftPick.name = "arrow-shaft-pick";
    shaftPick.scale.y = len;
    shaftPick.position.y = len / 2;
    shaftPick.userData.drag = "bearing";
    arrow.add(shaftPick);
    const cone = new T.Mesh(new T.ConeGeometry(0.36, 1, 24), arrowMat);
    cone.name = "arrow-head";
    cone.scale.setScalar(head);
    cone.position.y = len - head / 2;
    cone.userData.drag = "bearing";
    cone.renderOrder = 8;
    arrow.add(cone);
    s.model.add(arrow);
    const pick = new T.Mesh(
      new T.SphereGeometry(0.16, 16, 16),
      new T.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    pick.name = "load-pick";
    pick.position.copy(origin).addScaledVector(dir, len);
    pick.userData.drag = "bearing";
    s.model.add(pick);
    s.render();
    let appearance: Worker | null = null;
    if (view === "Setup" && p.regions.length) {
      appearance = new Worker(
        new URL("../workers/appearance.worker.ts", import.meta.url),
        { type: "module" },
      );
      appearance.postMessage({
        pole: p,
        woodURL: new URL(
          import.meta.env.BASE_URL + "textures/treated-pine-p02.png",
          location.href,
        ).href,
        atlasURL: new URL(
          import.meta.env.BASE_URL + "textures/defects-p08.png",
          location.href,
        ).href,
      });
      appearance.onmessage = (e) => {
        if (e.data.error) return;
        const texture = new T.Texture(e.data.bitmap);
        texture.colorSpace = T.SRGBColorSpace;
        texture.flipY = false;
        texture.needsUpdate = true;
        texture.addEventListener("dispose", () => e.data.bitmap.close());
        (mat as T.MeshStandardMaterial).map = texture;
        (mat as T.MeshStandardMaterial).bumpMap = texture;
        mat.needsUpdate = true;
        timber.dispose();
        s.render();
      };
    }
    return () => {
      if (appearance) {
        appearance.onmessage = null;
        appearance.terminate();
      }
    };
  }, [
    props.pole,
    props.result,
    props.solid,
    props.view,
    props.stressDisplay,
    props.soil,
    props.scale,
    props.units,
    props.reveal,
    props.utilisationMax,
    props.testBearing !== undefined,
    props.breakState?.active,
    props.breakState?.heightM,
  ]);
  useEffect(() => {
    const s = state.current;
    if (!s || props.view !== "Stresses" || !props.result) return;
    let disposed = false;
    setQuality("Preparing stress surfaces…");
    const worker = new Worker(
      new URL("../workers/surface.worker.ts", import.meta.url),
      { type: "module" },
    );
    worker.postMessage({
      pole: props.pole,
      result: props.result,
      solid: props.solid,
      scale: props.scale,
      display: props.stressDisplay,
      reveal: props.reveal ?? false,
      utilisationMax: props.utilisationMax,
    });
    worker.onmessage = (e) => {
      if (disposed) return;
      if (e.data.error) {
        setQuality("Stress surfaces unavailable");
        return;
      }
      const geometry = new T.BufferGeometry();
      geometry.setAttribute(
        "position",
        new T.BufferAttribute(e.data.position, 3),
      );
      geometry.setAttribute("color", new T.BufferAttribute(e.data.colour, 3));
      geometry.setAttribute("normal", new T.BufferAttribute(e.data.normal, 3));
      const material = new T.MeshBasicMaterial({
        vertexColors: true,
        side: T.DoubleSide,
        toneMapped: false,
      });
      material.onBeforeCompile = (shader) => {
        shader.vertexShader = shader.vertexShader
          .replace(
            "#include <common>",
            "#include <common>\nvarying vec3 stressNormal;",
          )
          .replace(
            "#include <begin_vertex>",
            "#include <begin_vertex>\nstressNormal=normalize(normalMatrix*normal);",
          );
        shader.fragmentShader = shader.fragmentShader
          .replace(
            "#include <common>",
            "#include <common>\nvarying vec3 stressNormal;",
          )
          .replace(
            "#include <color_fragment>",
            "#include <color_fragment>\ndiffuseColor.rgb *= .78+.22*abs(dot(normalize(stressNormal),normalize(vec3(-.4,.7,1.))));",
          );
      };
      const mesh = new T.Mesh(geometry, material);
      mesh.name = "stress-surfaces";
      s.model.add(mesh);
      setQuality("Auto quality");
      s.render();
      worker.terminate();
    };
    worker.onerror = () => {
      if (!disposed) setQuality("Stress surfaces unavailable");
    };
    return () => {
      disposed = true;
      worker.terminate();
    };
  }, [
    props.pole,
    props.result,
    props.solid,
    props.view,
    props.stressDisplay,
    props.soil,
    props.scale,
    props.reveal,
    props.utilisationMax,
    props.testBearing !== undefined,
  ]);
  useEffect(() => {
    const s = state.current;
    if (!s) return;
    const q = props.result ? stationAt(props.result, props.section) : null;
    for (const name of ["section-fill", "section-ring"])
      s.model
        .getObjectByName(name)
        ?.position.set(
          (q?.ux ?? 0) * props.scale,
          props.section,
          -(q?.uy ?? 0) * props.scale,
        );
    s.render();
  }, [props.section, props.result, props.scale, props.testBearing]);
  useEffect(() => {
    const s = state.current;
    if (!s) return;
    const h = props.pole.length - props.pole.embedment;
    const width = s.renderer.domElement.clientWidth,
      height = s.renderer.domElement.clientHeight;
    if (props.comparison && props.cameraCommand.mode !== "top")
      s.camera.setViewOffset(
        width,
        height,
        Math.min(70, width * 0.2),
        0,
        width,
        height,
      );
    else s.camera.clearViewOffset();
    const middle =
      (h - props.pole.embedment) / 2 +
      (props.comparison
        ? props.pole.length * 0.045
        : narrow
          ? props.pole.length * 0.025
          : 0);
    const distance =
      props.pole.length /
      (2 * Math.tan((16 * Math.PI) / 180)) /
      (props.comparison ? (narrow ? 0.7 : 0.77) : narrow ? 0.73 : 0.89);
    const wholePosition = new T.Vector3(0.48, 0.11, 1)
      .normalize()
      .multiplyScalar(distance)
      .add(new T.Vector3(0, middle, 0));
    const points = Array.from({ length: 41 }, (_, i) => {
      const z = -props.pole.embedment + (props.pole.length * i) / 40,
        q = props.result ? stationAt(props.result, z) : null;
      return {
        x: (q?.ux ?? 0) * props.scale,
        y: -(q?.uy ?? 0) * props.scale,
        r: diameterAt(props.pole, z) / 2,
        z,
      };
    });
    const xmin = Math.min(...points.map((q) => q.x - q.r)),
      xmax = Math.max(...points.map((q) => q.x + q.r)),
      ymin = Math.min(...points.map((q) => q.y - q.r)),
      ymax = Math.max(...points.map((q) => q.y + q.r)),
      cx = (xmin + xmax) / 2,
      cy = (ymin + ymax) / 2,
      span = Math.max(
        (xmax - xmin) / Math.max(0.4, s.camera.aspect),
        ymax - ymin,
        0.6,
      ),
      altitude = props.pole.length * 2;
    s.camera.fov =
      props.cameraCommand.mode === "top"
        ? (2 * Math.atan((span * 0.8) / altitude) * 180) / Math.PI
        : 32;
    s.camera.updateProjectionMatrix();
    const modes: Record<string, { p: number[]; t: number[] }> = {
      whole: { p: wholePosition.toArray(), t: [0, middle, 0] },
      front: { p: [0, middle, distance], t: [0, middle, 0] },
      top: { p: [cx, h + altitude, cy + 0.0001], t: [cx, 0, cy] },
      detail: { p: [2.3, props.section + 1.4, 3.1], t: [0, props.section, 0] },
    };
    const mode = modes[props.cameraCommand.mode] ?? modes.whole;
    if (
      !props.cameraCommand.animate ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      s.camera.position.fromArray(mode.p);
      s.controls.target.fromArray(mode.t);
      s.controls.update();
      s.render();
      return;
    }
    const from = s.camera.position.clone(),
      target = s.controls.target.clone(),
      to = new T.Vector3().fromArray(mode.p),
      look = new T.Vector3().fromArray(mode.t),
      start = performance.now();
    let frame = 0,
      cancelled = false;
    const cancel = () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
    s.controls.addEventListener("start", cancel);
    const tick = () => {
      if (cancelled) return;
      const t = Math.min(1, (performance.now() - start) / 1000),
        u = t * t * (3 - 2 * t);
      s.camera.position.lerpVectors(from, to, u);
      s.controls.target.lerpVectors(target, look, u);
      s.controls.update();
      s.render();
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancel();
      s.controls.removeEventListener("start", cancel);
    };
  }, [
    props.cameraCommand,
    narrow,
    props.comparison,
    props.cameraCommand.mode === "top" ? props.result : null,
    props.cameraCommand.mode === "top" ? props.pole : null,
  ]);
  useEffect(() => {
    const s = state.current,
      p = props.linkedPose;
    if (!s || !p || p.source === props.pole.id) return;
    s.camera.position.fromArray(p.position);
    s.controls.target.fromArray(p.target);
    s.controls.update();
    s.render();
  }, [props.linkedPose]);
  useEffect(() => {
    const s = state.current;
    if (!s) return;
    s.model.traverse((o) => {
      if (
        o instanceof T.Mesh &&
        o.userData.defect &&
        o.material instanceof T.MeshStandardMaterial
      )
        o.material.emissive.set(
          props.view === "Innerview" && o.userData.defect === props.selected
            ? "#314f68"
            : "#000000",
        );
    });
    s.render();
  }, [props.selected, props.pole, props.view]);
  useEffect(() => {
    state.current?.render();
  }, [profile.rows, metric, props.chartScale, props.utilisationMax]);
  useEffect(() => {
    props.onProfile(profile.rows);
  }, [profile.rows]);
  function chartMove(e: React.PointerEvent<HTMLDivElement>) {
    const points = chartPositions.current,
      y = e.clientY - (mount.current?.getBoundingClientRect().top ?? 0);
    if (!points.length) return;
    let nearest = points.reduce((a, b) =>
      Math.abs(a.y - y) < Math.abs(b.y - y) ? a : b,
    ).z;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1],
        b = points[i];
      if ((y - a.y) * (y - b.y) <= 0 && Math.abs(b.y - a.y) > 1e-5) {
        nearest = a.z + ((b.z - a.z) * (y - a.y)) / (b.y - a.y);
        break;
      }
    }
    chartHeight.current = Math.round(nearest * 100) / 100;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      props.onSectionPreview?.(chartHeight.current);
    }
  }
  const profileRow = profile.rows.reduce<(typeof profile.rows)[number] | null>(
      (best, row) =>
        !best ||
        Math.abs(row.z - props.section) < Math.abs(best.z - props.section)
          ? row
          : best,
      null,
    ),
    profileValue = profileRow?.[metric];
  function handleStart(
    kind: "section" | "bearing",
    e: React.PointerEvent<HTMLElement>,
  ) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    actions.current?.start(kind, e.clientX, e.clientY);
  }
  const moveHandle = (e: React.PointerEvent<HTMLElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      actions.current?.move(e.clientX, e.clientY);
  };
  const endHandle = (e: React.PointerEvent<HTMLElement>) => {
    actions.current?.end();
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
  };
  return (
    <div className="scene-host" ref={mount}>
      <canvas
        ref={chart}
        className="height-chart"
        aria-label="Height profile with one metre increments"
      />
      <div
        className="height-chart-hit"
        title="Drag here to inspect a height"
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          chartMove(e);
        }}
        onPointerMove={chartMove}
        onPointerUp={(e) => {
          if (chartHeight.current !== null)
            props.onSection(chartHeight.current);
          props.onSectionPreview?.(null);
          if (e.currentTarget.hasPointerCapture(e.pointerId))
            e.currentTarget.releasePointerCapture(e.pointerId);
        }}
        onPointerCancel={() => props.onSectionPreview?.(null)}
      />
      {failed && (
        <div className="scene-fallback">
          <strong>3D is unavailable on this device.</strong>
          <span>The section view and calculations still work.</span>
        </div>
      )}
      {!failed && (
        <>
          {props.showRecordedReadings && props.pole.gridManager?.inspections.find(s => s.id === props.pole.gridManager?.selectedInspectionId)?.readings.filter(r => r.heightM !== null).map(r => <button key={r.id} ref={el => {if (el) readingLabels.current.set(r.id, el); else readingLabels.current.delete(r.id);}} className="recorded-reading-label" title={`Recorded UB1000 reading ${r.id}`} onClick={() => props.onSection(r.heightM!)}><span>UB1000 · {formatPoleLength(r.heightM!, props.units ?? "metric")} AGL</span><strong>AR {r.ar ?? "—"}{r.rsm !== null ? ` · RSM ${r.rsm}` : ""}</strong></button>)}
          <div ref={breakLabel} className="scene-break-label" hidden />
          <div ref={sectionHandle} className="scene-leader section-leader">
            <button
              className="section-leader-hit"
              aria-label={`Drag section leader on pole ${props.pole.id}`}
              title="Drag anywhere along this line to move the section"
              onPointerDown={(e) => handleStart("section", e)}
              onPointerMove={moveHandle}
              onPointerUp={endHandle}
              onPointerCancel={() => actions.current?.end(false)}
              onLostPointerCapture={() => actions.current?.end(false)}
              onKeyDown={(e) => {
                if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                  e.preventDefault();
                  props.onSection(
                    Math.max(
                      -props.pole.embedment,
                      Math.min(
                        props.pole.length - props.pole.embedment,
                        props.section + (e.key === "ArrowUp" ? 0.05 : -0.05),
                      ),
                    ),
                  );
                }
              }}
            />
            <span ref={sectionLabel} className="leader-label">
              {formatPoleLength(props.section,props.units??'metric')}
            </span>
            <button
              className="leader-circle"
              aria-label={`Drag cross-section on pole ${props.pole.id}`}
              title="Height relative to groundline. Drag up or down; arrow keys move 50 mm; Escape cancels"
              onPointerDown={(e) => handleStart("section", e)}
              onPointerMove={moveHandle}
              onPointerUp={endHandle}
              onPointerCancel={() => actions.current?.end(false)}
              onLostPointerCapture={() => actions.current?.end(false)}
              onKeyDown={(e) => {
                if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                  e.preventDefault();
                  props.onSection(
                    Math.max(
                      -props.pole.embedment,
                      Math.min(
                        props.pole.length - props.pole.embedment,
                        props.section + (e.key === "ArrowUp" ? 0.05 : -0.05),
                      ),
                    ),
                  );
                }
              }}
            />
          </div>
          <div ref={loadHandle} className="scene-leader load-leader">
            <span ref={loadLabel} className="leader-label">
              {displayForce(props.pole.loadKN,props.units??'metric').toFixed((props.units??'metric')==='metric'?1:0)} {unitLabels[props.units??'metric'].force}
            </span>
            <button
              className="leader-circle"
              aria-label={`Drag load arrow on pole ${props.pole.id}`}
              title="Pull or push to change load; drag sideways to turn. Up/down: 0.1 kN; left/right: 5 degrees. Escape cancels"
              onPointerDown={(e) => handleStart("bearing", e)}
              onPointerMove={moveHandle}
              onPointerUp={endHandle}
              onPointerCancel={() => actions.current?.end(false)}
              onLostPointerCapture={() => actions.current?.end(false)}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                  e.preventDefault();
                  props.onForce(
                    (props.pole.bearing +
                      (e.key === "ArrowRight" ? 5 : -5) +
                      360) %
                      360,
                    props.pole.loadKN,
                  );
                } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                  e.preventDefault();
                  props.onForce(
                    props.pole.bearing,
                    Math.max(
                      0,
                      Math.min(
                        50,
                        props.pole.loadKN + (e.key === "ArrowUp" ? 0.1 : -0.1),
                      ),
                    ),
                  );
                }
              }}
            />
          </div>
          <span className="drag-preview-note" ref={dragNote} hidden>
            Release to update
          </span>
        </>
      )}
      {quality !== "Auto quality" && quality !== "Balanced quality" && (
        <span className="quality-note">{quality}</span>
      )}
    </div>
  );
}
