"""Package an already-built local review. No network or deployment actions."""
from pathlib import Path
import argparse, hashlib, re, shutil, zipfile

parser=argparse.ArgumentParser()
parser.add_argument('revision')
args=parser.parse_args()
if not re.fullmatch(r'P[0-9]+',args.revision):
    raise SystemExit('Use a review revision such as P09.')
root=Path(__file__).resolve().parent.parent
dist=root/'dist'
if not (dist/'index.html').is_file():
    raise SystemExit('Build the application first.')
release=root/'releases'
release.mkdir(exist_ok=True)
targets=[release/f'InnerView-Pole-Lab-{args.revision}-{kind}.zip' for kind in ('build','source')]
if any(p.exists() for p in targets):
    raise SystemExit('This review already exists. Preserve it and choose a new revision.')
shutil.copy2(root/'tools/serve.mjs',dist/'serve.mjs')
shutil.copy2(root/'docs'/f'{args.revision}-REVIEW.md',dist/f'{args.revision}-REVIEW.md')
(dist/'START-HERE.txt').write_text(f'InnerView Pole Lab {args.revision}\n\nRun: node serve.mjs\nThen open http://127.0.0.1:5192/\nNode 22.13 or newer is required.\nServe over HTTP, not by double-clicking index.html.\n\nThis is a local review, not a deployed engineering or climbing assessment.\nRead {args.revision}-REVIEW.md for implementation, evidence and remaining limits.\n',encoding='utf-8')
source_dirs={'src','public','data','docs','verification','tools'}
root_files=[p for p in root.iterdir() if p.is_file() and p.suffix in ('.json','.ts','.tsx','.md','.html','.ps1','.mjs','.txt')]
filesets=[(dist,sorted(p for p in dist.rglob('*') if p.is_file())),(root,sorted(root_files+[p for folder in source_dirs for p in (root/folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts]))]
for target,(base,files) in zip(targets,filesets):
    with zipfile.ZipFile(target,'x',zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
        for p in files:
            archive.write(p,p.relative_to(base))
    with zipfile.ZipFile(target) as archive:
        if archive.testzip():
            raise RuntimeError('Archive integrity check failed.')
    print(f'{target.name}: {target.stat().st_size:,} bytes; SHA256 {hashlib.sha256(target.read_bytes()).hexdigest()}')
