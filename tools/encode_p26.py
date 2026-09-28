"""Encode captured chapters; concatenate narration then normalise ONCE per film."""
import json,sys,subprocess,wave,math
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'.media-deps'));import imageio_ffmpeg
FF=imageio_ffmpeg.get_ffmpeg_exe();WORK=ROOT/'.media-p26';OUT=ROOT/'public/videos';SR=44100
def run(args):subprocess.run([FF,'-hide_banner','-loglevel','error','-y',*map(str,args)],check=True)
def stamp(t,ass=False):
 h=int(t//3600);m=int(t//60)%60;s=t%60
 return f'{h}:{m:02d}:{s:05.2f}' if ass else f'{h:02d}:{m:02d}:{s:06.3f}'
def writewav(path,pcm):
 with wave.open(str(path),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes(pcm.astype('<i2').tobytes())
films=json.loads((OUT/'manifest.json').read_text(encoding='utf-8'))
for film in films:
 if len(sys.argv)>1 and film['id'] not in sys.argv[1:]:continue
 id=film['id'];chunks=[];captions=[];offset=0;files=[]
 for i,ch in enumerate(film['chapters']):
  raw=WORK/f'{id}-{i}.webm'
  if not raw.exists():raise FileNotFoundError(raw)
  dst=WORK/f'{id}-{i}-silent.mp4'
  if not dst.exists() or raw.stat().st_mtime>dst.stat().st_mtime:run(['-i',raw,'-an','-vf','fps=30,tpad=stop_mode=clone:stop_duration=3','-t',ch['duration'],'-c:v','libx264','-preset','medium','-crf','19','-pix_fmt','yuv420p',dst])
  files.append(dst)
  with wave.open(str(OUT/ch['audio']),'rb') as w:chunks.append(np.frombuffer(w.readframes(w.getnframes()),dtype='<i2'))
  captions.extend({**c,'start':c['start']+offset,'end':c['end']+offset} for c in ch['cues']);offset+=ch['duration']
 speech=WORK/(id+'-narration.wav');writewav(speech,np.concatenate(chunks))
 (OUT/(id+'.vtt')).write_text('WEBVTT\n\n'+'\n\n'.join(f"{stamp(c['start'])} --> {stamp(c['end'])}\n{c['text']}" for c in captions)+'\n',encoding='utf-8')
 # Whole-film loudness, never per chapter. The continuous filtered noise bed is added at measured -62 dBFS RMS.
 normal=WORK/(id+'-normalised.wav');run(['-i',speech,'-af','loudnorm=I=-18:TP=-1.5:LRA=9','-ar',SR,'-ac','1',normal])
 with wave.open(str(normal),'rb') as w:narration=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(np.float64)/32768
 noise=np.frombuffer(subprocess.check_output([FF,'-v','error','-f','lavfi','-i',f'anoisesrc=r={SR}:a=1:seed=260927:d={len(narration)/SR+.1}','-af','highpass=f=150,lowpass=f=2800','-f','f32le','-']),dtype='<f4')[:len(narration)].astype(np.float64)
 noise*=10**(-62/20)/np.sqrt(np.mean(noise**2))
 mixed=narration+noise
 if np.max(np.abs(mixed))>=1:raise ValueError('Clipping in mix')
 writewav(OUT/(id+'-mixed.wav'),np.round(mixed*32767))
 concat=WORK/(id+'-p26-concat.txt');concat.write_text('\n'.join("file '"+p.name+"'" for p in files),encoding='utf-8')
 silent=WORK/(id+'-silent.mp4');run(['-f','concat','-safe','0','-i',concat,'-c','copy',silent])
 run(['-i',silent,'-i',OUT/(id+'-mixed.wav'),'-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','160k','-movflags','+faststart','-t',film['duration'],OUT/(id+'.mp4')])
 run(['-ss',min(4,film['duration']/4),'-i',OUT/(id+'.mp4'),'-frames:v','1','-q:v','2',OUT/(id+'.jpg')])
 print('ENCODED',id,film['duration'],flush=True)
