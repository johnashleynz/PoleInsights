import type {SystemPreferences as Preferences} from "../integrations/preferences.ts";

export default function SystemPreferences({value, onChange, onClose}: {value: Preferences; onChange: (p: Preferences) => void; onClose: () => void}) {
  return <div className="modal-backdrop" onClick={onClose}>
    <section className="modal preferences-modal" role="dialog" aria-modal="true" aria-label="System preferences" onClick={e => e.stopPropagation()}>
      <button className="text-control" aria-label="Close system preferences" onClick={onClose}>Close</button>
      <h2>System preferences</h2>
      {([['detect', 'Enable Detect'], ['axonic', 'Enable Axonic integration'], ['gridManager', 'Enable Grid Manager integration']] as const).map(([key, label]) => <label className="check-row" key={key}><input type="checkbox" checked={value[key]} onChange={e => onChange({...value, [key]: e.target.checked})}/>{label}</label>)}
    </section>
  </div>;
}
