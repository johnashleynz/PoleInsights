import {useEffect, useRef, useState} from "react";
import {ExternalLink, Search, Plug} from "lucide-react";
import type {PoleCase} from "../domain/model.ts";
import {axonicUrl, validProfile, type SystemPreferences} from "../integrations/preferences.ts";
import {applyGridInspection, overrideReadingUnit, validGridSnapshot} from "../integrations/geometry.ts";
import type {GridPoleSnapshot} from "../integrations/types.ts";
import {formatSmallLength} from "../domain/units.ts";

async function gridRequest(path: string, signal: AbortSignal) {
  const response = await fetch(`${import.meta.env.BASE_URL}api/grid-manager/${path}`, {signal, headers: {Accept: "application/json"}});
  if (!response.headers.get("content-type")?.includes("application/json")) throw new Error("Grid Manager server is unavailable or sign-in is required.");
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Grid Manager request failed.");
  return data;
}
export default function IntegrationsPanel({pole, preferences, onPreferences, onChange}: {pole: PoleCase; preferences: SystemPreferences; onPreferences: (p: SystemPreferences) => void; onChange: (p: Partial<PoleCase>) => void}) {
  const [busy, setBusy] = useState(false), [connected, setConnected] = useState(false), [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  const currentPole = useRef(pole); currentPole.current = pole;
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {if (!preferences.gridManager) {request.current?.abort(); setBusy(false); setConnected(false);}}, [preferences.gridManager]);
  useEffect(() => {request.current?.abort(); setBusy(false); setError("");}, [pole.assetId]);
  const assetId = pole.assetId ?? "", profile = pole.axonic?.profile ?? preferences.lastProfile, url = axonicUrl(profile, assetId);
  function changeAsset(value: string) {
    request.current?.abort();
    onChange({assetId: value, ...(pole.axonic ? {axonic: {profile, assetId: value}} : {}), gridManager: undefined, diameterStations: undefined});
  }
  function rememberProfile() {
    if (validProfile(profile)) onPreferences({...preferences, lastProfile: profile, recentProfiles: [profile, ...preferences.recentProfiles.filter(p => p !== profile)].slice(0, 12)});
  }
  async function connect(search = false) {
    request.current?.abort(); const controller = new AbortController(); request.current = controller;
    setBusy(true); setError("");
    try {
      const data = await gridRequest(search ? `pole?${new URLSearchParams({assetId: assetId.trim()})}` : "connect", controller.signal);
      if (controller.signal.aborted) return;
      setConnected(true);
      if (search) {
        if (!validGridSnapshot(data)) throw new Error("Grid Manager response format is unsupported.");
        onChange(applyGridInspection(currentPole.current, data, data.selectedInspectionId));
      }
    } catch (e) {if (!controller.signal.aborted) {setError(e instanceof Error ? e.message : "Connection failed."); setConnected(false);}}
    finally {if (!controller.signal.aborted) setBusy(false);}
  }
  const snapshot = pole.gridManager, inspection = snapshot?.inspections.find(s => s.id === snapshot.selectedInspectionId);
  function selectInspection(snapshot: GridPoleSnapshot, id: string) {onChange(applyGridInspection(pole, snapshot, id));}
  return <>
    <div className="integration-search">
      <label className="select-field">Asset ID<input aria-label="Asset ID" maxLength={255} value={assetId} onChange={e => changeAsset(e.target.value)} onKeyDown={e => {if (e.key === "Enter" && preferences.gridManager && assetId.trim() && !busy) {e.preventDefault(); void connect(true);}}}/></label>
      {preferences.gridManager && <button className="text-control" title="Retrieve this asset from Grid Manager" aria-label="Retrieve asset from Grid Manager" disabled={busy || !assetId.trim()} onClick={() => void connect(true)}><Search size={15}/></button>}
    </div>
    {preferences.axonic && <details className="integration-section"><summary>Axonic</summary><div className="integration-fields">
      <label className="select-field">Organisation profile<input aria-label="Axonic organisation profile" list={`axonic-profiles-${pole.id}`} maxLength={100} value={profile} onChange={e => onChange({axonic: {profile: e.target.value, assetId}})} onBlur={rememberProfile}/></label>
      <datalist id={`axonic-profiles-${pole.id}`}>{preferences.recentProfiles.map(p => <option key={p} value={p}/>)}</datalist>
      {url && <a className="integration-link" href={url} onClick={rememberProfile}><ExternalLink size={14}/>Open in Axonic</a>}
    </div></details>}
    {preferences.gridManager && <details className="integration-section" open><summary>Grid Manager</summary><div className="integration-fields">
      <button className="text-control" disabled={busy} onClick={() => void connect()}><Plug size={14}/>{connected ? "Reconnect" : "Connect"}</button>
      <span className="integration-status" role="status">{busy ? "Connecting..." : connected ? "Connected" : "Not connected"}</span>
      {error && <p className="integration-error" role="alert">{error}</p>}
      {snapshot && <>
        <dl className="integration-summary"><div><dt>Pole</dt><dd>{snapshot.assetId}</dd></div><div><dt>Species / class</dt><dd>{snapshot.species ?? "Unknown"} / {snapshot.poleClass ?? "Unknown"}</dd></div><div><dt>Installed</dt><dd>{snapshot.installYear ?? "Unknown"}</dd></div><div><dt>Latest survey</dt><dd>{snapshot.lastSurvey ? new Date(snapshot.lastSurvey).toLocaleDateString() : "Unknown"}</dd></div><div><dt>Height AGL</dt><dd>{snapshot.heightAglM == null ? "Unknown" : `${snapshot.heightAglM.toFixed(2)} m`}</dd></div><div><dt>Survey length</dt><dd>{snapshot.lengthM === null ? "Unknown" : `${snapshot.lengthM.toFixed(2)} m`}</dd></div><div><dt>Latest tag</dt><dd>{snapshot.tag ?? "Not recorded"}</dd></div></dl>
        {snapshot.recordUrl ? <a className="integration-link" href={snapshot.recordUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={14}/>Open Grid Manager record</a> : <span className="integration-status">Record link not configured.</span>}
        <label className="select-field">Inspection / service request<select aria-label="Grid Manager inspection" value={snapshot.selectedInspectionId ?? ""} onChange={e => selectInspection(snapshot, e.target.value)} disabled={!snapshot.inspections.length}>{!snapshot.inspections.length && <option value="">No inspections</option>}{snapshot.inspections.map(s => <option key={s.id} value={s.id}>SR {s.id} · {s.date ? new Date(s.date).toLocaleDateString() : "Date unknown"}</option>)}</select></label>
        {inspection && <><p className="integration-status">Inspector: {inspection.inspector ?? "Unknown"} · Tag: {inspection.tag ?? "Not recorded"}</p><div className="integration-table-wrap"><table className="integration-table"><thead><tr><th>Height AGL</th><th>Girth</th><th>AR</th><th>RSM</th><th>Units</th></tr></thead><tbody>{inspection.readings.map(r => <tr key={r.id}><td title={`Recorded: ${r.rawHeight ?? "-"} ${r.rawUnit ?? "unknown unit"}`}>{r.heightM === null ? `${r.rawHeight ?? "-"} (${r.rawUnit ?? "?"})` : formatSmallLength(r.heightM, pole.unitSystem ?? "metric")}</td><td title={`Recorded: ${r.rawCircumference ?? "-"} ${r.rawUnit ?? "unknown unit"}`}>{r.circumferenceM === null ? `${r.rawCircumference ?? "-"} (${r.rawUnit ?? "?"})` : formatSmallLength(r.circumferenceM, pole.unitSystem ?? "metric")}</td><td>{r.ar ?? "-"}</td><td>{r.rsm ?? "-"}</td><td><select aria-label={`Units for reading ${r.id}`} value={r.unitOverride ?? ""} onChange={e => onChange(applyGridInspection(pole, overrideReadingUnit(snapshot, r.id, e.target.value === "mm" || e.target.value === "in" ? e.target.value : undefined), inspection.id))}><option value="">Recorded</option><option value="mm">mm</option><option value="in">in</option></select></td></tr>)}</tbody></table></div></>}
        <details><summary>Source and import status</summary><p className="integration-status">Grid Manager · retrieved {new Date(snapshot.fetchedAt).toLocaleString()}</p>{snapshot.warnings.map(w => <p className="integration-status" key={w}>{w}</p>)}</details>
      </>}
    </div></details>}
    {!!pole.diameterStations?.length && <details className="integration-section"><summary>Imported diameter stations</summary><div className="integration-fields">{pole.geometryEstimates && <p className="integration-status">{pole.geometryEstimates.basis}</p>}{pole.diameterStations.map(s => <p className="integration-status" key={s.heightM}>{formatSmallLength(s.heightM, pole.unitSystem ?? "metric")} AGL · diameter {formatSmallLength(s.diameterM, pole.unitSystem ?? "metric")} · SR {s.inspectionId}</p>)}<button className="text-control" onClick={() => onChange({diameterStations: undefined})}>Remove imported stations</button></div></details>}
  </>;
}
