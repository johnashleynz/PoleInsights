import type { IncomingMessage, ServerResponse } from "node:http";
import type { GridPoleSnapshot, RecordedInspection } from "../src/integrations/types.ts";

type Row = Record<string, unknown>;
type Config = Record<string, string>;
const object = (v: unknown): Row => v && typeof v === "object" && !Array.isArray(v) ? v as Row : {};
const rows = (v: unknown): Row[] => Array.isArray(v) ? v.map(object) : [];
const text = (v: unknown): string | null => typeof v === "string" ? v : typeof v === "number" && Number.isFinite(v) ? String(v) : null;
const number = (v: unknown): number | null => (typeof v === "number" || typeof v === "string" && v.trim() !== "") && Number.isFinite(Number(v)) ? Number(v) : null;
const date = (v: unknown) => typeof v === "string" && Number.isFinite(Date.parse(v)) ? v : null;
const newest = (a: string | null, b: string | null) => (a ? Date.parse(a) : -Infinity) >= (b ? Date.parse(b) : -Infinity) ? a : b;
function unitScale(unit: unknown, map: Record<string, string>) {
  const label = text(unit)?.trim() ?? "", mapped = map[label] ?? ({metric: "mm", imperial: "in", inches: "in", inch: "in", millimetres: "mm", millimeters: "mm", metres: "m", meters: "m", feet: "ft"} as Record<string,string>)[label.toLowerCase()] ?? label.toLowerCase();
  return mapped === "mm" ? .001 : mapped === "in" ? .0254 : mapped === "m" ? 1 : mapped === "ft" ? .3048 : null;
}
export function normalizeGridPole(value: unknown, assetId: string, config: Config = {}): GridPoleSnapshot {
  const p = object(value), warnings = new Set<string>(), groups = new Map<string, RecordedInspection>();
  const unitMap: Record<string, string> = JSON.parse(config.GRID_MANAGER_UNIT_MAP || "{}");
  let survey = date(p.LastSurvey), lengthM: number | null = null, lengthDate: string | null = null;
  function surveyDimensions(sr: Row) {
    const visual = object(sr.PoleStructureInspectionVisual), surveyDate = date(visual.InspectionDate) ?? date(sr.UtcCalendarDateTime) ?? date(sr.Created);
    const visualScale = unitScale(visual.LengthUnit, unitMap), length = number(visual.Length);
    if (length !== null && length > 0 && visualScale !== null && (!lengthDate || surveyDate && Date.parse(surveyDate) > Date.parse(lengthDate))) {lengthM = length * visualScale; lengthDate = surveyDate;}
    if (Object.keys(visual).length) survey = newest(survey, surveyDate);
  }
  for (const link of rows(p.ServiceRequestPoleStructuresCollection)) surveyDimensions(object(link.ServiceRequest));
  for (const r of rows(p.PoleInspectionUB1000s)) {
    const sr = object(r.ServiceRequest), id = text(r.ServiceRequestId) ?? text(sr.Id) ?? `reading-${text(r.Id) ?? groups.size}`;
    const inspectionDate = date(sr.UtcCalendarDateTime) ?? date(sr.Created) ?? date(r.Created);
    let inspection = groups.get(id);
    if (!inspection) { inspection = {id, date: inspectionDate, inspector: text(sr.InspectorInitials), tag: text(sr.PoleTag), readings: []}; groups.set(id, inspection); }
    inspection.date = newest(inspection.date, inspectionDate);
    const scale = unitScale(r.UnitType, unitMap), rawHeight = text(r.HeightAgl), rawCircumference = text(r.PoleCircumference);
    if (scale === null && (rawHeight !== null || rawCircumference !== null)) warnings.add(`Unmapped UB1000 unit: ${text(r.UnitType) ?? "missing"}. Dimensions withheld.`);
    const height = number(r.HeightAgl), circumference = number(r.PoleCircumference);
    const heightM = scale !== null && height !== null ? height * scale : null;
    const circumferenceM = scale !== null && circumference !== null && circumference > 0 ? circumference * scale : null;
    inspection.readings.push({id: text(r.Id) ?? `${id}-${inspection.readings.length}`, heightM, circumferenceM, ar: number(r.Ar), rsm: config.GRID_MANAGER_RSM_FIELD ? number(r[config.GRID_MANAGER_RSM_FIELD]) : null, rawHeight, rawCircumference, rawUnit: text(r.UnitType)});
    surveyDimensions(sr);
  }
  const inspections = [...groups.values()].sort((a, b) => (b.date ? Date.parse(b.date) : -Infinity) - (a.date ? Date.parse(a.date) : -Infinity));
  if (!config.GRID_MANAGER_RSM_FIELD) warnings.add("Per-reading RSM field is not defined in the published metadata; RSM remains unavailable.");
  if (!inspections.length) warnings.add("No UB1000 readings returned for this pole.");
  const metres = number(p.Height_M), feet = number(p.Height_Ft), heightAglM = metres !== null && metres > 0 ? metres : feet !== null && feet > 0 ? feet * .3048 : null;
  return {source: "grid-manager", fetchedAt: new Date().toISOString(), poleId: text(p.Id) ?? "", assetId, species: text(p.Species), poleClass: text(p.PoleClass), installYear: number(p.InstallYear), lastSurvey: survey, tag: text(p.LastPoleStructureTag), lengthM, heightAglM, inspections, selectedInspectionId: inspections[0]?.id ?? null, warnings: [...warnings]};
}

