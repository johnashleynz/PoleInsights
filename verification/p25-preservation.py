from pathlib import Path
import hashlib,json,zipfile
root=Path(r'C:\Users\Carl\OneDrive - LineSmarts\Desktop\OLENZ\CODEX\Line Lab - Crossarm\Line-Lab-Codex-Handover\Line-Lab\project\innerview-pole-lab')
source=Path(r'C:\Users\Carl\OneDrive - LineSmarts\Desktop\OLENZ\Client\Innerview Insights\UB1000\CODEX\Mockup')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
archives=json.loads((root/'verification/results/p25-preserved-archives.json').read_text())
assert len(archives)==4
assert all(sha(root/'releases'/name)==digest for name,digest in archives.items())
manifest=json.loads((root/'verification/results/p25-mockup-sources.json').read_text())
old=json.loads((root/'verification/results/p23-mockup-sources.json').read_text())
for kind,folder in [('axonic',source/'dist'),('safe2climb',source/'Safe2Climb/public')]:
    assert all(sha(folder/name)==digest for name,digest in manifest[kind].items())
    assert all(manifest[kind][name]==digest for name,digest in old[kind].items())
changed=[];added=[]
with zipfile.ZipFile(root/'releases/InnerView-Pole-Lab-P24-source.zip') as archive:
    names=set(archive.namelist())
    for prefix in ['src','public']:
        for p in (root/prefix).rglob('*'):
            if not p.is_file():continue
            name=p.relative_to(root).as_posix()
            if name not in names:added.append(name)
            elif p.read_bytes()!=archive.read(name):changed.append(name)
expected={'src/ui/App.tsx','src/ui/DetectApps.tsx','src/ui/detectApps.css','public/mockups/labBridge.js'}
assert set(changed)==expected,changed
assert set(added)=={'public/mockups/phoneBridge.js',*[f'public/mockups/{kind}/phone.{ext}' for kind in ['axonic','safe2climb'] for ext in ['html','js']]},added
report={'preservedP23P24Archives':list(archives),'originalSourceHashesMatch':True,'originalP23SourceHashesMatch':True,'changedSourceAndPublicFiles':changed,'addedSourceAndPublicFiles':added,'otherP24SourceAndPublicFilesUnchanged':True}
(root/'verification/results/p25-preservation.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
