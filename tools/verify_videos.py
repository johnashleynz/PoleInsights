import json,subprocess,sys,re,hashlib
from pathlib import Path
sys.path.insert(0,str(Path('.media-deps').resolve()))
import imageio_ffmpeg
from PIL import Image,ImageDraw,ImageChops
ff=imageio_ffmpeg.get_ffmpeg_exe();root=Path('public/videos');work=Path('.media-work');films=json.loads((root/'manifest.json').read_text());report=[];sheet=Image.new('RGB',(1920,200*len(films)),'white');draw=ImageDraw.Draw(sheet)
for f,film in enumerate(films):
 path=root/(film['id']+'.mp4');probe=subprocess.run([ff,'-hide_banner','-i',str(path),'-af','volumedetect','-f','null','-'],capture_output=True,text=True)
 if probe.returncode:raise RuntimeError(probe.stderr)
 text=probe.stderr;m=re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)',text);duration=int(m[1])*3600+int(m[2])*60+float(m[3]);volume=float(re.search(r'max_volume: ([-.\d]+) dB',text)[1]);assert abs(duration-film['duration'])<.25,(duration,film['duration']);assert '1280x720' in text and 'h264' in text and 'aac' in text;assert volume>-25
 caption=(root/(film['id']+'.vtt')).read_text();assert caption.startswith('WEBVTT') and '-->' in caption
 for i,ch in enumerate(film['chapters']):
  t=sum(c['duration'] for c in film['chapters'][:i])+ch['duration']*.5;png=work/f'qa-{f}-{i}.png';subprocess.run([ff,'-hide_banner','-loglevel','error','-y','-ss',str(t),'-i',str(path),'-frames:v','1',str(png)],check=True);im=Image.open(png).convert('RGB');assert ImageChops.difference(im,Image.new('RGB',im.size,'white')).getbbox();sheet.paste(im.resize((320,180)),(i*320,f*200));draw.text((i*320+8,f*200+182),ch['title'],fill='#14334a')
 report.append({'id':film['id'],'durationSeconds':duration,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'decoded':True,'video':'H.264 1280x720','audio':'AAC with UK synthetic narration','maxVolumeDB':volume,'captions':True})
 print('Verified',film['id'],duration,'s',flush=True)
sheet.save(work/'film-contact-sheet.jpg',quality=94);Path('verification/results/p19-media.json').write_text(json.dumps(report,indent=2));print('All videos decode with narration and captions.')