/** Local, read-only adapter. Credentials never enter the Vite client environment. */
export function createGridManagerHandler(config: Config, fetcher: typeof fetch = fetch) {
  const base = new URL(config.GRID_MANAGER_API_URL || "https://api.innerviewtech.com/");
  if (base.protocol !== "https:" || base.username || base.password) throw new Error("Grid Manager requires an HTTPS API URL without embedded credentials.");
  const configured = !!(config.GRID_MANAGER_BEARER_TOKEN || config.GRID_MANAGER_CLIENT_ID && config.GRID_MANAGER_CLIENT_SECRET);
  let cachedToken: {value: string; expires: number} | null = null;
  async function token() {
    if (config.GRID_MANAGER_BEARER_TOKEN) return config.GRID_MANAGER_BEARER_TOKEN;
    if (cachedToken && cachedToken.expires > Date.now()) return cachedToken.value;
    const url = new URL("oauth/token", base);
    url.search = new URLSearchParams({grant_type: "client_credentials", client_id: config.GRID_MANAGER_CLIENT_ID, client_secret: config.GRID_MANAGER_CLIENT_SECRET}).toString();
    const response = await fetcher(url, {method: "POST", signal: AbortSignal.timeout(20000)});
    if (!response.ok) throw new Error(`Grid Manager authentication failed (${response.status}). Check local credentials.`);
    const data = object(await response.json());
    if (typeof data.access_token !== "string" || !data.access_token) throw new Error("Grid Manager returned no access token.");
    cachedToken = {value: data.access_token, expires: Date.now() + Math.max(0, (number(data.expires_in) ?? 60) - 30) * 1000};
    return cachedToken.value;
  }
  async function get(url: URL) {
    const response = await fetcher(url, {headers: {Authorization: `Bearer ${await token()}`, Accept: "application/json"}, signal: AbortSignal.timeout(20000)});
    if (!response.ok) { if (response.status === 401) cachedToken = null; throw new Error(`Grid Manager query failed (${response.status}). Check access and supported OData expansions.`); }
    return response.json();
  }
  return async (req: Request): Promise<Response> => {
    const send = (status: number, data: unknown) => Response.json(data, {status, headers: {"Cache-Control": "no-store"}});
    if (req.method !== "GET") return send(405, {error: "Read-only integration."});
    const request = new URL(req.url);
    try {
      if (!configured) return send(503, {error: "Grid Manager credentials are not configured in .env.local."});
      if (request.pathname === "/api/grid-manager/connect") {
        const probe = new URL("PoleStructures", base); probe.searchParams.set("$top", "0");
        await get(probe); return send(200, {connected: true});
      }
      if (request.pathname !== "/api/grid-manager/pole") return send(404, {error: "Unknown integration endpoint."});
      const assetId = request.searchParams.get("assetId")?.trim() ?? "";
      if (!assetId || assetId.length > 255) return send(400, {error: "Enter an asset ID of at most 255 characters."});
      const fields = (config.GRID_MANAGER_ASSET_FIELDS || "CustomerPoleId,Gisid,ObservedPoleId").split(",");
      if (fields.some(f => !/^[A-Za-z][A-Za-z0-9_]*$/.test(f))) throw new Error("Invalid configured asset field.");
      const url = new URL("PoleStructures", base);
      url.searchParams.set("$filter", fields.map(f => `${f} eq '${assetId.replaceAll("'", "''")}'`).join(" or "));
      url.searchParams.set("$top", "2");
      url.searchParams.set("$expand", config.GRID_MANAGER_EXPAND || "PoleInspectionUB1000s($expand=ServiceRequest),ServiceRequestPoleStructuresCollection($expand=ServiceRequest)");
      const data = object(await get(url)), values = rows(data.value);
      if (!values.length) return send(404, {error: "No pole matches this asset ID."});
      if (values.length > 1 || data["@odata.nextLink"]) return send(409, {error: "Multiple poles match this ID. Configure a narrower asset field or account scope."});
      if (values[0]["PoleInspectionUB1000s@odata.nextLink"] || values[0]["ServiceRequestPoleStructuresCollection@odata.nextLink"]) return send(422, {error: "Inspection history was paginated. This MVP requires a complete pole response."});
      const snapshot = normalizeGridPole(values[0], assetId, config);
      if (snapshot.poleId) {
        const template = config.GRID_MANAGER_RECORD_URL_TEMPLATE || "https://app.innerviewinsights.com/pole/{poleId}";
        const recordUrl = new URL(template.replaceAll("{poleId}", encodeURIComponent(snapshot.poleId)).replaceAll("{assetId}", encodeURIComponent(assetId)));
        if (recordUrl.protocol !== "https:" || recordUrl.username || recordUrl.password) throw new Error("Invalid record URL template.");
        snapshot.recordUrl = recordUrl.href;
      }
      return send(200, snapshot);
    } catch (error) { return send(502, {error: error instanceof Error && error.message.startsWith("Grid Manager") ? error.message : "Grid Manager connection failed. Check credentials, units and API configuration."}); }
  };
}
export function gridManagerMiddleware(config: Config, fetcher: typeof fetch = fetch) {
  const handle = createGridManagerHandler(config, fetcher);
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url?.startsWith("/api/grid-manager/")) return next();
    if (!/^127\.0\.0\.1(?::\d+)?$/.test(req.headers.host ?? "") || req.headers.origin && req.headers.origin !== `http://${req.headers.host}` || req.headers["sec-fetch-site"] === "cross-site") {res.statusCode = 403; res.end(); return;}
    const response = await handle(new Request(`http://${req.headers.host}${req.url}`, {method: req.method}));
    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.end(await response.text());
  };
}
