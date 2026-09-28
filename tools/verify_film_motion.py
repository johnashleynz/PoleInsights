"""Check encoded chapters for changing pole imagery, excluding titles/captions/section view."""
import sys,json,subprocess
from pathlib import Path
sys.path.insert(0,'.media-deps')
import imageio_ffmpeg
from PIL import Image,ImageChops
ff=imageio_ffmpeg.get_ffmpeg_exe();films=json.loads(Path('public/videos/manifest.json').read_text());report=[]
for film in films:
 offset=0
 for k,ch in enumerate(film['chapters']):
  imgs=[]
  for tag,fraction in [('early',.2),('late',.8)]:
   target=Path('.media-work')/f"motion-{film['id']}-{k}-{tag}.png"
   subprocess.run([ff,'-hide_banner','-loglevel','error','-y','-ss',str(offset+ch['duration']*fraction),'-i',str(Path('public/videos')/(film['id']+'.mp4')),'-frames:v','1',str(target)],check=True)
   imgs.append(Image.open(target).convert('RGB').crop((240,140,500,570)))
  hist=ImageChops.difference(*imgs).convert('L').histogram();changed=sum(hist[14:])/sum(hist)
  assert changed>.004,(film['id'],k,changed)
  report.append({'film':film['id'],'chapter':k+1,'mainPoleAreaChangedFraction':changed,'pass':True});offset+=ch['duration']
Path('verification/results/p19-film-motion.json').write_text(json.dumps(report,indent=2))
print('All chapters contain changing pole imagery; this is not a frame-rate or physical-validation claim.')
