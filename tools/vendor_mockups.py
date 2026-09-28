"""Bundle the owner's existing workflow mockups; never edit the originals."""
from pathlib import Path
import hashlib, json, sys

root = Path(__file__).resolve().parent.parent
source = Path(sys.argv[1]) if len(sys.argv)>1 else Path(r'C:\Users\Carl\OneDrive - LineSmarts\Desktop\OLENZ\Client\Innerview Insights\UB1000\CODEX\Mockup')
manifest = {}
for kind, folder in [('axonic', source/'dist'), ('safe2climb', source/'Safe2Climb'/'public')]:
    dest = root/'public'/'mockups'/kind
    dest.mkdir(parents=True, exist_ok=True)
    manifest[kind] = {}
    for file in folder.iterdir():
        if file.suffix not in ('.js','.html','.css','.webmanifest') or file.name in ('sw.js','manifest.webmanifest'):
            continue
        original = file.read_bytes()
        manifest[kind][file.name] = hashlib.sha256(original).hexdigest()
        text = original.decode('utf-8-sig')
        # The lab copy cannot install a service worker or touch original demo records.
        text = text.replace("if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});", '')
        text = text.replace('localStorage', 'sessionStorage')
        text = text.replace('innerview-mockup-v1','pole-lab-axonic-p23').replace('safe2climb-standalone-v1','pole-lab-safe2climb-p23')
        text = text.replace('<link rel="manifest" href="./manifest.webmanifest">','')
        if file.name == 'phone.html':
            text = text.replace('Galaxy S24 Ultra', 'Samsung Galaxy S21 Ultra')
            text = text.replace('<button id="pop-out">Pop out ↗</button>', '')
            text = text.replace(' src="./index.html#analyser/summary"', '').replace(' src="./index.html"', '')
            text = text.replace('border-radius:14px', 'border-radius:32px').replace('border-radius:7px', 'border-radius:24px')
        if file.name == 'phone.js':
            # Keep original fit-to-window geometry; the lab owns launching/closing.
            text = "import {connectPhone} from '../phoneBridge.js';\n" + text[text.index("const device="):]
            text = text.replace('Math.max(.2,', 'Math.max(.05,')
            text += '\nconnectPhone();\n'
        if file.name == 'app.js':
            text = "import {labContext,publishScan,connectLab} from '../labBridge.js';\n" + text
            if kind == 'axonic':
                text = text.replace("import {openPhonePreview} from './phone.js';", "const openPhonePreview=()=>window.focus();")
                text = text.replace("${btn('Open phone-sized preview','phone-preview','ghost','external')}", '')
                text = text.replace('function render(){', 'function render(){\n  publishScan(busy);', 1)
                text = text.replace('busy=true;dialog.close();render();', 'busy=true;publishScan(true,Number(poleInput().scanHeight));dialog.close();render();', 1)
                anchor = 'pendingPosition=positionFromRecord();'
                seed = """
if(labContext){
 record=newRecord('normal');records={normal:record};scenario='normal';
 Object.assign(record.asset,{id:labContext.id,species:labContext.species,length:labContext.length,height:labContext.height,circumference:labContext.circumference});
 pendingPosition={height:labContext.scanHeight,direction:0,circumference:labContext.circumference};
 draft={poleId:record.asset.id,species:record.asset.species,length:record.asset.length,poleHeight:record.asset.height,scanHeight:pendingPosition.height,size:Math.round(pendingPosition.circumference),canonicalSize:pendingPosition.circumference};
}
"""
                text = text.replace(anchor,anchor+seed,1)
            else:
                text = text.replace("['Radiata pine','Douglas fir','Larch','Hardwood','Other / unknown'].map(t=>", "[...new Set([v.species,'Radiata pine','Douglas fir','Larch','Hardwood','Other / unknown'].filter(Boolean))].map(t=>")
                text = text.replace('function render(){', 'function render(){publishScan(scanBusy);', 1)
                text = text.replace("scanBusy=true;event(r,'measurement.started'", "scanBusy=true;publishScan(true,inputs.scanHeight);event(r,'measurement.started'",1)
                anchor = 'render();' # Last render at module entry, after all event handlers.
                pos = text.rfind(anchor)
                seed = """
if(labContext){
 db={draft:createInspection({...ASSETS[0],id:labContext.id,species:labContext.species,height:labContext.height,circumference:labContext.circumference}),records:[],outbox:[]};
 db.draft.ubInputs={species:labContext.species,size:Math.round(labContext.circumference),sizeMode:'circumference',scanHeight:labContext.scanHeight};
}
"""
                text = text[:pos]+seed+text[pos:]
            text += '\nconnectLab();\n'
        (dest/file.name).write_text(text,encoding='utf-8')
(root/'verification'/'results'/'p25-mockup-sources.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print('Bundled workflow copies and recorded original hashes.')
